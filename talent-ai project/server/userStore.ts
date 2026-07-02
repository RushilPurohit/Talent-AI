import fs from "fs";
import path from "path";

export interface RegisteredUser {
  openId: string;
  name: string;
  email: string;
  passwordHash: string; // We can use simple hashes or plain text since it is a mock dev db
  role: "admin" | "recruiter";
  createdAt: string;
}

let _users: RegisteredUser[] = [];
const dbPath = path.resolve(process.cwd(), "users_db.json");

// Helper to load users
function loadUsers(): RegisteredUser[] {
  if (_users.length > 0) return _users;
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      _users = JSON.parse(raw);
    } else {
      // Seed default users if db doesn't exist
      _users = [
        {
          openId: "mock-recruiter-id",
          name: "Mock Recruiter",
          email: "recruiter@example.com",
          passwordHash: "password123",
          role: "recruiter",
          createdAt: new Date().toISOString(),
        },
        {
          openId: "mock-admin-id",
          name: "Mock Admin",
          email: "admin@example.com",
          passwordHash: "password123",
          role: "admin",
          createdAt: new Date().toISOString(),
        },
      ];
      saveUsers();
    }
  } catch (err) {
    console.warn("[UserStore] Failed to load users_db.json, using fallback:", err);
  }
  return _users;
}

// Helper to save users
function saveUsers() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(_users, null, 2), "utf-8");
  } catch (err) {
    console.warn("[UserStore] Failed to save users_db.json:", err);
  }
}

export function findUserByEmail(email: string): RegisteredUser | undefined {
  const all = loadUsers();
  return all.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function registerNewUser(
  name: string,
  email: string,
  password: string,
  role: "admin" | "recruiter"
): RegisteredUser {
  const all = loadUsers();
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const openId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newUser: RegisteredUser = {
    openId,
    name,
    email: email.toLowerCase(),
    passwordHash: password, // simple storage for mock environment
    role,
    createdAt: new Date().toISOString(),
  };

  all.push(newUser);
  saveUsers();
  return newUser;
}

export function verifyUserCredentials(
  email: string,
  password: string
): RegisteredUser | undefined {
  const user = findUserByEmail(email);
  if (user && user.passwordHash === password) {
    return user;
  }
  return undefined;
}

export function findUserByOpenId(openId: string): RegisteredUser | undefined {
  const all = loadUsers();
  return all.find((u) => u.openId === openId);
}

