async function showRecordedSection(cdp, selector, site = "shell") {
  const { root } = await cdp.send("DOM.getDocument", {
    depth: -1,
    pierce: true,
  });
  let documentId = site === "shell" ? root.nodeId : null;
  function visit(node) {
    const pairs = (node.attributes ?? []).reduce(
      (items, value, index, all) =>
        index % 2 ? items : [...items, [value, all[index + 1]]],
      [],
    );
    if (node.contentDocument && Object.fromEntries(pairs).title === site)
      documentId = node.contentDocument.nodeId;
    for (const child of node.children ?? []) visit(child);
  }
  if (!documentId) visit(root);
  if (!documentId) throw new Error(`Missing visible document: ${site}`);
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: documentId,
    selector,
  });
  if (!nodeId) throw new Error(`Missing visible section: ${selector}`);
  await cdp.send("DOM.scrollIntoViewIfNeeded", { nodeId });
}

/** Call and await the complete take in one active Browser tool operation. */
export async function recordEveningTake(cdp, baseDirectory) {
  const { startLiveCapture, clickRecordedControl } = await import(
    new URL(`./live-capture.mjs?take=${Date.now()}`, import.meta.url).href
  );
  const capture = await startLiveCapture(cdp, baseDirectory);
  const hold = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const click = async (label, site = "shell", pause = 1700) => {
    await clickRecordedControl(cdp, label, site);
    await hold(pause);
  };
  try {
    capture.mark("A night out, on my terms.");
    await hold(1700);
    await click("Row F, seat 6, €13", "LUNA Cinema", 900);
    await click("Row F, seat 7, €13", "LUNA Cinema", 3000);
    capture.mark("Help me choose.");
    await click("Make it easier", "shell", 3000);
    await click("Original", "shell", 1500);
    await click("My view", "shell", 3000);
    capture.mark("My ticket, my decision.");
    await click("Review selection", "LUNA Cinema", 4000);
    await click("Confirm demo tickets", "LUNA Cinema", 3600);
    capture.mark("Prepare for me.");
    await click("Prepare for me", "shell", 1700);
    await click("Plan dinner from my tickets", "shell", 2400);
    await showRecordedSection(cdp, ".evening-plan");
    await hold(3500);
    capture.mark("A plan I can check.");
    await hold(11000);
    capture.mark("Food preferences I choose.");
    await showRecordedSection(cdp, ".menu-preferences", "OLIVA Restaurant");
    await hold(4000);
    await showRecordedSection(
      cdp,
      '[data-testid="menu-dish-tomato-orzo"]',
      "OLIVA Restaurant",
    );
    await hold(7000);
    capture.mark("My choices, my view.");
    await click("Full menu", "OLIVA Restaurant", 1700);
    await click("My choices", "OLIVA Restaurant", 1600);
    await click("Review suggested table", "shell", 2300);
    await click("Confirm demo table", "OLIVA Restaurant", 2600);
    capture.mark("Only what each task needs.");
    await click("How it works", "shell", 500);
    await showRecordedSection(cdp, ".shared-receipt");
    await hold(10500);
    capture.mark("Why WebMCP matters.");
    await showRecordedSection(
      cdp,
      'section[aria-labelledby="how-it-works-title"]',
    );
    await hold(12500);
    capture.mark("The web adapts.");
    await click("How it works", "shell", 500);
    await click("01 Cinema", "shell", 500);
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: 400,
      y: 300,
      deltaX: 0,
      deltaY: -20000,
    });
    await hold(8500);
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
