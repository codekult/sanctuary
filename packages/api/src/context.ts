import type { Database } from "@sanctuary/db";

export interface Session {
  userId: string;
  email: string;
}

export interface Context {
  db: Database;
  session: Session | null;
}

export function createContext(db: Database, session: Session | null): Context {
  return { db, session };
}
