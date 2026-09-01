/**
 * Adaptive Web Contract — capabilities.ts
 * Capability discovery: what each page can meaningfully adapt.
 * Pages declare capabilities; tools serve them. No CSS selectors —
 * only semantic keys of the contract.
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
  return { key, domain, description, unit, supported_values };
}

const VISUAL: Capability[] = [
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
];

const INTERACTION: Capability[] = [
  cap("interaction.minimum_target_size", "interaction", "Minimum interactive target size", "px", "continuous"),
  cap("interaction.target_spacing", "interaction", "Minimum gap between targets", "px", "continuous"),
  cap("interaction.keyboard_first", "interaction", "Keyboard-first navigation aids", "", [true]),
  cap("interaction.focus_strength", "interaction", "Focus indicator strength", "", ["default", "strong", "maximum"]),
  cap("interaction.cursor_size", "interaction", "Enlarged cursor helper", "px", "continuous"),
  cap("interaction.drag_alternatives", "interaction", "Buttons replace any drag interaction", "", [true]),
  cap("interaction.double_click_disabled", "interaction", "No double-click required anywhere", "", [true]),
  cap("interaction.timeout_multiplier", "interaction", "Extend session timeouts", "×", "continuous"),
  cap("interaction.error_tolerance", "interaction", "Forgiving input correction", "", ["normal", "high"]),
];

const COGNITIVE: Capability[] = [
  cap("cognitive.information_density", "cognitive", "Page information density", "", ["normal", "reduced", "minimal"]),
  cap("cognitive.maximum_primary_actions", "cognitive", "Visible primary actions in header", "count", "continuous"),
  cap("cognitive.step_by_step", "cognitive", "Guided steps with progress", "", [true]),
  cap("cognitive.hide_nonessential", "cognitive", "Hide promos, badges, nonessential blocks", "", [true]),
  cap("cognitive.persistent_labels", "cognitive", "Always-visible labels on controls", "", [true]),
  cap("cognitive.consistent_help", "cognitive", "Persistent, consistent help panel", "", [true]),
  cap("cognitive.progress_indicators", "cognitive", "Show progress and remaining steps", "", [true]),
  cap("cognitive.plain_error_messages", "cognitive", "Errors in plain language", "", [true]),
  cap("cognitive.confirmation_level", "cognitive", "Confirmation before risky actions", "", ["normal", "confirm-risky", "confirm-all"]),
];

const MOTION_MEDIA: Capability[] = [
  cap("motion_media.reduce_motion", "motion_media", "Respect reduced motion", "", [true]),
  cap("motion_media.disable_animation", "motion_media", "Stop all animation", "", [true]),
  cap("motion_media.disable_autoplay", "motion_media", "Stop autoplay media and tickers", "", [true]),
  cap("motion_media.disable_parallax", "motion_media", "Remove parallax/zoom transitions", "", [true]),
  cap("motion_media.mute_nonessential_audio", "motion_media", "Mute nonessential sounds", "", [true]),
  cap("motion_media.enable_captions", "motion_media", "Captions on all media", "", [true]),
  cap("motion_media.enable_transcripts", "motion_media", "Text transcripts for media", "", [true]),
  cap("motion_media.static_media_alternatives", "motion_media", "Static alternatives for motion", "", [true]),
];

const READING: Capability[] = [
  cap("reading.mode", "reading", "Content presentation mode", "", [
    "original", "plain_language", "key_points", "step_by_step", "read_aloud", "bilingual_or_explained",
  ]),
  cap("reading.speech_rate", "reading", "Speech rate for read-aloud", "×", "continuous"),
];

const SAFETY: Capability[] = [
  cap("safety.confirm_destructive", "safety", "Explicit confirm for destructive actions", "", [true]),
  cap("safety.complete_price_totals", "safety", "Prices always as complete totals", "", [true]),
];

/** Build the discovery document for a page. */
export function discoverCapabilities(pageId: string, siteName: string): CapabilityDiscovery {
  const all: Capability[] = [
    ...VISUAL,
    ...INTERACTION,
    ...COGNITIVE,
    ...MOTION_MEDIA,
    ...READING,
    ...SAFETY,
  ];
  return {
    contract: CONTRACT_NAME,
    version: CONTRACT_VERSION,
    site_name: siteName,
    page_id: pageId,
    capabilities: all,
    unsupported_domains: [],
  };
}

export const ALL_CAPABILITY_KEYS: string[] = discoverCapabilities("x", "x").capabilities.map((c) => c.key);

/** Which capability keys does a profile request? */
export function requestedKeys(profile: Record<string, Record<string, unknown>>): string[] {
  const keys: string[] = [];
  for (const [section, fields] of Object.entries(profile)) {
    if (section === "version" || section === "label") continue;
    for (const field of Object.keys(fields ?? {})) keys.push(`${section}.${field}`);
  }
  return keys;
}
