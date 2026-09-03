import { describe, it, expect } from "vitest";
import { validateProfile, profileJsonSchema, CONTRACT_VERSION } from "../../src/adaptive-contract/schema";
import { mergeProfiles, normalizeProfile, DEMO_BUNDLES, prepareIncomingProfile } from "../../src/adaptive-contract/profile";
import { countPreferences, buildReceipt } from "../../src/adaptive-contract/receipts";
import { scanForDiagnosisTerms } from "../../src/adaptive-contract/privacy";
import { requestedKeys, discoverCapabilities, ALL_CAPABILITY_KEYS } from "../../src/adaptive-contract/capabilities";
import { verifyFit, type RenderedMeasurements } from "../../src/adaptive-contract/measurements";
import { priceBreakdown, findProduct, findCoupon, PRODUCTS, COUPONS } from "../../src/data/products";
import { profileToTokenOps, explainChange } from "../../src/engine/tokens";

describe("contract validation", () => {
  it("accepts a valid minimal profile", () => {
    const r = validateProfile({ version: CONTRACT_VERSION, visual: { text_scale: 1.5 } });
    expect(r.ok).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it("rejects unknown keys", () => {
    const r = validateProfile({ version: CONTRACT_VERSION, mood: { happy: true } });
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe("unknown_key");
  });

  it("rejects bad version", () => {
    const r = validateProfile({ version: "9.9" });
    expect(r.issues.some((i) => i.code === "bad_version")).toBe(true);
  });

  it("flags out-of-range values but stays applicable (clamped later)", () => {
    const r = validateProfile({ version: CONTRACT_VERSION, visual: { text_scale: 9 } });
    expect(r.ok).toBe(true);
    expect(r.issues[0].code).toBe("out_of_range");
  });

  it("rejects wrong types", () => {
    const r = validateProfile({ version: CONTRACT_VERSION, interaction: { keyboard_first: "yes" } });
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe("bad_type");
  });

  it("JSON schema mentions no diagnosis fields anywhere", () => {
    const schema = JSON.stringify(profileJsonSchema());
    for (const term of ["diagnos", "condition", "disease", "medical"]) {
      expect(schema.toLowerCase().includes(term)).toBe(false);
    }
    expect((profileJsonSchema().properties as Record<string, unknown>)).not.toHaveProperty("label");
    expect(
      ((profileJsonSchema().properties as Record<string, Record<string, unknown>>).visual),
    ).toMatchObject({ additionalProperties: false });
  });
});

describe("profile merging and normalization", () => {
  it("merges sections with later wins", () => {
    const merged = mergeProfiles(
      { version: CONTRACT_VERSION, visual: { text_scale: 1.5 }, interaction: { minimum_target_size: 52 } },
      { version: CONTRACT_VERSION, visual: { text_scale: 1.8 } },
    );
    expect(merged.visual?.text_scale).toBe(1.8);
    expect(merged.interaction?.minimum_target_size).toBe(52);
  });

  it("clamps out-of-range numbers", () => {
    const { profile, clamped } = normalizeProfile({
      version: CONTRACT_VERSION,
      interaction: { minimum_target_size: 90 },
      visual: { text_scale: 5 },
    });
    expect(profile.interaction?.minimum_target_size).toBe(60);
    expect(profile.visual?.text_scale).toBe(2.2);
    expect(clamped).toHaveLength(2);
  });

  it("all demo bundles are valid, diagnosis-free and combinable", () => {
    const combined = mergeProfiles(...DEMO_BUNDLES.map((b) => b.profile));
    const r = validateProfile(combined);
    expect(r.ok).toBe(true);
    for (const b of DEMO_BUNDLES) {
      expect(validateProfile(b.profile).ok).toBe(true);
      expect(scanForDiagnosisTerms(JSON.stringify(b.profile)).ok).toBe(true);
    }
  });

  it("prepareIncomingProfile reports clamps", () => {
    const { profile, clamped } = prepareIncomingProfile({ version: CONTRACT_VERSION, visual: { text_scale: 3 } });
    expect(profile?.visual?.text_scale).toBe(2.2);
    expect(clamped[0].key).toBe("visual.text_scale");
  });
});

describe("privacy", () => {
  it("detects diagnosis-like terms in payloads", () => {
    const r = scanForDiagnosisTerms({ note: "user has Parkinson", visual: { text_scale: 1.5 } });
    expect(r.ok).toBe(false);
    expect(r.findings[0].term).toContain("parkinson");
  });

  it("allows functional language", () => {
    expect(scanForDiagnosisTerms({ visual: { text_scale: 1.5 }, note: "one-handed use today" }).ok).toBe(true);
  });

  it("receipts are diagnosis-free by construction", () => {
    const receipt = buildReceipt({
      origin_site: "Test",
      profile: DEMO_BUNDLES[0].profile,
      adaptations_applied: 2,
      refinements: 1,
    });
    expect(receipt.privacy.contains_diagnoses).toBe(false);
    expect(scanForDiagnosisTerms(receipt).ok).toBe(true);
    expect(receipt.profile).not.toHaveProperty("label");
  });

  it("counts preferences for the timeline", () => {
    expect(countPreferences(DEMO_BUNDLES[0].profile)).toBeGreaterThan(15);
  });
});

describe("capabilities", () => {
  it("discovers page-specific adaptive and inherent capabilities", () => {
    const a = discoverCapabilities("shop-catalog", "Shop");
    const b = discoverCapabilities("services-portal", "Services");
    const landing = discoverCapabilities("landing", "As I Am");
    expect(a.capabilities.some((capability) => capability.key === "visual.important_text_scale")).toBe(true);
    expect(b.capabilities.some((capability) => capability.key === "cognitive.plain_error_messages")).toBe(true);
    expect(a.capabilities.some((capability) => capability.key === "cognitive.plain_error_messages")).toBe(false);
    expect(landing.unsupported_domains).toEqual(expect.arrayContaining(["cognitive", "reading", "safety"]));
    expect(a.capabilities.find((capability) => capability.key === "safety.complete_price_totals")?.status).toBe("inherent");
    expect(a.capabilities.find((capability) => capability.key === "cognitive.confirmation_level")?.supported_values).toEqual(["normal", "confirm-risky", "confirm-all"]);
  });

  it("requestedKeys flattens profiles", () => {
    const keys = requestedKeys({ visual: { text_scale: 1.5 }, safety: { confirm_destructive: true } });
    expect(keys).toEqual(["visual.text_scale", "safety.confirm_destructive"]);
  });

  it("all capability keys are unique", () => {
    expect(new Set(ALL_CAPABILITY_KEYS).size).toBe(ALL_CAPABILITY_KEYS.length);
  });
});

describe("fit verification", () => {
  const m: RenderedMeasurements = {
    smallest_body_text_px: 24,
    price_text_px: { smallest: 30, largest: 42 },
    smallest_target_px: 52.3,
    min_action_gap_px: 16.2,
    contrast: { min_ratio: 5.2, sample_size: 40 },
    primary_actions_visible: 3,
    animations_running: 0,
    horizontal_overflow: false,
    occluded_focusables: 0,
    measured_at: new Date().toISOString(),
  };

  it("reports satisfied when the rendered page meets the request", () => {
    const fit = verifyFit(
      { "interaction.minimum_target_size": 52, "cognitive.maximum_primary_actions": 3, "motion_media.disable_animation": true },
      m,
    );
    expect(fit.overall).toBe("satisfied");
    expect(fit.partially_satisfied).toHaveLength(0);
  });

  it("reports partial + refinements when measurements fall short", () => {
    const fit = verifyFit({ "interaction.minimum_target_size": 60 }, m);
    expect(fit.overall).toBe("partially_satisfied");
    expect(fit.suggested_refinements.length).toBeGreaterThan(0);
  });

  it("never marks unknown or unmeasured values satisfied by default", () => {
    const fit = verifyFit({
      "visual.text_scale": 1.5,
      "visual.not_a_contract_key": true,
    }, m);
    expect(fit.partially_satisfied).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "visual.text_scale" }),
    ]));
    expect(fit.unsupported).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "visual.not_a_contract_key" }),
    ]));
    expect(fit.overall).toBe("partially_satisfied");
  });
});

