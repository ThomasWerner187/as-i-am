/**
 * Adaptive Web Contract — schema.ts
 * Version 0.1
 *
 * The functional preference profile is the ONLY thing a website may receive.
 * It contains functional, parameterised preferences — never diagnoses,
 * conditions, medical terms or identities. See privacy.ts for enforcement.
 */

export const CONTRACT_VERSION = "0.1" as const;
export const CONTRACT_NAME = "Adaptive Web Contract" as const;

/* ------------------------------------------------------------------ */
/* Functional preference profile (agent → website payload)            */
/* ------------------------------------------------------------------ */

export type TextScale = number; // 1.0 – 2.2 (multiplier of base font size)
export type TargetSize = number; // 44 – 60 (CSS px, minimum target dimension)

export interface VisualPreferences {
  text_scale?: TextScale;
  /** Extra multiplier applied to key info (prices, totals, primary headings). */
  important_text_scale?: number; // 1.0 – 2.0
  line_height?: number; // 1.0 – 2.2
  letter_spacing?: number; // em, 0 – 0.2
  word_spacing?: number; // em, 0 – 0.5
  max_line_length?: number; // ch, 30 – 90
  contrast?: "normal" | "high" | "maximum";
  brightness?: number; // 0.55 – 1.0 (1.0 = unchanged)
  glare?: "normal" | "low";
  /** Site-owned appearance; independent of colour-vision remapping. */
  color_scheme?: "default" | "dark";
  color_mode?:
    | "normal"
    | "grayscale"
    | "protanopia-safe"
    | "deuteranopia-safe"
    | "tritanopia-safe"
    | "invert";
  /** Require status to be encoded with labels/icons/patterns, not colour alone. */
  color_independent_status?: boolean;
  font_style?: "default" | "readable";
}

export interface InteractionPreferences {
  minimum_target_size?: TargetSize;
  target_spacing?: number; // px, 8 – 32, minimum gap between adjacent targets
  keyboard_first?: boolean;
  focus_strength?: "default" | "strong" | "maximum";
  cursor_size?: number; // 16 – 48 px
  drag_alternatives?: boolean;
  double_click_disabled?: boolean;
  timeout_multiplier?: number; // 1 – 4
  error_tolerance?: "normal" | "high";
}

export interface CognitivePreferences {
  information_density?: "normal" | "reduced" | "minimal";
  maximum_primary_actions?: number; // 2 – 5
  step_by_step?: boolean;
  hide_nonessential?: boolean;
  persistent_labels?: boolean;
  consistent_help?: boolean;
  progress_indicators?: boolean;
  plain_error_messages?: boolean;
  confirmation_level?: "normal" | "confirm-risky" | "confirm-all";
}

export interface MotionMediaPreferences {
  reduce_motion?: boolean;
  disable_animation?: boolean;
  disable_autoplay?: boolean;
  disable_parallax?: boolean;
  mute_nonessential_audio?: boolean;
  enable_captions?: boolean;
  enable_transcripts?: boolean;
  static_media_alternatives?: boolean;
}

export type ReadingMode =
  | "original"
  | "plain_language"
  | "key_points"
  | "step_by_step"
  | "read_aloud"
  | "bilingual_or_explained";

export interface ReadingPreferences {
  mode?: ReadingMode;
  speech_rate?: number; // 0.5 – 2.0 (Web Speech rate)
}

export interface SafetyPreferences {
  /** Always confirm destructive or paid actions before execution. */
  confirm_destructive?: boolean;
  /** Prices must always be presented as complete totals incl. shipping/fees. */
  complete_price_totals?: boolean;
}

export interface FunctionalProfile {
  version: typeof CONTRACT_VERSION;
  /**
   * Legacy agent-local display hint. It is accepted for backwards
   * compatibility, but is not part of the wire schema and is discarded before
   * a profile is stored, logged or exported.
   */
  label?: string;
  visual?: VisualPreferences;
  interaction?: InteractionPreferences;
  cognitive?: CognitivePreferences;
  motion_media?: MotionMediaPreferences;
  reading?: ReadingPreferences;
  safety?: SafetyPreferences;
}

/* ------------------------------------------------------------------ */
/* Capability discovery                                               */
/* ------------------------------------------------------------------ */

export type AdaptationDomain =
  | "visual"
  | "interaction"
  | "cognitive"
  | "motion_media"
  | "reading"
  | "safety";

export interface Capability {
  /** Dotted key inside the profile, e.g. "visual.text_scale". */
  key: string;
  domain: AdaptationDomain;
  description: string;
  /** Human-readable measured unit used by measure_rendered_ui. */
  unit: string;
  /** The values this website can meaningfully apply. */
  supported_values: (string | number | boolean)[] | "continuous";
  /** Adaptive changes the rendering; inherent means the page already satisfies it. */
  status: "adaptive" | "inherent";
}

