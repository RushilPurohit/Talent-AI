import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import * as db from "../db";
import { addUploadedResume } from "../resumeStore";


function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create uploads folder if not exists
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Upload endpoint
  app.post("/api/upload", async (req, res) => {
    try {
      const { filename, content } = req.body;
      if (!filename || !content) {
        res.status(400).json({ error: "Missing filename or content" });
        return;
      }

      // Remove the base64 prefix if present
      const base64Data = content.includes(";base64,")
        ? content.split(";base64,")[1]
        : content;

      const fileBuffer = Buffer.from(base64Data, "base64");
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, fileBuffer);
      console.log(`[Storage] Saved uploaded file to ${filePath}`);

      // Save to store (this handles local JSON and Drizzle DB sync)
      const mockSkills = ["Python", "JavaScript", "Machine Learning", "React"];
      const mockExpYears = 4;
      const storedResume = await addUploadedResume(filename, `/uploads/${filename}`, mockSkills, mockExpYears);

      res.json({
        success: true,
        fileUrl: storedResume.fileUrl,
        fileName: storedResume.fileName,
        resume: storedResume
      });
    } catch (err) {
      console.error("[Upload] Error handling upload:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Expose the uploads folder statically
  app.use("/uploads", express.static(uploadsDir));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
