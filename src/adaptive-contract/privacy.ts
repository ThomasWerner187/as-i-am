/**
 * Adaptive Web Contract — privacy.ts
 *
 * Enforces the privacy model:
 * - a closed functional schema is the primary data boundary
 * - tool arguments are additionally screened for known diagnosis-like terms
 * - nothing is persisted (session state only, in memory)
 * - receipts contain functional parameters only
 */

/**
 * A deliberately finite, defence-in-depth screen for common diagnosis-like
 * terms. It is not a medical classifier and must never be presented as proof
 * that arbitrary free text is diagnosis-free. The closed schema and removal
 * of free-form metadata are the actual privacy boundary.
 */
const DIAGNOSIS_TERMS: string[] = [
  "parkinson",
  "alzheimer",
  "dementia",
  "diabetes",
  "epilepsy",
  "schizophrenia",
  "multiple sclerosis",
  "ms diagnosis",
  "arthritis",
  "fibromyalgia",
  "long covid",
  "cancer",
  "stroke",
  "adhd",
  "autism",
  "asperger",
  "dyslexia",
  "dyscalculia",
  "depression",
  "anxiety disorder",
  "ptsd",
  "ocd",
  "bipolar",
  "migraine diagnosis",
  "chronic illness",
  "chronic pain",
  "tremor",
  "cataract",
  "glaucoma",
  "macular degeneration",
  "retinitis pigmentosa",
  "hearing loss",
  "deafness",
  "color blindness",
  "colour blindness",
  "colourblind",
  "colorblind",
  "handicap",
  "disability pension",
  "diagnosed with",
  "diagnosis:",
  "my diagnosis",
  "icd-10",
  "icd-11",
  " prescription",
  "medication",
  "meds for",
];

export interface PrivacyScanResult {
  ok: boolean;
  findings: { term: string; where: string }[];
}

function scanObject(obj: unknown, where: string, findings: { term: string; where: string }[]): void {
  if (typeof obj === "string") {
    const haystack = obj.toLowerCase();
    for (const term of DIAGNOSIS_TERMS) {
      if (haystack.includes(term)) findings.push({ term, where });
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => scanObject(v, `${where}[${i}]`, findings));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      scanObject(v, where ? `${where}.${k}` : k, findings);
    }
  }
}

/** Scan any tool argument payload for diagnosis-like terms. */
export function scanForDiagnosisTerms(args: unknown): PrivacyScanResult {
  const findings: { term: string; where: string }[] = [];
  scanObject(args, "", findings);
  return { ok: findings.length === 0, findings };
}

/** A redacted view of arguments for logging: values pass through, terms already blocked upstream. */
export function redactForLog(args: unknown): unknown {
  const scan = scanForDiagnosisTerms(args);
  if (scan.ok) return args;
  return { blocked: true, findings: scan.findings };
}

/** Session-only in-memory store. Never touches localStorage/indexedDB/cookies. */
export class SessionOnlyStore<T> {
  private value: T | null = null;
  set(v: T): void {
    this.value = v;
  }
  get(): T | null {
    return this.value;
  }
  clear(): void {
    this.value = null;
  }
}

export const PRIVACY_RULES = [
  "The accepted profile schema contains functional parameters only; free-form labels are discarded.",
  "Known diagnosis-like terms are screened as defence in depth, not as a medical classifier.",
  "The tool log shows validated functional parameters only.",
  "Nothing is persisted: session memory only, no cookies, no localStorage.",
  "No external analytics, no third-party requests for adaptation logic.",
  "Profiles never appear in URLs or share links.",
  "Export contains only values accepted by the closed functional schema.",
  "The website shows the accepted functional values after validation and metadata removal.",
] as const;
