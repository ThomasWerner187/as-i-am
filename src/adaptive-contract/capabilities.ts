/**
 * Adaptive Web Contract — capabilities.ts
 *
 * Capability discovery is page-specific. A key is advertised only when the
 * current page either adapts its rendered UI for it or already satisfies the
 * requested outcome by construction (`inherent`).
 */

import type { Capability, CapabilityDiscovery, AdaptationDomain } from "./schema";
import { CONTRACT_NAME, CONTRACT_VERSION } from "./schema";

function cap(
  key: string,
  domain: AdaptationDomain,
  description: string,
  unit: string,
  supported_values: Capability["supported_values"],
): Capability {
  return { key, domain, description, unit, supported_values, status: "adaptive" };
}

const CAPABILITIES: Capability[] = [
  cap("visual.text_scale", "visual", "Scale body and UI text", "×", "continuous"),
  cap("visual.important_text_scale", "visual", "Extra scale for prices and key facts", "×", "continuous"),
  cap("visual.line_height", "visual", "Line height of paragraphs", "×", "continuous"),
  cap("visual.letter_spacing", "visual", "Tracking between letters", "em", "continuous"),
  cap("visual.word_spacing", "visual", "Space between words", "em", "continuous"),
  cap("visual.max_line_length", "visual", "Maximum text line length", "ch", "continuous"),
  cap("visual.contrast", "visual", "Contrast scheme", "", ["normal", "high", "maximum"]),
  cap("visual.brightness", "visual", "Overall brightness", "×", "continuous"),
  cap("visual.glare", "visual", "Glare reduction (softer palette)", "", ["normal", "low"]),
  cap("visual.color_mode", "visual", "Colour vision mode", "", [
    "normal", "grayscale", "protanopia-safe", "deuteranopia-safe", "tritanopia-safe", "invert",
  ]),
  cap("visual.color_independent_status", "visual", "Status never encoded by colour alone", "", [true]),
  cap("visual.font_style", "visual", "Typeface style", "", ["default", "readable"]),

  cap("interaction.minimum_target_size", "interaction", "Minimum interactive target size", "px", "continuous"),
  cap("interaction.target_spacing", "interaction", "Minimum gap between targets", "px", "continuous"),
  cap("interaction.keyboard_first", "interaction", "Keyboard-first navigation aids", "", [true]),
  cap("interaction.focus_strength", "interaction", "Focus indicator strength", "", ["default", "strong", "maximum"]),
  cap("interaction.cursor_size", "interaction", "Enlarged cursor helper", "px", "continuous"),
  cap("interaction.drag_alternatives", "interaction", "Buttons replace any drag interaction", "", [true]),
  cap("interaction.double_click_disabled", "interaction", "No double-click required anywhere", "", [true]),
  cap("interaction.timeout_multiplier", "interaction", "Extend session timeouts", "×", "continuous"),
  cap("interaction.error_tolerance", "interaction", "Forgiving input correction", "", ["normal", "high"]),

  cap("cognitive.information_density", "cognitive", "Page information density", "", ["normal", "reduced", "minimal"]),
  cap("cognitive.maximum_primary_actions", "cognitive", "Visible primary actions in header", "count", "continuous"),
  cap("cognitive.step_by_step", "cognitive", "Guided steps with progress", "", [true]),
  cap("cognitive.hide_nonessential", "cognitive", "Hide promos, badges, nonessential blocks", "", [true]),
  cap("cognitive.persistent_labels", "cognitive", "Always-visible labels on controls", "", [true]),
  cap("cognitive.consistent_help", "cognitive", "Persistent, consistent help panel", "", [true]),
  cap("cognitive.progress_indicators", "cognitive", "Show progress and remaining steps", "", [true]),
  cap("cognitive.plain_error_messages", "cognitive", "Errors in plain language", "", [true]),
  cap("cognitive.confirmation_level", "cognitive", "Confirmation before risky actions", "", ["normal", "confirm-risky", "confirm-all"]),

  cap("motion_media.reduce_motion", "motion_media", "Respect reduced motion", "", [true]),
  cap("motion_media.disable_animation", "motion_media", "Stop all animation", "", [true]),
  cap("motion_media.disable_autoplay", "motion_media", "Stop autoplay media and tickers", "", [true]),
  cap("motion_media.disable_parallax", "motion_media", "Remove parallax/zoom transitions", "", [true]),
  cap("motion_media.mute_nonessential_audio", "motion_media", "Mute nonessential sounds", "", [true]),
  cap("motion_media.enable_captions", "motion_media", "Captions on all media", "", [true]),
  cap("motion_media.enable_transcripts", "motion_media", "Text transcripts for media", "", [true]),
  cap("motion_media.static_media_alternatives", "motion_media", "Static alternatives for motion", "", [true]),

  cap("reading.mode", "reading", "Content presentation mode", "", [
    "original", "plain_language", "key_points", "step_by_step", "read_aloud", "bilingual_or_explained",
  ]),
  cap("reading.speech_rate", "reading", "Speech rate for read-aloud", "×", "continuous"),

  cap("safety.confirm_destructive", "safety", "Explicit confirm for destructive actions", "", [true]),
  cap("safety.complete_price_totals", "safety", "Prices always as complete totals", "", [true]),
];

