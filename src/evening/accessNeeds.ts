import { CONTRACT_VERSION, type FunctionalProfile } from "../adaptive-contract/schema";

export type AccessNeed = "pointing" | "reading" | "focus";

export const DEFAULT_ACCESS_NEEDS: AccessNeed[] = ["pointing", "focus"];

export const ACCESS_NEEDS: readonly {
  id: AccessNeed;
  label: string;
  description: string;
  request: string;
}[] = [
  {
    id: "pointing",
    label: "Make pointing easier for me",
    description: "Bigger buttons, more space, and a clearer keyboard focus.",
    request: "Give me bigger buttons, more space between them, and a clearer keyboard focus.",
  },
  {
    id: "reading",
    label: "Make reading easier for me",
    description: "Larger text, a readable typeface, and more line spacing.",
    request: "Give me larger text, a readable typeface, and more line spacing.",
  },
  {
    id: "focus",
    label: "Give me less to process",
    description: "Clearer steps, fewer distractions, and less motion.",
    request: "Guide me step by step, hide nonessential content, and reduce motion.",
  },
];

/** User-chosen functional preferences only; no labels or personal context leave the chooser. */
export function buildAccessProfile(ids: readonly AccessNeed[]): FunctionalProfile {
  const profile: FunctionalProfile = { version: CONTRACT_VERSION };
  if (ids.includes("pointing")) {
    profile.interaction = {
      minimum_target_size: 56,
      target_spacing: 12,
      focus_strength: "strong",
    };
  }
  if (ids.includes("reading")) {
    profile.visual = { text_scale: 1.3, font_style: "readable", line_height: 1.7 };
  }
  if (ids.includes("focus")) {
    profile.cognitive = { step_by_step: true, hide_nonessential: true };
    profile.motion_media = { reduce_motion: true };
  }
  return profile;
}

/** Optional agent-local wording for the request shown before applying the profile. */
export function accessNeedsRequest(ids: readonly AccessNeed[]): string {
  return ACCESS_NEEDS.filter((need) => ids.includes(need.id))
    .map((need) => need.request)
    .join(" ") || "Keep the website's original presentation.";
}
