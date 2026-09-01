/**
 * AdaptationEngine — applies functional profiles as atomic, undoable
 * operations. State is session-only (in memory). The website renders from
 * this state: CSS custom properties, data-attributes, and React-level
 * structural changes (nav reduction, status labels, reading mode, steps).
 */

import type {
  AdaptationResult,
  AppliedChange,
  FunctionalProfile,
  ReadingMode,
  UndoInfo,
} from "../adaptive-contract/schema";
import { CONTRACT_VERSION } from "../adaptive-contract/schema";
import { mergeProfiles, normalizeProfile } from "../adaptive-contract/profile";
import { validateProfile } from "../adaptive-contract/schema";
import { BASE_TOKENS, changeKind, explainChange, profileToTokenOps } from "./tokens";

export interface EngineSnapshot {
  /** Version counter, increments with every applied operation. */
  adaptationVersion: number;
  /** The currently active merged profile ({} when none). */
  active: Record<string, Record<string, unknown>>;
  /** Cumulative applied changes (latest op last). */
  applied: AppliedChange[];
  /** Undo stack depth. */
  undoDepth: number;
  /** Last operation id + label. */
  lastOp?: { id: string; label: string };
  /** Live-region queue for screen reader announcements. */
  announcement: string;
  /** True when the current state is the unmodified base. */
  isBase: boolean;
  /** Stats for the receipt. */
  stats: { adaptations_applied: number; refinements: number };
}

type Listener = () => void;

function flatten(profile: Record<string, Record<string, unknown>>): Map<string, unknown> {
  const flat = new Map<string, unknown>();
  for (const [section, fields] of Object.entries(profile)) {
    if (section === "version" || section === "label") continue;
    for (const [k, v] of Object.entries(fields ?? {})) flat.set(`${section}.${k}`, v);
  }
  return flat;
}

let opCounter = 0;
function newOpId(): string {
  opCounter += 1;
  return `op-${Date.now().toString(36)}-${opCounter}`;
}

export class AdaptationEngine {
  private listeners = new Set<Listener>();
  private undoStack: { profile: Record<string, Record<string, unknown>>; label: string; opId: string }[] = [];
  private appliedAll: AppliedChange[] = [];
  private stats = { adaptations_applied: 0, refinements: 0 };
  private announcement = "";
  private current: Record<string, Record<string, unknown>> = {};
  private version = 0;
  private lastOp?: { id: string; label: string };
  private snapshotCache: EngineSnapshot | null = null;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Stable snapshot for useSyncExternalStore — rebuilt only when state changes. */
  getSnapshot = (): EngineSnapshot => {
    if (!this.snapshotCache) {
      this.snapshotCache = {
        adaptationVersion: this.version,
        active: this.current,
        applied: this.appliedAll,
        undoDepth: this.undoStack.length,
        lastOp: this.lastOp,
        announcement: this.announcement,
        isBase: Object.keys(this.current).length === 0,
        stats: { ...this.stats },
      };
    }
    return this.snapshotCache;
  };

  private emit(): void {
    this.snapshotCache = null;
    for (const l of this.listeners) l();
  }

  private announce(text: string): void {
    this.announcement = text;
  }

  /** Public announcement (tools push user-visible status here). */
  announceNow(text: string): void {
    this.announce(text);
    this.emit();
  }

  /* ---------------------------------------------------------------- */
  /* Core operations                                                  */
  /* ---------------------------------------------------------------- */

  /**
   * Apply (merge) a functional profile as one atomic, undoable operation.
   * Returns what actually changed — after the change is in effect.
   */
  applyProfile(incoming: FunctionalProfile, label: string): AdaptationResult {
    const validity = validateProfile(incoming);
    const warnings: string[] = validity.issues
      .filter((i) => i.code === "out_of_range")
      .map((i) => i.message);
    const hardFail = validity.issues.find(
      (i) => i.code === "unknown_key" || i.code === "bad_type" || i.code === "bad_version",
    );
    if (hardFail) {
      return {
        ok: false,
        operation_id: newOpId(),
        adaptation_version: this.version,
        applied: [],
        unmet: [
          {
            key: hardFail.path,
            reason: "unsupported",
            detail: hardFail.message,
          },
        ],
        warnings,
      };
    }
    const { profile: normalized, clamped } = normalizeProfile(incoming);
    for (const c of clamped) warnings.push(`${c.key} clamped from ${c.from} to ${c.to} (contract range).`);

    const merged = mergeProfiles(
      { version: CONTRACT_VERSION, ...this.current } as unknown as FunctionalProfile,
      normalized,
    ) as unknown as Record<string, Record<string, unknown>>;

    const changes = this.diffInto(merged, label);
    this.stats.adaptations_applied += 1;
    this.announce(`Adaptation applied: ${changes.length} changes. ${label}`);
    this.emit();
    return {
      ok: true,
      operation_id: this.lastOp?.id ?? newOpId(),
      adaptation_version: this.version,
      applied: changes,
      unmet: [],
      warnings,
    };
  }