const BY_KEY = new Map(CAPABILITIES.map((capability) => [capability.key, capability]));

const GLOBAL_ADAPTIVE = [
  "visual.text_scale",
  "visual.line_height",
  "visual.letter_spacing",
  "visual.word_spacing",
  "visual.max_line_length",
  "visual.contrast",
  "visual.brightness",
  "visual.glare",
  "visual.color_mode",
  "visual.font_style",
  "interaction.keyboard_first",
  "interaction.focus_strength",
  "interaction.cursor_size",
  "motion_media.reduce_motion",
  "motion_media.disable_animation",
] as const;

interface PageSupport {
  adaptive: readonly string[];
  inherent: readonly string[];
  valueOverrides?: Record<string, Capability["supported_values"]>;
}

const PAGE_SUPPORT: Record<string, PageSupport> = {
  "cinema-booking": {
    adaptive: ["visual.text_scale", "visual.important_text_scale", "visual.line_height", "visual.font_style", "interaction.minimum_target_size", "interaction.target_spacing", "interaction.focus_strength", "cognitive.information_density", "cognitive.step_by_step", "cognitive.hide_nonessential", "motion_media.reduce_motion", "motion_media.disable_animation"],
    inherent: ["interaction.drag_alternatives", "interaction.double_click_disabled", "cognitive.persistent_labels", "cognitive.progress_indicators", "motion_media.disable_autoplay", "safety.confirm_destructive", "safety.complete_price_totals"],
  },
  "restaurant-booking": {
    adaptive: ["visual.text_scale", "visual.line_height", "visual.font_style", "interaction.minimum_target_size", "interaction.target_spacing", "interaction.focus_strength", "cognitive.information_density", "cognitive.step_by_step", "cognitive.hide_nonessential", "motion_media.reduce_motion", "motion_media.disable_animation"],
    inherent: ["interaction.drag_alternatives", "interaction.double_click_disabled", "cognitive.persistent_labels", "cognitive.progress_indicators", "motion_media.disable_autoplay", "safety.confirm_destructive", "safety.complete_price_totals"],
  },
  landing: {
    adaptive: GLOBAL_ADAPTIVE,
    inherent: [
      "interaction.drag_alternatives",
      "interaction.double_click_disabled",
      "motion_media.disable_parallax",
      "motion_media.mute_nonessential_audio",
    ],
  },
  "shop-catalog": {
    adaptive: [
      ...GLOBAL_ADAPTIVE,
      "visual.important_text_scale",
      "visual.color_independent_status",
      "interaction.minimum_target_size",
      "interaction.target_spacing",
      "cognitive.information_density",
      "cognitive.maximum_primary_actions",
      "cognitive.step_by_step",
      "cognitive.hide_nonessential",
      "cognitive.persistent_labels",
      "cognitive.confirmation_level",
      "motion_media.disable_autoplay",
      "reading.mode",
    ],
    inherent: [
      "interaction.drag_alternatives",
      "interaction.double_click_disabled",
      "interaction.timeout_multiplier",
      "motion_media.disable_parallax",
      "motion_media.mute_nonessential_audio",
      "safety.confirm_destructive",
      "safety.complete_price_totals",
    ],
    valueOverrides: {
      "reading.mode": ["original", "plain_language", "key_points", "step_by_step"],
      // The baseline still requires human confirmation. These values also
      // let an agent reverse a previously requested two-step policy.
      "cognitive.confirmation_level": ["normal", "confirm-risky", "confirm-all"],
    },
  },
  "services-portal": {
    adaptive: [
      ...GLOBAL_ADAPTIVE,
      "visual.color_independent_status",
      "interaction.minimum_target_size",
      "interaction.target_spacing",
      "cognitive.information_density",
      "cognitive.maximum_primary_actions",
      "cognitive.step_by_step",
      "cognitive.hide_nonessential",
      "cognitive.progress_indicators",
      "cognitive.plain_error_messages",
      "reading.mode",
    ],
    inherent: [
      "interaction.drag_alternatives",
      "interaction.double_click_disabled",
      "interaction.timeout_multiplier",
      "cognitive.persistent_labels",
      "motion_media.disable_autoplay",
      "motion_media.disable_parallax",
      "motion_media.mute_nonessential_audio",
      "safety.confirm_destructive",
      "safety.complete_price_totals",
    ],
    valueOverrides: {
      "reading.mode": ["original", "plain_language"],
    },
  },
};

