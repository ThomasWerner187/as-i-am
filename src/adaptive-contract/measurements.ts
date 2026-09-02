/**
 * Adaptive Web Contract — measurements.ts
 * Measures the RENDERED UI. The agent's feedback loop is
 * observe → adapt → measure → refine, and tools must report real values.
 */

import type { Capability } from "./schema";
import { isKnownCapabilityKey } from "./capabilities";

export interface RenderedMeasurements {
  smallest_body_text_px: number;
  price_text_px: { smallest: number; largest: number };
  smallest_target_px: number;
  min_action_gap_px: number;
  contrast: { min_ratio: number; sample_size: number };
  primary_actions_visible: number;
  animations_running: number;
  horizontal_overflow: boolean;
  occluded_focusables: number;
  samples?: {
    body_text: number;
    prices: number;
    targets: number;
    action_gaps: number;
    contrast: number;
  };
  /** DOM-backed contract signals (tokens, flags and rendered reading mode). */
  rendered_signals?: Record<string, number | string | boolean>;
  measured_at: string;
}

/**
 * Let React external-store subscribers commit and the browser calculate layout
 * before a tool reads geometry. Two frames also cover a commit scheduled from
 * a microtask. Each frame has a timeout so background tabs cannot hang a tool.
 */
export async function waitForRenderedCommit(): Promise<void> {
  await Promise.resolve();
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const frame = () => new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = window.setTimeout(finish, 50);
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        window.clearTimeout(timer);
        finish();
      });
    } else {
      window.clearTimeout(timer);
      window.setTimeout(finish, 0);
    }
  });
  await frame();
  await frame();
}

