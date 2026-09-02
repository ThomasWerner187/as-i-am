import { useEffect, useRef, useState } from "react";
import { createFrameClient } from "./bridge";
import { SITE_NAMES, siteUrl } from "./config";
import type { EveningSite } from "./state";
import type { AdaptationReceipt } from "../adaptive-contract/schema";

interface Trace {
  name: string;
  site: EveningSite;
  transport: string;
  ok: boolean;
  args: Record<string, unknown>;
  result: Record<string, any>;
}
const SITES: EveningSite[] = ["cinema", "restaurant"];
const DEMO_PROFILE = {
  version: "0.1",
  interaction: {
    minimum_target_size: 56,
    target_spacing: 12,
    focus_strength: "strong",
  },
  cognitive: { step_by_step: true, hide_nonessential: true },
  motion_media: { reduce_motion: true },
};
const AGENT_PROMPT =
  "Help me plan a cinema-and-dinner evening on this page. First discover the current site's WebMCP capabilities. I want larger click targets, one step at a time, and less visual clutter. Apply only supported functional preferences, measure the rendered result, and correct any unmet requests. Show me available adjacent seat pairs and let me choose. Never confirm a booking for me. With my permission, carry only my functional adaptation receipt to the restaurant, discover its capabilities, and apply what it supports. Do not send personal reasons, identity, or cinema selections to the restaurant.";

