import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import jsQR from "jsqr";
import { extractMemberId } from "@/lib/member";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan member QR" }] }),
  component: Scan,
});

function Scan() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const go = (id: string) => navigate({ to: "/verify/$id", params: { id } });

  useEffect(() => {
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera not available. Camera access needs HTTPS (or localhost) — enter the ID below instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        const video = videoRef.current;
        if (!video || stopped) return;
        video.srcObject = stream;
        await video.play();

        const tick = () => {
          if (stopped) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code?.data) {
              const id = extractMemberId(code.data);
              if (id) {
                stopped = true;
                go(id);
                return;
              }
              setHint("That QR code is not a member card.");
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Camera permission denied or unavailable. You can enter the member ID below.");
      }
    }
    start();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onManual(e: FormEvent) {
    e.preventDefault();
    const id = extractMemberId(manual);
    if (id) go(id);
    else setHint("Enter an ID like STPK-26-353677.");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-primary">Scan member QR</h1>
          <Link to="/" className="text-sm font-semibold text-primary underline">Home</Link>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-gold/80 bg-black">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-gold/70" />
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}

        <form onSubmit={onManual} className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="STPK-26-353677"
            className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Look up
          </button>
        </form>
      </div>
    </main>
  );
}