function px(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function isVisible(el: Element): boolean {
  const closedDetails = el.closest("details:not([open])");
  if (closedDetails && el.tagName !== "SUMMARY" && !el.closest("summary")) return false;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

const INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';

const MEASUREMENT_EXCLUDE_SELECTOR = [
  "[data-aia-demo-chrome]",
  '[data-aia-measure="exclude"]',
  '[data-aia-measure-exclude="true"]',
  ".aia-panel",
  ".aia-fab",
  ".mcp-chip",
  ".aia-live",
].join(",");

function excluded(el: Element): boolean {
  return Boolean(el.closest(MEASUREMENT_EXCLUDE_SELECTOR));
}

function effectiveTargetRect(el: HTMLElement): DOMRect {
  if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
    const labels = Array.from(el.labels ?? []).filter((label) => isVisible(label) && !excluded(label));
    if (labels.length > 0) {
      return labels
        .map((label) => label.getBoundingClientRect())
        .sort((a, b) => b.width * b.height - a.width * a.height)[0];
    }
  }
  return el.getBoundingClientRect();
}

export function collectMeasurements(root: Document | HTMLElement = document): RenderedMeasurements {
  const doc = root.nodeType === 9 ? (root as Document) : (root as HTMLElement).ownerDocument;
  // App/judge controls live outside #main. Measuring the page's own content
  // makes the result stable whether the demo chrome is open or closed.
  const scope: Document | HTMLElement = root.nodeType === 9
    ? ((root as Document).querySelector<HTMLElement>("#main") ?? (root as Document))
    : (root as HTMLElement);
  const queryAll = <T extends Element>(selector: string): T[] =>
    Array.from(scope.querySelectorAll<T>(selector)).filter((el) => !excluded(el));

  const bodyEls = queryAll<HTMLElement>("p, li, td, th, span, label, a, button, h1, h2, h3, h4");
  let smallestBody = Number.POSITIVE_INFINITY;
  let bodySamples = 0;
  for (const el of bodyEls) {
    if (!isVisible(el) || !el.textContent?.trim()) continue;
    const size = px(getComputedStyle(el).fontSize);
    if (size > 0) {
      smallestBody = Math.min(smallestBody, size);
      bodySamples++;
    }
  }

  const priceEls = queryAll<HTMLElement>('[data-aia="price"]');
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;
  let priceSamples = 0;
  for (const el of priceEls) {
    if (!isVisible(el)) continue;
    const size = px(getComputedStyle(el).fontSize);
    minPrice = Math.min(minPrice, size);
    maxPrice = Math.max(maxPrice, size);
    priceSamples++;
  }

  // Smallest interactive target. For checkbox/radio controls the associated
  // label is the effective pointer target, not the tiny native glyph alone.
  let smallestTarget = Number.POSITIVE_INFINITY;
  const targets: { el: HTMLElement; r: DOMRect }[] = [];
  for (const el of queryAll<HTMLElement>(INTERACTIVE_SELECTOR)) {
    const htmlEl = el as HTMLElement;
    if (!isVisible(htmlEl)) continue;
    const r = effectiveTargetRect(htmlEl);
    if (r.width <= 0 || r.height <= 0) continue;
    smallestTarget = Math.min(smallestTarget, Math.min(r.width, r.height));
    targets.push({ el: htmlEl, r });
  }

  // Minimum gap between adjacent interactive siblings inside action groups.
  let minGap = Number.POSITIVE_INFINITY;
  let gapSamples = 0;
  const groups = queryAll<HTMLElement>('[data-aia="actions"], [role="toolbar"], nav');
  for (const group of groups) {
    const kids = Array.from(group.querySelectorAll(INTERACTIVE_SELECTOR))
      .filter((el) => isVisible(el) && !excluded(el))
      .map((el) => effectiveTargetRect(el as HTMLElement));
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i];
        const b = kids[j];
        const gapX = Math.max(b.left - a.right, a.left - b.right, 0);
        const gapY = Math.max(b.top - a.bottom, a.top - b.bottom, 0);
        const gap = gapX > 0 || gapY > 0 ? (gapX > 0 && gapY > 0 ? Math.hypot(gapX, gapY) : Math.max(gapX, gapY)) : 0;
        minGap = Math.min(minGap, gap);
        gapSamples++;
      }
    }
  }

  // Contrast sampling on visible text nodes.
  let minContrast = Number.POSITIVE_INFINITY;
  let contrastSamples = 0;
  const contrastEls = queryAll<HTMLElement>("p, li, td, th, a, button, span, label, h1, h2, h3, h4");
  for (const el of contrastEls) {
    if (!isVisible(el) || !el.textContent?.trim()) continue;
    if (contrastSamples >= 120) break;
    const ratio = effectiveContrast(el);
    if (ratio !== null) {
      minContrast = Math.min(minContrast, ratio);
      contrastSamples++;
    }
  }

  const primaryActions = Array.from(
    scope.querySelectorAll('[data-aia="primary"]'),
  ).filter((el) => isVisible(el) && !excluded(el)).length;

  const animationsRunning = doc.getAnimations
    ? doc.getAnimations().filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        if (!(target instanceof Element) || excluded(target)) return false;
        return scope.nodeType === 9 || scope.contains(target);
      }).length
    : 0;

  const overflowNode = scope.nodeType === 9 ? doc.documentElement : (scope as HTMLElement);
  const overflowX = overflowNode.scrollWidth > overflowNode.clientWidth + 1;

  // A focusable is considered occluded only when every in-viewport sample
  // point is covered. Demo chrome is filtered from the hit-test stack.
  let occluded = 0;
  if (typeof doc.elementFromPoint === "function") {
    const viewportWidth = doc.documentElement?.clientWidth ?? 0;
    const viewportHeight = doc.documentElement?.clientHeight ?? 0;
    for (const t of targets) {
      const left = Math.max(0, t.r.left);
      const right = Math.min(viewportWidth, t.r.right);
      const topEdge = Math.max(0, t.r.top);
      const bottom = Math.min(viewportHeight, t.r.bottom);
      if (right <= left || bottom <= topEdge) continue;
      const insetX = Math.min(3, (right - left) / 4);
      const insetY = Math.min(3, (bottom - topEdge) / 4);
      const points = [
        [(left + right) / 2, (topEdge + bottom) / 2],
        [left + insetX, topEdge + insetY],
        [right - insetX, topEdge + insetY],
        [left + insetX, bottom - insetY],
        [right - insetX, bottom - insetY],
      ];
      const hasVisiblePoint = points.some(([x, y]) => {
        const stack = typeof doc.elementsFromPoint === "function"
          ? doc.elementsFromPoint(x, y)
          : [doc.elementFromPoint(x, y)].filter(Boolean) as Element[];
        const topContent = stack.find((candidate) => !excluded(candidate));
        return Boolean(topContent && (t.el.contains(topContent) || topContent.contains(t.el)));
      });
      if (!hasVisiblePoint) occluded++;
    }
  }

  const renderedSignals = collectRenderedSignals(doc, scope);

  return {
    smallest_body_text_px: Number.isFinite(smallestBody) ? round1(smallestBody) : 0,
    price_text_px: {
      smallest: Number.isFinite(minPrice) ? round1(minPrice) : 0,
      largest: round1(maxPrice),
    },
    smallest_target_px: Number.isFinite(smallestTarget) ? round1(smallestTarget) : 0,
    min_action_gap_px: Number.isFinite(minGap) ? round1(minGap) : 0,
    contrast: {
      min_ratio: Number.isFinite(minContrast) ? round1(minContrast) : 0,
      sample_size: contrastSamples,
    },
    primary_actions_visible: primaryActions,
    animations_running: animationsRunning,
    horizontal_overflow: overflowX,
    occluded_focusables: occluded,
    samples: {
      body_text: bodySamples,
      prices: priceSamples,
      targets: targets.length,
      action_gaps: gapSamples,
      contrast: contrastSamples,
    },
    rendered_signals: renderedSignals,
    measured_at: new Date().toISOString(),
  };
}

