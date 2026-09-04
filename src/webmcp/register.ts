/**
 * Shared WebMCP registration lifecycle for each participating site.
 * Types come from webmcp.d.ts (ambient). The imperative API is available
 * in Chrome 149+ behind chrome://flags/#enable-webmcp-testing. Everything
 * else on the page uses the shared handlers in adaptive-contract/tools.ts.
 */

import type { ToolDef } from "../adaptive-contract/tools";

export function webmcpAvailable(): boolean {
  return typeof document !== "undefined" && !!document.modelContext;
}

export interface RegistrationOutcome {
  available: boolean;
  registered: number;
  failed: string[];
}

/** Register every tool; aborting the controller unregisters them all. */
export async function registerTools(
  defs: ToolDef[],
  execute: (name: string, args: Record<string, unknown>) => Promise<string> | string,
  exposedTo?: string[],
  registrationController?: AbortController,
): Promise<{ controller: AbortController } & RegistrationOutcome> {
  const controller = registrationController ?? new AbortController();
  const outcome: RegistrationOutcome = { available: webmcpAvailable(), registered: 0, failed: [] };
  const mc = typeof document !== "undefined" ? document.modelContext : undefined;
  if (!mc) return { controller, ...outcome };

  for (const def of defs) {
    if (controller.signal.aborted) break;
    try {
      await mc.registerTool(
        {
          name: def.name,
          description: def.description,
          inputSchema: def.inputSchema,
          ...(def.annotations ? { annotations: def.annotations } : {}),
          execute: (input) => execute(def.name, (input ?? {}) as Record<string, unknown>),
        },
        { signal: controller.signal, ...(exposedTo?.length ? { exposedTo } : {}) },
      );
      outcome.registered += 1;
    } catch (e) {
      outcome.failed.push(def.name);
      console.error(`WebMCP: failed to register ${def.name}`, e);
    }
  }
  return { controller, ...outcome };
}
