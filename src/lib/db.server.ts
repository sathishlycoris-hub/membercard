import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;
let ready: Promise<void> | undefined;

function getPool() {
  pool ??= mysql.createPool({
    host: process.env["DB_HOST"] ?? "127.0.0.1",
    port: Number(process.env["DB_PORT"] ?? 3306),
    user: process.env["DB_USER"] ?? "root",
    password: process.env["DB_PASSWORD"] ?? "",
    database: process.env["DB_NAME"] ?? "membership",
    charset: "utf8mb4",
    dateStrings: true, // DATE columns come back as "YYYY-MM-DD" strings
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

async function migrate(p: mysql.Pool) {
  await p.query(
    `CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(20) NOT NULL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      state VARCHAR(100) NOT NULL,
      constituency VARCHAR(100) NOT NULL,
      joined DATE NOT NULL,
      photo MEDIUMTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  // Add newer columns to tables created by an earlier version (works on MySQL and MariaDB).
  const [cols] = await p.query(
    "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members'",
  );
  const have = new Set((cols as { c: string }[]).map((r) => r.c));
  const add: [string, string][] = [
    ["location", "VARCHAR(200) NULL"],
    ["dob", "DATE NULL"],
    ["phone", "VARCHAR(15) NULL"],
  ];
  for (const [name, def] of add) {
    if (!have.has(name)) await p.query(`ALTER TABLE members ADD COLUMN ${name} ${def}`);
  }

  await p.query(
    `CREATE TABLE IF NOT EXISTS member_documents (
      member_id VARCHAR(20) NOT NULL,
      kind ENUM('aadhaar','voter') NOT NULL,
      data LONGTEXT NOT NULL,                 -- file as a data URL (image or PDF)
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (member_id, kind),
      CONSTRAINT fk_doc_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

/** Returns the pool, creating/upgrading the tables on first use. */
export async function db() {
  const p = getPool();
  ready ??= migrate(p).catch((err) => {
    ready = undefined; // retry next request
    throw err;
  });
  await ready;
  return p;
}
