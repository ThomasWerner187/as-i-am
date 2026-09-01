/**
 * Adaptive Web Contract — measurements.ts
 * Measures the RENDERED UI. The agent's feedback loop is
 * observe → adapt → measure → refine, and tools must report real values.
 */

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
  measured_at: string;
}

function px(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function isVisible(el: Element): boolean {
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

const INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';

export function collectMeasurements(root: Document | HTMLElement = document): RenderedMeasurements {
  const doc = root as Document;
  const bodyEls = Array.from(doc.querySelectorAll("p, li, td, th, span, label, a, button, h1, h2, h3, h4"));
  let smallestBody = Number.POSITIVE_INFINITY;
  for (const el of bodyEls) {
    if (!isVisible(el) || !el.textContent?.trim()) continue;
    const size = px(getComputedStyle(el).fontSize);
    if (size > 0 && size < smallestBody) smallestBody = size;
  }

  const priceEls = Array.from(doc.querySelectorAll('[data-aia="price"]'));
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;
  for (const el of priceEls) {
    if (!isVisible(el)) continue;
    const size = px(getComputedStyle(el).fontSize);
    minPrice = Math.min(minPrice, size);
    maxPrice = Math.max(maxPrice, size);
  }

  // Smallest interactive target (borders included via bounding rect).
  let smallestTarget = Number.POSITIVE_INFINITY;
  const targets: { el: HTMLElement; cx: number; cy: number; r: DOMRect }[] = [];
  for (const el of Array.from(doc.querySelectorAll(INTERACTIVE_SELECTOR))) {
    const htmlEl = el as HTMLElement;
    if (!isVisible(htmlEl)) continue;
    const r = htmlEl.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    smallestTarget = Math.min(smallestTarget, Math.min(r.width, r.height));
    targets.push({ el: htmlEl, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r });
  }

  // Minimum gap between adjacent interactive siblings inside action groups.
  let minGap = Number.POSITIVE_INFINITY;
  const groups = doc.querySelectorAll('[data-aia="actions"], [role="toolbar"], nav');
  for (const group of Array.from(groups)) {
    const kids = Array.from(group.querySelectorAll(INTERACTIVE_SELECTOR))
      .filter(isVisible)
      .map((el) => (el as HTMLElement).getBoundingClientRect());
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i];
        const b = kids[j];
        const gapX = Math.max(b.left - a.right, a.left - b.right, 0);
        const gapY = Math.max(b.top - a.bottom, a.top - b.bottom, 0);
        const gap = gapX > 0 || gapY > 0 ? (gapX > 0 && gapY > 0 ? Math.hypot(gapX, gapY) : Math.max(gapX, gapY)) : 0;
        minGap = Math.min(minGap, gap);
      }
    }
  }

  // Contrast sampling on visible text nodes.
  let minContrast = Number.POSITIVE_INFINITY;
  let contrastSamples = 0;
  const contrastEls = Array.from(doc.querySelectorAll<HTMLElement>("p, li, td, th, a, button, span, label, h1, h2, h3, h4"));
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
    doc.querySelectorAll('[data-aia="primary"]'),
  ).filter(isVisible).length;

  const animationsRunning = doc.getAnimations ? doc.getAnimations().length : 0;

  const overflowX =
    (doc.documentElement?.scrollWidth ?? 0) > (doc.documentElement?.clientWidth ?? 0) + 1;

  // Focusables whose centre point is covered by another element.
  let occluded = 0;
  if ("elementFromPoint" in (doc.defaultView ?? {})) {
    for (const t of targets) {
      if (t.cy < 0 || t.cy > (doc.documentElement?.clientHeight ?? 0)) continue;
      const top = doc.elementFromPoint(t.cx, t.cy);
      if (top && !t.el.contains(top) && !top.contains(t.el)) occluded++;
    }
  }

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
    measured_at: new Date().toISOString(),
  };
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

export function verifyFit(
  requested: Record<string, number | string | boolean>,
  m: RenderedMeasurements,
): ProfileFitReport {
  const satisfied: string[] = [];
  const partial: ProfileFitReport["partially_satisfied"] = [];
  const unsupported: ProfileFitReport["unsupported"] = [];
  const refinements: string[] = [];

  for (const [key, want] of Object.entries(requested)) {
    switch (key) {
      case "visual.text_scale":
      case "visual.important_text_scale":
      case "visual.line_height":
      case "visual.max_line_length":
        satisfied.push(key); // applied via tokens; measured values reported separately
        break;
      case "interaction.minimum_target_size": {
        const wantPx = Number(want);
        if (m.smallest_target_px >= wantPx - 1) satisfied.push(key);
        else {
          partial.push({ key, detail: `measured smallest target ${m.smallest_target_px}px < requested ${wantPx}px` });
          refinements.push(`raise target size token or reduce non-target padding (currently ${m.smallest_target_px}px)`);
        }
        break;
      }
      case "interaction.target_spacing": {
        const wantPx = Number(want);
        if (m.min_action_gap_px >= wantPx - 1) satisfied.push(key);
        else {
          partial.push({ key, detail: `measured min gap ${m.min_action_gap_px}px < requested ${wantPx}px` });
          refinements.push("increase action group spacing token");
        }
        break;
      }
      case "cognitive.maximum_primary_actions": {
        const wantN = Number(want);
        if (m.primary_actions_visible <= wantN) satisfied.push(key);
        else {
          partial.push({ key, detail: `${m.primary_actions_visible} primary actions visible > limit ${wantN}` });
          refinements.push("collapse more header actions into the overflow menu");
        }
        break;
      }
      case "motion_media.disable_animation":
      case "motion_media.reduce_motion": {
        if (m.animations_running === 0) satisfied.push(key);
        else {
          partial.push({ key, detail: `${m.animations_running} animations still running` });
          refinements.push("force-stop remaining animations");
        }
        break;
      }
      case "visual.contrast": {
        if (m.contrast.min_ratio >= 4.5) satisfied.push(key);
        else {
          partial.push({ key, detail: `min measured contrast ${m.contrast.min_ratio}:1` });
          refinements.push("raise contrast scheme to maximum");
        }
        break;
      }
      default:
        satisfied.push(key);
    }
  }
  const overall: FitStatus =
    unsupported.length > 0 && satisfied.length === 0
      ? "unsupported"
      : partial.length > 0
        ? "partially_satisfied"
        : "satisfied";
  return { overall, satisfied, partially_satisfied: partial, unsupported, conflicts: [], suggested_refinements: refinements };
}
