/**
 * Adaptive Web Contract — privacy.ts
 *
 * Enforces the privacy model:
 * - tool arguments are scanned for diagnosis-like terms before execution
 * - nothing is persisted (session state only, in memory)
 * - receipts contain functional parameters only
 */

/** Common medical diagnoses / condition names. Functional descriptions
 *  ("larger text", "one-handed") are always allowed; these are not. */
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
  "No diagnosis parameters exist in any tool schema.",
  "Tool arguments are scanned and rejected if they contain diagnosis-like terms.",
  "The tool log shows functional parameters only.",
  "Nothing is persisted: session memory only, no cookies, no localStorage.",
  "No external analytics, no third-party requests for adaptation logic.",
  "Profiles never appear in URLs or share links.",
  "Export is a diagnosis-free functional receipt.",
  "The website shows exactly which functional values it received.",
] as const;