export interface CapabilityDiscovery {
  contract: typeof CONTRACT_NAME;
  version: typeof CONTRACT_VERSION;
  site_name: string;
  page_id: string;
  capabilities: Capability[];
  /** Domains the page cannot adapt at all. */
  unsupported_domains: AdaptationDomain[];
}

/* ------------------------------------------------------------------ */
/* Application result                                                 */
/* ------------------------------------------------------------------ */

export type ChangeKind =
  | "token"
  | "layout"
  | "content"
  | "media"
  | "navigation"
  | "safety";

export interface AppliedChange {
  key: string; // profile key, e.g. "visual.text_scale"
  kind: ChangeKind;
  from: string | number | boolean | null;
  to: string | number | boolean | null;
  /** Plain-language sentence shown in the activity timeline. */
  explanation: string;
}

export interface UnmetRequest {
  key: string;
  reason: "unsupported" | "out_of_range" | "clamped" | "conflict";
  detail: string;
}

export interface AdaptationResult {
  ok: boolean;
  operation_id: string;
  adaptation_version: number; // monotonically increasing per page session
  applied: AppliedChange[];
  unmet: UnmetRequest[];
  warnings: string[];
  /** Populated by measure_rendered_ui after re-measure; tools may inline it. */
  measurements?: Record<string, number | string | boolean>;
}

/* ------------------------------------------------------------------ */
/* Undo / reset                                                       */
/* ------------------------------------------------------------------ */

export interface UndoInfo {
  available: boolean;
  depth: number;
  last_operation_id?: string;
  last_label?: string;
}

/* ------------------------------------------------------------------ */
/* Privacy receipt (diagnosis-free export)                            */
/* ------------------------------------------------------------------ */

export interface AdaptationReceipt {
  contract: typeof CONTRACT_NAME;
  version: typeof CONTRACT_VERSION;
  issued_at: string;
  /** Which page issued it — for provenance only, no user identity. */
  origin_site: string;
  profile: Omit<FunctionalProfile, "label">;
  /** Counters only; no page content, no user data. */
  stats: { adaptations_applied: number; refinements: number };
  /** Explicit promise marker consumers can check. */
  privacy: {
    contains_diagnoses: false;
    storage: "none";
    scope: "session";
  };
}

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */

export interface ValidationIssue {
  path: string;
  code: "unknown_key" | "bad_type" | "out_of_range" | "diagnosis_term" | "bad_version";
  message: string;
}

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

const ENUMS: Record<string, readonly string[]> = {
  "visual.contrast": ["normal", "high", "maximum"],
  "visual.glare": ["normal", "low"],
  "visual.color_scheme": ["default", "dark"],
  "visual.color_mode": [
    "normal",
    "grayscale",
    "protanopia-safe",
    "deuteranopia-safe",
    "tritanopia-safe",
    "invert",
  ],
  "visual.font_style": ["default", "readable"],
  "interaction.focus_strength": ["default", "strong", "maximum"],
  "interaction.error_tolerance": ["normal", "high"],
  "cognitive.information_density": ["normal", "reduced", "minimal"],
  "cognitive.confirmation_level": ["normal", "confirm-risky", "confirm-all"],
  "reading.mode": [
    "original",
    "plain_language",
    "key_points",
    "step_by_step",
    "read_aloud",
    "bilingual_or_explained",
  ],
};

const SECTIONS = [
  "visual",
  "interaction",
  "cognitive",
  "motion_media",
  "reading",
  "safety",
] as const;

function typeMatches(value: unknown, expected: "number" | "boolean" | "string"): boolean {
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  if (expected === "boolean") return typeof value === "boolean";
  return typeof value === "string";
}

function expectedType(key: string): "number" | "boolean" | "string" | null {
  if (RANGES[key]) return "number";
  if (ENUMS[key]) return "string";
  // Known boolean keys (everything else declared in the interfaces).
  const booleans = new Set([
    "visual.color_independent_status",
    "interaction.keyboard_first",
    "interaction.drag_alternatives",
    "interaction.double_click_disabled",
    "cognitive.step_by_step",
    "cognitive.hide_nonessential",
    "cognitive.persistent_labels",
    "cognitive.consistent_help",
    "cognitive.progress_indicators",
    "cognitive.plain_error_messages",
    "motion_media.reduce_motion",
    "motion_media.disable_animation",
    "motion_media.disable_autoplay",
    "motion_media.disable_parallax",
    "motion_media.mute_nonessential_audio",
    "motion_media.enable_captions",
    "motion_media.enable_transcripts",
    "motion_media.static_media_alternatives",
    "safety.confirm_destructive",
    "safety.complete_price_totals",
  ]);
  return booleans.has(key) ? "boolean" : null;
}

