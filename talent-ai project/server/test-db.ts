import "dotenv/config";
import { getDb, upsertUser } from "./db";

async function main() {
  const db = await getDb();
  console.log("DB connection:", db ? "success" : "failed");
  try {
    await upsertUser({
      openId: "mock-recruiter-id",
      name: "Mock Recruiter",
      email: "recruiter@example.com",
      loginMethod: "mock",
      role: "recruiter",
      lastSignedIn: new Date(),
    });
    console.log("Upsert success");
  } catch (err: any) {
    console.error("Upsert failed:", err);
    console.error("Keys in error:", Object.keys(err));
    console.error("SQL Message:", err.sqlMessage);
    console.error("Code:", err.code);
  }
}

main();
