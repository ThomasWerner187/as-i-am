/**
 * Design tokens — the ONLY surface adaptations may touch.
 * The website translates semantic preferences into these tokens;
 * agents never send CSS.
 */

export const BASE_TOKENS: Record<string, string> = {
  "--aia-text-scale": "1",
  "--aia-important-scale": "1",
  "--aia-line-height": "1.55",
  "--aia-letter-spacing": "0em",
  "--aia-word-spacing": "0em",
  "--aia-max-line": "72ch",
  "--aia-target-min": "44px",
  "--aia-target-gap": "8px",
  "--aia-focus": "0 0 0 2px var(--ink), 0 0 0 5px var(--accent)",
  "--aia-radius": "10px",
};

/** Map a normalized functional profile onto token values + document flags. */
export function profileToTokenOps(profile: Record<string, Record<string, unknown>>): {
  tokens: Record<string, string>;
  flags: Record<string, string>;
} {
  const tokens: Record<string, string> = {};
  const flags: Record<string, string> = {};
  const vis = profile.visual ?? {};
  const act = profile.interaction ?? {};
  const cog = profile.cognitive ?? {};

  if (typeof vis.text_scale === "number") tokens["--aia-text-scale"] = String(vis.text_scale);
  if (typeof vis.important_text_scale === "number") tokens["--aia-important-scale"] = String(vis.important_text_scale);
  if (typeof vis.line_height === "number") tokens["--aia-line-height"] = String(vis.line_height);
  if (typeof vis.letter_spacing === "number") tokens["--aia-letter-spacing"] = `${vis.letter_spacing}em`;
  if (typeof vis.word_spacing === "number") tokens["--aia-word-spacing"] = `${vis.word_spacing}em`;
  if (typeof vis.max_line_length === "number") tokens["--aia-max-line"] = `${vis.max_line_length}ch`;

  if (vis.contrast) flags["contrast"] = String(vis.contrast);
  if (vis.glare) flags["glare"] = String(vis.glare);
  if (vis.color_mode) flags["color-mode"] = String(vis.color_mode);
  if (vis.font_style) flags["font-style"] = String(vis.font_style);
  if (vis.color_independent_status === true) flags["status-labels"] = "on";

  if (typeof act.minimum_target_size === "number") {
    tokens["--aia-target-min"] = `${act.minimum_target_size}px`;
    flags["min-target"] = "on";
  }
  if (typeof act.target_spacing === "number") tokens["--aia-target-gap"] = `${act.target_spacing}px`;
  if (act.focus_strength) {
    flags["focus"] = String(act.focus_strength);
    tokens["--aia-focus"] =
      act.focus_strength === "maximum"
        ? "0 0 0 3px var(--paper), 0 0 0 7px var(--accent), 0 0 0 10px var(--ink)"
        : act.focus_strength === "strong"
          ? "0 0 0 2px var(--paper), 0 0 0 5px var(--accent)"
          : BASE_TOKENS["--aia-focus"];
  }
  if (act.keyboard_first === true) flags["keyboard-first"] = "on";
  if (act.drag_alternatives === true) flags["no-drag"] = "on";
  if (act.double_click_disabled === true) flags["no-dblclick"] = "on";
  if (typeof act.cursor_size === "number") flags["cursor-size"] = String(act.cursor_size);

  if (cog.information_density) flags["density"] = String(cog.information_density);
  if (cog.hide_nonessential === true) flags["hide-nonessential"] = "on";
  if (cog.persistent_labels === true) flags["labels"] = "on";
  if (cog.step_by_step === true) flags["steps"] = "on";
  if (cog.progress_indicators === true) flags["progress"] = "on";
  if (cog.consistent_help === true) flags["help"] = "on";
  if (cog.plain_error_messages === true) flags["plain-errors"] = "on";
  if (cog.confirmation_level) flags["confirmation"] = String(cog.confirmation_level);

  const mm = profile.motion_media ?? {};
  const motionOff = mm.disable_animation === true || mm.reduce_motion === true;
  if (motionOff) flags["motion"] = "off";
  else if (mm.reduce_motion === false) flags["motion"] = "normal";
  if (mm.disable_autoplay === true) flags["autoplay"] = "off";
  if (mm.disable_parallax === true) flags["parallax"] = "off";
  if (mm.enable_captions === true) flags["captions"] = "on";
  if (mm.enable_transcripts === true) flags["transcripts"] = "on";
  if (mm.static_media_alternatives === true) flags["static-media"] = "on";

  if (typeof vis.brightness === "number") {
    flags["brightness"] = String(vis.brightness);
    tokens["--aia-brightness-value"] = String(vis.brightness);
  }

  return { tokens, flags };
}

