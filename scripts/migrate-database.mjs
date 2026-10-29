import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";

const migrationsFolder = "drizzle";
const privacyMigrationCreatedAt = 1787133247732;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 1, timezone: "Z" });

async function objectExists(connection, tableName, objectType, objectName) {
  const sources = {
    table: ["TABLES", "TABLE_NAME"],
    column: ["COLUMNS", "COLUMN_NAME"],
    index: ["STATISTICS", "INDEX_NAME"],
    constraint: ["TABLE_CONSTRAINTS", "CONSTRAINT_NAME"],
  };
  const source = sources[objectType];
  if (!source) throw new Error(`Unsupported schema object type: ${objectType}`);
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.${source[0]} WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND ${source[1]} = ? LIMIT 1`,
    [tableName, objectName],
  );
  return rows.length > 0;
}

async function repairInterruptedPrivacyMigration(connection) {
  const [migrationRows] = await connection.execute(
    "SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1",
  );
  if (migrationRows.length > 0 && Number(migrationRows[0].created_at) >= privacyMigrationCreatedAt) return false;

  const privacyRequestsExists = await objectExists(connection, "privacy_requests", "table", "privacy_requests");
  const retentionRunsExists = await objectExists(connection, "privacy_retention_runs", "table", "privacy_retention_runs");
  const anonymizedAtExists = await objectExists(connection, "contact_enquiries", "column", "anonymized_at");
  if (!privacyRequestsExists && !retentionRunsExists && !anonymizedAtExists) return false;

  await connection.execute(`CREATE TABLE IF NOT EXISTS privacy_requests (
    id bigint AUTO_INCREMENT NOT NULL, public_id varchar(36) NOT NULL,
    subject_email varchar(254) NOT NULL, request_type enum('export','erasure') NOT NULL,
    status enum('pending','completed','blocked_legal_review','failed') NOT NULL DEFAULT 'pending',
    requested_by_admin_id int, result json, completed_at timestamp,
    created_at timestamp NOT NULL DEFAULT (now()),
    updated_at timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT privacy_requests_id PRIMARY KEY(id),
    CONSTRAINT privacy_requests_public_id_unique UNIQUE(public_id)
  ) ENGINE=InnoDB`);
  await connection.execute(`CREATE TABLE IF NOT EXISTS privacy_retention_runs (
    id bigint AUTO_INCREMENT NOT NULL, mode enum('dry_run','apply') NOT NULL,
    retention_days int NOT NULL, eligible_count int NOT NULL DEFAULT 0,
    anonymized_count int NOT NULL DEFAULT 0,
    status enum('completed','disabled','failed') NOT NULL, detail json,
    created_at timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT privacy_retention_runs_id PRIMARY KEY(id)
  ) ENGINE=InnoDB`);

  // MySQL DDL auto-commits. An interrupted first attempt may have created these
  // tables with the server's MyISAM default, whose index limit is only 1000 bytes
  // and which cannot enforce the required admin-user foreign key.
  await connection.execute("ALTER TABLE privacy_requests ENGINE=InnoDB");
  await connection.execute("ALTER TABLE privacy_retention_runs ENGINE=InnoDB");

  if (!(await objectExists(connection, "contact_enquiries", "column", "anonymized_at"))) {
    await connection.execute("ALTER TABLE contact_enquiries ADD anonymized_at timestamp");
  }
  if (!(await objectExists(connection, "privacy_requests", "constraint", "privacy_requests_requested_by_admin_id_admin_users_id_fk"))) {
    await connection.execute("ALTER TABLE privacy_requests ADD CONSTRAINT privacy_requests_requested_by_admin_id_admin_users_id_fk FOREIGN KEY (requested_by_admin_id) REFERENCES admin_users(id) ON DELETE set null ON UPDATE no action");
  }
  if (!(await objectExists(connection, "privacy_requests", "index", "privacy_requests_email_created_idx"))) {
    await connection.execute("CREATE INDEX privacy_requests_email_created_idx ON privacy_requests (subject_email,created_at)");
  }

  const privacyMigration = readMigrationFiles({ migrationsFolder })
    .find((entry) => entry.folderMillis === privacyMigrationCreatedAt);
  if (!privacyMigration) throw new Error("Sprint 06 migration metadata is missing.");
  await connection.execute(
    "INSERT INTO __drizzle_migrations (hash, created_at) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE created_at = ?)",
    [privacyMigration.hash, privacyMigration.folderMillis, privacyMigration.folderMillis],
  );
  return true;
}

function safeError(error) {
  let source = error;
  while (source?.cause && typeof source.cause === "object") source = source.cause;
  return {
    ok: false,
    name: source instanceof Error ? source.name : "MigrationError",
    message: source instanceof Error ? source.message.slice(0, 500) : "Database migration failed.",
    code: source && typeof source === "object" && "code" in source ? String(source.code).slice(0, 80) : undefined,
    sqlState: source && typeof source === "object" && "sqlState" in source ? String(source.sqlState).slice(0, 20) : undefined,
  };
}

try {
  const connection = await pool.getConnection();
  let repaired;
  try {
    repaired = await repairInterruptedPrivacyMigration(connection);
  } finally {
    connection.release();
  }
  const database = drizzle({ client: pool });
  await migrate(database, { migrationsFolder });
  console.log(JSON.stringify({ ok: true, migrationsFolder, repairedInterruptedMigration: repaired }, null, 2));
} catch (error) {
  console.error(JSON.stringify(safeError(error), null, 2));
  process.exitCode = 1;
} finally {
  await pool.end();
}