  /** Granular tuning: merge a partial patch into one section. */
  tuneSection(section: string, patch: Record<string, unknown>, label: string): AdaptationResult {
    const wrapper: Record<string, Record<string, unknown>> = { [section]: patch };
    const asProfile = { version: CONTRACT_VERSION, ...wrapper } as unknown as FunctionalProfile;
    return this.applyProfile(asProfile, label);
  }

  private diffInto(next: Record<string, Record<string, unknown>>, label: string): AppliedChange[] {
    const before = flatten(this.current);
    const after = flatten(next);
    const changes: AppliedChange[] = [];
    for (const [key, to] of after) {
      const from = before.has(key) ? before.get(key) : null;
      if (from !== to) {
        changes.push({
          key,
          kind: changeKind(key),
          from: from as string | number | boolean | null,
          to: to as string | number | boolean,
          explanation: explainChange(key, to),
        });
      }
    }
    // Keys that existed before but are absent now (never happens for merge, but safe).
    this.undoStack.push({
      profile: structuredClone(this.current),
      label,
      opId: newOpId(),
    });
    this.current = next;
    this.appliedAll = [...this.appliedAll, ...changes];
    this.version += 1;
    this.lastOp = { id: this.undoStack[this.undoStack.length - 1].opId, label };
    return changes;
  }

  undo(): AdaptationResult & { restored: boolean } {
    const prev = this.undoStack.pop();
    if (!prev) {
      return {
        ok: true,
        restored: false,
        operation_id: newOpId(),
        adaptation_version: this.version,
        applied: [],
        unmet: [],
        warnings: ["Nothing to undo — already at the earliest state of this session."],
      };
    }
    const before = flatten(this.current);
    const restored = prev.profile;
    const after = flatten(restored);
    const changes: AppliedChange[] = [];
    for (const [key, to] of after) {
      const from = before.has(key) ? before.get(key) : null;
      if (from !== to) {
        changes.push({
          key,
          kind: changeKind(key),
          from: from as string | number | boolean | null,
          to: to as string | number | boolean,
          explanation: `Reverted ${key} back to ${String(to)}.`,
        });
      }
    }
    this.current = restored;
    this.stats.refinements += 1;
    this.version += 1;
    this.lastOp = { id: prev.opId, label: `Undo: ${prev.label}` };
    this.announce("Last adaptation undone.");
    this.emit();
    return {
      ok: true,
      restored: true,
      operation_id: prev.opId,
      adaptation_version: this.version,
      applied: changes,
      unmet: [],
      warnings: [],
    };
  }

  reset(): AdaptationResult {
    const hadChanges = Object.keys(this.current).length > 0;
    this.undoStack.push({
      profile: structuredClone(this.current),
      label: "reset",
      opId: newOpId(),
    });
    this.current = {};
    this.version += 1;
    this.lastOp = { id: newOpId(), label: "Reset to normal view" };
    this.announce("All adaptations removed. Normal view restored.");
    this.emit();
    return {
      ok: true,
      operation_id: this.lastOp.id,
      adaptation_version: this.version,
      applied: hadChanges
        ? [{ key: "*", kind: "token", from: "adapted", to: "base", explanation: "Restored the normal base view." }]
        : [],
      unmet: [],
      warnings: [],
    };
  }

  getUndoInfo(): UndoInfo {
    return {
      available: this.undoStack.length > 0,
      depth: this.undoStack.length,
      last_operation_id: this.lastOp?.id,
      last_label: this.lastOp?.label,
    };
  }

  /** Plain-language summary of everything currently changed vs. base. */
  explainCurrent(): string[] {
    const base = flatten({});
    const now = flatten(this.current);
    const lines: string[] = [];
    for (const [key, to] of now) {
      const from = base.get(key) ?? null;
      if (from !== to) lines.push(explainChange(key, to));
    }
    return lines;
  }

  /** DOM sync: write tokens + data attributes to <html>. */
  syncDom(): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const { tokens, flags } = profileToTokenOps(this.current);
    // Clear previously set tokens first, then write the active ones — so
    // undo/reset truly restores the base view.
    for (const k of Object.keys(BASE_TOKENS)) root.style.removeProperty(k);
    root.style.removeProperty("--aia-brightness-value");
    for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v);
    for (const name of [
      "contrast", "glare", "color-mode", "font-style", "status-labels", "focus",
      "keyboard-first", "no-drag", "no-dblclick", "cursor-size", "min-target", "density",
      "hide-nonessential", "labels", "steps", "progress", "help", "plain-errors",
      "motion", "autoplay", "parallax", "captions", "transcripts", "static-media",
      "brightness",
    ]) {
      if (flags[name] !== undefined) {
        root.setAttribute(`data-aia-${name}`, flags[name]);
      } else {
        root.removeAttribute(`data-aia-${name}`);
      }
    }
    // Enlarged cursor: an honest large-pointer rendering (data-URI SVG).
    if (flags["cursor-size"] !== undefined) {
      const size = Number(flags["cursor-size"]) || 32;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 2}' fill='rgba(176,81,43,0.35)' stroke='%2326231c' stroke-width='2.5'/></svg>`;
      root.style.cursor = `url("data:image/svg+xml,${svg}") ${size / 2} ${size / 2}, auto`;
    } else {
      root.style.cursor = "";
    }
  }
}

/** React-friendly singleton. */
export const engine = new AdaptationEngine();