/** Plain-language explanations per profile key (used by explain_adaptation + timeline). */
export function explainChange(key: string, to: unknown): string {
  const v = to as string | number | boolean;
  switch (key) {
    case "visual.text_scale": return `Text size increased to ${Math.round(Number(v) * 100)}%.`;
    case "visual.important_text_scale": return `Key information like prices scaled up additionally (${Math.round(Number(v) * 100)}%).`;
    case "visual.line_height": return `Line spacing set to ${v}.`;
    case "visual.letter_spacing": return "Letter spacing widened for readability.";
    case "visual.word_spacing": return "Word spacing widened.";
    case "visual.max_line_length": return `Lines limited to about ${v} characters.`;
    case "visual.contrast": return `Contrast scheme set to ${v}.`;
    case "visual.brightness": return `Brightness reduced to ${Math.round(Number(v) * 100)}%.`;
    case "visual.glare": return "Glare reduced with a softer palette.";
    case "visual.color_mode": return `Colour mode set to ${String(v).replace("-", " ")}; status colours remapped to a safe palette.`;
    case "visual.color_independent_status": return "Status is now shown with labels, icons and patterns — never colour alone.";
    case "visual.font_style": return "Switched to a highly readable typeface.";
    case "interaction.minimum_target_size": return `All touch and click targets are at least ${v}×${v} pixels.`;
    case "interaction.target_spacing": return `At least ${v}px of space between adjacent controls.`;
    case "interaction.keyboard_first": return "Keyboard navigation is front and centre, with visible shortcuts.";
    case "interaction.focus_strength": return "Focus indicator made strongly visible.";
    case "interaction.cursor_size": return `Cursor enlarged to ${v}px.`;
    case "interaction.drag_alternatives": return "Every drag interaction has a button alternative.";
    case "interaction.double_click_disabled": return "Nothing requires a double-click anymore.";
    case "interaction.timeout_multiplier": return `Time limits extended ${v}×.`;
    case "interaction.error_tolerance": return "Input is more forgiving when correcting mistakes.";
    case "cognitive.information_density": return `Information density set to ${v}.`;
    case "cognitive.maximum_primary_actions": return `Primary actions reduced to at most ${v}.`;
    case "cognitive.step_by_step": return "Content is presented as guided steps.";
    case "cognitive.hide_nonessential": return "Promotions, badges and nonessential blocks are hidden (not deleted).";
    case "cognitive.persistent_labels": return "All controls carry permanent text labels.";
    case "cognitive.consistent_help": return "A consistent help panel is available on every page.";
    case "cognitive.progress_indicators": return "Progress and remaining steps are always visible.";
    case "cognitive.plain_error_messages": return "Error messages use plain language.";
    case "cognitive.confirmation_level": return "Risky actions now ask for explicit confirmation.";
    case "motion_media.reduce_motion": return "Motion reduced.";
    case "motion_media.disable_animation": return "All animations stopped.";
    case "motion_media.disable_autoplay": return "Autoplay media and tickers stopped.";
    case "motion_media.disable_parallax": return "Parallax and zoom effects removed.";
    case "motion_media.mute_nonessential_audio": return "Nonessential audio muted.";
    case "motion_media.enable_captions": return "Captions enabled.";
    case "motion_media.enable_transcripts": return "Transcripts available for media.";
    case "motion_media.static_media_alternatives": return "Static alternatives shown for moving content.";
    case "reading.mode": return `Reading mode set to "${String(v).replace(/_/g, " ")}".`;
    case "reading.speech_rate": return `Speech rate set to ${v}×.`;
    case "safety.confirm_destructive": return "Destructive actions always require confirmation.";
    case "safety.complete_price_totals": return "Prices are always shown as complete totals including shipping and fees.";
    default: return `${key} set to ${String(v)}.`;
  }
}

export function changeKind(key: string): "token" | "layout" | "content" | "media" | "navigation" | "safety" {
  if (key.startsWith("visual.")) return "token";
  if (key.startsWith("interaction.")) return "layout";
  if (key.startsWith("cognitive.")) return key === "cognitive.maximum_primary_actions" ? "navigation" : "content";
  if (key.startsWith("motion_media.")) return "media";
  if (key.startsWith("reading.")) return "content";
  if (key.startsWith("safety.")) return "safety";
  return "token";
}
