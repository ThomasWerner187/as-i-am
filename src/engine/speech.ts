/**
 * Local text-to-speech via voices explicitly marked localService by the browser.
 * Always paired with a visible text alternative — speech is optional.
 * Autoplay rules respected: speech only starts from user/agent action.
 */

export interface SpeechState {
  status: "idle" | "speaking" | "paused";
  rate: number;
}

export interface SpeechRequestResult {
  state: "requested" | "text_only";
  local_only: true;
  reason?: "unsupported" | "no_local_voice" | "empty_text" | "speech_unavailable";
  voice?: string;
}

type SpeechListener = (state: SpeechState) => void;

export class SpeechController {
  private listeners = new Set<SpeechListener>();
  private queue: string[] = [];
  private status: SpeechState["status"] = "idle";
  private rate = 1;
  private current: SpeechSynthesisUtterance | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  subscribe(listener: SpeechListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): SpeechState {
    return { status: this.status, rate: this.rate };
  }

  private emit(): void {
    for (const l of this.listeners) l(this.snapshot());
  }

  supported(): boolean {
    return typeof window !== "undefined"
      && typeof SpeechSynthesisUtterance !== "undefined"
      && typeof window.speechSynthesis?.getVoices === "function"
      && typeof window.speechSynthesis.speak === "function"
      && typeof window.speechSynthesis.cancel === "function";
  }

  setRate(rate: number): void {
    this.rate = Math.min(2, Math.max(0.5, rate));
    this.emit();
  }

  speak(text: string, opts?: { rate?: number }): SpeechRequestResult {
    this.stop();
    if (!this.supported()) return { state: "text_only", local_only: true, reason: "unsupported" };
    // Never hand text to a browser-default or remote service. An empty voice
    // list is answered immediately; the person can retry once voices load.
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.localService === true);
    const language = document.documentElement.lang || "en";
    this.voice = voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase())
      ?? voices.find((voice) => voice.lang.split("-")[0] === language.split("-")[0])
      ?? voices.find((voice) => voice.default)
      ?? voices[0]
      ?? null;
    if (!this.voice) return { state: "text_only", local_only: true, reason: "no_local_voice" };
    if (opts?.rate) this.setRate(opts.rate);
    // Chunk long text at sentence boundaries for reliable pause/resume.
    const chunks = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (chunks.length === 0) return { state: "text_only", local_only: true, reason: "empty_text" };
    this.queue = chunks;
    this.status = "speaking";
    this.emit();
    try {
      const voice = this.voice.name;
      this.speakNext();
      return { state: "requested", local_only: true, voice };
    } catch {
      this.stop();
      return { state: "text_only", local_only: true, reason: "speech_unavailable" };
    }
  }

  private speakNext(): void {
    const next = this.queue.shift();
    if (!next || !this.voice) {
      this.current = null;
      this.status = "idle";
      this.emit();
      return;
    }
    const u = new SpeechSynthesisUtterance(next);
    u.voice = this.voice;
    u.lang = this.voice.lang;
    u.rate = this.rate;
    u.onend = () => {
      if (this.current === u) this.speakNext();
    };
    u.onerror = () => {
      if (this.current !== u) return;
      this.current = null;
      this.queue = [];
      this.status = "idle";
      this.emit();
    };
    this.current = u;
    window.speechSynthesis.speak(u);
  }

  pause(): void {
    if (!this.supported() || this.status !== "speaking") return;
    window.speechSynthesis.pause();
    this.status = "paused";
    this.emit();
  }

  resume(): void {
    if (!this.supported() || this.status !== "paused") return;
    window.speechSynthesis.resume();
    this.status = "speaking";
    this.emit();
  }

  stop(): void {
    this.queue = [];
    this.current = null;
    this.voice = null;
    this.status = "idle";
    if (typeof window !== "undefined" && typeof window.speechSynthesis?.cancel === "function") {
      window.speechSynthesis.cancel();
    }
    this.emit();
  }
}

export const speech = new SpeechController();
