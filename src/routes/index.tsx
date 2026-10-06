import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createMember } from "@/lib/members.functions";
import { prepareDocument, resizeImage } from "@/lib/image";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "செந்தமிழர் புரட்சிக் கழகம் — உறுப்பினர் பதிவு" },
      { name: "description", content: "Register a member and generate a QR-enabled ID card." },
    ],
  }),
  component: Register,
});

const today = () => new Date().toISOString().slice(0, 10);

const input =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const label = "mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground";

/** Server validation errors arrive as a JSON list of zod issues; show just the first message. */
function friendlyError(err: unknown) {
  const raw = err instanceof Error ? err.message : "";
  try {
    const issues = JSON.parse(raw);
    if (Array.isArray(issues) && issues[0]?.message) return String(issues[0].message);
  } catch {
    /* not JSON */
  }
  return raw || "Something went wrong. Please try again.";
}

function DocInput({
  id,
  title,
  value,
  onChange,
}: {
  id: string;
  title: string;
  value: { name: string } | null;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <div>
      <label className={label} htmlFor={id}>{title}</label>
      <input
        id={id}
        type="file"
        required={!value}
        accept="image/*,application/pdf"
        onChange={(e) => onChange(e.target.files?.[0])}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
      />
      {value && <p className="mt-1 truncate text-xs text-muted-foreground">✓ {value.name}</p>}
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    location: "",
    dob: "",
    phone: "",
    state: "தமிழ்நாடு",
    constituency: "",
    joined: today(),
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [aadhaar, setAadhaar] = useState<{ name: string; data: string } | null>(null);
  const [voter, setVoter] = useState<{ name: string; data: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onPhoto(file?: File) {
    if (!file) return;
    try {
      setPhoto(await resizeImage(file));
    } catch {
      setError("Could not read that image. Try a JPG or PNG.");
    }
  }

  async function onDoc(file: File | undefined, set: (v: { name: string; data: string } | null) => void) {
    if (!file) return;
    setError(null);
    try {
      set({ name: file.name, data: await prepareDocument(file) });
    } catch (err) {
      set(null);
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!aadhaar || !voter) {
      setError("Please attach both the Aadhaar card and the Voter ID.");
      return;
    }
    setSaving(true);
    try {
      const { id } = await createMember({
        data: { ...form, photo, aadhaarDoc: aadhaar.data, voterDoc: voter.data },
      });
      await navigate({ to: "/card/$id", params: { id } });
    } catch (err) {
      setError(friendlyError(err));
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-tamil text-xl font-extrabold text-primary">உறுப்பினர் பதிவு</h1>
          <Link to="/scan" className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-primary">
            Scan QR
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-primary/20 bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="h-28 w-22 shrink-0 overflow-hidden rounded-md border-2 border-gold bg-muted" style={{ width: "5.5rem" }}>
              {photo ? (
                <img src={photo} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Photo</div>
              )}
            </div>
            <div className="flex-1">
              <label className={label} htmlFor="photo">Photo</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => onPhoto(e.target.files?.[0])}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="name">Name / பெயர்</label>
            <input id="name" required minLength={2} value={form.name} onChange={set("name")} className={`${input} font-tamil`} />
          </div>
          <div>
            <label className={label} htmlFor="location">Location / இடம்</label>
            <input id="location" required value={form.location} onChange={set("location")} placeholder="Village / town / city" className={`${input} font-tamil`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="dob">Date of birth</label>
              <input id="dob" type="date" required max={today()} value={form.dob} onChange={set("dob")} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                required
                autoComplete="tel"
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={set("phone")}
                className={input}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="state">State</label>
              <input id="state" required value={form.state} onChange={set("state")} className={`${input} font-tamil`} />
            </div>
            <div>
              <label className={label} htmlFor="constituency">Constituency</label>
              <input id="constituency" required value={form.constituency} onChange={set("constituency")} className={`${input} font-tamil`} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="joined">Joined</label>
            <input id="joined" type="date" required value={form.joined} onChange={set("joined")} className={input} />
          </div>

          <div className="space-y-3 rounded-lg border border-dashed border-primary/30 p-3">
            <p className="text-xs text-muted-foreground">Documents (JPG, PNG or PDF). Only authorised staff can view them.</p>
            <DocInput id="aadhaar" title="Aadhaar card" value={aadhaar} onChange={(f) => onDoc(f, setAadhaar)} />
            <DocInput id="voter" title="Voter ID" value={voter} onChange={(f) => onDoc(f, setVoter)} />
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save & generate ID card"}
          </button>
        </form>
      </div>
    </main>
  );
}
