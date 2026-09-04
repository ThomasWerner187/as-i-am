import { dispatchTool, toolsForEvening } from "../adaptive-contract/tools";
import { engine } from "../engine/adaptationEngine";
import { waitForRenderedCommit } from "../adaptive-contract/measurements";
import { AGENT_ORIGIN } from "./config";
import type { EveningSite } from "./state";

/** Local fallback only. Source AND origin are checked; no arbitrary RPC or confirmation. */
export function connectDemoBridge(site: EveningSite) {
  if (window.parent === window) return () => {};
  const allowed = new Set(toolsForEvening(site).map((tool) => tool.name));
  const listener = async (event: MessageEvent) => {
    if (event.origin !== AGENT_ORIGIN || event.source !== window.parent) return;
    const message = event.data;
    if (
      !message ||
      message.channel !== "as-i-am-demo" ||
      typeof message.id !== "string"
    )
      return;
    try {
      let result: unknown;
      if (message.name === "preview_original") {
        if (message.args?.enabled === true) engine.startPreviewBase();
        else engine.endPreviewBase();
        await waitForRenderedCommit();
        result = { ok: true };
      } else {
        if (!allowed.has(message.name))
          throw new Error("Tool not exposed by this page.");
        if (
          document.modelContext?.getTools &&
          document.modelContext.executeTool
        )
          throw new Error(
            "Native WebMCP is available. Use the native tool interface.",
          );
        result = JSON.parse(
          await dispatchTool(message.name, message.args, `${site}-booking`),
        );
      }
      window.parent.postMessage(
        { channel: "as-i-am-result", id: message.id, result },
        AGENT_ORIGIN,
      );
    } catch (error) {
      window.parent.postMessage(
        {
          channel: "as-i-am-result",
          id: message.id,
          result: {
            ok: false,
            error: error instanceof Error ? error.message : "Tool failed.",
          },
        },
        AGENT_ORIGIN,
      );
    }
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

export interface FrameClient {
  invoke(
    name: string,
    args?: Record<string, unknown>,
  ): Promise<{ result: Record<string, any>; transport: "native" | "fallback" }>;
}

export function createFrameClient(
  frame: HTMLIFrameElement,
  origin: string,
  nativeEnabled = true,
): FrameClient {
  async function fallback(name: string, args: Record<string, unknown>) {
    return new Promise<Record<string, any>>((resolve, reject) => {
      const id = crypto.randomUUID();
      const cleanup = () => {
        clearTimeout(timer);
        window.removeEventListener("message", listener);
      };
      const listener = (event: MessageEvent) => {
        if (
          event.source !== frame.contentWindow ||
          event.origin !== origin ||
          event.data?.channel !== "as-i-am-result" ||
          event.data.id !== id
        )
          return;
        cleanup();
        resolve(event.data.result);
      };
      const timer = window.setTimeout(() => {
        cleanup();
        reject(
          new Error(
            "The site did not respond. Try again, or reload the experience if the connection has been lost.",
          ),
        );
      }, 8000);
      window.addEventListener("message", listener);
      frame.contentWindow?.postMessage(
        { channel: "as-i-am-demo", id, name, args },
        origin,
      );
    });
  }
  return {
    async invoke(name, args = {}) {
      const mc = document.modelContext;
      if (
        nativeEnabled &&
        name !== "preview_original" &&
        mc?.getTools &&
        mc.executeTool
      ) {
        const options =
          origin === location.origin ? undefined : { fromOrigins: [origin] };
        const tools = await mc.getTools(options);
        const tool = tools.find(
          (item) =>
            item.name === name &&
            item.origin === origin &&
            item.window === frame.contentWindow,
        );
        if (!tool)
          throw new Error(
            `Waiting for ${name} on the current site. Retry when the site is ready.`,
          );
        const raw = await mc.executeTool(tool, JSON.stringify(args));
        if (typeof raw !== "string")
          throw new Error("WebMCP returned no result.");
        return { result: JSON.parse(raw), transport: "native" };
      }
      return { result: await fallback(name, args), transport: "fallback" };
    },
  };
}
