export function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="3" />
      {/* rays */}
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="60"
          y1="60"
          x2={60 + 52 * Math.cos((i * Math.PI) / 12)}
          y2={60 + 52 * Math.sin((i * Math.PI) / 12)}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.18"
        />
      ))}
      {/* rising torch / flame */}
      <path
        d="M60 26c9 10 13 17 13 24a13 13 0 1 1-26 0c0-7 4-14 13-24z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M54 66h12l-3 18h-6l-3-18z" fill="currentColor" opacity="0.75" />
      {/* community figures */}
      <g fill="currentColor" opacity="0.85">
        <circle cx="38" cy="74" r="5" />
        <path d="M29 94c0-6 4-9 9-9s9 3 9 9z" />
        <circle cx="82" cy="74" r="5" />
        <path d="M73 94c0-6 4-9 9-9s9 3 9 9z" />
        <circle cx="60" cy="80" r="5.5" />
        <path d="M50 99c0-6.5 4.5-10 10-10s10 3.5 10 10z" />
      </g>
    </svg>
  );
}
