import { useMemo, useState } from "react";
import { DEMO_BUNDLES } from "../adaptive-contract/profile";
import { dispatchTool } from "../adaptive-contract/tools";
import type { Route } from "../App";
import {
  IconCheck,
  IconLock,
  IconReceipt,
  IconReset,
  IconRuler,
  IconSpark,
} from "./Icons";

type JsonObject = Record<string, unknown>;

interface Measurements {
  smallest_body_text_px?: number;
  smallest_target_px?: number;
  min_action_gap_px?: number;
  primary_actions_visible?: number;
  animations_running?: number;
  horizontal_overflow?: boolean;
}

interface JudgeModeProps {
  route: Exclude<Route, "home">;
  mcp: { state: "checking" | "live" | "none"; count: number };
  onNavigate: (route: Route, options?: { judge?: boolean }) => void;
  onExit: () => void;
}

const proofProfile = DEMO_BUNDLES.find((bundle) => bundle.id === "precision-reading");

function preferenceCount(profile: JsonObject): number {
  return Object.entries(profile).reduce((count, [section, value]) => {
    if (section === "version" || section === "label" || typeof value !== "object" || value === null) {
      return count;
    }
    return count + Object.keys(value).length;
  }, 0);
}

function capabilityMap(result: JsonObject): Map<string, JsonObject> {
  const capabilities = Array.isArray(result.capabilities) ? result.capabilities : [];
  return new Map(
    capabilities
      .map((capability) => capability as JsonObject)
      .filter((capability) => typeof capability.key === "string")
      .map((capability) => [String(capability.key), capability]),
  );
}

function supportedProfile(profile: JsonObject, supported: Map<string, JsonObject>): JsonObject {
  const result: JsonObject = { version: profile.version };
  for (const [section, value] of Object.entries(profile)) {
    if (section === "version" || typeof value !== "object" || value === null || Array.isArray(value)) continue;
    const accepted = Object.fromEntries(
      Object.entries(value as JsonObject).filter(([field, requested]) => {
        const capability = supported.get(`${section}.${field}`);
        if (!capability) return false;
        const values = capability.values;
        return values === "continuous" || (Array.isArray(values) && values.includes(requested));
      }),
    );
    if (Object.keys(accepted).length > 0) result[section] = accepted;
  }
  return result;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function runTool(name: string, args: JsonObject = {}): Promise<JsonObject> {
  const raw = await dispatchTool(name, args);
  const parsed = JSON.parse(raw) as JsonObject;
  if (parsed.ok === false) {
    throw new Error(String(parsed.error ?? `Tool ${name} failed.`));
  }
  return parsed;
}

function readMeasurements(result: JsonObject): Measurements {
  return (result.measurements ?? {}) as Measurements;
}

function value(value: number | boolean | undefined, suffix = ""): string {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value !== "number") return "—";
  return `${value}${suffix}`;
}

function MeasurementPair({ before, after }: { before: Measurements; after: Measurements }) {
  const rows = [
    ["Smallest text", value(before.smallest_body_text_px, " px"), value(after.smallest_body_text_px, " px")],
    ["Smallest target", value(before.smallest_target_px, " px"), value(after.smallest_target_px, " px")],
    ["Minimum action gap", value(before.min_action_gap_px, " px"), value(after.min_action_gap_px, " px")],
    ["Primary actions", value(before.primary_actions_visible), value(after.primary_actions_visible)],
    ["Running animations", value(before.animations_running), value(after.animations_running)],
    ["Horizontal overflow", value(before.horizontal_overflow), value(after.horizontal_overflow)],
  ];

  return (
    <div className="proof-measurements" role="group" aria-label="Rendered measurements before and after adaptation">
      <div className="proof-measurements__head" aria-hidden="true">
        <span>Rendered UI</span><span>Before</span><span>After</span>
      </div>
      {rows.map(([label, from, to]) => (
        <div className="proof-measurements__row" key={label}>
          <span>{label}</span><span>{from}</span><strong>{to}</strong>
        </div>
      ))}
    </div>
  );
}

