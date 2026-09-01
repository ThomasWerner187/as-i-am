/** WebMCP imperative API surface (Chrome 149+, chrome://flags/#enable-webmcp-testing). */

interface WebMCPToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  untrustedContentHint?: boolean;
}

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: WebMCPToolAnnotations;
  execute: (input: Record<string, unknown>, context?: { signal?: AbortSignal }) => string | Promise<string>;
}

interface ModelContext {
  registerTool(tool: WebMCPTool, options?: { signal?: AbortSignal; exposedTo?: string[] }): Promise<void> | void;
  getTools?(): Promise<unknown[]>;
  executeTool?(tool: unknown, input: string, options?: { signal?: AbortSignal }): Promise<unknown>;
}

interface Document {
  readonly modelContext?: ModelContext;
}
