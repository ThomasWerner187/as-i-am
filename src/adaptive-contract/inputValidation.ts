/** Small JSON-Schema subset used at the WebMCP/dev-harness dispatch boundary. */

export interface InputValidationIssue {
  path: string;
  message: string;
}

export interface InputValidationOptions {
  /** Adaptation numbers are deliberately clamped by the contract engine. */
  allowOutOfRangeNumbers?: boolean;
}

function typeMatches(value: unknown, expected: string): boolean {
  switch (expected) {
    case "null": return value === null;
    case "object": return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    case "array": return Array.isArray(value);
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "string": return typeof value === "string";
    case "boolean": return typeof value === "boolean";
    default: return true;
  }
}

function visit(
  value: unknown,
  schema: Record<string, unknown>,
  path: string,
  issues: InputValidationIssue[],
  options: InputValidationOptions,
): void {
  if (issues.length >= 20) return;
  if (Object.hasOwn(schema, "const") && value !== schema.const) {
    issues.push({ path, message: `must equal ${JSON.stringify(schema.const)}` });
    return;
  }

  const declared = Array.isArray(schema.type)
    ? schema.type.filter((item): item is string => typeof item === "string")
    : typeof schema.type === "string"
      ? [schema.type]
      : [];
  if (declared.length > 0 && !declared.some((type) => typeMatches(value, type))) {
    issues.push({ path, message: `must be ${declared.join(" or ")}` });
    return;
  }

  const enumValues = Array.isArray(schema.enum) ? schema.enum : null;
  if (enumValues && !enumValues.some((candidate) => candidate === value)) {
    issues.push({ path, message: `must be one of ${enumValues.map(String).join(", ")}` });
    return;
  }

  if (typeof value === "number" && !options.allowOutOfRangeNumbers) {
    if (typeof schema.minimum === "number" && value < schema.minimum) {
      issues.push({ path, message: `must be at least ${schema.minimum}` });
    }
    if (typeof schema.maximum === "number" && value > schema.maximum) {
      issues.push({ path, message: `must be at most ${schema.maximum}` });
    }
  }
  if (typeof value === "string" && typeof schema.maxLength === "number" && value.length > schema.maxLength) {
    issues.push({ path, message: `must have at most ${schema.maxLength} characters` });
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      issues.push({ path, message: `must contain at least ${schema.minItems} item(s)` });
    }
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      issues.push({ path, message: `must contain at most ${schema.maxItems} item(s)` });
    }
    if (schema.items && typeof schema.items === "object") {
      value.forEach((item, index) => visit(
        item,
        schema.items as Record<string, unknown>,
        `${path}[${index}]`,
        issues,
        options,
      ));
    }
    return;
  }

  if (!value || typeof value !== "object") return;
  const object = value as Record<string, unknown>;
  const properties = schema.properties && typeof schema.properties === "object"
    ? schema.properties as Record<string, Record<string, unknown>>
    : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === "string")
    : [];
  for (const key of required) {
    if (!Object.hasOwn(object, key)) {
      issues.push({ path: path ? `${path}.${key}` : key, message: "is required" });
    }
  }
  for (const [key, child] of Object.entries(object)) {
    const childPath = path ? `${path}.${key}` : key;
    const childSchema = Object.hasOwn(properties, key) ? properties[key] : undefined;
    if (!childSchema) {
      if (schema.additionalProperties === false) {
        issues.push({ path: childPath, message: "is not an accepted argument" });
      }
      continue;
    }
    visit(child, childSchema, childPath, issues, options);
  }
}

export function validateToolInput(
  input: unknown,
  schema: Record<string, unknown>,
  options: InputValidationOptions = {},
): InputValidationIssue[] {
  const issues: InputValidationIssue[] = [];
  visit(input, schema, "", issues, options);
  return issues;
}
