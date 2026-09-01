/**
 * Adaptive Web Contract — receipts.ts
 * Diagnosis-free, portable summary of the functional preferences an
 * agent applied during this session. For carrying to the next website.
 */

import type { AdaptationReceipt, FunctionalProfile } from "./schema";
import { CONTRACT_NAME, CONTRACT_VERSION, functionalPayload } from "./schema";
import { validateProfile } from "./schema";
import { scanForDiagnosisTerms } from "./privacy";

export interface ReceiptInput {
  origin_site: string;
  profile: FunctionalProfile;
  adaptations_applied: number;
  refinements: number;
}

export function buildReceipt(input: ReceiptInput): AdaptationReceipt {
  const validity = validateProfile(input.profile);
  if (!validity.ok) {
    throw new Error("receipt profile failed contract validation");
  }
  const receipt: AdaptationReceipt = {
    contract: CONTRACT_NAME,
    version: CONTRACT_VERSION,
    issued_at: new Date().toISOString(),
    origin_site: input.origin_site,
    profile: functionalPayload(input.profile),
    stats: {
      adaptations_applied: input.adaptations_applied,
      refinements: input.refinements,
    },
    privacy: {
      contains_diagnoses: false,
      storage: "none",
      scope: "session",
    },
  };
  const scan = scanForDiagnosisTerms(receipt);
  if (!scan.ok) {
    throw new Error(
      `receipt construction violated privacy policy: ${scan.findings.map((f) => f.term).join(", ")}`,
    );
  }
  return receipt;
}

/** Count of functional parameters in a profile (for "Applying N preferences"). */
export function countPreferences(profile: FunctionalProfile): number {
  let n = 0;
  for (const [section, fields] of Object.entries(profile)) {
    if (section === "version" || section === "label") continue;
    n += Object.keys((fields as Record<string, unknown>) ?? {}).length;
  }
  return n;
}
