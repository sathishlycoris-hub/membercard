import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CardBack, CardFront, type Member } from "@/components/MembershipCard";
import { getMember } from "@/lib/members.functions";
import { toDisplayDate, verifyUrl } from "@/lib/member";
import { useQrDataUrl } from "@/hooks/use-qr";

export const Route = createFileRoute("/card/$id")({
  loader: async ({ params }) => {
    const member = await getMember({ data: { id: params.id } });
    if (!member) throw notFound();
    return member;
  },
  head: () => ({ meta: [{ title: "உறுப்பினர் அடையாள அட்டை" }] }),
  component: CardPage,
});

type View = "both" | "front" | "back";

function CardPage() {
  const record = Route.useLoaderData();
  const qrUrl = useQrDataUrl(verifyUrl(record.id));

  const member: Member = {
    name: record.name,
    state: record.state,
    constituency: record.constituency,
    joined: toDisplayDate(record.joined),
    id: record.id,
    photoUrl: record.photo ?? undefined,
    qrUrl,
    logoUrl: undefined,
  };

  const [view, setView] = useState<View>("both");
  const [printOnly, setPrintOnly] = useState<View>("both");

  const print = (which: View) => {
    setPrintOnly(which);
    setTimeout(() => {
      window.print();
      setPrintOnly("both");
    }, 50);
  };

  const showFront = view !== "back";
  const showBack = view !== "front";
  const btn = "rounded-md px-4 py-2 text-sm font-semibold transition-colors";

  return (
    <main className="print-root min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6">
        <div className="no-print flex flex-wrap items-center justify-center gap-2">
          <div className="flex rounded-lg border border-primary/20 bg-card p-1">
            {(["both", "front", "back"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`${btn} ${view === v ? "bg-primary text-primary-foreground" : "text-primary"}`}
              >
                {v === "both" ? "Both" : v === "front" ? "Front" : "Back"}
              </button>
            ))}
          </div>
          <button onClick={() => print("front")} className={`${btn} bg-primary text-primary-foreground`}>
            Print Front
          </button>
          <button onClick={() => print("back")} className={`${btn} bg-primary text-primary-foreground`}>
            Print Back
          </button>
          <button onClick={() => print("both")} className={`${btn} bg-gold text-primary`}>
            Download / Print PDF
          </button>
        </div>

        {showFront && (
          <section className={`card-slot flex w-full flex-col items-center gap-2 ${printOnly === "back" ? "print-hide" : ""}`}>
            <p className="no-print text-xs uppercase tracking-widest text-muted-foreground">Front</p>
            <CardFront member={member} />
          </section>
        )}
        {showBack && (
          <section className={`card-slot flex w-full flex-col items-center gap-2 ${printOnly === "front" ? "print-hide" : ""}`}>
            <p className="no-print text-xs uppercase tracking-widest text-muted-foreground">Back</p>
            <CardBack member={member} />
          </section>
        )}

        <p className="no-print text-center text-xs text-muted-foreground">
          Actual print size: 85.6 × 54 mm (CR80). Set printer margins to none.
        </p>
        <div className="no-print flex gap-4 text-sm">
          <Link to="/" className="font-semibold text-primary underline">+ New member</Link>
          <Link to="/verify/$id" params={{ id: record.id }} className="font-semibold text-primary underline">
            Open verify page
          </Link>
          <Link to="/scan" className="font-semibold text-primary underline">Scan QR</Link>
        </div>
      </div>
    </main>
  );
}
