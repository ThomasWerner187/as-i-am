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
    setReceipt(exported.receipt);
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
  const canCarry = site === "restaurant" && !hasFit && adapted.cinema;
  const transport = ready[site]
    ? native[site] && document.modelContext?.executeTool
      ? "Native WebMCP ready"
      : "Guided demo · fallback"
    : "Connecting…";

  return (
    <div className="evening-shell">
      <header className="experience-top">
        <span className="aia-wordmark">
          As I Am<span aria-hidden="true">.</span>
        </span>
        <div className="experience-links">
          <span className="connection-status">{transport}</span>
          <button onClick={() => setAgentOpen(!agentOpen)}>
            Use WebMCP ↗
          </button>
        </div>
      </header>
      <section className="experience-intro" aria-labelledby="experience-title">
        <h1 id="experience-title">
          The web adapts.
          <br />
          <em>You don’t have to.</em>
        </h1>
        <p>Your needs. Your preferences. A web that works your way.</p>
      </section>
      {agentOpen && (
        <section className="agent-details">
          <h2>Try it with your agent.</h2>
          <p>
            Give your agent this request in a WebMCP-enabled browser. The guided
            demo uses preset requests, not an embedded AI.
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
            <b>01</b> Cinema
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
            <b>02</b> Dinner
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
            <p className="agent-request">
              {hasFit
                ? site === "cinema"
                  ? "“Dinner next. Keep it this simple.”"
                  : "No need to explain it all again."
                : canCarry
                  ? "“Same preferences here, please.”"
                  : site === "cinema"
                    ? "“Bigger buttons. Two seats together, please.”"
                    : "“Bigger choices. One step at a time.”"}
            </p>
            <small>
              {canCarry
                ? "Share preferences, not booking details."
                : "You choose. You confirm."}
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
                hasFit
                  ? site === "cinema"
                    ? () => switchSite("restaurant")
                    : refine
                  : canCarry
                    ? carry
                    : apply,
              )
            }
          >
            {busy
              ? "One moment…"
              : hasFit
                ? site === "cinema"
                  ? "Continue to dinner →"
                  : textScale[site] >= 2.2
                    ? "Text size: maximum"
                    : textScale[site] > 1
                      ? "Larger again"
                      : "A little larger"
                : canCarry
                  ? "Use my preferences here →"
                  : "Make it easier →"}
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
                  {after.horizontal_overflow ? "Layout needs attention" : ""}
                </span>
              </>
            ) : null}
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
                  {preview ? "My view" : "Original"}
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
              How it works
            </button>
          </div>
        </div>
        {status && (
          <p className="sr-only" role="status">
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
        <section className="proof-details" aria-labelledby="how-it-works-title">
          <h2 id="how-it-works-title">How the web adapts to you.</h2>
          <p className="proof-intro">
            WebMCP lets your agent ask a website for changes it supports.
          </p>
          <ol className="contract-steps" aria-label="The WebMCP flow">
            <li>
              <span aria-hidden="true">1</span>
              <h3>Discover</h3>
              <p>The site tells your agent what can change.</p>
            </li>
            <li>
              <span aria-hidden="true">2</span>
              <h3>Adapt</h3>
              <p>Your agent asks. The site changes and checks the result.</p>
            </li>
            <li>
              <span aria-hidden="true">3</span>
              <h3>Carry</h3>
              <p>With your OK, your preferences move to the next site.</p>
            </li>
          </ol>
          {receipt && (
            <section
              className="shared-receipt"
              aria-label="Preferences shared with OLIVA"
            >
              <div>
                <p className="receipt-route">
                  LUNA <span aria-hidden="true">→</span> OLIVA
                </p>
                <h3>Preferences. Not personal details.</h3>
              </div>
              <ul aria-label="Shared preferences">
                {receipt.profile.interaction?.minimum_target_size && (
                  <li>
                    {receipt.profile.interaction.minimum_target_size}px buttons
                  </li>
                )}
                {receipt.profile.interaction?.target_spacing && (
                  <li>More space</li>
                )}
                {receipt.profile.interaction?.focus_strength === "strong" && (
                  <li>Clear focus</li>
                )}
                {receipt.profile.cognitive?.step_by_step && (
                  <li>One step at a time</li>
                )}
                {receipt.profile.cognitive?.hide_nonessential && (
                  <li>Less clutter</li>
                )}
                {receipt.profile.motion_media?.reduce_motion && (
                  <li>Less motion</li>
                )}
              </ul>
              <p>Not shared: your name, seat choices, or personal reasons.</p>
            </section>
          )}
          <div className="beyond-evening">
            <h3>Not just a night out.</h3>
            <p>
              Shopping. Travel. Everyday forms. On websites that support this
              contract, the same idea applies.
            </p>
            <p className="everyday-needs">
              <span>Easier to read.</span>
              <span>Easier to tap.</span>
              <span>Less to take in.</span>
            </p>
          </div>
          <details className="technical-proof">
            <summary>Actual tools &amp; data</summary>
            <p>
              {crossOrigin
                ? "Three separate origins: this demo controller, LUNA, and OLIVA. Each site has its own document and adaptation engine."
                : "Separate documents on the same deployment origin. Configure separate site URLs to demonstrate an origin boundary."}{" "}
              Nothing is stored in cookies or localStorage.
            </p>
            <p>
              Native mode calls discovered tools through document.modelContext.
              Fallback mode uses an origin-checked demo bridge and is explicitly
              labelled. Measurements describe rendered properties, not a
              complete accessibility audit.
            </p>
            <details>
              <summary>Demo preferences</summary>
              <pre>{JSON.stringify(DEMO_PROFILE, null, 2)}</pre>
            </details>
            {receipt && (
              <details>
                <summary>Shared with OLIVA</summary>
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
          </details>
        </section>
      )}
      <p className="shell-note">
        WebMCP hackathon prototype · No real bookings.
      </p>
    </div>
  );
}