export default function EveningShell() {
  const [site, setSite] = useState<EveningSite>("cinema");
  const [ready, setReady] = useState({ cinema: false, restaurant: false });
  const [native, setNative] = useState({ cinema: false, restaurant: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adapted, setAdapted] = useState({ cinema: false, restaurant: false });
  const [preview, setPreview] = useState(false);
  const [trace, setTrace] = useState<Trace[]>([]);
  const [proofOpen, setProofOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const [before, setBefore] = useState<Record<string, any>>({});
  const [after, setAfter] = useState<Record<string, any>>({});
  const [receipt, setReceipt] = useState<AdaptationReceipt>();
  const [textScale, setTextScale] = useState({ cinema: 1, restaurant: 1 });
  const [frameHeight, setFrameHeight] = useState({
    cinema: 550,
    restaurant: 550,
  });
  const frames = useRef<Partial<Record<EveningSite, HTMLIFrameElement>>>({});
  const state = useRef({ site, ready, busy, preview });
  state.current = { site, ready, busy, preview };
  const crossOrigin =
    new Set([
      location.origin,
      ...SITES.map((value) => new URL(siteUrl(value)).origin),
    ]).size === 3;

  useEffect(() => {
    document.documentElement.dataset.evening = "shell";
    document.title = "As I Am — The web adapts. You don’t have to.";
    const listener = (event: MessageEvent) => {
      const from = SITES.find(
        (value) =>
          event.source === frames.current[value]?.contentWindow &&
          event.origin === new URL(siteUrl(value)).origin,
      );
      if (!from) return;
      if (
        event.data?.channel === "as-i-am-size" &&
        Number.isFinite(event.data.height)
      ) {
        setFrameHeight((current) => ({
          ...current,
          [from]: Math.max(550, Math.min(4000, event.data.height)),
        }));
        return;
      }
      if (event.data?.channel === "as-i-am-state") {
        setAdapted((current) => ({
          ...current,
          [from]: event.data.adapted === true,
        }));
        if (from === state.current.site)
          setPreview(event.data.preview === true);
        if (
          event.data.preview !== true &&
          Number.isFinite(event.data.textScale)
        ) {
          setTextScale((current) => ({
            ...current,
            [from]: Math.max(1, Math.min(2.2, event.data.textScale)),
          }));
        }
        return;
      }
      if (event.data?.channel !== "as-i-am-ready") return;
      setReady((current) => ({ ...current, [from]: true }));
      setNative((current) => ({
        ...current,
        [from]: event.data.native === true,
      }));
    };
    window.addEventListener("message", listener);
    const timer = window.setTimeout(() => {
      if (!state.current.ready.cinema || !state.current.ready.restaurant)
        setError(
          "The example sites are not connected yet. Start all three servers with npm run dev:experience, then reload this page.",
        );
    }, 14000);
    const controller = new AbortController();
    const mc = document.modelContext;
    if (mc) {
      const register = async () => {
        await mc.registerTool(
          {
            name: "get_evening_context",
            description:
              "Read the two participating sites, active site, and truthful demo topology. The embedded sites expose adaptation and booking tools. The guided demo uses preset requests; an external agent should discover and call the page tools itself.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: () =>
              JSON.stringify({
                ok: true,
                current_site: state.current.site,
                sites: SITES.map((value) => ({
                  id: value,
                  name: SITE_NAMES[value],
                  url: siteUrl(value),
                  ready: state.current.ready[value],
                })),
                cross_origin: crossOrigin,
                user_confirmation:
                  "Required for bookings and preference transfer. No identity or booking details in adaptation receipts.",
              }),
          },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        await mc.registerTool(
          {
            name: "open_evening_site",
            description:
              "Show cinema or restaurant in the experience. This only switches visible sites. It does NOT share preferences, book anything, or transfer data. Discover the destination tools again after switching.",
            inputSchema: {
              type: "object",
              properties: { site: { type: "string", enum: SITES } },
              required: ["site"],
              additionalProperties: false,
            },
            execute: async (input) => {
              if (
                !SITES.includes(input.site as EveningSite) ||
                Object.keys(input).some((key) => key !== "site")
              )
                return JSON.stringify({
                  ok: false,
                  error: "Choose cinema or restaurant.",
                });
              if (state.current.busy)
                return JSON.stringify({
                  ok: false,
                  error:
                    "A demo operation is running. Try again when it completes.",
                });
              const current = state.current.site;
              if (state.current.preview && frames.current[current]) {
                await createFrameClient(
                  frames.current[current]!,
                  new URL(siteUrl(current)).origin,
                ).invoke("preview_original", { enabled: false });
              }
              setPreview(false);
              setBefore({});
              setAfter({});
              setStatus("");
              setSite(input.site as EveningSite);
              return JSON.stringify({
                ok: true,
                site: input.site,
                preferences_transferred: false,
              });
            },
          },
          { signal: controller.signal },
        );
      };
      void register().catch(() => {});
    }
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("message", listener);
      delete document.documentElement.dataset.evening;
    };
  }, [crossOrigin]);

  async function call(
    target: EveningSite,
    name: string,
    args: Record<string, unknown> = {},
  ) {
    const frame = frames.current[target];
    if (!frame) throw new Error("The example site is not ready.");
    const { result, transport } = await createFrameClient(
      frame,
      new URL(siteUrl(target)).origin,
      native[target],
    ).invoke(name, args);
    setTrace((current) =>
      [
        ...current,
        {
          name,
          site: target,
          transport,
          ok: result.ok !== false,
          args,
          result,
        },
      ].slice(-30),
    );
    if (result.ok === false)
      throw new Error(
        result.error || "The site could not complete this request.",
      );
    return result;
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The request could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function stopPreview() {
    if (!preview) return;
    const frame = frames.current[site];
    if (frame)
      await createFrameClient(frame, new URL(siteUrl(site)).origin).invoke(
        "preview_original",
        { enabled: false },
      );
    setPreview(false);
  }
  function describeFit(result: Record<string, any>) {
    const fit = result.fit ?? result.verification;
    return fit?.overall === "satisfied"
      ? "Requested fit verified. Your choice stays yours."
      : "Adapted. Some requests still need attention—see the actual tool results.";
  }
  async function apply() {
    await stopPreview();
    setStatus("Checking what this site supports…");
    const baseline = await call(site, "measure_rendered_ui");
    setBefore(baseline.measurements);
    const caps = await call(site, "get_adaptation_capabilities");
    const supported = new Set(
      caps.capabilities.map((capability: { key: string }) => capability.key),
    );
    const profile: Record<string, unknown> = { version: "0.1" };
    for (const [domain, fields] of Object.entries(DEMO_PROFILE)) {
      if (typeof fields !== "object") continue;
      profile[domain] = Object.fromEntries(
        Object.entries(fields).filter(([key]) =>
          supported.has(`${domain}.${key}`),
        ),
      );
    }
    await call(site, "apply_adaptation_profile", { profile });
    await call(
      site,
      site === "cinema"
        ? "get_available_seat_pairs"
        : "get_available_table_times",
    );
    const fit = await call(site, "verify_profile_fit");
    setAfter(fit.measurements);
    setAdapted((current) => ({ ...current, [site]: true }));
    setStatus(describeFit(fit));
  }
  async function carry() {
    await stopPreview();
    setStatus("Carrying only your functional preferences to OLIVA…");
    const exported = await call("cinema", "export_adaptation_receipt");
    setReceipt(exported.receipt);
    setSite("restaurant");
    // The receiving document has its own engine; no shared React state or CSS.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const baseline = await call("restaurant", "measure_rendered_ui");
    setBefore(baseline.measurements);
    await call("restaurant", "get_adaptation_capabilities");
    const imported = await call("restaurant", "import_adaptation_receipt", {
      receipt: exported.receipt,
    });
    const fit = await call("restaurant", "verify_profile_fit");
    await call("restaurant", "get_available_table_times");
    setAfter(fit.measurements);
    setAdapted((current) => ({ ...current, restaurant: true }));
    setStatus(
      `${imported.accepted_preference_count} preferences accepted by OLIVA. ${imported.unsupported_preferences.length ? `${imported.unsupported_preferences.length} not supported here—see the receipt.` : "Nothing to explain twice."}`,
    );
  }
  async function refine() {
    await stopPreview();
    const current = await call(site, "get_adaptation_state");
    const scale = Math.min(
      2.2,
      Math.round(
        (Number(current.active_preferences.visual?.text_scale ?? 1) + 0.2) * 10,
      ) / 10,
    );
    await call(site, "tune_visual_presentation", { text_scale: scale });
    const fit = await call(site, "verify_profile_fit");
    setTextScale((current) => ({ ...current, [site]: scale }));
    setAfter(fit.measurements);
    setStatus(describeFit(fit));
  }
  async function switchSite(next: EveningSite) {
    await stopPreview();
    setSite(next);
    setBefore({});
    setAfter({});
    setStatus("");
  }
  const hasFit = adapted[site];
  const transport = ready[site]
    ? native[site] && document.modelContext?.executeTool
      ? "Native WebMCP ready"
      : "Fallback demo · no native WebMCP"
    : "Connecting the example sites";

  return (
    <div className="evening-shell">
      <header className="experience-top">
        <span className="aia-wordmark">
          As I Am<span aria-hidden="true">.</span>
        </span>
        <div className="experience-links">
          <span className="connection-status">{transport}</span>
          <button onClick={() => setAgentOpen(!agentOpen)}>
            Use your agent ↗
          </button>
        </div>
      </header>
      <section className="experience-intro" aria-labelledby="experience-title">
        <h1 id="experience-title">
          The web adapts.
          <br />
          <em>You don’t have to.</em>
        </h1>
        <p>
          One evening. Two websites. Tell your agent how you like things—then
          keep being you.
        </p>
      </section>
      {agentOpen && (
        <section className="agent-details">
          <h2>Bring your own agent.</h2>
          <p>
            Open this page in a WebMCP-enabled browser and give your agent this
            request. The buttons below are a guided demonstration with preset
            requests, not an embedded language model.
          </p>
          <pre>{AGENT_PROMPT}</pre>
          <button
            className="shell-primary"
            onClick={() => {
              void navigator.clipboard
                .writeText(AGENT_PROMPT)
                .then(() => setCopied(true))
                .catch(() => setError("Select and copy the request above."));
            }}
          >
            {copied ? "Copied" : "Copy agent request"}
          </button>
          <p>
            If your browser does not expose tools inside frames, open each site
            directly and use its native tools:{" "}
            <a
              href={siteUrl("cinema").replace("?embedded=1", "")}
              target="_blank"
              rel="noreferrer"
            >
              LUNA Cinema
            </a>{" "}
            ·{" "}
            <a
              href={siteUrl("restaurant").replace("?embedded=1", "")}
              target="_blank"
              rel="noreferrer"
            >
              OLIVA Restaurant
            </a>
          </p>
        </section>
      )}
      <main className="experience-stage" aria-label="One evening, two websites">
        <nav className="journey-tabs" aria-label="Your evening">
          <button
            className="journey-tab"
            aria-pressed={site === "cinema"}
            disabled={busy}
            onClick={() => void perform(() => switchSite("cinema"))}
          >
            <b>01</b> Cinema tickets
          </button>
          <span className="journey-divider" aria-hidden="true">
            →
          </span>
          <button
            className="journey-tab"
            aria-pressed={site === "restaurant"}
            disabled={busy}
            onClick={() => void perform(() => switchSite("restaurant"))}
          >
            <b>02</b> A table before the film
          </button>
        </nav>
        <div className="site-frame">
          <div className="site-address">
            <span className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <strong>
              {new URL(siteUrl(site)).host}/{site}
            </strong>
            <span>
              {hasFit && !preview ? "Adapted for you" : "Original view"}
            </span>
          </div>
          {SITES.map((value) => (
            <iframe
              key={value}
              ref={(element) => {
                if (element) frames.current[value] = element;
              }}
              hidden={site !== value}
              className="site-document"
              style={{ height: frameHeight[value] }}
              title={SITE_NAMES[value]}
              src={siteUrl(value)}
              allow="tools"
            />
          ))}
        </div>
        <section className="agent-dock" aria-label="Try a personal adaptation">
          <span className="agent-mark" aria-hidden="true">
            ✳
          </span>
          <div>
            <p className="eyebrow">
              {hasFit
                ? site === "cinema"
                  ? "SAME YOU. NEXT WEBSITE."
                  : "YOUR PREFERENCES ARRIVED."
                : "TRY THIS REQUEST"}
            </p>
            <p className="agent-request">
              {hasFit
                ? site === "cinema"
                  ? "“Now a table before the film. Keep it this easy.”"
                  : "Different website. Already feels like you."
                : site === "cinema"
                  ? "“The tiny seats are hard to click. Show me two seats together.”"
                  : "“Make the choices larger. One step at a time, please.”"}
            </p>
            <small>
              {hasFit && site === "cinema"
                ? "Shares only interface preferences with OLIVA. No seats, identity, or personal reasons."
                : "Guided demo · Real page changes · You make the final choice"}
            </small>
          </div>
          <button
            className="shell-primary"
            disabled={
              busy ||
              !ready[site] ||
              (hasFit && site === "cinema" && !ready.restaurant) ||
              (hasFit && site === "restaurant" && textScale[site] >= 2.2)
            }
            onClick={() =>
              void perform(
                hasFit ? (site === "cinema" ? carry : refine) : apply,
              )
            }
          >
            {busy
              ? "Working on it…"
              : hasFit
                ? site === "cinema"
                  ? "Share preferences with OLIVA →"
                  : textScale[site] >= 2.2
                    ? "Maximum text size reached"
                    : textScale[site] > 1
                      ? "Make text larger again"
                      : "A little larger, please"
                : "Make it work for me →"}
          </button>
        </section>
        <div className="proof-footer">
          <div className="measurement-chips" aria-live="polite">
            {after.smallest_target_px ? (
              <>
                <span>
                  Targets{" "}
                  <b>
                    {before.smallest_target_px
                      ? `${before.smallest_target_px} → `
                      : ""}
                    {after.smallest_target_px}px
                  </b>
                </span>
                <span>
                  {after.horizontal_overflow
                    ? "Layout needs attention"
                    : "No horizontal overflow"}
                </span>
              </>
            ) : (
              <span>Your preferences travel. Your personal reasons don’t.</span>
            )}
          </div>
          <div className="proof-controls">
            {hasFit && (
              <>
                <button
                  className="shell-link"
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      const frame = frames.current[site]!;
                      await createFrameClient(
                        frame,
                        new URL(siteUrl(site)).origin,
                      ).invoke("preview_original", { enabled: !preview });
                      setPreview(!preview);
                    })
                  }
                >
                  {preview ? "Back to my view" : "Compare with original"}
                </button>
                <button
                  className="shell-link"
                  disabled={busy || textScale[site] >= 2.2}
                  onClick={() => void perform(refine)}
                >
                  Larger text
                </button>
                <button
                  className="shell-link"
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      await stopPreview();
                      await call(site, "undo_adaptation");
                      const current = await call(site, "get_adaptation_state");
                      setAdapted((previous) => ({
                        ...previous,
                        [site]: current.active_parameter_count > 0,
                      }));
                      const fit = await call(site, "verify_profile_fit");
                      setAfter(fit.measurements);
                      setStatus(
                        "Last adaptation undone. Your booking selection is unchanged.",
                      );
                    })
                  }
                >
                  Undo
                </button>
              </>
            )}
            <button
              className="shell-link"
              onClick={() => setProofOpen(!proofOpen)}
            >
              Under the hood {trace.length > 0 ? `(${trace.length})` : ""}
            </button>
          </div>
        </div>
        {status && (
          <p className="shell-note" role="status">
            {status}
          </p>
        )}
        {error && (
          <div className="experience-error" role="alert">
            {error}
            <button className="shell-link" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}
      </main>
      {proofOpen && (
        <section className="proof-details">
          <h2>The proof, not the pitch.</h2>
          <p>
            {crossOrigin
              ? "Three separate origins: this demo controller, LUNA, and OLIVA. Each site has its own document and adaptation engine."
              : "Separate documents on the same deployment origin. Configure separate site URLs to demonstrate an origin boundary."}{" "}
            Nothing is stored in cookies or localStorage.
          </p>
          <p>
            Native mode calls discovered tools through document.modelContext.
            Fallback mode uses an origin-checked demo bridge and is explicitly
            labelled. Measurements describe rendered properties, not a complete
            accessibility audit.
          </p>
          <details>
            <summary>Preset preferences for this guided example</summary>
            <pre>{JSON.stringify(DEMO_PROFILE, null, 2)}</pre>
          </details>
          {receipt && (
            <details>
              <summary>Receipt carried to OLIVA</summary>
              <pre>{JSON.stringify(receipt, null, 2)}</pre>
            </details>
          )}
          <ol>
            {trace.map((entry, index) => (
              <li key={index}>
                <details>
                  <summary>
                    <code>{entry.name}</code> ·{" "}
                    {entry.ok ? "completed" : "not completed"} ·{" "}
                    {entry.transport === "native"
                      ? "native WebMCP"
                      : "demo fallback"}
                  </summary>
                  <p className="trace-origin">
                    {SITE_NAMES[entry.site]} ·{" "}
                    {new URL(siteUrl(entry.site)).origin}
                  </p>
                  <pre>
                    {JSON.stringify(
                      { arguments: entry.args, result: entry.result },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className="shell-note">
        A working accessibility contract for participating websites. Cinema and
        restaurant data are fictional. Your agent adapts the interface; you stay
        in control.
      </p>
    </div>
  );
}