export default function JudgeMode({ route, mcp, onNavigate, onExit }: JudgeModeProps) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [capabilityCount, setCapabilityCount] = useState(0);
  const [negotiatedProfile, setNegotiatedProfile] = useState<JsonObject>();
  const [before, setBefore] = useState<Measurements>({});
  const [after, setAfter] = useState<Measurements>({});
  const [fit, setFit] = useState("");
  const [receiptOrigin, setReceiptOrigin] = useState("");
  const [receiptAcceptedCount, setReceiptAcceptedCount] = useState(0);
  const [receiptUnsupportedCount, setReceiptUnsupportedCount] = useState(0);

  const profile = useMemo(() => {
    const raw = proofProfile?.profile as unknown as JsonObject | undefined;
    if (!raw) return undefined;
    const { label: _agentLocalLabel, ...functional } = raw;
    return functional;
  }, []);
  const payload = negotiatedProfile ?? profile;
  const sentCount = useMemo(() => (payload ? preferenceCount(payload) : 0), [payload]);

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function start() {
    void perform(async () => {
      if (!profile) throw new Error("The proof profile is unavailable.");
      await runTool("reset_adaptations");
      await nextPaint();
      const baseline = await runTool("measure_rendered_ui");
      const capabilities = await runTool("get_adaptation_capabilities");
      setBefore(readMeasurements(baseline));
      setCapabilityCount(Number(capabilities.capability_count ?? 0));
      setNegotiatedProfile(supportedProfile(profile, capabilityMap(capabilities)));
      setStep(1);
    });
  }

  function applyProfile() {
    void perform(async () => {
      if (!payload) throw new Error("The negotiated proof profile is unavailable.");
      await runTool("apply_adaptation_profile", { profile: payload });
      await nextPaint();
      const verification = await runTool("verify_profile_fit", { profile: payload });
      setAfter(readMeasurements(verification));
      const report = verification.fit as JsonObject | undefined;
      setFit(String(report?.overall ?? "measured"));
      setStep(2);
    });
  }

  function refine() {
    void perform(async () => {
      await runTool("tune_visual_presentation", {
        text_scale: 1.8,
        important_text_scale: 1.6,
      });
      await nextPaint();
      const verification = await runTool("verify_profile_fit");
      setAfter(readMeasurements(verification));
      const report = verification.fit as JsonObject | undefined;
      setFit(String(report?.overall ?? "measured"));
      setStep(3);
    });
  }

  function carryReceipt() {
    void perform(async () => {
      const exported = await runTool("export_adaptation_receipt");
      const receipt = exported.receipt as JsonObject | undefined;
      if (!receipt) throw new Error("The functional receipt could not be exported.");
      await runTool("reset_adaptations");
      onNavigate("services", { judge: true });
      await nextPaint();
      const imported = await runTool("import_adaptation_receipt", { receipt });
      setReceiptOrigin(String(imported.receipt_origin ?? receipt.origin_site ?? "Hearth & Signal"));
      setReceiptAcceptedCount(Number(imported.accepted_preference_count ?? 0));
      setReceiptUnsupportedCount(Array.isArray(imported.unsupported_preferences) ? imported.unsupported_preferences.length : 0);
      setAfter(readMeasurements(imported));
      const report = imported.verification as JsonObject | undefined;
      setFit(String(report?.overall ?? "measured"));
      setStep(4);
    });
  }

  function restart() {
    void perform(async () => {
      await runTool("reset_adaptations");
      onNavigate("shop", { judge: true });
      setStep(0);
      setBefore({});
      setAfter({});
      setFit("");
      setReceiptOrigin("");
      setReceiptAcceptedCount(0);
      setReceiptUnsupportedCount(0);
      setNegotiatedProfile(undefined);
    });
  }

  const progress = step === 0 ? 0 : Math.min(100, step * 25);

  return (
    <aside
      className="proof-rail"
      aria-label="90-second product proof"
      data-aia-demo-chrome
      data-aia-measure="exclude"
    >
      <header className="proof-rail__header">
        <div>
          <h2>90-second proof</h2>
          <p>One real loop. No slides.</p>
        </div>
        <button type="button" className="proof-exit" onClick={onExit}>Exit proof</button>
      </header>

      <div
        className="proof-progress"
        role="progressbar"
        aria-label="Proof progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      <div className="proof-rail__body" aria-live="polite">
        {step === 0 && (
          <section className="proof-step">
            <IconSpark size={24} />
            <h3>Watch the page negotiate a better fit.</h3>
            <p>
              We start with the dense, unadapted shop. A simulated private agent will discover
              what the site supports, send only functional preferences, then measure the rendered result.
            </p>
            <p className="proof-truth">
              This self-guided rail simulates the private agent. The page beside it is the actual WebMCP-enabled site.
            </p>
            <button type="button" className="btn btn--primary proof-action" onClick={start} disabled={busy}>
              <IconRuler size={16} /> {busy ? "Measuring baseline…" : "Start with the live baseline"}
            </button>
          </section>
        )}

        {step === 1 && payload && (
          <section className="proof-step">
            <p className="proof-status"><IconCheck size={15} /> {capabilityCount} capabilities discovered on this page</p>
            <h3>The privacy boundary is the product.</h3>
            <div className="proof-boundary">
              <div className="proof-boundary__private">
                <strong><IconLock size={15} /> Simulated private agent</strong>
                <p>Needs larger text, steadier focus, generous targets and fewer simultaneous choices.</p>
                <small>Context stays on the agent side.</small>
              </div>
              <div className="proof-boundary__sent">
                <strong>Website receives</strong>
                <p><b>{sentCount}</b> page-supported functional values such as <code>text_scale: 1.5</code> and <code>minimum_target_size: 52</code>.</p>
                <small>No condition or identity field exists in the contract.</small>
              </div>
            </div>
            <details className="proof-json">
              <summary>Inspect the exact payload</summary>
              <pre>{JSON.stringify(payload, null, 2)}</pre>
            </details>
            <button type="button" className="btn btn--primary proof-action" onClick={applyProfile} disabled={busy}>
              {busy ? "Applying and measuring…" : "Send functional profile"}
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="proof-step">
            <p className="proof-status"><IconCheck size={15} /> Profile applied; rendered fit: {fit.replace(/_/g, " ")}</p>
            <h3>The browser reports evidence, not intent.</h3>
            <MeasurementPair before={before} after={after} />
            <p>
              The user can still respond naturally. Here we simulate: “The text is better, but still too small.”
            </p>
            <button type="button" className="btn btn--primary proof-action" onClick={refine} disabled={busy}>
              {busy ? "Refining and re-measuring…" : "Refine text to 180%"}
            </button>
          </section>
        )}

        {step === 3 && (
          <section className="proof-step">
            <p className="proof-status"><IconCheck size={15} /> Refinement measured; fit: {fit.replace(/_/g, " ")}</p>
            <h3>The preference becomes portable.</h3>
            <MeasurementPair before={before} after={after} />
            <p>
              Export a session-only functional receipt, reset this shop, and carry the same preferences
              to a visually different resident-services surface in this prototype.
            </p>
            <button type="button" className="btn btn--primary proof-action" onClick={carryReceipt} disabled={busy}>
              <IconReceipt size={16} /> {busy ? "Carrying receipt…" : "Carry receipt to the second surface"}
            </button>
          </section>
        )}

        {step === 4 && (
          <section className="proof-step proof-step--complete">
            <p className="proof-status"><IconCheck size={15} /> Receipt validated by City of Meridian</p>
            <h3>Same person. Different surface. Same contract.</h3>
            <p>
              The full receipt from <strong>{receiptOrigin}</strong> was validated on this second route of the
              same prototype origin. City of Meridian accepted the values it supports, reported the rest,
              and rendered them in its own design language.
            </p>
            <dl className="proof-summary">
              <div><dt>Contract</dt><dd>Adaptive Web Contract 0.1</dd></div>
              <div><dt>Supported-subset fit</dt><dd>{fit.replace(/_/g, " ")}</dd></div>
              <div><dt>Accepted values</dt><dd>{receiptAcceptedCount}</dd></div>
              <div><dt>Reported unsupported</dt><dd>{receiptUnsupportedCount}</dd></div>
              <div><dt>Storage</dt><dd>Session memory only</dd></div>
              <div><dt>Reversible</dt><dd>Undo or reset</dd></div>
            </dl>
            <div className="proof-finish-actions" data-aia="actions">
              <button type="button" className="btn btn--primary" onClick={onExit}>Explore the adapted site</button>
              <button type="button" className="btn" onClick={restart} disabled={busy}>
                <IconReset size={15} /> Run again
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="proof-error" role="alert">
            <strong>The proof paused.</strong>
            <span>{error} You can retry the current action.</span>
          </div>
        )}
      </div>

      <footer className="proof-rail__footer">
        <span className="proof-mcp" data-state={mcp.state}>
          {mcp.state === "live"
            ? `WebMCP live · ${mcp.count} registered tools`
            : mcp.state === "checking"
              ? "Checking WebMCP…"
              : "Harness mode · same tool handlers"}
        </span>
        <span>{route === "shop" ? "Hearth & Signal" : "City of Meridian"}</span>
      </footer>
    </aside>
  );
}
