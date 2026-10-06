import { z } from "zod";

export const MEMBER_ID_RE = /^STPK-\d{2}-\d{6}$/;

const DOC_RE = /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/;

export const memberInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(150),
  location: z.string().trim().min(2, "Location is required").max(200),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date of birth"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
  state: z.string().trim().min(2, "State is required").max(100),
  constituency: z.string().trim().min(2, "Constituency is required").max(100),
  joined: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  // resized image as a data URL (see resizeImage); ~600 KB cap
  photo: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/, "Invalid image")
    .max(600_000, "Photo is too large")
    .nullish(),
  // Attachments: image (compressed in the browser) or PDF, as data URLs
  aadhaarDoc: z.string().regex(DOC_RE, "Attach your Aadhaar card (image or PDF)").max(2_500_000, "Aadhaar file is too large"),
  voterDoc: z.string().regex(DOC_RE, "Attach your Voter ID (image or PDF)").max(2_500_000, "Voter ID file is too large"),
});

export const memberIdSchema = z.object({ id: z.string().regex(MEMBER_ID_RE, "Invalid member ID") });

export const privateAccessSchema = z.object({
  id: z.string().regex(MEMBER_ID_RE, "Invalid member ID"),
  password: z.string().min(1, "Enter the staff password").max(200),
});

export type MemberInput = z.infer<typeof memberInputSchema>;

/** Safe to show to anyone who scans the QR code. */
export type MemberRecord = {
  id: string;
  name: string;
  state: string;
  constituency: string;
  location: string | null;
  joined: string;
  photo: string | null;
};

/** Only returned after the staff password is verified. */
export type MemberPrivate = {
  dob: string | null;
  phone: string | null;
  aadhaarDoc: string | null;
  voterDoc: string | null;
};

/** 2026-06-05 -> 05-06-2026 (format printed on the card) */
export function toDisplayDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

export function verifyUrl(id: string) {
  const base =
    (import.meta.env["VITE_PUBLIC_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/verify/${id}`;
}

/** Accepts a scanned URL (…/verify/STPK-26-123456) or a bare member ID. */
export function extractMemberId(text: string): string | null {
  const m = text.toUpperCase().match(/STPK-\d{2}-\d{6}/);
  return m ? m[0] : null;
}
