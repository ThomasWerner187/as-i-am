/**
 * Adaptive Web Contract — receipts.ts
 * Diagnosis-free, portable summary of the functional preferences an
 * agent applied during this session. For carrying to the next website.
 */

import type { AdaptationReceipt, FunctionalProfile } from "./schema";
import {
  CONTRACT_NAME,
  CONTRACT_VERSION,
  functionalPayload,
  profileJsonSchema,
  validateProfile,
} from "./schema";
import { scanForDiagnosisTerms } from "./privacy";

export interface ReceiptInput {
  origin_site: string;
  profile: FunctionalProfile;
  adaptations_applied: number;
  refinements: number;
}

export interface ReceiptValidationIssue {
  path: string;
  message: string;
}

export interface ReceiptValidationResult {
  ok: boolean;
  issues: ReceiptValidationIssue[];
}

const RECEIPT_FIELDS = new Set([
  "contract",
  "version",
  "issued_at",
  "origin_site",
  "profile",
  "stats",
  "privacy",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireExactFields(
  value: unknown,
  path: string,
  required: readonly string[],
  issues: ReceiptValidationIssue[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issues.push({ path, message: "must be an object" });
    return false;
  }
  const allowed = new Set(required);
  for (const field of required) {
    if (!Object.hasOwn(value, field)) {
      issues.push({ path: `${path}.${field}`, message: "is required" });
    }
  }
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) {
      issues.push({ path: `${path}.${field}`, message: "is not part of the receipt contract" });
    }
  }
  return true;
}

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [0, 31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month]
    && hour <= 23 && minute <= 59 && second <= 59;
}

/** Complete, closed JSON Schema exposed by import_adaptation_receipt. */
export function receiptJsonSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://as-i-am.demo/schemas/adaptation-receipt-0.1.json",
    title: "Adaptation Receipt (Adaptive Web Contract 0.1)",
    type: "object",
    required: [...RECEIPT_FIELDS],
    properties: {
      contract: { const: CONTRACT_NAME },
      version: { const: CONTRACT_VERSION },
      issued_at: { type: "string", format: "date-time", maxLength: 64 },
      origin_site: { type: "string", minLength: 1, maxLength: 200 },
      profile: profileJsonSchema(),
      stats: {
        type: "object",
        required: ["adaptations_applied", "refinements"],
        properties: {
          adaptations_applied: { type: "integer", minimum: 0 },
          refinements: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
      },
      privacy: {
        type: "object",
        required: ["contains_diagnoses", "storage", "scope"],
        properties: {
          contains_diagnoses: { const: false },
          storage: { const: "none" },
          scope: { const: "session" },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  };
}

/** Validate an untrusted receipt independently of the WebMCP schema validator. */
export function validateReceipt(input: unknown): ReceiptValidationResult {
  const issues: ReceiptValidationIssue[] = [];
  if (!isRecord(input)) {
    return { ok: false, issues: [{ path: "receipt", message: "must be an object" }] };
  }

  for (const field of RECEIPT_FIELDS) {
    if (!Object.hasOwn(input, field)) {
      issues.push({ path: `receipt.${field}`, message: "is required" });
    }
  }
  for (const field of Object.keys(input)) {
    if (!RECEIPT_FIELDS.has(field)) {
      issues.push({ path: `receipt.${field}`, message: "is not part of the receipt contract" });
    }
  }

  if (input.contract !== CONTRACT_NAME) {
    issues.push({ path: "receipt.contract", message: `must equal ${JSON.stringify(CONTRACT_NAME)}` });
  }
  if (input.version !== CONTRACT_VERSION) {
    issues.push({ path: "receipt.version", message: `must equal ${JSON.stringify(CONTRACT_VERSION)}` });
  }
  if (!isIsoDateTime(input.issued_at)) {
    issues.push({ path: "receipt.issued_at", message: "must be a valid RFC 3339 date-time" });
  }
  if (
    typeof input.origin_site !== "string" ||
    input.origin_site.trim().length === 0 ||
    input.origin_site.length > 200
  ) {
    issues.push({ path: "receipt.origin_site", message: "must be a non-empty string of at most 200 characters" });
  }

  const profileValidation = validateProfile(input.profile);
  if (!profileValidation.ok || profileValidation.issues.length > 0) {
    for (const issue of profileValidation.issues) {
      issues.push({
        path: issue.path ? `receipt.profile.${issue.path}` : "receipt.profile",
        message: issue.message,
      });
    }
  }
  if (isRecord(input.profile) && Object.hasOwn(input.profile, "label")) {
    issues.push({ path: "receipt.profile.label", message: "free-form labels are not allowed in receipts" });
  }

  if (requireExactFields(
    input.stats,
    "receipt.stats",
    ["adaptations_applied", "refinements"],
    issues,
  )) {
    for (const field of ["adaptations_applied", "refinements"] as const) {
      const value = input.stats[field];
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        issues.push({ path: `receipt.stats.${field}`, message: "must be a non-negative integer" });
      }
    }
  }

  if (requireExactFields(
    input.privacy,
    "receipt.privacy",
    ["contains_diagnoses", "storage", "scope"],
    issues,
  )) {
    if (input.privacy.contains_diagnoses !== false) {
      issues.push({ path: "receipt.privacy.contains_diagnoses", message: "must be false" });
    }
    if (input.privacy.storage !== "none") {
      issues.push({ path: "receipt.privacy.storage", message: 'must equal "none"' });
    }
    if (input.privacy.scope !== "session") {
      issues.push({ path: "receipt.privacy.scope", message: 'must equal "session"' });
    }
  }

  if (!scanForDiagnosisTerms(input).ok) {
    issues.push({
      path: "receipt",
      message: "contains privacy-sensitive free text outside the functional receipt contract",
    });
  }
  return { ok: issues.length === 0, issues };
}

export function buildReceipt(input: ReceiptInput): AdaptationReceipt {
  const profileValidity = validateProfile(input.profile);
  if (!profileValidity.ok) {
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
  const receiptValidity = validateReceipt(receipt);
  if (!receiptValidity.ok) {
    throw new Error(`receipt construction failed contract validation: ${receiptValidity.issues.map((issue) => issue.path).join(", ")}`);
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
