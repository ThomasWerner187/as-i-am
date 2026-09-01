/**
 * Local text-to-speech via the Web Speech API. Fully local, no network.
 * Always paired with a visible text alternative — speech is optional.
 * Autoplay rules respected: speech only starts from user/agent action.
 */

export interface SpeechState {
  status: "idle" | "speaking" | "paused";
  rate: number;
}

type SpeechListener = (state: SpeechState) => void;

export class SpeechController {
  private listeners = new Set<SpeechListener>();
  private queue: string[] = [];
  private status: SpeechState["status"] = "idle";
  private rate = 1;
  private current: SpeechSynthesisUtterance | null = null;

  subscribe(listener: SpeechListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot(): SpeechState {
    return { status: this.status, rate: this.rate };
  }

  private emit(): void {
    for (const l of this.listeners) l(this.snapshot());
  }

  supported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  setRate(rate: number): void {
    this.rate = Math.min(2, Math.max(0.5, rate));
    this.emit();
  }

  speak(text: string, opts?: { rate?: number }): void {
    if (!this.supported()) return;
    this.stop();
    if (opts?.rate) this.setRate(opts.rate);
    // Chunk long text at sentence boundaries for reliable pause/resume.
    const chunks = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    this.queue = chunks;
    this.status = "speaking";
    this.emit();
    this.speakNext();
  }

  private speakNext(): void {
    const next = this.queue.shift();
    if (!next) {
      this.status = "idle";
      this.emit();
      return;
    }
    const u = new SpeechSynthesisUtterance(next);
    u.rate = this.rate;
    u.onend = () => this.speakNext();
    u.onerror = () => {
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
    if (!this.supported()) return;
    window.speechSynthesis.cancel();
    this.queue = [];
    this.current = null;
    this.status = "idle";
    this.emit();
  }
}

export const speech = new SpeechController();