/** Validate an untrusted profile object. Returns clamped issues, not exceptions. */
export function validateProfile(input: unknown): {
  ok: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, issues: [{ path: "", code: "bad_type", message: "profile must be an object" }] };
  }
  const obj = input as Record<string, unknown>;
  if (obj.version !== CONTRACT_VERSION) {
    issues.push({
      path: "version",
      code: "bad_version",
      message: `expected version "${CONTRACT_VERSION}", got "${String(obj.version)}"`,
    });
  }
  if (
    obj.label !== undefined &&
    (typeof obj.label !== "string" || obj.label.length > 80)
  ) {
    issues.push({
      path: "label",
      code: "bad_type",
      message: "legacy label must be a string of at most 80 characters (it is ignored on receipt)",
    });
  }
  for (const [section, fields] of Object.entries(obj)) {
    if (section === "version" || section === "label") continue;
    if (!SECTIONS.includes(section as (typeof SECTIONS)[number])) {
      issues.push({ path: section, code: "unknown_key", message: `unknown section "${section}"` });
      continue;
    }
    if (typeof fields !== "object" || fields === null || Array.isArray(fields)) {
      issues.push({ path: section, code: "bad_type", message: "section must be an object" });
      continue;
    }
    for (const [field, value] of Object.entries(fields as Record<string, unknown>)) {
      const key = `${section}.${field}`;
      const type = expectedType(key);
      if (!type) {
        issues.push({ path: key, code: "unknown_key", message: `unknown preference "${key}"` });
        continue;
      }
      if (!typeMatches(value, type)) {
        issues.push({
          path: key,
          code: "bad_type",
          message: `"${key}" must be ${type}`,
        });
        continue;
      }
      const range = RANGES[key];
      if (range && (value as number) < range[0]) {
        issues.push({ path: key, code: "out_of_range", message: `"${key}" below minimum ${range[0]} (will be clamped)` });
      } else if (range && (value as number) > range[1]) {
        issues.push({ path: key, code: "out_of_range", message: `"${key}" above maximum ${range[1]} (will be clamped)` });
      }
      const enumVals = ENUMS[key];
      if (enumVals && !enumVals.includes(value as string)) {
        issues.push({ path: key, code: "out_of_range", message: `"${key}" must be one of: ${enumVals.join(", ")}` });
      }
    }
  }
  return { ok: issues.every((i) => i.code !== "unknown_key" && i.code !== "bad_type" && i.code !== "bad_version"), issues };
}

/** JSON Schemas (contract artifacts, also served to agents in docs). */
export function profileJsonSchema(): Record<string, unknown> {
  const prop = (key: string): Record<string, unknown> => {
    if (RANGES[key]) {
      const [min, max] = RANGES[key];
      return { type: "number", minimum: min, maximum: max };
    }
    if (ENUMS[key]) return { type: "string", enum: [...ENUMS[key]] };
    return { type: "boolean" };
  };
  const section = (keys: string[]) => ({
    type: "object",
    properties: Object.fromEntries(keys.map((k) => [k.split(".")[1], prop(k)])),
    additionalProperties: false,
  });
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://as-i-am.demo/schemas/functional-profile-0.1.json",
    title: "Functional Preference Profile (Adaptive Web Contract 0.1)",
    type: "object",
    required: ["version"],
    properties: {
      version: { const: CONTRACT_VERSION },
      visual: section([
          "visual.text_scale", "visual.important_text_scale", "visual.line_height",
          "visual.letter_spacing", "visual.word_spacing", "visual.max_line_length",
          "visual.contrast", "visual.brightness", "visual.glare", "visual.color_scheme", "visual.color_mode",
          "visual.color_independent_status", "visual.font_style",
        ]),
      interaction: section([
          "interaction.minimum_target_size", "interaction.target_spacing",
          "interaction.keyboard_first", "interaction.focus_strength",
          "interaction.cursor_size", "interaction.drag_alternatives",
          "interaction.double_click_disabled", "interaction.timeout_multiplier",
          "interaction.error_tolerance",
        ]),
      cognitive: section([
          "cognitive.information_density", "cognitive.maximum_primary_actions",
          "cognitive.step_by_step", "cognitive.hide_nonessential",
          "cognitive.persistent_labels", "cognitive.consistent_help",
          "cognitive.progress_indicators", "cognitive.plain_error_messages",
          "cognitive.confirmation_level",
        ]),
      motion_media: section([
          "motion_media.reduce_motion", "motion_media.disable_animation",
          "motion_media.disable_autoplay", "motion_media.disable_parallax",
          "motion_media.mute_nonessential_audio", "motion_media.enable_captions",
          "motion_media.enable_transcripts", "motion_media.static_media_alternatives",
        ]),
      reading: section(["reading.mode", "reading.speech_rate"]),
      safety: section(["safety.confirm_destructive", "safety.complete_price_totals"]),
    },
    additionalProperties: false,
  };
}

/** Remove legacy/free-form metadata before the website retains or exports a profile. */
export function functionalPayload(profile: FunctionalProfile): Omit<FunctionalProfile, "label"> {
  const { label: _ignored, ...functional } = profile;
  return structuredClone(functional);
}
