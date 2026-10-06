import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import {
  memberIdSchema,
  memberInputSchema,
  privateAccessSchema,
  type MemberPrivate,
  type MemberRecord,
} from "@/lib/member";

function newMemberId() {
  const yy = String(new Date().getFullYear()).slice(-2);
  return `STPK-${yy}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
}

/** Save a new member (+ Aadhaar and Voter ID attachments) in MySQL and return the generated ID. */
export const createMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => memberInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    const pool = await db();
    const conn = await pool.getConnection();
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const id = newMemberId();
        await conn.beginTransaction();
        try {
          await conn.execute(
            `INSERT INTO members (id, name, location, dob, phone, state, constituency, joined, photo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, data.name, data.location, data.dob, data.phone, data.state, data.constituency, data.joined, data.photo ?? null],
          );
          await conn.execute("INSERT INTO member_documents (member_id, kind, data) VALUES (?, 'aadhaar', ?)", [id, data.aadhaarDoc]);
          await conn.execute("INSERT INTO member_documents (member_id, kind, data) VALUES (?, 'voter', ?)", [id, data.voterDoc]);
          await conn.commit();
          return { id };
        } catch (err) {
          await conn.rollback();
          if ((err as { code?: string }).code === "ER_DUP_ENTRY") continue; // ID collision, retry
          throw err;
        }
      }
      throw new Error("Could not generate a unique member ID, please try again.");
    } finally {
      conn.release();
    }
  });

/** Public read (card page + what a QR scan shows to anyone). No DOB / phone / documents. */
export const getMember = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => memberIdSchema.parse(data))
  .handler(async ({ data }): Promise<MemberRecord | null> => {
    const { db } = await import("./db.server");
    const pool = await db();
    const [rows] = await pool.execute(
      "SELECT id, name, state, constituency, location, joined, photo FROM members WHERE id = ? LIMIT 1",
      [data.id],
    );
    return (rows as MemberRecord[])[0] ?? null;
  });

function passwordMatches(given: string) {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Sensitive details — only after the staff password (ADMIN_PASSWORD) is verified. */
export const getMemberPrivate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => privateAccessSchema.parse(data))
  .handler(async ({ data }): Promise<MemberPrivate> => {
    if (!process.env["ADMIN_PASSWORD"]) {
      throw new Error("Staff access is not configured. Set ADMIN_PASSWORD on the server.");
    }
    if (!passwordMatches(data.password)) {
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      throw new Error("Incorrect staff password.");
    }
    const { db } = await import("./db.server");
    const pool = await db();
    const [rows] = await pool.execute("SELECT dob, phone FROM members WHERE id = ? LIMIT 1", [data.id]);
    const row = (rows as { dob: string | null; phone: string | null }[])[0];
    if (!row) throw new Error("Member not found.");
    const [docs] = await pool.execute("SELECT kind, data FROM member_documents WHERE member_id = ?", [data.id]);
    const byKind = Object.fromEntries((docs as { kind: string; data: string }[]).map((d) => [d.kind, d.data]));
    return {
      dob: row.dob,
      phone: row.phone,
      aadhaarDoc: byKind["aadhaar"] ?? null,
      voterDoc: byKind["voter"] ?? null,
    };
  });
