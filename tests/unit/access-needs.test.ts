import { describe, expect, it } from "vitest";
import {
  ACCESS_NEEDS,
  DEFAULT_ACCESS_NEEDS,
  accessNeedsRequest,
  buildAccessProfile,
  type AccessNeed,
} from "../../src/evening/accessNeeds";
import { validateProfile } from "../../src/adaptive-contract/schema";
import { capabilityForPage, requestedKeys } from "../../src/adaptive-contract/capabilities";
import { scanForDiagnosisTerms } from "../../src/adaptive-contract/privacy";
import { buildReceipt, validateReceipt } from "../../src/adaptive-contract/receipts";

describe("user-chosen access needs", () => {
  it("accepts no needs without adding default adaptations", () => {
    expect(buildAccessProfile([])).toEqual({ version: "0.1" });
    expect(accessNeedsRequest([])).toBe("Keep the website's original presentation.");
  });

  it("keeps the initial example focused on pointing and processing without assuming a reading need", () => {
    expect(DEFAULT_ACCESS_NEEDS).toEqual(["pointing", "focus"]);
    expect(buildAccessProfile(DEFAULT_ACCESS_NEEDS)).toEqual({
      version: "0.1",
      interaction: { minimum_target_size: 56, target_spacing: 12, focus_strength: "strong" },
      cognitive: { step_by_step: true, hide_nonessential: true },
      motion_media: { reduce_motion: true },
    });
  });

  it("lets a reading request stand alone without simplifying content or changing targets", () => {
    expect(buildAccessProfile(["reading"])).toEqual({
      version: "0.1",
      visual: { text_scale: 1.3, font_style: "readable", line_height: 1.7 },
    });
  });

  it("removes deselected preferences when the next profile is built", () => {
    buildAccessProfile(["pointing", "reading", "focus"]);
    expect(buildAccessProfile(["pointing"])).toEqual({
      version: "0.1",
      interaction: { minimum_target_size: 56, target_spacing: 12, focus_strength: "strong" },
    });
    expect(buildAccessProfile(["focus"])).toEqual({
      version: "0.1",
      cognitive: { step_by_step: true, hide_nonessential: true },
      motion_media: { reduce_motion: true },
    });
  });

  it("produces a valid, supported request for every combination on both booking pages", () => {
    for (let mask = 0; mask < 8; mask++) {
      const needs = ACCESS_NEEDS.filter((_, index) => mask & (1 << index)).map((need) => need.id);
      const profile = buildAccessProfile(needs);
      expect(validateProfile(profile), needs.join(", ")).toEqual({ ok: true, issues: [] });
      for (const page of ["cinema-booking", "restaurant-booking"]) {
        for (const key of requestedKeys({ ...profile })) {
          const capability = capabilityForPage(page, key);
          expect(capability, `${page}: ${key}`).toBeDefined();
          expect(capability?.status, `${page}: ${key}`).toBe("adaptive");
          if (capability?.supported_values !== "continuous") {
            const [domain, preference] = key.split(".");
            const fields = profile[domain as keyof typeof profile] as Record<string, unknown>;
            expect(capability?.supported_values, `${page}: ${key}`).toContain(fields[preference]);
          }
        }
      }
    }
  });

  it("exports only functional settings, without chooser labels or personal context", () => {
    const profile = buildAccessProfile(["pointing", "reading", "focus"]);
    const receipt = buildReceipt({
      origin_site: "cinema-booking",
      profile,
      adaptations_applied: requestedKeys({ ...profile }).length,
      refinements: 0,
    });
    expect(validateReceipt(receipt)).toEqual({ ok: true, issues: [] });
    expect(scanForDiagnosisTerms(receipt).ok).toBe(true);
    expect(receipt.profile).toEqual(profile);
    expect(Object.keys(receipt.profile).sort()).toEqual([
      "cognitive", "interaction", "motion_media", "version", "visual",
    ]);
    for (const need of ACCESS_NEEDS) {
      expect(JSON.stringify(receipt)).not.toContain(need.label);
      expect(JSON.stringify(receipt)).not.toContain(need.request);
    }
    expect(receipt.privacy).toEqual({ contains_diagnoses: false, storage: "none", scope: "session" });
  });

  it("does not mutate the selection or share mutable profile fields between requests", () => {
    const needs = Object.freeze(["reading", "pointing", "reading"] as AccessNeed[]);
    const first = buildAccessProfile(needs);
    const second = buildAccessProfile(["pointing", "reading"]);
    expect(first).toEqual(second);
    first.visual!.text_scale = 2;
    expect(second.visual?.text_scale).toBe(1.3);
    expect(needs).toEqual(["reading", "pointing", "reading"]);
    expect(accessNeedsRequest(needs)).toBe(accessNeedsRequest(["pointing", "reading"]));
    expect(scanForDiagnosisTerms(accessNeedsRequest(needs)).ok).toBe(true);
  });
});
