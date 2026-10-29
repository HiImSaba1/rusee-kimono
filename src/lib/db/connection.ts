import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { serverEnvironment } from "@/lib/env/server";
import * as schema from "./schema";

const globalDatabase = globalThis as typeof globalThis & {
  kimonoMySqlPool?: mysql.Pool;
};

const pool = globalDatabase.kimonoMySqlPool ?? mysql.createPool({
  uri: serverEnvironment.DATABASE_URL,
  connectionLimit: 8,
  enableKeepAlive: true,
  decimalNumbers: true,
  timezone: "Z",
});

if (process.env.NODE_ENV !== "production") {
  globalDatabase.kimonoMySqlPool = pool;
}

export const database = drizzle({ client: pool, schema, mode: "default" });
export { pool as databasePool };
