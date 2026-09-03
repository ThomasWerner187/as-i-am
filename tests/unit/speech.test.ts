import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeechController, speech } from "../../src/engine/speech";
import { dispatchTool } from "../../src/adaptive-contract/tools";

class TestUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = "";
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function voice(name: string, localService: boolean, lang = "en-GB", isDefault = false) {
  return { name, localService, lang, default: isDefault } as SpeechSynthesisVoice;
}

function synthesizer(voices: SpeechSynthesisVoice[]) {
  const mock = {
    getVoices: vi.fn(() => voices),
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: mock });
  return mock;
}

beforeEach(() => {
  window.history.replaceState({}, "", "/shop");
  vi.stubGlobal("SpeechSynthesisUtterance", TestUtterance);
});

afterEach(() => {
  speech.stop();
  Reflect.deleteProperty(window, "speechSynthesis");
  vi.unstubAllGlobals();
});

describe("local-only speech", () => {
  it("pins a local voice for every chunk even when the default voice is remote", () => {
    const local = voice("Local English", true);
    const mock = synthesizer([voice("Remote default", false, "en-GB", true), local]);
    const controller = new SpeechController();
    expect(controller.speak("First sentence. Second sentence.")).toEqual({
      state: "requested", local_only: true, voice: "Local English",
    });
    const first = mock.speak.mock.calls[0][0] as TestUtterance;
    expect(first.voice).toBe(local);
    expect(first.lang).toBe("en-GB");
    first.onend?.();
    expect(mock.speak).toHaveBeenCalledTimes(2);
    expect((mock.speak.mock.calls[1][0] as TestUtterance).voice).toBe(local);
  });

  it.each([{ voices: [] }, { voices: [voice("Remote only", false)] }])("returns text immediately when there is no available local voice (%j)", ({ voices }) => {
    const mock = synthesizer(voices);
    const controller = new SpeechController();
    expect(controller.speak("Private page content.")).toEqual({
      state: "text_only", local_only: true, reason: "no_local_voice",
    });
    expect(controller.snapshot().status).toBe("idle");
    expect(mock.speak).not.toHaveBeenCalled();
  });

  it("preserves pause/resume and ignores cancelled callbacks after stop", () => {
    const mock = synthesizer([voice("Local English", true)]);
    const controller = new SpeechController();
    controller.speak("First sentence. Second sentence.");
    const first = mock.speak.mock.calls[0][0] as TestUtterance;
    controller.pause();
    expect(controller.snapshot().status).toBe("paused");
    expect(mock.pause).toHaveBeenCalledOnce();
    controller.resume();
    expect(controller.snapshot().status).toBe("speaking");
    expect(mock.resume).toHaveBeenCalledOnce();
    controller.stop();
    first.onend?.();
    expect(mock.speak).toHaveBeenCalledOnce();
    expect(mock.cancel).toHaveBeenCalled();
    expect(controller.snapshot().status).toBe("idle");
  });

  it("returns a truthful text-only result through both speaking tools", async () => {
    const mock = synthesizer([voice("Remote only", false)]);
    const content = JSON.parse(await dispatchTool("read_content", { scope: "page", speak: true }));
    const comparison = JSON.parse(await dispatchTool("read_comparison", {
      product_ids: ["aurora-anc", "northline-q2"], speak: true,
    }));
    for (const result of [content, comparison]) {
      expect(result.ok).toBe(true);
      expect(result.text.length).toBeGreaterThan(20);
      expect(result.speech).toMatchObject({
        state: "text_only", reason: "no_local_voice", local_only: true, text_alternative: true,
      });
    }
    expect(mock.speak).not.toHaveBeenCalled();
  });
});