const DOMAINS: AdaptationDomain[] = ["visual", "interaction", "cognitive", "motion_media", "reading", "safety"];

/** Build the honest discovery document for one concrete page context. */
export function discoverCapabilities(pageId: string, siteName: string): CapabilityDiscovery {
  const support = PAGE_SUPPORT[pageId];
  const capabilities: Capability[] = support
    ? [
        ...support.adaptive.map((key) => ({ ...BY_KEY.get(key)!, status: "adaptive" as const })),
        ...support.inherent.map((key) => ({ ...BY_KEY.get(key)!, status: "inherent" as const })),
      ].map((capability) => ({
        ...capability,
        supported_values: support.valueOverrides?.[capability.key]
          ?? (capability.status === "adaptive" && Array.isArray(capability.supported_values)
            && capability.supported_values.length === 1 && capability.supported_values[0] === true
            ? [true, false]
            : capability.supported_values),
      }))
    : [];
  const presentDomains = new Set(capabilities.map((capability) => capability.domain));
  return {
    contract: CONTRACT_NAME,
    version: CONTRACT_VERSION,
    site_name: siteName,
    page_id: pageId,
    capabilities,
    unsupported_domains: DOMAINS.filter((domain) => !presentDomains.has(domain)),
  };
}

export function capabilityForPage(pageId: string, key: string): Capability | undefined {
  return discoverCapabilities(pageId, "").capabilities.find((capability) => capability.key === key);
}

export function isKnownCapabilityKey(key: string): boolean {
  return BY_KEY.has(key);
}

export const ALL_CAPABILITY_KEYS: string[] = CAPABILITIES.map((capability) => capability.key);

/** Which capability keys does a profile request? */
export function requestedKeys(profile: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const [section, fields] of Object.entries(profile)) {
    if (section === "version" || section === "label") continue;
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) continue;
    for (const field of Object.keys(fields)) keys.push(`${section}.${field}`);
  }
  return keys;
}
