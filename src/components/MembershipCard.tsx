import { Emblem } from "./Emblem";

export type Member = {
  name: string;
  state: string;
  constituency: string;
  joined: string;
  id: string;
  photoUrl?: string | undefined;
  qrUrl?: string | undefined;
  logoUrl?: string | undefined;
};

const ORG = "செந்தமிழர் புரட்சிக் கழகம்";
const SLOGAN = "புரட்சிகர மாற்றம்";

function Logo({ member, className }: { member: Member; className: string }) {
  return member.logoUrl ? (
    <img src={member.logoUrl} alt="Logo" className={`${className} object-contain`} />
  ) : (
    <Emblem className={`${className} text-gold`} />
  );
}

function QR({ member, className }: { member: Member; className: string }) {
  if (member.qrUrl)
    return <img src={member.qrUrl} alt="QR" className={`${className} bg-primary-foreground p-[0.6cqw]`} />;
  // deterministic placeholder pattern
  const cells = Array.from({ length: 81 }, (_, i) => {
    const r = Math.floor(i / 9), c = i % 9;
    const finder = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
    return finder ? !(r % 6 === 1 && c % 6 === 1) || true : (i * 7 + member.id.length * 3) % 5 < 2;
  });
  return (
    <div className={`${className} grid grid-cols-9 gap-0 bg-primary-foreground p-[0.7cqw]`}>
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-blood-deep" : ""} />
      ))}
    </div>
  );
}

function Field({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="min-w-0 leading-tight">
      <p className="text-[1.75cqw] uppercase tracking-[0.15em] text-primary-foreground/60">{label}</p>
      <p
        className={
          gold
            ? "font-mono text-[3.1cqw] font-bold tracking-wide text-gold"
            : "truncate text-[2.6cqw] font-semibold text-primary-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

function GoldLine() {
  return <div className="h-[0.35cqw] w-full bg-gold-foil" />;
}

export function CardFront({ member }: { member: Member }) {
  return (
    <article className="id-card bg-card-pattern font-tamil flex flex-col border-2 border-gold/80">
      {/* header */}
      <header className="flex items-center gap-[2cqw] px-[4cqw] pt-[2.6cqw] pb-[1.6cqw]">
        <Logo member={member} className="h-[9cqw] w-[9cqw] shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[4.3cqw] font-extrabold leading-none text-gold">{ORG}</h2>
          <p className="mt-[0.9cqw] text-[2.2cqw] font-semibold tracking-wide text-primary-foreground/85">
            {SLOGAN}
          </p>
        </div>
        <span className="rounded-[1cqw] bg-gold-foil px-[1.6cqw] py-[0.6cqw] text-[1.7cqw] font-bold uppercase tracking-[0.12em] text-blood-deep">
          Member
        </span>
      </header>
      <div className="px-[4cqw]"><GoldLine /></div>

      {/* body */}
      <div className="flex flex-1 items-center gap-[3.5cqw] px-[4cqw] py-[2cqw]">
        <div className="h-[28cqw] w-[22cqw] shrink-0 overflow-hidden rounded-[1.5cqw] border-[0.45cqw] border-gold bg-blood-deep/60">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 40 50" className="h-full w-full text-gold/40" fill="currentColor">
              <circle cx="20" cy="18" r="8" />
              <path d="M4 50c0-10 7-15 16-15s16 5 16 15z" />
            </svg>
          )}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-[2.5cqw] gap-y-[1.6cqw]">
          <div className="col-span-2"><Field label="Name / பெயர்" value={member.name} /></div>
          <Field label="State" value={member.state} />
          <Field label="Constituency" value={member.constituency} />
          <Field label="Joined" value={member.joined} />
          <div />
          <div className="col-span-2"><Field gold label="Member ID" value={member.id} /></div>
        </div>
        <QR member={member} className="h-[14cqw] w-[14cqw] shrink-0 self-end rounded-[0.8cqw]" />
      </div>

      {/* footer strip */}
      <GoldLine />
      <footer className="bg-footer py-[1.5cqw] text-center text-[2.1cqw] font-semibold text-gold">
        தன்னார்வலர் • {ORG}
      </footer>
    </article>
  );
}

export function CardBack({ member }: { member: Member }) {
  return (
    <article className="id-card bg-card-pattern font-tamil flex flex-col border-2 border-gold/80">
      <header className="flex items-center justify-center gap-[1.8cqw] pt-[2.6cqw] pb-[1.6cqw]">
        <Logo member={member} className="h-[6.5cqw] w-[6.5cqw]" />
        <h2 className="text-[4cqw] font-extrabold leading-none text-gold">{ORG}</h2>
      </header>
      <div className="px-[4cqw]"><GoldLine /></div>

      <div className="flex flex-1 items-center gap-[4cqw] px-[5cqw] py-[2cqw]">
        <div className="flex flex-col items-center gap-[1cqw]">
          <QR member={member} className="h-[20cqw] w-[20cqw] rounded-[1cqw]" />
          <p className="font-mono text-[2.4cqw] font-bold tracking-wide text-gold">{member.id}</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[1.8cqw] text-primary-foreground">
          <p className="text-[2.2cqw] leading-snug">
            இந்த அட்டை உறுப்பினர் அடையாளத்திற்காக மட்டுமே பயன்படுத்தப்படும்.
          </p>
          <p className="text-[1.9cqw] leading-snug text-primary-foreground/70">
            சரிபார்க்க QR குறியீட்டை ஸ்கேன் செய்யவும் • +91 00000 00000
          </p>
          <div className="mt-[1cqw] self-end text-center">
            <div className="mb-[0.6cqw] h-[5cqw] w-[24cqw] border-b-[0.25cqw] border-gold/70" />
            <p className="text-[1.8cqw] text-gold/90">அங்கீகரிக்கப்பட்ட கையொப்பம்</p>
          </div>
        </div>
      </div>

      <div
        className="h-[1.4cqw] w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--gold) 0 1.2cqw, var(--blood-deep) 1.2cqw 2.4cqw)",
        }}
      />
      <footer className="bg-footer py-[1.4cqw] text-center text-[2.1cqw] font-semibold text-gold">
        {ORG} • {SLOGAN}
      </footer>
    </article>
  );
}
