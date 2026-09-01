import { beforeEach, describe, expect, it } from "vitest";
import { collectMeasurements } from "../../src/adaptive-contract/measurements";

function rect(width: number, height: number, left = 20, top = 20): DOMRect {
  return DOMRect.fromRect({ width, height, x: left, y: top });
}

describe("rendered measurement boundaries", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(document.documentElement, "clientWidth", { value: 900, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 700, configurable: true });
  });

  it("uses an associated label as the effective checkbox target and excludes judge chrome", () => {
    document.body.innerHTML = `
      <main id="main">
        <label id="choice-label"><input id="choice" type="checkbox"> Compare</label>
        <button id="page-action">Continue</button>
        <div data-aia-demo-chrome><button id="judge-action">Judge control</button></div>
      </main>
    `;
    const label = document.querySelector<HTMLElement>("#choice-label")!;
    const input = document.querySelector<HTMLElement>("#choice")!;
    const pageAction = document.querySelector<HTMLElement>("#page-action")!;
    const judgeAction = document.querySelector<HTMLElement>("#judge-action")!;
    label.getBoundingClientRect = () => rect(160, 52);
    input.getBoundingClientRect = () => rect(16, 16, 24, 38);
    pageAction.getBoundingClientRect = () => rect(120, 60, 220, 20);
    judgeAction.getBoundingClientRect = () => rect(8, 8, 400, 20);

    const measured = collectMeasurements();
    expect(measured.smallest_target_px).toBe(52);
    expect(measured.samples?.targets).toBe(2);
  });

  it("looks through excluded demo chrome but reports a real occluder", () => {
    document.body.innerHTML = `
      <main id="main">
        <button id="target">Continue</button>
        <div id="judge" data-aia-measure="exclude"></div>
        <div id="real-overlay"></div>
      </main>
    `;
    const target = document.querySelector<HTMLElement>("#target")!;
    const judge = document.querySelector<HTMLElement>("#judge")!;
    const realOverlay = document.querySelector<HTMLElement>("#real-overlay")!;
    target.getBoundingClientRect = () => rect(100, 52, 100, 100);
    judge.getBoundingClientRect = () => rect(100, 52, 100, 100);
    realOverlay.getBoundingClientRect = () => rect(100, 52, 100, 100);

    Object.defineProperty(document, "elementFromPoint", {
      value: () => judge,
      configurable: true,
    });
    Object.defineProperty(document, "elementsFromPoint", {
      value: () => [judge, target],
      configurable: true,
    });
    expect(collectMeasurements().occluded_focusables).toBe(0);

    Object.defineProperty(document, "elementsFromPoint", {
      value: () => [realOverlay],
      configurable: true,
    });
    expect(collectMeasurements().occluded_focusables).toBe(1);
  });
});