describe("price math (deterministic)", () => {
  it("computes item + shipping - discount", () => {
    const p = findProduct("aurora-anc")!;
    const b = priceBreakdown(p);
    expect(b.item_price).toBe(229);
    expect(b.shipping).toBe(4.95);
    expect(b.discount).toBe(50);
    expect(b.total).toBe(233.95);
  });

  it("applies percent coupons to the right category", () => {
    const p = findProduct("aurora-anc")!;
    const c = findCoupon("QUIET10")!;
    const b = priceBreakdown(p, c);
    expect(b.coupon_savings).toBeCloseTo(22.9, 2);
    expect(b.total).toBeCloseTo(211.05, 2);
  });

  it("does not apply category coupons to other categories", () => {
    const p = findProduct("meridian-desk")!;
    const b = priceBreakdown(p, findCoupon("QUIET10")!);
    expect(b.coupon_savings).toBe(0);
  });

  it("shipping coupons waive shipping above min cart", () => {
    const p = findProduct("vellum-studio")!;
    const b = priceBreakdown(p, findCoupon("SHIPFREE")!);
    expect(b.coupon_savings).toBe(4.95);
    expect(b.total).toBe(179);
  });

  it("ignores expired coupons", () => {
    const p = findProduct("aurora-anc")!;
    const b = priceBreakdown(p, findCoupon("SUMMER25")!);
    expect(b.coupon_savings).toBe(0);
  });

  it("every product has price and plain_description for reading modes", () => {
    for (const p of PRODUCTS) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.plain_description.length).toBeGreaterThan(10);
      expect(p.key_points.length).toBe(3);
    }
    expect(COUPONS.length).toBeGreaterThanOrEqual(4);
  });
});

describe("token mapping", () => {
  it("maps profile to tokens + document flags", () => {
    const { tokens, flags } = profileToTokenOps({
      visual: { text_scale: 1.5, color_mode: "deuteranopia-safe" },
      interaction: { minimum_target_size: 52 },
      cognitive: { maximum_primary_actions: 3, hide_nonessential: true },
      motion_media: { disable_animation: true },
    });
    expect(tokens["--aia-text-scale"]).toBe("1.5");
    expect(tokens["--aia-target-min"]).toBe("52px");
    expect(flags["color-mode"]).toBe("deuteranopia-safe");
    expect(flags["motion"]).toBe("off");
    expect(flags["hide-nonessential"]).toBe("on");
  });

  it("explains changes in plain language", () => {
    expect(explainChange("visual.text_scale", 1.5)).toContain("150%");
    expect(explainChange("interaction.minimum_target_size", 52)).toContain("52×52");
  });
});
