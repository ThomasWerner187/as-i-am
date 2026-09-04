import { useEffect, useRef, useState } from "react";
import { createFrameClient } from "./bridge";
import { siteUrl, SITE_NAMES } from "./config";
import type { EveningSite } from "./state";
import { CALM_DARK_PROFILE } from "../adaptive-contract/profile";
import { PERSONAL_CONTEXT, localDate } from "./personalContext";
import "../styles/personal-story.css";

type Result = Record<string, any>;
type Step = "welcome" | "seats" | "dinner";
interface Evidence { site: EveningSite; name: string; transport: string; result: Result; }
const SITES: EveningSite[] = ["cinema", "restaurant"];

export default function PersonalEvening() {
  const [step, setStep] = useState<Step>("welcome");
  const [site, setSite] = useState<EveningSite>("cinema");
  const [ready, setReady] = useState({ cinema: false, restaurant: false });
  const [native, setNative] = useState({ cinema: false, restaurant: false });
  const [stages, setStages] = useState({ cinema: "choose", restaurant: "choose" });
  const [heights, setHeights] = useState({ cinema: 700, restaurant: 750 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [line, setLine] = useState("A familiar request. A little less to think about.");
  const [date, setDate] = useState("");
  const [filmTime, setFilmTime] = useState("20:15");
  const [pair, setPair] = useState<Result>();
  const [plan, setPlan] = useState<Result>();
  const [trace, setTrace] = useState<Evidence[]>([]);
  const [details, setDetails] = useState<"preferences" | "tools" | null>(null);
  const [preview, setPreview] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [connectionSlow, setConnectionSlow] = useState(false);
  const frames = useRef<Partial<Record<EveningSite, HTMLIFrameElement>>>({});
  const locked = useRef(false);
  const retry = useRef<(() => Promise<void>) | null>(null);
  const detailsClose = useRef<HTMLButtonElement>(null);
  const detailsOpener = useRef<HTMLElement | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const latest = useRef({ native, date, filmTime, pair });
  latest.current = { native, date, filmTime, pair };

  function showDetails(value: "preferences" | "tools" | null) {
    if (value) detailsOpener.current = document.activeElement as HTMLElement;
    setDetails(value);
  }
  useEffect(() => {
    if (details) detailsClose.current?.focus();
    else detailsOpener.current?.focus();
  }, [details]);
  useEffect(() => { if (step !== "welcome") stepHeading.current?.focus(); }, [step]);
  useEffect(() => {
    if (ready.cinema && ready.restaurant) { setConnectionSlow(false); return; }
    const timer = window.setTimeout(() => setConnectionSlow(true), 10000);
    return () => clearTimeout(timer);
  }, [ready.cinema, ready.restaurant]);

  useEffect(() => {
    document.documentElement.dataset.evening = "personal";
    document.title = "As I Am — A night for two";
    const onMessage = (event: MessageEvent) => {
      const from = SITES.find(value => event.source === frames.current[value]?.contentWindow && event.origin === new URL(siteUrl(value)).origin);
      if (!from) return;
      if (event.data?.channel === "as-i-am-ready") {
        setReady(current => ({ ...current, [from]: true }));
        setNative(current => ({ ...current, [from]: event.data.native === true }));
      }
      if (event.data?.channel === "as-i-am-booking" && ["choose", "review", "confirmed"].includes(event.data.stage)) {
        setStages(current => ({ ...current, [from]: event.data.stage }));
      }
      if (event.data?.channel === "as-i-am-size" && Number.isFinite(event.data.height)) {
        setHeights(current => ({ ...current, [from]: Math.max(550, Math.min(12000, event.data.height + 8)) }));
      }
    };
    window.addEventListener("message", onMessage);
    const controller = new AbortController();
    const mc = document.modelContext;
    if (mc) void Promise.resolve(mc.registerTool({
      name: "get_personal_evening_context",
      description: "Read the explicitly shared FICTIONAL Alex and Lea demonstration context. This is supplied example history, not real personal memory. Use it to plan next week's cinema and dinner through the participating sites' own native tools. Send display preferences rather than health history to sites; keep final confirmations with the person.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => JSON.stringify({ ok: true, ...PERSONAL_CONTEXT, planning_date: localDate(), calm_profile: CALM_DARK_PROFILE, sites: SITES.map(value => ({ site: value, url: siteUrl(value, false) })) }),
    }, { signal: controller.signal })).catch(() => {});
    return () => { controller.abort(); window.removeEventListener("message", onMessage); delete document.documentElement.dataset.evening; };
  }, []);

  async function call(target: EveningSite, name: string, args: Record<string, unknown> = {}) {
    const frame = frames.current[target];
    if (!frame) throw new Error("The page is still opening. Please try again.");
    const response = await createFrameClient(frame, new URL(siteUrl(target)).origin, latest.current.native[target]).invoke(name, args);
    setTrace(current => [...current, { site: target, name, ...response }].slice(-60));
    if (response.result.ok === false) throw new Error(response.result.error || "The website could not complete that request.");
    return response.result;
  }
  async function perform(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await action(); retry.current = null; } catch (cause) { retry.current = action; setError(cause instanceof Error ? cause.message : "Please try again."); }
    finally { locked.current = false; setBusy(false); }
  }
  async function adapt(target: EveningSite) {
    const capabilities = await call(target, "get_adaptation_capabilities");
    const keys = new Set(capabilities.capabilities.map((value: { key: string }) => value.key));
    const profile: Record<string, unknown> = { version: "0.1" };
    for (const [domain, fields] of Object.entries(CALM_DARK_PROFILE)) {
      if (typeof fields === "object" && fields) profile[domain] = Object.fromEntries(Object.entries(fields).filter(([key]) => keys.has(`${domain}.${key}`)));
    }
    await call(target, "apply_adaptation_profile", { profile });
    await call(target, "verify_profile_fit");
  }
  async function start() {
    setStep("seats"); setSite("cinema"); setLine("I’ll use your calm view for today.");
    await adapt("cinema");
    const inventory = await call("cinema", "list_showings", { today: localDate() });
    const chosenDate = inventory.default_date ?? inventory.default_friday ?? inventory.dates?.[4];
    if (typeof chosenDate !== "string") throw new Error("No date was returned by the cinema.");
    await call("cinema", "select_showing", { date: chosenDate, time: "20:15" });
    setDate(chosenDate); setFilmTime("20:15");
    const seats = await call("cinema", "get_available_seat_pairs", { prefer_aisle: true, row: "F" });
    const selected = seats.pairs?.[0];
    if (!selected) throw new Error("There isn’t an available pair at the aisle.");
    await call("cinema", "prepare_seat_selection", { pair_id: selected.id, review: false }); setPair(selected);
    const dinner = await call("restaurant", "get_dinner_plan", { date: chosenDate, film_time: "20:15", table_preference: "quiet", plan_source: "selected" });
    setPlan(dinner);
    setLine(dinner.recommended ? "You at the aisle. Lea beside you. Time for dinner first." : "Your seats are ready to review. We still need a dinner time.");
  }
  async function moveBack() {
    const current = await call("cinema", "get_booking_state");
    const first = current.seats?.[0];
    const currentRow = typeof first === "string" ? first.charAt(0) : first?.row ?? latest.current.pair?.seats?.[0]?.row ?? "F";
    const row = String.fromCharCode(currentRow.charCodeAt(0) + 1);
    if (row > "H") throw new Error("That is the last row. Your current seats are kept.");
    const seats = await call("cinema", "get_available_seat_pairs", { prefer_aisle: true, row });
    const selected = seats.pairs?.[0];
    if (!selected) throw new Error("No aisle pair is available one row back. Your seats are kept.");
    await call("cinema", "prepare_seat_selection", { pair_id: selected.id, review: false }); setPair(selected);
    setLine("One row back. You’re still at the aisle.");
  }
  async function dinner() {
    const booking = await call("cinema", "get_booking_state");
    if (booking.status !== "confirmed" && booking.stage !== "confirmed") throw new Error("Please confirm the demo tickets on the cinema page first.");
    const confirmedDate = booking.date ?? booking.showing?.date ?? date;
    const confirmedTime = booking.film?.time ?? booking.film_time ?? booking.time ?? filmTime;
    setDate(confirmedDate); setFilmTime(confirmedTime);
    if (booking.seats?.length) setPair({ seats: booking.seats.map((seat: string | Result) => typeof seat === "string" ? { id: seat, row: seat.charAt(0) } : seat) });
    const exported = await call("cinema", "export_adaptation_receipt");
    setSite("restaurant"); setStep("dinner"); setPreview(false); setMenuReady(false);
    await call("restaurant", "get_adaptation_capabilities");
    await call("restaurant", "import_adaptation_receipt", { receipt: exported.receipt });
    await call("restaurant", "verify_profile_fit");
    const result = await call("restaurant", "get_dinner_plan", { date: confirmedDate, film_time: confirmedTime, table_preference: "quiet", plan_source: "confirmed" });
    setPlan(result);
    if (result.recommended) await call("restaurant", "prepare_table_selection", { date: confirmedDate, time: result.recommended.time, table_id: result.recommended.table_id });
    const menu = await call("restaurant", "present_menu_for_user", { diet: "any", view: "focused", max_price: 24, avoid_allergens: ["peanuts", "avocado"], favorite_dish_id: "mushroom-risotto", limit: 3 });
    setMenuReady(true);
    const choices = menu.recommendations ?? menu.menu?.recommendations ?? [];
    const favorite = choices.some((choice: Result) => (choice.item?.id ?? choice.id) === "mushroom-risotto");
    setLine(choices.length === 3 && favorite ? "Three options. Your risotto is here, too." : "Your menu is ready to explore.");
  }
  async function toggleView() {
    await call(site, "preview_original", { enabled: !preview }); setPreview(value => !value);
  }
  const formattedDate = date ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)) : "Next Friday";
  const bothConfirmed = stages.cinema === "confirmed" && stages.restaurant === "confirmed";

  return <div className="personal-experience">
    <a className="personal-skip" href="#personal-main">Skip to your evening</a>
    <header className="personal-header">
      <a className="personal-brand" href="/">As I Am<span>.</span></a>
      <span className="personal-header-note">A night for two</span>
      <button className="personal-text-button" onClick={() => showDetails(details === "preferences" ? null : "preferences")}>Saved preferences</button>
    </header>
    {details && <aside className="personal-details" onKeyDown={event => { if (event.key === "Escape") showDetails(null); }} aria-label={details === "preferences" ? "Fictional saved preferences" : "Actual tool results"}>
      <button ref={detailsClose} className="personal-close" onClick={() => showDetails(null)} aria-label="Close details">×</button>
      {details === "preferences" ? <><p className="personal-eyebrow">Fictional demo profile · Shared with the agent</p><h2>Alex & Lea</h2><dl><div><dt>Alex</dt><dd>Aisle seat, beside Lea · Mushroom risotto</dd></div><div><dt>Lea</dt><dd>Explicit allergies: peanuts and avocado</dd></div><div><dt>Today, from Alex</dt><dd>“{PERSONAL_CONTEXT.today.message}”</dd></div></dl><p>Today’s view is temporary. Sites receive display preferences, not this health context.</p></> : <><h2>What actually happened</h2><p>The playable walkthrough uses preset actions. A real external agent can use the native page tools.</p><nav><a href={siteUrl("cinema", false)}>Open LUNA</a><a href={siteUrl("restaurant", false)}>Open OLIVA</a><a href="/guided">Full controls</a></nav><ol>{trace.map((item, index) => <li key={index}><strong>{item.name}</strong> · {item.transport}<details><summary>Result</summary><pre>{JSON.stringify(item.result, null, 2)}</pre></details></li>)}</ol></>}
    </aside>}
    <main id="personal-main" className={`personal-layout personal-step-${step}`}>
      <section className="personal-companion" aria-label="Plan with your companion">
        <div className="personal-people" aria-label="Fictional demo couple Alex and Lea"><span>A</span><span>L</span><p>Alex & Lea<small>Demo with shared preferences</small></p></div>
        {step === "welcome" ? <>
          <p className="personal-earlier"><span>Earlier today</span>“Migraine again. My calm view, please.”</p>
          <div className="personal-request"><span>You</span><p>Plan a movie night for us next week.<br/>Dinner first would be lovely.</p></div>
          <button className="personal-primary" onClick={() => void perform(start)} disabled={busy || !ready.cinema || !ready.restaurant}>{busy ? "Opening your evening…" : "Plan our evening"}<span aria-hidden="true">↗</span></button>
          {connectionSlow && <div className="personal-error"><p role="alert">The pages are taking longer to open.</p><button className="personal-secondary" onClick={() => location.reload()}>Reload experience</button></div>}
        </> : <>
          <p className="personal-eyebrow">Your companion</p>
          <h1 ref={stepHeading} tabIndex={-1} className="personal-response" aria-live="polite">{bothConfirmed ? "An evening for you two." : line}</h1>
          <p className="personal-date">{formattedDate}</p>
          {plan?.recommended && <ol className="personal-timeline" aria-label="Your evening"><li><time>{plan.recommended.time}</time><span>OLIVA<small>Dinner for two</small></span></li><li><span className="personal-walk" aria-hidden="true">↗</span><span>15-minute walk<small>Time to arrive early</small></span></li><li><time>{filmTime}</time><span>LUNA<small>{pair?.seats?.map((seat: { id: string }) => seat.id).join(" + ") || "Two seats together"}</small></span></li></ol>}
          {step === "seats" && stages.cinema !== "confirmed" && <button className="personal-secondary" disabled={busy || !pair} onClick={() => void perform(moveBack)}>One row further back</button>}
          {step === "seats" && stages.cinema === "confirmed" && <button className="personal-primary" disabled={busy} onClick={() => void perform(dinner)}>Dinner, next<span aria-hidden="true">↗</span></button>}
          {step === "dinner" && menuReady && <p className="personal-allergy-note">Lea’s ingredient exclusions are applied.<br/>Kitchen confirmation is still needed.</p>}
          {bothConfirmed && <p className="personal-done">✓ Demo tickets & table confirmed</p>}
          <button className="personal-text-button" onClick={() => void perform(toggleView)} disabled={busy}>{preview ? "Back to my calm view" : "Compare original view"}</button>
        </>}
        {error && <div className="personal-error"><p role="alert">{error}</p><button className="personal-secondary" disabled={busy} onClick={() => { if (retry.current) void perform(retry.current); }}>Try again</button></div>}
        {busy && step !== "welcome" && <p role="status" className="personal-working">Checking the actual page…</p>}
        <footer className="personal-companion-footer"><button onClick={() => showDetails(details === "tools" ? null : "tools")}>How this works</button><span>Fictional bookings · Your final say</span></footer>
      </section>
      <section className="personal-venue" aria-label={step === "welcome" ? "Your next evening" : SITE_NAMES[site]}>
        {step === "welcome" && <div className="personal-opening"><div className="personal-opening-type"><p className="personal-eyebrow">Something to look forward to</p><h1>Next Friday.<br/><em>Just us.</em></h1></div><div className="personal-opening-images"><figure><img src="/art/luna-poster.webp" alt="LUNA, a quiet science-fiction film"/><figcaption>A film.</figcaption></figure><figure><img src="/art/oliva-table.webp" alt="A restaurant table set for two"/><figcaption>A table for two.</figcaption></figure></div></div>}
        {SITES.map(value => <div key={value} className="personal-frame-wrap" hidden={step === "welcome" || site !== value}><iframe ref={node => { if (node) frames.current[value] = node; }} src={siteUrl(value)} title={SITE_NAMES[value]} style={{ height: heights[value] }} /></div>)}
      </section>
    </main>
  </div>;
}
