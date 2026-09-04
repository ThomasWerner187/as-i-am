/**
 * As I Am — app shell. Two visibly different demo sites, one Adaptive Web
 * Contract. The shell owns routing, engine→DOM sync, WebMCP registration,
 * the guided judge proof, advanced controls and the agent activity drawer.
 */

import { useCallback, useEffect, useState } from "react";
import { engine } from "./engine/adaptationEngine";
import { ALL_TOOLS, dispatchTool } from "./adaptive-contract/tools";
import { registerTools } from "./webmcp/register";
import { ActivityDrawer, DemoPanel } from "./components/Panels";
import JudgeMode from "./components/JudgeMode";
import { LiveRegion } from "./components/Primitives";
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

export function navigate(route: Route, options?: { judge?: boolean }): void {
  const params = new URLSearchParams();
  if (options?.judge) params.set("judge", "1");
  if (new URLSearchParams(location.search).has("agent")) params.set("agent", "1");
  const search = params.size > 0 ? `?${params.toString()}` : "";
  history.pushState({}, "", `${route === "home" ? "/" : `/${route}`}${search}`);
  dispatchEvent(new PopStateEvent("popstate"));
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute);
  const [judgeMode, setJudgeMode] = useState(() => new URLSearchParams(location.search).has("judge"));
  const [mcp, setMcp] = useState<{ state: "checking" | "live" | "none"; count: number }>({
    state: "checking",
    count: 0,
  });
  const [activityOpen, setActivityOpen] = useState(false);

  // Router
  useEffect(() => {
    const onPop = () => {
      setRoute(parseRoute());
      setJudgeMode(new URLSearchParams(location.search).has("judge"));
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  const go = useCallback((r: Route, options?: { judge?: boolean }) => {
    navigate(r, options);
    setRoute(r);
    setJudgeMode(Boolean(options?.judge));
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

  const themeClass = route === "services" ? "theme-services" : "";

  const routedPage = route === "shop"
    ? <ShopPage onNavigate={go} />
    : route === "services"
      ? <ServicesPage onNavigate={go} />
      : null;

  return (
    <div className={`app ${themeClass}${judgeMode ? " app--judge" : ""}`} data-testid="app" data-route={route}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <LiveRegion />

      {!judgeMode && route !== "home" && (
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
      )}

      {route === "home" && <Landing onNavigate={go} onStartProof={() => go("shop", { judge: true })} />}
      {route !== "home" && judgeMode ? (
        <div className="judge-layout">
          <div className="judge-canvas">{routedPage}</div>
          <JudgeMode
            route={route}
            mcp={mcp}
            onNavigate={go}
            onExit={() => go(route)}
          />
        </div>
      ) : routedPage}

      {!judgeMode && route !== "home" && (
        <>
          <DemoPanel route={route} />
          <ActivityDrawer open={activityOpen} onToggle={() => setActivityOpen((o) => !o)} />
        </>
      )}
    </div>
  );
}
