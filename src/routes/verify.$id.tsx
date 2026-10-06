import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getMember, getMemberPrivate } from "@/lib/members.functions";
import { MEMBER_ID_RE, toDisplayDate, type MemberPrivate, type MemberRecord } from "@/lib/member";

export const Route = createFileRoute("/verify/$id")({
  // Reads the member straight from MySQL — this is the page the QR code opens.
  loader: ({ params }) =>
    MEMBER_ID_RE.test(params.id) ? getMember({ data: { id: params.id } }) : null,
  head: () => ({ meta: [{ title: "உறுப்பினர் சரிபார்ப்பு — Member verification" }] }),
  errorComponent: () => <Result ok={false} />,
  component: Verify,
});

function Verify() {
  const member = Route.useLoaderData();
  return <Result ok={!!member} member={member ?? undefined} />;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="font-tamil text-right text-sm font-semibold text-foreground">{v}</dd>
    </div>
  );
}

function friendlyError(err: unknown) {
  const raw = err instanceof Error ? err.message : "";
  try {
    const issues = JSON.parse(raw);
    if (Array.isArray(issues) && issues[0]?.message) return String(issues[0].message);
  } catch {
    /* not JSON */
  }
  return raw || "Something went wrong.";
}

function Doc({ title, data }: { title: string; data: string | null }) {
  if (!data) return null;
  const isPdf = data.startsWith("data:application/pdf");
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      {isPdf ? (
        <iframe title={title} src={data} className="h-72 w-full rounded-md border border-border" />
      ) : (
        <img src={data} alt={title} className="w-full rounded-md border border-border" />
      )}
      <a
        href={data}
        download={`${title.replace(/\s+/g, "-").toLowerCase()}.${isPdf ? "pdf" : "jpg"}`}
        className="mt-1 inline-block text-xs font-semibold text-primary underline"
      >
        Download
      </a>
    </div>
  );
}

/** Password-protected: DOB, phone and the Aadhaar / Voter ID attachments. */
function StaffPanel({ id }: { id: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<MemberPrivate | null>(null);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setDetails(await getMemberPrivate({ data: { id, password } }));
      setPassword("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!details) {
    return (
      <form onSubmit={unlock} className="mt-4 rounded-xl border border-primary/20 bg-card p-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Staff access · full details</p>
        <div className="flex gap-2">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Staff password"
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            disabled={busy || !password}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "…" : "Unlock"}
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      </form>
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border-2 border-gold/80 bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Confidential</p>
        <button onClick={() => setDetails(null)} className="text-xs font-semibold text-primary underline">
          Hide
        </button>
      </div>
      <dl>
        <Row k="Date of birth" v={details.dob ? toDisplayDate(details.dob) : "—"} />
        <Row k="Phone" v={details.phone ?? "—"} />
      </dl>
      <Doc title="Aadhaar card" data={details.aadhaarDoc} />
      <Doc title="Voter ID" data={details.voterDoc} />
    </div>
  );
}

function Result({ ok, member }: { ok: boolean; member?: undefined | MemberRecord }) {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-sm">
        {ok && member ? (
          <>
            <div className="overflow-hidden rounded-xl border-2 border-gold/80 bg-card">
              <div className="bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">
                ✓ Verified member · சரிபார்க்கப்பட்டது
              </div>
              <div className="flex flex-col items-center gap-4 p-5">
                <div className="h-40 w-32 overflow-hidden rounded-md border-2 border-gold bg-muted">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</div>
                  )}
                </div>
                <dl className="w-full">
                  <Row k="Name" v={member.name} />
                  {member.location && <Row k="Location" v={member.location} />}
                  <Row k="State" v={member.state} />
                  <Row k="Constituency" v={member.constituency} />
                  <Row k="Joined" v={toDisplayDate(member.joined)} />
                  <Row k="Member ID" v={member.id} />
                </dl>
              </div>
            </div>
            <StaffPanel id={member.id} />
          </>
        ) : (
          <div className="rounded-xl border-2 border-destructive/60 bg-card p-6 text-center">
            <p className="text-lg font-bold text-destructive">Member not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This QR code / ID is not registered. உறுப்பினர் பதிவு கிடைக்கவில்லை.
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link to="/scan" className="font-semibold text-primary underline">Scan another</Link>
          <Link to="/" className="font-semibold text-primary underline">Home</Link>
        </div>
      </div>
    </main>
  );
}
