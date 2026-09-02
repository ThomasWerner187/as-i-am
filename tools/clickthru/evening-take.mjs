import { startLiveCapture, clickRecordedControl } from "./live-capture.mjs";

/** Call and await the complete take in one active Browser tool operation. */
export async function recordEveningTake(cdp, baseDirectory) {
  const capture = await startLiveCapture(cdp, baseDirectory);
  const hold = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const click = async (label, site = "shell", pause = 1800) => {
    await clickRecordedControl(cdp, label, site);
    await hold(pause);
  };
  try {
    capture.mark("Two tickets. Dinner.");
    await hold(7500);
    await click("Make it easier", "shell", 6000);
    capture.mark("Bigger targets. Clear choices.");
    await click("Row F · Seats 6 + 7", "LUNA Cinema", 3000);
    await click("Original", "shell", 2200);
    await click("My view", "shell", 2000);
    capture.mark("You keep the final say.");
    await click("Review selection", "LUNA Cinema", 3000);
    await click("Confirm demo tickets", "LUNA Cinema", 3000);
    capture.mark("Same preferences. Another website.");
    await click("Use my preferences at dinner", "shell", 5000);
    await click("18:30 · Table for two", "OLIVA Restaurant", 2500);
    await click("Review selection", "OLIVA Restaurant", 2000);
    await click("Confirm demo table", "OLIVA Restaurant", 2500);
    capture.mark("The WebMCP contract.");
    await click("How it works", "shell", 4000);
    await click("Shared with OLIVA", "shell", 6500);
    await click("Shared with OLIVA", "shell", 400);
    await click("How it works", "shell", 400);
    await click("01 Cinema", "shell", 800);
    capture.mark("The web adapts. You don’t have to.");
    await hold(6000);
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
