import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const role = userInfo.openId.includes("admin") ? "admin" : "recruiter";

      // Best-effort DB write — app works even when DB is unavailable
      try {
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
          role: role,
        });
      } catch (dbErr) {
        console.warn("[OAuth] DB unavailable, skipping user upsert:", dbErr);
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({
        error: "OAuth callback failed",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Mock endpoints for local OAuth simulation
  app.post("/webdev.v1.WebDevAuthPublicService/ExchangeToken", (req, res) => {
    const { code } = req.body;
    res.json({
      accessToken: `mock-token-${code}`,
      tokenType: "Bearer",
      expiresIn: 3600,
      scope: "openid profile email",
      idToken: `mock-id-token-${code}`
    });
  });

  app.post("/webdev.v1.WebDevAuthPublicService/GetUserInfo", (req, res) => {
    const { accessToken } = req.body;
    const code = accessToken ? accessToken.replace("mock-token-", "") : "recruiter";
    const openId = `mock-${code}-id`;
    const name = code === "admin" ? "Mock Admin" : "Mock Recruiter";
    const email = `${code}@example.com`;

    res.json({
      openId,
      projectId: "test-app",
      name,
      email,
      platform: "mock",
      loginMethod: "mock"
    });
  });

  app.post("/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt", async (req, res) => {
    const { jwtToken } = req.body;
    try {
      const session = await sdk.verifySession(jwtToken);
      if (session) {
        const role = session.openId.includes("admin") ? "admin" : "recruiter";
        res.json({
          openId: session.openId,
          projectId: "test-app",
          name: session.name || `Mock ${role}`,
          email: `${role}@example.com`,
          platform: "mock",
          loginMethod: "mock"
        });
        return;
      }
    } catch (e) {
      console.error("[Mock OAuth] Failed to verify session JWT:", e);
    }
    res.status(400).json({ error: "Invalid token" });
  });
}
