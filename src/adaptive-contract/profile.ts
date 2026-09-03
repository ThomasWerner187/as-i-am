/**
 * Adaptive Web Contract — profile.ts
 * Profile presets (synthetic demo bundles), merging and normalisation.
 * Profiles are functional, combinable and diagnosis-free.
 */

import type {
  FunctionalProfile,
  ValidationIssue,
} from "./schema";
import { CONTRACT_VERSION, validateProfile } from "./schema";

/* ------------------------------------------------------------------ */
/* Deep merge — later profiles win; arrays n/a; scalars override      */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  "visual",
  "interaction",
  "cognitive",
  "motion_media",
  "reading",
  "safety",
] as const;

export function mergeProfiles(...profiles: FunctionalProfile[]): FunctionalProfile {
  const out: FunctionalProfile = { version: CONTRACT_VERSION };
  for (const p of profiles) {
    if (!p || typeof p !== "object") continue;
    for (const section of SECTIONS) {
      const inc = p[section] as Record<string, unknown> | undefined;
      if (!inc) continue;
      const cur = (out[section] ?? {}) as Record<string, unknown>;
      for (const [k, v] of Object.entries(inc)) {
        if (v !== undefined && v !== null) cur[k] = v;
      }
      (out as unknown as Record<string, unknown>)[section] = cur;
    }
  }
  return out;
}

/** Clamp numeric values into contract ranges; returns clamped profile + notes. */
export function normalizeProfile(profile: FunctionalProfile): {
  profile: FunctionalProfile;
  clamped: { key: string; from: number; to: number }[];
} {
  const RANGES: Record<string, [number, number]> = {
    "visual.text_scale": [1.0, 2.2],
    "visual.important_text_scale": [1.0, 2.0],
    "visual.line_height": [1.0, 2.2],
    "visual.letter_spacing": [0, 0.2],
    "visual.word_spacing": [0, 0.5],
    "visual.max_line_length": [30, 90],
    "visual.brightness": [0.55, 1.0],
    "interaction.minimum_target_size": [44, 60],
    "interaction.target_spacing": [8, 32],
    "interaction.cursor_size": [16, 48],
    "interaction.timeout_multiplier": [1, 4],
    "cognitive.maximum_primary_actions": [2, 5],
    "reading.speech_rate": [0.5, 2.0],
  };
  const clamped: { key: string; from: number; to: number }[] = [];
  // Free-form labels are agent-local display metadata, never retained as part
  // of the website's functional profile.
  const out: FunctionalProfile = { version: CONTRACT_VERSION };
  for (const section of SECTIONS) {
    const inc = profile[section] as Record<string, unknown> | undefined;
    if (!inc) continue;
    const sec = { ...(inc as Record<string, unknown>) };
    for (const [k, v] of Object.entries(sec)) {
      const range = RANGES[`${section}.${k}`];
      if (range && typeof v === "number") {
        const to = Math.min(range[1], Math.max(range[0], v));
        if (to !== v) {
          sec[k] = to;
          clamped.push({ key: `${section}.${k}`, from: v, to });
        }
      }
    }
    (out as unknown as Record<string, unknown>)[section] = sec;
  }
  return { profile: out, clamped };
}

/* ------------------------------------------------------------------ */
/* Demo profile bundles — synthetic, for judges. NOT user data.        */
/* ------------------------------------------------------------------ */

export interface DemoBundle {
  id: string;
  name: string;
  /** What the (simulated) private agent knows — shown ONLY in the private panel. */
  agent_note: string;
  /** The functional parameters actually transmitted to the website. */
  profile: FunctionalProfile;
  /** The demo prompt a judge would send their agent. */
  prompt: string;
}

/** A personal display choice, without a diagnosis or any other private context. */
export const CALM_DARK_PROFILE: FunctionalProfile = {
  version: CONTRACT_VERSION,
  visual: { color_scheme: "dark", glare: "low" },
  motion_media: { reduce_motion: true, disable_animation: true },
};

