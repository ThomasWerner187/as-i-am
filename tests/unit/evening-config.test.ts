import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("evening deployment URLs", () => {
  it("keeps a production preview entirely on its own origin", async () => {
    vi.stubEnv("DEV", false);
    const { AGENT_ORIGIN, siteUrl } = await import("../../src/evening/config");
    expect(AGENT_ORIGIN).toBe(location.origin);
    expect(siteUrl("cinema")).toBe(`${location.origin}/cinema?embedded=1`);
    expect(siteUrl("restaurant", false)).toBe(`${location.origin}/restaurant`);
  });

  it("uses separate local origins only during development", async () => {
    vi.stubEnv("DEV", true);
    const { AGENT_ORIGIN, siteUrl } = await import("../../src/evening/config");
    expect(new URL(AGENT_ORIGIN).port).toBe("5273");
    expect(new URL(siteUrl("cinema")).port).toBe("5274");
    expect(new URL(siteUrl("restaurant")).port).toBe("5275");
  });

  it("preserves configured query parameters while removing embedded mode from direct links", async () => {
    vi.stubEnv(
      "VITE_CINEMA_URL",
      "https://cinema.example/cinema?lang=en&embedded=1",
    );
    vi.stubEnv("VITE_AGENT_ORIGIN", "https://agent.example");
    const { AGENT_ORIGIN, siteUrl } = await import("../../src/evening/config");
    expect(AGENT_ORIGIN).toBe("https://agent.example");
    expect(siteUrl("cinema", false)).toBe(
      "https://cinema.example/cinema?lang=en",
    );
    expect(new URL(siteUrl("cinema")).searchParams.get("lang")).toBe("en");
  });
});
