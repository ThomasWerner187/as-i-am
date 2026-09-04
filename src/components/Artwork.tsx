/** Inline SVG product illustrations — neutral, consistent, offline. */

export function Artwork({ id, title }: { id: string; title: string }) {
  return (
    <svg viewBox="0 0 200 150" role="img" aria-label={`Illustration: ${title}`} preserveAspectRatio="xMidYMid meet">
      <rect width="200" height="150" fill="var(--accent-soft)" />
      <circle cx="100" cy="80" r="62" fill="var(--paper-raised)" opacity="0.65" />
      {id === "headphones-1" && (
        <g>
          <path d="M52 95 v-18 a48 48 0 0 1 96 0 v18" fill="none" stroke="#26303e" strokeWidth="10" strokeLinecap="round" />
          <rect x="36" y="88" width="26" height="42" rx="12" fill="#26303e" />
          <rect x="138" y="88" width="26" height="42" rx="12" fill="#26303e" />
          <rect x="42" y="94" width="14" height="30" rx="7" fill="#3d5a80" />
          <rect x="144" y="94" width="14" height="30" rx="7" fill="#3d5a80" />
        </g>
      )}
      {id === "headphones-2" && (
        <g>
          <path d="M55 92 v-15 a45 45 0 0 1 90 0 v15" fill="none" stroke="#5c4632" strokeWidth="9" strokeLinecap="round" />
          <rect x="40" y="86" width="24" height="38" rx="10" fill="#5c4632" />
          <rect x="136" y="86" width="24" height="38" rx="10" fill="#5c4632" />
          <circle cx="148" cy="105" r="4" fill="#e8d9c4" />
        </g>
      )}
      {id === "earbuds-1" && (
        <g>
          <ellipse cx="82" cy="82" rx="20" ry="26" fill="#5a7247" />
          <ellipse cx="120" cy="82" rx="20" ry="26" fill="#5a7247" />
          <ellipse cx="82" cy="76" rx="11" ry="14" fill="#eef2e6" />
          <ellipse cx="120" cy="76" rx="11" ry="14" fill="#eef2e6" />
          <path d="M96 112 q8 10 20 6" stroke="#5a7247" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === "earbuds-2" && (
        <g>
          <path d="M70 95 q10 -30 30 -30 q22 0 32 30" fill="none" stroke="#b5654a" strokeWidth="10" strokeLinecap="round" />
          <circle cx="70" cy="98" r="9" fill="#b5654a" />
          <circle cx="132" cy="98" r="9" fill="#b5654a" />
          <path d="M62 116 q40 14 78 0" stroke="#e5c9b8" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === "lamp" && (
        <g>
          <rect x="88" y="70" width="7" height="52" rx="3" fill="#8a6d3b" />
          <rect x="62" y="120" width="60" height="8" rx="4" fill="#8a6d3b" />
          <path d="M56 66 a44 26 0 0 1 88 0 z" fill="#e9d9a8" stroke="#8a6d3b" strokeWidth="4" />
          <circle cx="100" cy="78" r="7" fill="#fdf3cf" />
        </g>
      )}
      {id === "clock" && (
        <g>
          <circle cx="100" cy="80" r="46" fill="#a1824a" />
          <circle cx="100" cy="80" r="34" fill="#f5ecd7" />
          <circle cx="100" cy="80" r="20" fill="#e7743f" opacity="0.85" />
          <circle cx="100" cy="80" r="8" fill="#f5ecd7" />
        </g>
      )}
      {id === "reader" && (
        <g>
          <rect x="62" y="46" width="76" height="104" rx="8" fill="#4a4a52" />
          <rect x="70" y="56" width="60" height="76" rx="3" fill="#e8e6dc" />
          {[68, 76, 84, 92].map((y) => (
            <line key={y} x1="76" y1={y} x2="124" y2={y} stroke="#b8b4a4" strokeWidth="3" strokeLinecap="round" />
          ))}
          <circle cx="100" cy="140" r="4" fill="#e8e6dc" />
        </g>
      )}
      {id === "magnifier" && (
        <g>
          <circle cx="92" cy="70" r="30" fill="#dfe9ef" stroke="#7a6c5d" strokeWidth="7" />
          <line x1="114" y1="92" x2="142" y2="120" stroke="#7a6c5d" strokeWidth="9" strokeLinecap="round" />
          <text x="92" y="78" textAnchor="middle" fontSize="20" fontWeight="700" fill="#41506b">Aa</text>
        </g>
      )}
      <g opacity="0.9">
        <circle cx="24" cy="24" r="5" fill="var(--accent)" opacity="0.35" />
        <circle cx="178" cy="128" r="7" fill="var(--accent)" opacity="0.25" />
      </g>
    </svg>
  );
}