export const DEMO_BUNDLES: DemoBundle[] = [
  {
    id: "precision-reading",
    name: "Precision & readability",
    agent_note:
      "Private agent note (demo): low vision, hand tremor, loses track of multi-step tasks. This note is never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Precision & readability",
      visual: {
        text_scale: 1.5,
        important_text_scale: 1.4,
        line_height: 1.6,
        color_independent_status: true,
        font_style: "readable",
      },
      interaction: {
        minimum_target_size: 52,
        target_spacing: 16,
        focus_strength: "maximum",
        drag_alternatives: true,
        double_click_disabled: true,
        timeout_multiplier: 2,
        error_tolerance: "high",
      },
      cognitive: {
        information_density: "reduced",
        maximum_primary_actions: 3,
        step_by_step: true,
        hide_nonessential: true,
        persistent_labels: true,
        consistent_help: true,
        progress_indicators: true,
        plain_error_messages: true,
        confirmation_level: "confirm-risky",
      },
      motion_media: {
        disable_animation: true,
        disable_autoplay: true,
        reduce_motion: true,
      },
      safety: { confirm_destructive: true, complete_price_totals: true },
    },
    prompt:
      "I have low vision, a hand tremor, and I lose track of multi-step tasks. Make this page comfortable for me, but do not send my diagnoses to the website.",
  },
  {
    id: "low-vision-contrast",
    name: "Low vision & glare",
    agent_note: "Private agent note (demo): tunnel vision, photophobia after surgery. Never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Low vision & glare",
      visual: {
        text_scale: 1.8,
        important_text_scale: 1.3,
        line_height: 1.8,
        contrast: "high",
        glare: "low",
        brightness: 0.85,
        max_line_length: 60,
      },
      interaction: { minimum_target_size: 48, target_spacing: 12, focus_strength: "maximum" },
      cognitive: { information_density: "reduced", persistent_labels: true },
      motion_media: { disable_autoplay: true },
    },
    prompt:
      "Zoom everything to 180%, high contrast, low glare. Keep lines short. Labels on everything.",
  },
  {
    id: "color-independent",
    name: "Color-independent",
    agent_note: "Private agent note (demo): red-green colour vision deficiency. Never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Color-independent",
      visual: {
        color_mode: "deuteranopia-safe",
        color_independent_status: true,
        contrast: "high",
      },
      cognitive: { persistent_labels: true, plain_error_messages: true },
    },
    prompt:
      "I cannot reliably distinguish red and green. Remove color-only meaning and show all status information using labels, icons and patterns.",
  },
  {
    id: "motor-reduction",
    name: "Motor reduction",
    agent_note: "Private agent note (demo): RSI flare-up, right hand in brace. Never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Motor reduction",
      interaction: {
        minimum_target_size: 56,
        target_spacing: 20,
        keyboard_first: true,
        focus_strength: "strong",
        cursor_size: 36,
        drag_alternatives: true,
        double_click_disabled: true,
        timeout_multiplier: 3,
        error_tolerance: "high",
      },
      cognitive: { maximum_primary_actions: 3, confirmation_level: "confirm-risky" },
      safety: { confirm_destructive: true },
    },
    prompt:
      "My arm is in a brace today. Big targets, keyboard-first, no drag or double-click anywhere, confirm risky actions.",
  },
  {
    id: "focus-cognitive",
    name: "Focus & low cognitive load",
    agent_note: "Private agent note (demo): attention difficulties, exhaustion this week. Never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Focus & low cognitive load",
      cognitive: {
        information_density: "minimal",
        maximum_primary_actions: 3,
        step_by_step: true,
        hide_nonessential: true,
        progress_indicators: true,
        consistent_help: true,
        plain_error_messages: true,
      },
      visual: { text_scale: 1.15, line_height: 1.7 },
      motion_media: { disable_animation: true, disable_autoplay: true, reduce_motion: true },
    },
    prompt:
      "I am exhausted and keep losing focus. Strip the page down to one task at a time with clear progress.",
  },
  {
    id: "plain-language",
    name: "Reading & plain language",
    agent_note: "Private agent note (demo): dyslexia, German is a second language. Never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Reading & plain language",
      reading: { mode: "plain_language", speech_rate: 1.0 },
      visual: {
        text_scale: 1.2,
        line_height: 1.8,
        letter_spacing: 0.05,
        word_spacing: 0.15,
        max_line_length: 55,
        font_style: "readable",
      },
      cognitive: { plain_error_messages: true, consistent_help: true },
    },
    prompt:
      "Rewrite this page in plain language, short paragraphs, and explain the jargon. Keep the original reachable.",
  },
  {
    id: "read-first",
    name: "Read-first (non-visual)",
    agent_note: "Private agent note (demo): prefers listening; screen reader coexists. Never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Read-first (non-visual)",
      reading: { mode: "read_aloud", speech_rate: 1.1 },
      cognitive: { information_density: "reduced", maximum_primary_actions: 3, step_by_step: true },
      safety: { confirm_destructive: true },
    },
    prompt:
      "Explain the page, then read me the important parts in a sensible order. Tell me what tools you can use for me.",
  },
  {
    id: "migraine",
    name: "Migraine day (temporary)",
    agent_note:
      "Private agent note (demo): temporary situational state today — migraine. Not a persistent profile, never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "Migraine day",
      motion_media: {
        disable_animation: true,
        disable_autoplay: true,
        disable_parallax: true,
        reduce_motion: true,
        mute_nonessential_audio: true,
        static_media_alternatives: true,
      },
      visual: { brightness: 0.7, glare: "low", contrast: "high" },
      cognitive: { information_density: "minimal", maximum_primary_actions: 3, hide_nonessential: true },
    },
    prompt:
      "I am having a migraine today. Remove motion, reduce glare, simplify the page and keep only what I need to compare two products.",
  },
  {
    id: "one-handed",
    name: "One-handed (temporary)",
    agent_note: "Private agent note (demo): holding a baby, one hand free. Temporary, never sent.",
    profile: {
      version: CONTRACT_VERSION,
      label: "One-handed",
      interaction: {
        minimum_target_size: 56,
        target_spacing: 20,
        keyboard_first: false,
        drag_alternatives: true,
        double_click_disabled: true,
        error_tolerance: "high",
      },
      cognitive: { maximum_primary_actions: 3, confirmation_level: "confirm-all" },
    },
    prompt:
      "I am holding a baby with one arm. Make every target big and undoable, and confirm anything risky.",
  },
];

export function findBundle(id: string): DemoBundle | undefined {
  return DEMO_BUNDLES.find((b) => b.id === id);
}

/** Validate + normalize an incoming profile; collects clamping issues. */
export function prepareIncomingProfile(input: unknown): {
  profile?: FunctionalProfile;
  issues: ValidationIssue[];
  clamped: { key: string; from: number; to: number }[];
} {
  const { ok, issues } = validateProfile(input);
  if (!ok) return { issues, clamped: [] };
  const { profile, clamped } = normalizeProfile(input as FunctionalProfile);
  return { profile, issues, clamped };
}