function collectRenderedSignals(
  doc: Document,
  scope: Document | HTMLElement,
): Record<string, number | string | boolean> {
  const root = doc.documentElement;
  const signals: Record<string, number | string | boolean> = {};
  const numericToken = (key: string, cssName: string) => {
    const raw = root.style.getPropertyValue(cssName).trim();
    if (!raw) return;
    const value = Number.parseFloat(raw);
    if (Number.isFinite(value)) signals[key] = value;
  };
  const attr = (key: string, name: string) => {
    const value = root.getAttribute(`data-aia-${name}`);
    if (value !== null) signals[key] = value;
  };
  const on = (key: string, name: string) => {
    const value = root.getAttribute(`data-aia-${name}`);
    if (value === "on") signals[key] = true;
    else if (value === "off") signals[key] = false;
  };

  numericToken("visual.text_scale", "--aia-text-scale");
  numericToken("visual.important_text_scale", "--aia-important-scale");
  numericToken("visual.line_height", "--aia-line-height");
  numericToken("visual.letter_spacing", "--aia-letter-spacing");
  numericToken("visual.word_spacing", "--aia-word-spacing");
  numericToken("visual.max_line_length", "--aia-max-line");
  numericToken("visual.brightness", "--aia-brightness-value");
  attr("visual.contrast", "contrast");
  attr("visual.glare", "glare");
  attr("visual.color_mode", "color-mode");
  attr("visual.font_style", "font-style");
  on("visual.color_independent_status", "status-labels");

  on("interaction.keyboard_first", "keyboard-first");
  attr("interaction.focus_strength", "focus");
  attr("interaction.cursor_size", "cursor-size");
  on("interaction.drag_alternatives", "no-drag");
  on("interaction.double_click_disabled", "no-dblclick");

  attr("cognitive.information_density", "density");
  on("cognitive.hide_nonessential", "hide-nonessential");
  on("cognitive.persistent_labels", "labels");
  on("cognitive.step_by_step", "steps");
  on("cognitive.plain_error_messages", "plain-errors");
  attr("cognitive.confirmation_level", "confirmation");
  if (root.getAttribute("data-aia-progress") === "on" && scope.querySelector('[data-aia="progress"], [role="progressbar"]')) {
    signals["cognitive.progress_indicators"] = true;
  }

  if (root.getAttribute("data-aia-motion") === "off") {
    signals["motion_media.reduce_motion"] = true;
    signals["motion_media.disable_animation"] = true;
  } else if (root.getAttribute("data-aia-motion") === "normal") {
    signals["motion_media.reduce_motion"] = false;
    signals["motion_media.disable_animation"] = false;
  }
  if (root.getAttribute("data-aia-autoplay") === "off") signals["motion_media.disable_autoplay"] = true;
  if (root.getAttribute("data-aia-parallax") === "off") signals["motion_media.disable_parallax"] = true;

  const reading = scope.querySelector<HTMLElement>("[data-reading]")?.dataset.reading;
  signals["reading.mode"] = reading === "plain"
    ? "plain_language"
    : reading === "key-points"
      ? Array.from(scope.querySelectorAll('[data-reading="key-points"] li')).some((item) => item.textContent?.trim().startsWith("Step:"))
        ? "step_by_step"
        : "key_points"
      : "original";
  return signals;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Effective contrast ratio of an element's text against its resolved background. */
export function effectiveContrast(el: HTMLElement): number | null {
  const style = getComputedStyle(el);
  const fg = parseColor(style.color);
  if (!fg) return null;
  let node: HTMLElement | null = el;
  let bg: RGB | null = null;
  while (node) {
    const s = getComputedStyle(node);
    const c = parseColor(s.backgroundColor);
    if (c && c.a > 0.9) {
      bg = c;
      break;
    }
    node = node.parentElement;
  }
  const effectiveBg = bg ?? { r: 255, g: 255, b: 255, a: 1 };
  const l1 = luminance(fg);
  const l2 = luminance(effectiveBg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return round1(ratio);
}

interface RGB { r: number; g: number; b: number; a: number }

function parseColor(value: string): RGB | null {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[,/\s]+/).filter(Boolean).map(Number);
  if (parts.length < 3) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}

function luminance(c: RGB): number {
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
}

/** Compare measurements against requested profile keys → fit report. */
export type FitStatus = "satisfied" | "partially_satisfied" | "unsupported";

export interface ProfileFitReport {
  overall: FitStatus;
  satisfied: string[];
  partially_satisfied: { key: string; detail: string }[];
  unsupported: { key: string; reason: string }[];
  conflicts: string[];
  suggested_refinements: string[];
}

export interface VerifyFitContext {
  /** Page-specific capability document returned by discovery. */
  capabilities?: Capability[];
}

export function verifyFit(
  requested: Record<string, number | string | boolean>,
  m: RenderedMeasurements,
  context: VerifyFitContext = {},
): ProfileFitReport {
  const satisfied: string[] = [];
  const partial: ProfileFitReport["partially_satisfied"] = [];
  const unsupported: ProfileFitReport["unsupported"] = [];
  const refinements: string[] = [];
  const conflicts: string[] = [];
  const pageCapabilities = context.capabilities
    ? new Map(context.capabilities.map((capability) => [capability.key, capability]))
    : null;
  const signals = m.rendered_signals ?? {};

  const markPartial = (key: string, detail: string, refinement?: string) => {
    partial.push({ key, detail });
    if (refinement && !refinements.includes(refinement)) refinements.push(refinement);
  };
  const signalMatches = (key: string, want: number | string | boolean): boolean | null => {
    const got = signals[key];
    if (got === undefined) {
      // Absence is meaningful only for a requested boolean false.
      return typeof want === "boolean" && want === false ? true : null;
    }
    if (typeof want === "number" && typeof got === "number") return Math.abs(got - want) < 0.01;
    return got === want;
  };
  const verifySignal = (key: string, want: number | string | boolean) => {
    const matches = signalMatches(key, want);
    if (matches === true) satisfied.push(key);
    else if (matches === false) {
      markPartial(key, `rendered signal is ${String(signals[key])}, requested ${String(want)}`);
    } else {
      markPartial(key, "supported, but no rendered evidence was measured for this value");
    }
  };

  for (const [key, want] of Object.entries(requested)) {
    if (!isKnownCapabilityKey(key)) {
      unsupported.push({ key, reason: "unknown contract key" });
      continue;
    }
    const capability = pageCapabilities?.get(key);
    if (pageCapabilities && !capability) {
      unsupported.push({ key, reason: "not supported on this page" });
      continue;
    }
    if (
      capability &&
      capability.supported_values !== "continuous" &&
      !capability.supported_values.includes(want)
    ) {
      unsupported.push({ key, reason: `value ${String(want)} is not supported on this page` });
      continue;
    }
    if (capability?.status === "inherent") {
      satisfied.push(key);
      continue;
    }

    switch (key) {
      case "visual.text_scale":
      case "visual.important_text_scale":
      case "visual.line_height":
      case "visual.letter_spacing":
      case "visual.word_spacing":
      case "visual.max_line_length":
      case "visual.brightness":
      case "visual.glare":
      case "visual.color_mode":
      case "visual.color_independent_status":
      case "visual.font_style":
      case "interaction.keyboard_first":
      case "interaction.focus_strength":
      case "interaction.cursor_size":
      case "interaction.drag_alternatives":
      case "interaction.double_click_disabled":
      case "cognitive.information_density":
      case "cognitive.step_by_step":
      case "cognitive.hide_nonessential":
      case "cognitive.persistent_labels":
      case "cognitive.progress_indicators":
      case "cognitive.plain_error_messages":
      case "cognitive.confirmation_level":
      case "motion_media.disable_autoplay":
      case "motion_media.disable_parallax":
      case "reading.mode":
        verifySignal(key, want);
        break;
      case "interaction.minimum_target_size": {
        const wantPx = Number(want);
        if ((m.samples?.targets ?? (m.smallest_target_px > 0 ? 1 : 0)) === 0) {
          markPartial(key, "no page targets were measurable");
        } else if (m.smallest_target_px >= wantPx - 1) satisfied.push(key);
        else {
          markPartial(
            key,
            `measured smallest target ${m.smallest_target_px}px < requested ${wantPx}px`,
            `raise target size token or fix the undersized control (currently ${m.smallest_target_px}px)`,
          );
        }
        break;
      }
      case "interaction.target_spacing": {
        const wantPx = Number(want);
        if ((m.samples?.action_gaps ?? (m.min_action_gap_px > 0 ? 1 : 0)) === 0) {
          markPartial(key, "no adjacent action pairs were measurable");
        } else if (m.min_action_gap_px >= wantPx - 1) satisfied.push(key);
        else {
          markPartial(
            key,
            `measured min gap ${m.min_action_gap_px}px < requested ${wantPx}px`,
            "increase action group spacing or separate overlapping controls",
          );
        }
        break;
      }
      case "cognitive.maximum_primary_actions": {
        const wantN = Number(want);
        if (m.primary_actions_visible <= wantN) satisfied.push(key);
        else {
          markPartial(
            key,
            `${m.primary_actions_visible} primary actions visible > limit ${wantN}`,
            "collapse more header actions into the overflow menu",
          );
        }
        break;
      }
      case "motion_media.disable_animation":
      case "motion_media.reduce_motion": {
        if (m.animations_running === 0) satisfied.push(key);
        else {
          markPartial(key, `${m.animations_running} animations still running`, "force-stop remaining page animations");
        }
        break;
      }
      case "visual.contrast": {
        if (want === "normal") {
          verifySignal(key, want);
        } else if (m.contrast.sample_size === 0) {
          markPartial(key, "no visible text contrast samples were measurable");
        } else if (signalMatches(key, want) === true && m.contrast.min_ratio >= 4.5) satisfied.push(key);
        else {
          markPartial(
            key,
            `min measured contrast ${m.contrast.min_ratio}:1 or rendered scheme did not match ${String(want)}`,
            "raise contrast tokens and re-measure the failing text sample",
          );
        }
        break;
      }
      default:
        markPartial(key, "declared by the contract, but this page exposes no rendered verification signal");
    }
  }

  if (m.horizontal_overflow) {
    conflicts.push("horizontal overflow detected in the measured page content");
    refinements.push("remove horizontal overflow introduced by the adaptation");
  }
  if (m.occluded_focusables > 0) {
    conflicts.push(`${m.occluded_focusables} focusable element(s) are fully occluded`);
    refinements.push("reposition overlays or controls so every focusable has a visible hit area");
  }
  const overall: FitStatus =
    unsupported.length > 0 && satisfied.length === 0 && partial.length === 0
      ? "unsupported"
      : partial.length > 0 || unsupported.length > 0 || conflicts.length > 0
        ? "partially_satisfied"
        : "satisfied";
  return { overall, satisfied, partially_satisfied: partial, unsupported, conflicts, suggested_refinements: refinements };
}
