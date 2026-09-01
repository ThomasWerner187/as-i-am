/**
 * As I Am — app shell. Two visibly different demo sites, one Adaptive Web
 * Contract. The shell owns: routing, engine→DOM sync, WebMCP registration,
 * the demo/judge panel, the agent activity drawer and the privacy panel.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { engine } from "./engine/adaptationEngine";
import { ALL_TOOLS, dispatchTool } from "./adaptive-contract/tools";
import { registerTools, webmcpAvailable } from "./webmcp/register";
import { ActivityDrawer, DemoPanel } from "./components/Panels";
import { LiveRegion } from "./components/Primitives";
import { IconEye } from "./components/Icons";
import { activity } from "./data/activityStore";
import Landing from "./pages/Landing";
import ShopPage from "./pages/ShopPage";
import ServicesPage from "./pages/ServicesPage";

export type Route = "home" | "shop" | "services";

let registrationStarted = false;

function parseRoute(): Route {
  const path = location.pathname.replace(/\/+$/, "");
  if (path.endsWith("/shop")) return "shop";
  if (path.endsWith("/services")) return "services";
  return "home";
}

export function navigate(route: Route): void {
  history.pushState({}, "", route === "home" ? "/" : `/${route}`);
  dispatchEvent(new PopStateEvent("popstate"));
}

/** Base tokens for the "peek original" moment (never touches engine state). */
function applyBaseTokensDirect(): void {
  const root = document.documentElement;
  root.style.setProperty("--aia-text-scale", "1");
  root.style.setProperty("--aia-important-scale", "1");
  root.style.setProperty("--aia-line-height", "1.55");
  root.style.setProperty("--aia-letter-spacing", "0em");
  root.style.setProperty("--aia-word-spacing", "0em");
  root.style.setProperty("--aia-max-line", "72ch");
  root.style.setProperty("--aia-target-min", "44px");
  root.style.setProperty("--aia-target-gap", "8px");
  for (const name of [
    "contrast", "glare", "color-mode", "font-style", "status-labels", "focus",
    "keyboard-first", "no-drag", "no-dblclick", "cursor-size", "density",
    "hide-nonessential", "labels", "steps", "progress", "help", "plain-errors",
    "motion", "autoplay", "parallax", "captions", "transcripts", "static-media",
    "brightness",
  ]) {
    root.removeAttribute(`data-aia-${name}`);
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute);
  const [mcp, setMcp] = useState<{ state: "checking" | "live" | "none"; count: number }>({
    state: "checking",
    count: 0,
  });
  const [peeking, setPeeking] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  // Router
  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  const go = useCallback((r: Route) => {
    navigate(r);
    setRoute(r);
  }, []);

  // Engine → DOM sync on every engine change.
  useEffect(() => engine.subscribe(() => engine.syncDom()), []);
  useEffect(() => {
    engine.syncDom();
  }, []);

  // WebMCP registration (feature-detected; harness works without it).
  // Runs exactly once per page load, even under React StrictMode.
  useEffect(() => {
    if (registrationStarted) return;
    registrationStarted = true;
    void (async () => {
      const outcome = await registerTools(ALL_TOOLS, (name, args) => dispatchTool(name, args));
      setMcp({
        state: outcome.available && outcome.registered > 0 ? "live" : "none",
        count: outcome.registered,
      });
    })();
  }, []);

  // Dev harness bridge (?agent=1): same dispatch path as WebMCP.
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("agent")) return;
    (window as unknown as Record<string, unknown>).__aia = {
      run: (name: string, args: Record<string, unknown>) => dispatchTool(name, args),
    };
  }, []);

  // Open the activity drawer whenever the agent does something.
  useEffect(() => activity.subscribe(() => setActivityOpen(true)), []);

  // Peek-original handlers (press & hold).
  const startPeek = useCallback(() => {
    if (engine.getSnapshot().isBase) return;
    setPeeking(true);
    applyBaseTokensDirect();
    document.documentElement.classList.add("aia-peek");
  }, []);
  const stopPeek = useCallback(() => {
    if (!peeking) return;
    setPeeking(false);
    document.documentElement.classList.remove("aia-peek");
    engine.syncDom();
  }, [peeking]);

  const themeClass = useMemo(
    () => (route === "services" ? "theme-services" : ""),
    [route],
  );

  return (
    <div className={`app ${themeClass}`} data-testid="app" data-route={route}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <LiveRegion />

      <div
        className="mcp-chip"
        data-state={mcp.state}
        data-testid="mcp-chip"
        role="status"
        title={
          mcp.state === "live"
            ? `${mcp.count} WebMCP tools registered via document.modelContext.`
            : "document.modelContext is not available here. Needs Chrome 149+ with chrome://flags/#enable-webmcp-testing. Tools are testable via ?agent=1."
        }
      >
        {mcp.state === "live"
          ? `WebMCP · ${mcp.count} tools live`
          : mcp.state === "checking"
            ? "WebMCP · …"
            : "WebMCP not detected — try ?agent=1"}
      </div>

      {route === "home" && <Landing onNavigate={go} />}
      {route === "shop" && <ShopPage onNavigate={go} />}
      {route === "services" && <ServicesPage onNavigate={go} />}

      <DemoPanel route={route} />
      <ActivityDrawer open={activityOpen} onToggle={() => setActivityOpen((o) => !o)} />

      {peeking && (
        <div className="aia-live" role="status">
          Original view (peek) — release to return to the adapted view
        </div>
      )}
      <button
        type="button"
        className="aia-fab peek-wrap"
        data-testid="peek-button"
        onMouseDown={startPeek}
        onMouseUp={stopPeek}
        onMouseLeave={stopPeek}
        onTouchStart={startPeek}
        onTouchEnd={stopPeek}
        disabled={engine.getSnapshot().isBase}
        title="Press and hold to peek at the unadapted original view"
      >
        <IconEye size={15} /> Hold to peek original
      </button>
    </div>
  );
}
