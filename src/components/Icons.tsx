/** Authored SVG icon set — one stroke voice, no emoji. */

interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number | undefined, className: string | undefined) {
  return {
    width: size ?? 18,
    height: size ?? 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false as const,
    className,
  };
}

export const IconSearch = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
);
export const IconHeart = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6 3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 3.7-3.5 6.9-8.5 10.9Z" /></svg>
);
export const IconUser = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" /></svg>
);
export const IconCart = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M3 4h2.2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L21 8H6" /><circle cx="10" cy="20.3" r="1.4" /><circle cx="17.5" cy="20.3" r="1.4" /></svg>
);
export const IconEye = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconUndo = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M8.5 4.5 4 9l4.5 4.5" /><path d="M4 9h9.5a6.5 6.5 0 0 1 0 13H8" /></svg>
);
export const IconReset = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3v5h-5" /></svg>
);
export const IconRuler = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><rect x="2.8" y="9" width="18.4" height="6.5" rx="1.4" transform="rotate(-38 12 12)" /><path d="m8.2 13.4 1.4 1.8M11 10.9l1.4 1.8M13.8 8.4l1.4 1.8" /></svg>
);
export const IconReceipt = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M5.5 3.5h13V20l-2.2-1.4L14 20l-2-1.4L10 20l-2.3-1.4L5.5 20Z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></svg>
);
export const IconSpark = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></svg>
);
export const IconRobot = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><rect x="4.5" y="8" width="15" height="11" rx="2.5" /><path d="M12 8V4.5M9.5 4.5h5" /><circle cx="9" cy="13" r="0.6" fill="currentColor" /><circle cx="15" cy="13" r="0.6" fill="currentColor" /><path d="M9.5 16h5" /></svg>
);
export const IconSliders = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M5 4v6M5 14v6M12 4v10M12 18v2M19 4v2M19 10v10" /><circle cx="5" cy="12" r="2" /><circle cx="12" cy="16" r="2" /><circle cx="19" cy="8" r="2" /></svg>
);
export const IconLock = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><rect x="5.5" y="10.5" width="13" height="9" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>
);
export const IconClose = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const IconInfo = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle cx="12" cy="8.2" r="0.7" fill="currentColor" stroke="none" /></svg>
);
export const IconCheck = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconHourglass = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M7 3.5h10M7 20.5h10M8 3.5v3c0 2.5 4 3.5 4 5.5s-4 3-4 5.5v3M16 3.5v3c0 2.5-4 3.5-4 5.5s4 3 4 5.5v3" /></svg>
);
export const IconPhone = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M7 3.5H5.8A1.8 1.8 0 0 0 4 5.3C4 13.9 10.1 20 18.7 20a1.8 1.8 0 0 0 1.8-1.8V17a1.5 1.5 0 0 0-1.2-1.5l-2.8-.6a1.5 1.5 0 0 0-1.5.6l-.7 1a12.6 12.6 0 0 1-5-5l1-.7a1.5 1.5 0 0 0 .6-1.5l-.6-2.8A1.5 1.5 0 0 0 8.8 4.7" /></svg>
);
export const IconMail = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4.5 7.5 7.5 5.5 7.5-5.5" /></svg>
);
export const IconReview = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.3-4.3" /><path d="M8 10.5h5M10.5 8v5" /></svg>
);
export const IconHand = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><path d="M9 11.5V5.8a1.4 1.4 0 0 1 2.8 0v4.9M11.8 10.5V4.8a1.4 1.4 0 0 1 2.8 0v5.7M14.6 11V6.6a1.4 1.4 0 0 1 2.8 0v7.6c0 3.6-2.2 6.3-5.7 6.3-3 0-4.4-1.5-5.9-4.4L4.6 13.6a1.5 1.5 0 0 1 2.5-1.6L9 14" /></svg>
);
export const IconX = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="8.5" /><path d="m9 9 6 6M15 9l-6 6" /></svg>
);
