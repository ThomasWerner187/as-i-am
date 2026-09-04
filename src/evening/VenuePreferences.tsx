import { useEffect, useState, type FormEvent } from "react";
import { dispatchTool } from "../adaptive-contract/tools";
import { CONTRACT_VERSION, type FunctionalProfile } from "../adaptive-contract/schema";
import { useEngineState } from "../components/Primitives";
import { AGENT_ORIGIN, siteUrl } from "./config";
import type { EveningSite } from "./state";
import AgentCapabilities from "./AgentCapabilities";
import "../styles/venue-preferences.css";

export default function VenuePreferences({ site, nativeCount }: { site: EveningSite; nativeCount: number }) {
  const adaptation = useEngineState();
  const [appearance, setAppearance] = useState("default");
  const [lowGlare, setLowGlare] = useState(false);
  const [still, setStill] = useState(false);
  const [largerText, setLargerText] = useState(false);
  const [readable, setReadable] = useState(false);
  const [largerTargets, setLargerTargets] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const { visual, motion_media: motion, interaction } = adaptation.active;
    setAppearance(visual?.color_scheme === "dark" ? "dark" : "default");
    setLowGlare(visual?.glare === "low");
    setStill(motion?.reduce_motion === true || motion?.disable_animation === true);
    setLargerText(Number(visual?.text_scale ?? 1) > 1);
    setReadable(visual?.font_style === "readable");
    setLargerTargets(Number(interaction?.minimum_target_size ?? 44) > 44);
  }, [adaptation.active]);

  // The embedded story and its recordings keep their original presentation.
  if (window.parent !== window || new URLSearchParams(location.search).has("embedded")) return null;

  async function run(name: string, args: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = JSON.parse(await dispatchTool(name, args, `${site}-booking`));
      if (result.ok === false) throw new Error(result.error || "These settings could not be applied. Try again.");
      setStatus(name === "reset_adaptations"
        ? "Original appearance restored. Your choices are kept."
        : "Page settings applied. Your choices are kept.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the page. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    const profile: FunctionalProfile = {
      version: CONTRACT_VERSION,
      visual: {
        color_scheme: appearance === "dark" ? "dark" : "default",
        glare: lowGlare ? "low" : "normal",
        text_scale: largerText ? 1.3 : 1,
        font_style: readable ? "readable" : "default",
        line_height: readable ? 1.7 : 1.5,
      },
      motion_media: { reduce_motion: still, disable_animation: still },
      interaction: {
        minimum_target_size: largerTargets ? 56 : 44,
        target_spacing: largerTargets ? 12 : 8,
        focus_strength: largerTargets ? "strong" : "default",
      },
    };
    // Explicit off values reverse these controls without removing unrelated
    // settings an agent may have applied. Booking and menu stores are separate.
    void run("apply_adaptation_profile", { profile });
  }

  return (
    <aside className="venue-preferences" aria-label="Explore and adjust this page">
      <nav className="venue-explore-links" aria-label="Explore As I Am">
        <a href={`${AGENT_ORIGIN}/`}>Guided demo</a>
        <a href={`${AGENT_ORIGIN}/try`}>Try it your way</a>
        <a href={siteUrl(site === "cinema" ? "restaurant" : "cinema", false)}>
          {site === "cinema" ? "Open OLIVA restaurant" : "Open LUNA cinema"}
        </a>
        <AgentCapabilities site={site} nativeCount={nativeCount} />
      </nav>
      <details className="venue-comfort">
        <summary>Make this page comfortable</summary>
        <form onSubmit={apply} aria-label="Page comfort preferences">
          <fieldset disabled={busy}>
            <legend className="visually-hidden">Choose your display settings</legend>
            <label className="venue-appearance">
              <span>Appearance</span>
              <select value={appearance} onChange={event => setAppearance(event.target.value)}>
                <option value="default">Original appearance</option>
                <option value="dark">Dark appearance</option>
              </select>
            </label>
            <div className="venue-comfort-options">
              <label><input type="checkbox" checked={lowGlare} onChange={event => setLowGlare(event.target.checked)} />Lower glare</label>
              <label><input type="checkbox" checked={still} onChange={event => setStill(event.target.checked)} />Stop animation</label>
              <label><input type="checkbox" checked={largerText} onChange={event => setLargerText(event.target.checked)} />Larger text</label>
              <label><input type="checkbox" checked={readable} onChange={event => setReadable(event.target.checked)} />Readable typeface</label>
              <label><input type="checkbox" checked={largerTargets} onChange={event => setLargerTargets(event.target.checked)} />Larger controls</label>
            </div>
            <div className="venue-comfort-actions">
              <button type="submit">{busy ? "Updating…" : "Apply page settings"}</button>
              <button type="button" onClick={() => void run("reset_adaptations")}>Restore original page</button>
            </div>
          </fieldset>
          <p className="venue-comfort-note">Only this open page. Your bookings and menu choices stay in place.</p>
          {error && <p role="alert">{error}</p>}
          <p className="venue-comfort-status" role="status" aria-live="polite">{status}</p>
        </form>
      </details>
    </aside>
  );
}
