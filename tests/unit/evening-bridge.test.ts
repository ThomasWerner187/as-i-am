import { afterEach, describe, expect, it, vi } from "vitest";
import { createFrameClient } from "../../src/evening/bridge";

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function fixture() {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const post = vi.spyOn(frame.contentWindow!, "postMessage");
  return { frame, post, origin: "http://localhost:5274" };
}

describe("evening transport boundary", () => {
  it("discovers the exact native origin and window, then executes serialized arguments", async () => {
    const { frame, post, origin } = fixture();
    const target = {
      name: "get_adaptation_state",
      origin,
      window: frame.contentWindow!,
    };
    const getTools = vi
      .fn()
      .mockResolvedValue([
        { ...target, origin: "https://untrusted.example" },
        { ...target, window },
        target,
      ]);
    const executeTool = vi
      .fn()
      .mockResolvedValue('{"ok":true,"active_parameter_count":0}');
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: vi.fn(), getTools, executeTool },
    });
    const result = await createFrameClient(frame, origin).invoke(target.name);
    expect(getTools).toHaveBeenCalledWith({ fromOrigins: [origin] });
    expect(executeTool).toHaveBeenCalledWith(target, "{}");
    expect(result.transport).toBe("native");
    expect(post).not.toHaveBeenCalled();
  });

  it("never downgrades a native discovery or execution failure", async () => {
    const { frame, post, origin } = fixture();
    const getTools = vi
      .fn()
      .mockResolvedValue([{ name: "get_adaptation_state" }]);
    const executeTool = vi
      .fn()
      .mockRejectedValue(new Error("Native request denied"));
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: vi.fn(), getTools, executeTool },
    });
    await expect(
      createFrameClient(frame, origin).invoke("get_adaptation_state"),
    ).rejects.toThrow("Waiting for");
    getTools.mockResolvedValue([
      { name: "get_adaptation_state", origin, window: frame.contentWindow },
    ]);
    await expect(
      createFrameClient(frame, origin).invoke("get_adaptation_state"),
    ).rejects.toThrow("Native request denied");
    expect(post).not.toHaveBeenCalled();
  });

  it("accepts fallback responses only from the expected frame, origin and request", async () => {
    const { frame, post, origin } = fixture();
    const pending = createFrameClient(frame, origin, false).invoke(
      "get_adaptation_state",
    );
    const request = post.mock.calls[0][0] as { id: string };
    expect(post.mock.calls[0][1]).toBe(origin);
    const data = {
      channel: "as-i-am-result",
      id: request.id,
      result: { ok: true, marker: "trusted" },
    };
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { ...data, result: { marker: "bad-origin" } },
        source: frame.contentWindow,
        origin: "https://untrusted.example",
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { ...data, result: { marker: "bad-source" } },
        source: window,
        origin,
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          ...data,
          id: "different-request",
          result: { marker: "bad-id" },
        },
        source: frame.contentWindow,
        origin,
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data,
        source: frame.contentWindow,
        origin,
      }),
    );
    expect(await pending).toEqual({
      result: { ok: true, marker: "trusted" },
      transport: "fallback",
    });
  });
});
