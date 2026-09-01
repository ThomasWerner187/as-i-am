/**
 * Judge-facing panels:
 * - DemoPanel: DEMO profile picker showing what the private agent knows vs.
 *   what the website receives, the applied-values panel (privacy transparency),
 *   undo/reset, and the ?agent=1 dev harness.
 * - ActivityDrawer: human-readable tool timeline with collapsible raw JSON.
 */

import { useSyncExternalStore, useState } from "react";
import { engine } from "../engine/adaptationEngine";
import { DEMO_BUNDLES } from "../adaptive-contract/profile";
import { dispatchTool } from "../adaptive-contract/tools";
import { activity } from "../data/activityStore";
import { countPreferences } from "../adaptive-contract/receipts";
import { webmcpAvailable } from "../webmcp/register";
import { useEngineState } from "./Primitives";
import type { FunctionalProfile } from "../adaptive-contract/schema";

const isHarness = new URLSearchParams(location.search).has("agent");

export function DemoPanel({ route }: { route: string }) {
  const snap = useEngineState();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [openPrivate, setOpenPrivate] = useState<string | null>(null);

  const activeParams = flattenParams(snap.active);

  async function applyBundle(id: string) {
    const bundle = DEMO_BUNDLES.find((b) => b.id === id);
    if (!bundle) return;
    setSending(id);
    // The profile travels through the SAME tool path an agent would use.
    await dispatchTool("apply_adaptation_profile", { profile: bundle.profile });
    setSending(null);
  }

  async function callTool(name: string, args: Record<string, unknown> = {}) {
    setSending(name);
    await dispatchTool(name, args);
    setSending(null);
  }

  return (
    <>
      <button
        type="button"
        className="aia-fab"
        data-testid="demo-panel-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ insetInlineEnd: "auto", insetInlineStart: "1rem" }}
      >
        {open ? "✕ Close demo panel" : "🎛 Demo profiles"}
      </button>

      {open && (
        <aside
          className="aia-panel"
          data-testid="demo-panel"
          aria-label="Demo profiles and privacy panel"
          style={{ insetInlineEnd: "auto", insetInlineStart: "1rem", inlineSize: "min(94vw, 420px)" }}
        >
          <header>
            <h2>Demo controls — for judges</h2>
            <button type="button" className="btn btn--small" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>
          <div className="body">
            <p className="demo-note">
              DEMO: this panel simulates what your personal agent would know and send. In the real
              product only your agent holds the profile — this website never sees it.
            </p>

            <section aria-label="Adaptation state">
              <h3 style={{ margin: 0, fontSize: "0.9rem" }}>
                State: v{snap.adaptationVersion} ·{" "}
                {snap.isBase ? "normal view" : `${activeParams.length} functional values active`}
              </h3>
              <div className="panel-actions" style={{ marginTop: "0.4rem" }}>
                <button
                  type="button"
                  className="btn btn--small"
                  data-testid="undo-button"
                  disabled={!engine.getUndoInfo().available}
                  onClick={() => void callTool("undo_adaptation")}
                >
                  ↩ Undo
                </button>
                <button
                  type="button"
                  className="btn btn--small"
                  data-testid="reset-button"
                  disabled={snap.isBase}
                  onClick={() => void callTool("reset_adaptations")}
                >
                  ⟲ Reset all
                </button>
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => void callTool("measure_rendered_ui")}
                >
                  📐 Measure
                </button>
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => void callTool("export_adaptation_receipt")}
                >
                  🧾 Receipt
                </button>
              </div>
            </section>

            <section aria-label="Demo profiles">
              <h3 style={{ margin: 0, fontSize: "0.9rem" }}>Demo profiles (synthetic)</h3>
              {DEMO_BUNDLES.map((b) => (
                <div className="demo-bundle" key={b.id} style={{ marginTop: "0.45rem" }} data-bundle={b.id}>
                  <h3>{b.name}</h3>
                  <div className="private">
                    🔒 Agent knows (never sent):{" "}
                    <button
                      type="button"
                      className="btn btn--small"
                      style={{ padding: "0 0.4em", minInlineSize: 0 }}
                      aria-expanded={openPrivate === b.id}
                      onClick={() => setOpenPrivate(openPrivate === b.id ? null : b.id)}
                    >
                      {openPrivate === b.id ? "hide" : "show"}
                    </button>
                    {openPrivate === b.id && <em> {b.agent_note}</em>}
                  </div>
                  <div className="sent">
                    ✓ Website receives only {countPreferences(b.profile)} functional parameters (no diagnosis)
                  </div>
                  <blockquote>“{b.prompt}”</blockquote>
                  <div className="panel-actions">
                    <button
                      type="button"
                      className="btn btn--small btn--primary"
                      data-testid={`apply-${b.id}`}
                      onClick={() => void applyBundle(b.id)}
                    >
                      {sending === b.id ? "Applying…" : "Send as agent would"}
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {activeParams.length > 0 && (
              <section aria-label="Functional values this website received" data-testid="applied-values">
                <h3 style={{ margin: 0, fontSize: "0.9rem" }}>
                  What this website received ({route === "services" ? "services" : "shop"})
                </h3>
                <ul className="applied-list">
                  {activeParams.map(([key, val]) => (
                    <li key={key}>
                      <code style={{ fontSize: "0.72rem" }}>{key}</code>
                      <span className="val">{String(val)}</span>
                    </li>
                  ))}
                </ul>
                <p className="privacy-pill" style={{ marginTop: "0.5rem" }}>
                  🔒 Session-only · no diagnosis · no storage · everything undoable
                </p>
              </section>
            )}

            {isHarness && <HarnessPanel />}
            {!isHarness && (
              <p style={{ fontSize: "0.74rem", color: "var(--ink-faint)", margin: 0 }}>
                Tool testing without WebMCP: append <code>?agent=1</code> to the URL for the dev harness.
                {webmcpAvailable() ? " WebMCP is live in this browser." : " WebMCP is not detected in this browser (needs Chrome 149+ and chrome://flags/#enable-webmcp-testing)."}
              </p>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

export function ActivityDrawer({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const entries = useSyncExternalStore(activity.subscribe, activity.log);
  return (
    <>
      {!open && (
        <button type="button" className="aia-fab" onClick={onToggle} aria-expanded={open}>
          🤖 Agent activity{entries.length > 0 ? ` (${entries.length})` : ""}
        </button>
      )}
      {open && (
        <aside className="aia-panel" aria-label="Agent activity timeline" data-testid="activity-drawer">
          <header>
            <h2>Agent activity</h2>
            <button type="button" className="btn btn--small" onClick={() => activity.clear()}>
              Clear
            </button>
            <button type="button" className="btn btn--small" onClick={onToggle}>
              Close
            </button>
          </header>
          <div className="body">
            {entries.length === 0 && (
              <p style={{ fontSize: "0.82rem", color: "var(--ink-faint)", margin: 0 }}>
                No agent activity yet. Use a demo profile, an agent over WebMCP, or the ?agent=1 harness.
              </p>
            )}
            <ol className="timeline" data-testid="activity-timeline">
              {entries.map((e) => (
                <li key={e.id} data-tool={e.tool}>
                  {e.summary}
                  <span className="t-note">{e.tool}</span>
                  {e.detail && (
                    <details>
                      <summary>raw data</summary>
                      <pre>{e.detail}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      )}
    </>
  );
}

function HarnessPanel() {
  const [tool, setTool] = useState("apply_adaptation_profile");
  const [argsText, setArgsText] = useState('{\n  "profile": { "version": "0.1", "visual": { "text_scale": 1.6 } }\n}');
  const [result, setResult] = useState("");
  const tools = [
    "get_adaptation_capabilities", "get_adaptation_state", "apply_adaptation_profile",
    "adapt_for_task", "tune_visual_presentation", "tune_interaction", "tune_cognitive_support",
    "tune_motion_and_media", "set_reading_mode", "measure_rendered_ui", "verify_profile_fit",
    "undo_adaptation", "reset_adaptations", "explain_adaptation", "export_adaptation_receipt",
    "explain_page", "list_available_tasks", "summarize_content", "read_content", "focus_task",
    "search_products", "filter_products", "get_product_details", "compare_products",
    "explain_price", "calculate_total_cost", "find_available_coupons", "apply_coupon",
    "read_comparison", "prepare_cart_change", "undo_cart_change",
  ];
  return (
    <section className="harness-form" aria-label="Dev harness" data-testid="dev-harness">
      <h3 style={{ margin: 0, fontSize: "0.9rem" }}>Dev harness (?agent=1)</h3>
      <label>
        Tool
        <select value={tool} onChange={(e) => setTool(e.target.value)}>
          {tools.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        Arguments (JSON)
        <textarea value={argsText} onChange={(e) => setArgsText(e.target.value)} spellCheck={false} />
      </label>
      <button
        type="button"
        className="btn btn--small btn--primary"
        onClick={async () => {
          let args: Record<string, unknown> = {};
          try {
            args = argsText.trim() ? JSON.parse(argsText) : {};
          } catch {
            setResult("Invalid JSON");
            return;
          }
          const res = await dispatchTool(tool, args);
          setResult(res);
        }}
      >
        Run tool
      </button>
      {result && (
        <pre style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 6, padding: "0.4rem", fontSize: "0.72rem", overflow: "auto" }}>
          {result}
        </pre>
      )}
    </section>
  );
}

function flattenParams(active: Record<string, Record<string, unknown>>): [string, unknown][] {
  const out: [string, unknown][] = [];
  for (const [section, fields] of Object.entries(active)) {
    if (section === "version" || section === "label") continue;
    for (const [k, v] of Object.entries(fields ?? {})) out.push([`${section}.${k}`, v]);
  }
  return out;
}
