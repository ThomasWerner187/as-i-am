/** Shared UI primitives used by both demo sites. */

import { useSyncExternalStore } from "react";
import { engine } from "../engine/adaptationEngine";
import { IconMail, IconReview, IconHand, IconCheck, IconX, IconHourglass } from "./Icons";
import type { RequestStatus } from "../data/services";

export function useEngineState() {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot);
}

/** Status pill: icon + text always; colour is never the only carrier. */
export function StatusPill({ status, label }: { status: RequestStatus["status"] | string; label: string }) {
  const icons: Record<string, React.ReactNode> = {
    received: <IconMail size={14} />,
    in_review: <IconReview size={14} />,
    action_needed: <IconHand size={14} />,
    approved: <IconCheck size={14} />,
    rejected: <IconX size={14} />,
    in_stock: <IconCheck size={14} />,
    low_stock: <IconHourglass size={14} />,
    out_of_stock: <IconX size={14} />,
  };
  const tones: Record<string, string> = {
    received: "info",
    in_review: "info",
    action_needed: "warn",
    approved: "ok",
    rejected: "danger",
    in_stock: "ok",
    low_stock: "warn",
    out_of_stock: "danger",
  };
  return (
    <span className="aia-status" data-tone={tones[status] ?? "info"} data-status={status}>
      <span aria-hidden="true" className="status-icon">{icons[status] ?? "●"}</span>
      {label}
    </span>
  );
}

/** Progress indicator with step count. */
export function ProgressLine({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="progress-line" data-aia="progress">
      <span>
        {label}: {current} of {total}
      </span>
      <span
        className="bar"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={label}
      >
        <span className="fill" style={{ transform: `scaleX(${current / total})` }} />
      </span>
    </div>
  );
}

/** Screen-reader live region fed by the adaptation engine. */
export function LiveRegion() {
  const snap = useEngineState();
  const last = snap.announcement;
  return (
    <div aria-live="polite" role="status" className="visually-hidden" data-testid="live-region">
      {last}
    </div>
  );
}

/** Price display honouring important_text_scale + complete totals preference. */
export function Price({ total, old, delta }: { total: string; old?: string; delta?: string }) {
  return (
    <span className="price-row" data-aia="price-group">
      <span data-aia="price" className="price">{total}</span>
      {old && <s className="price-old">{old}</s>}
      {delta && (
        <span className="price-delta" data-aia="price-delta">
          <span aria-hidden="true">{delta.startsWith("-") ? "↓ " : "↑ "}</span>
          {delta}
        </span>
      )}
    </span>
  );
}
