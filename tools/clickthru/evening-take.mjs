async function showRecordedExplanation(cdp) {
  const { root } = await cdp.send("DOM.getDocument", { depth: 1 });
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: 'section[aria-labelledby="how-it-works-title"]',
  });
  if (!nodeId) throw new Error("Open the explanation before recording it.");
  await cdp.send("DOM.scrollIntoViewIfNeeded", { nodeId });
}

/** Call and await the complete take in one active Browser tool operation. */
export async function recordEveningTake(cdp, baseDirectory) {
  // A Browser session is persistent: use the current helper code for each new take.
  const { startLiveCapture, clickRecordedControl } = await import(
    new URL(`./live-capture.mjs?take=${Date.now()}`, import.meta.url).href
  );
  const capture = await startLiveCapture(cdp, baseDirectory);
  const hold = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const click = async (label, site = "shell", pause = 1800) => {
    await clickRecordedControl(cdp, label, site);
    await hold(pause);
  };
  try {
    capture.mark("A simple night out.");
    await hold(1600);
    await click("Row F, seat 6, €13", "LUNA Cinema", 900);
    await click("Row F, seat 7, €13", "LUNA Cinema", 2600);
    capture.mark("Working websites. Different people.");
    await click("02 Dinner", "shell", 2200);
    await click("18:30", "OLIVA Restaurant", 3400);
    capture.mark("What works for you?");
    await hold(5400);
    await click("01 Cinema", "shell", 4800);
    capture.mark("Ask for a better fit.");
    await hold(4000);
    await click("Make it easier", "shell", 6500);
    capture.mark("Same cinema. Easier choices.");
    await hold(1500);
    await click("Original", "shell", 1800);
    await click("My view", "shell", 1800);
    await click("Review selection", "LUNA Cinema", 2700);
    await click("Confirm demo tickets", "LUNA Cinema", 3000);
    capture.mark("Dinner, before any changes.");
    await click("Continue to dinner", "shell", 10000);
    capture.mark("My preferences. Another website.");
    await hold(1800);
    await click("Use my preferences here", "shell", 5400);
    await click("Original", "shell", 1700);
    await click("My view", "shell", 1800);
    await click("Review selection", "OLIVA Restaurant", 2200);
    await click("Confirm demo table", "OLIVA Restaurant", 2600);
    capture.mark("Why WebMCP matters.");
    await click("How it works", "shell", 600);
    await showRecordedExplanation(cdp);
    await hold(18000);
    capture.mark("Not just a night out.");
    await click("How it works", "shell", 300);
    await click("01 Cinema", "shell", 800);
    await click("Larger text", "shell", 3800);
    await click("Larger text", "shell", 4200);
    capture.mark("Your needs. Your preferences. Your web.");
    await click("How it works", "shell", 500);
    await showRecordedExplanation(cdp);
    await hold(4700);
    await click("How it works", "shell", 300);
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: 400,
      y: 300,
      deltaX: 0,
      deltaY: -2000,
    });
    await hold(5200);
  } catch (error) {
    capture.failure = error.message;
    throw error;
  } finally {
    await capture.stop();
  }
  return {
    directory: capture.directory,
    frames: capture.frames.length,
    seconds: (Date.now() - capture.started) / 1000,
    events: capture.events,
  };
}
