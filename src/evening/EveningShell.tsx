import { useEffect, useRef, useState } from "react";
import { createFrameClient } from "./bridge";
import { SITE_NAMES, siteUrl } from "./config";
import type { EveningSite } from "./state";
import type { AdaptationReceipt } from "../adaptive-contract/schema";
import "../styles/journey.css";

type AssistanceMode = "choose" | "prepare";
interface ExampleRequest {
  diet: "any" | "vegan" | "vegetarian";
  maxPrice: number;
  quietTable: boolean;
  avoidAllergens: string[];
}
const EXAMPLE_REQUEST: ExampleRequest = {
  diet: "vegan",
  maxPrice: 20,
  quietTable: true,
  avoidAllergens: [],
};

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
function makeAgentPrompt(request: ExampleRequest, mode: AssistanceMode) {
  return `Help me plan a cinema-and-dinner evening using this editable example request. I want larger targets, clear steps and less visual clutter. ${mode === "choose" ? "Help me choose: adapt the pages so I can make my own choices." : "Prepare for me: research the available options and prepare booking reviews, preserving any choices I have already made."} Open LUNA at ${siteUrl("cinema", false)} as a top-level page and discover its native WebMCP tools. Apply supported functional preferences and verify the rendered result. Read my booking state and available seat pairs. Never confirm a booking for me. Once I have confirmed my tickets, use their actual film time to plan dinner. I authorize transferring my functional adaptation receipt and only the film start time needed for planning to OLIVA at ${siteUrl("restaurant", false)}. Discover its tools and get a dinner plan allowing 90 minutes to eat, a 15-minute walk and at least 15 minutes before the film. ${request.quietTable ? "Prefer a table listed as quiet by the restaurant." : "I have no table-location preference."} For the menu, my explicit example preference is ${request.diet === "any" ? "no dietary restriction" : request.diet}, at most EUR ${request.maxPrice} per dish. ${request.avoidAllergens.length ? `I explicitly ask to avoid these declared allergens: ${request.avoidAllergens.join(", ")}.` : "No food allergies have been shared. Do not infer any."} Read the restaurant's ingredient and allergen information. Keep any additional allergen constraints I have explicitly selected on the restaurant page. Vegan does not mean allergen-free; surface possible cross-contact or incomplete information and ask the restaurant instead of claiming safety. Present the matching dishes clearly on the actual page. Explain the timing and what is still uncertain. Dietary details are separate task inputs and must never be added to my adaptation receipt. Do not send my identity, diagnosis, seat numbers or other cinema booking details to the restaurant. Leave the final confirmation to me.`;
}

export default function EveningShell() {
  const [site, setSite] = useState<EveningSite>("cinema");
  const [mode, setMode] = useState<AssistanceMode>("choose");
  const [example, setExample] = useState<ExampleRequest>(EXAMPLE_REQUEST);
  const [requestOpen, setRequestOpen] = useState(false);
  const [dinnerPlan, setDinnerPlan] = useState<Record<string, any>>();
  const [menuResult, setMenuResult] = useState<Record<string, any>>();
  const [bookingStages, setBookingStages] = useState({
    cinema: "choose",
    restaurant: "choose",
  });
  const [ready, setReady] = useState({ cinema: false, restaurant: false });
  const [native, setNative] = useState({ cinema: false, restaurant: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
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
  const sharedExampleAllergens = useRef<string[]>([]);
  const state = useRef({ site, ready, busy, preview, example, mode });
  state.current = { site, ready, busy, preview, example, mode };
  const agentPrompt = makeAgentPrompt(example, mode);
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
        event.data?.channel === "as-i-am-booking" &&
        ["choose", "review", "confirmed"].includes(event.data.stage)
      ) {
        setBookingStages((current) => ({
          ...current,
          [from]: event.data.stage,
        }));
        return;
      }
      if (
        event.data?.channel === "as-i-am-size" &&
        Number.isFinite(event.data.height)
      ) {
        setFrameHeight((current) => ({
          ...current,
          [from]: Math.max(550, Math.min(12000, event.data.height)),
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
    const timer = window.setTimeout(() => setConnectionTimedOut(true), 14000);
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
                  url: siteUrl(value, false),
                  embedded_url: siteUrl(value),
                  ready: state.current.ready[value],
                })),
                cross_origin: crossOrigin,
                example_request: {
                  source:
                    "Editable, explicitly labelled demonstration request; not inferred personal information.",
                  assistance_mode: state.current.mode,
                  access_preferences: DEMO_PROFILE,
                  dining_preferences: {
                    diet: state.current.example.diet,
                    max_price_per_dish: state.current.example.maxPrice,
                    table_preference: state.current.example.quietTable
                      ? "quiet"
                      : "any",
                    avoid_allergens: state.current.example.avoidAllergens,
                  },
                  allergy_inference:
                    "Never infer an allergy. No shared allergy information does not mean no allergy.",
                },
                user_confirmation:
                  "Required for bookings and preference transfer. With authorization, use confirmed film time as a separate planning input. No food, identity or booking details in adaptation receipts.",
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
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
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
              state.current.busy = true;
              setBusy(true);
              try {
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
              } finally {
                state.current.busy = false;
                setBusy(false);
              }
            },
          },
          { signal: controller.signal },
        );
      };
      void register().catch(() => {
        if (!controller.signal.aborted)
          setError(
            "The agent entry points could not connect. You can still use the guided demo or open the sites directly under Use WebMCP.",
          );
      });
    }
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("message", listener);
      delete document.documentElement.dataset.evening;
    };
  }, [crossOrigin]);

  // Stage notifications contain no booking details. Read the real selection back
  // before labelling a confirmed table alongside the suggested itinerary.
  useEffect(() => {
    const frame = frames.current.restaurant;
    if (!frame || !["review", "confirmed"].includes(bookingStages.restaurant))
      return;
    let active = true;
    void createFrameClient(frame, new URL(siteUrl("restaurant")).origin)
      .invoke("get_booking_state")
      .then(({ result }) => {
        if (!active || result.ok === false) return;
        setDinnerPlan((current) =>
          current?.recommended
            ? {
                ...current,
                kept_booking:
                  result.time !== current.recommended.time ||
                  result.table_id !== current.recommended.table_id
                    ? result
                    : null,
              }
            : current,
        );
      })
      .catch(() => {
        /* The visible booking page remains the source of truth. */
      });
    return () => {
      active = false;
    };
  }, [bookingStages.restaurant]);

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
    if (state.current.busy) return;
    state.current.busy = true;
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
      state.current.busy = false;
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
  async function apply(target: EveningSite = site) {
    await stopPreview();
    setStatus("Checking what this site supports…");
    const baseline = await call(target, "measure_rendered_ui");
    setBefore(baseline.measurements);
    const caps = await call(target, "get_adaptation_capabilities");
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
    await call(target, "apply_adaptation_profile", { profile });
    await call(
      target,
      target === "cinema"
        ? "get_available_seat_pairs"
        : "get_available_table_times",
    );
    const fit = await call(target, "verify_profile_fit");
    setAfter(fit.measurements);
    setAdapted((current) => ({ ...current, [target]: true }));
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
  async function prepareSeats() {
    const booking = await call("cinema", "get_booking_state");
    if (booking.stage === "confirmed") {
      await planDinner(true);
      return;
    }
    if (!adapted.cinema) await apply("cinema");
    const availability = await call("cinema", "get_available_seat_pairs");
    const chosenIds = (booking.seats ?? []).map(
      (seat: { id: string }) => seat.id,
    );
    const pair = availability.pairs.find(
      (candidate: { seats: { id: string }[] }) =>
        chosenIds.every((id: string) =>
          candidate.seats.some((seat) => seat.id === id),
        ),
    );
    if (!pair)
      throw new Error(
        "Your selected seats cannot form an available adjacent pair. Choose the seats you want before preparing a review.",
      );
    await call("cinema", "prepare_seat_selection", { pair_id: pair.id });
    setStatus(
      "Your seat review is ready. Check the price and confirm on the cinema page when you are happy.",
    );
  }
  async function planDinner(prepare: boolean) {
    await stopPreview();
    setStatus("Reading your confirmed cinema booking…");
    const booking = await call("cinema", "get_booking_state");
    if (booking.stage !== "confirmed") {
      throw new Error(
        "Confirm your cinema tickets first. Then we can plan dinner from your actual film time.",
      );
    }
    if (!adapted.restaurant) {
      if (adapted.cinema) await carry();
      else {
        await switchSite("restaurant");
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        await apply("restaurant");
      }
    } else await switchSite("restaurant");
    setStatus("Finding a table with time to eat, walk and settle in…");
    const plan = await call("restaurant", "get_dinner_plan", {
      film_time: booking.film_time ?? booking.film.time,
      arrival_buffer_minutes: 15,
      table_preference: example.quietTable ? "quiet" : "any",
    });
    if (!plan.recommended)
      throw new Error(
        "No available table fits the confirmed film time and your requested buffer. Your bookings have not been changed.",
      );
    const menu = await call("restaurant", "get_restaurant_menu");
    // Preserve restrictions explicitly entered at the restaurant as well as in this example.
    const previousAllergens = (
      menu.current_criteria?.avoid_allergens ?? []
    ).filter((code: string) => !sharedExampleAllergens.current.includes(code));
    const criteria = {
      diet: example.diet,
      max_price: example.maxPrice,
      avoid_allergens: [
        ...new Set([...example.avoidAllergens, ...previousAllergens]),
      ],
    };
    const matches = await call("restaurant", "find_menu_options", criteria);
    const currentTable = await call("restaurant", "get_booking_state");
    if (prepare) {
      if (currentTable.stage !== "confirmed") {
        await call("restaurant", "prepare_table_selection", {
          time: currentTable.time ?? plan.recommended.time,
          table_id: currentTable.table_id ?? plan.recommended.table_id,
        });
      }
    }
    await call("restaurant", "present_menu_for_user", {
      ...criteria,
      view: "focused",
    });
    sharedExampleAllergens.current = [...example.avoidAllergens];
    setDinnerPlan({
      ...plan,
      kept_booking:
        currentTable.time &&
        (currentTable.time !== plan.recommended.time ||
          currentTable.table_id !== plan.recommended.table_id)
          ? currentTable
          : null,
    });
    setMenuResult(matches);
    setStatus(
      "Your dinner plan and menu choices are ready. The timing is explained below; you still make the final decision.",
    );
  }
  async function reviewSuggestedTable() {
    if (!dinnerPlan?.recommended) return;
    const current = await call("restaurant", "get_booking_state");
    if (current.stage === "confirmed") {
      setStatus("Your table is already confirmed. Your booking has been kept.");
      return;
    }
    if (
      current.time &&
      (current.time !== dinnerPlan.recommended.time ||
        (current.table_id &&
          current.table_id !== dinnerPlan.recommended.table_id))
    ) {
      await call("restaurant", "prepare_table_selection", {
        time: current.time,
        table_id: current.table_id,
      });
      setStatus(
        "Your existing table choice has been kept and opened for review. The suggested timing is an alternative, not a change to your booking.",
      );
      return;
    }
    await call("restaurant", "prepare_table_selection", {
      time: dinnerPlan.recommended.time,
      table_id: dinnerPlan.recommended.table_id,
    });
    setStatus(
      "Review the table details on OLIVA. Confirm only when the plan works for you.",
    );
  }
  const hasFit = adapted[site];
  const canCarry = site === "restaurant" && !hasFit && adapted.cinema;
  const transport = ready[site]
    ? native[site] && document.modelContext?.executeTool
      ? "Native WebMCP ready"
      : "Guided demo · fallback"
    : "Connecting…";
  const dinnerReady = Boolean(dinnerPlan?.recommended);
  function updateExample(patch: Partial<ExampleRequest>) {
    setExample((current) => ({ ...current, ...patch }));
    setDinnerPlan(undefined);
    setMenuResult(undefined);
    setCopied(false);
  }
  const primaryAction =
    mode === "prepare"
      ? site === "cinema"
        ? prepareSeats
        : () => planDinner(true)
      : hasFit
        ? site === "cinema"
          ? () => switchSite("restaurant")
          : dinnerReady
            ? refine
            : () => planDinner(false)
        : canCarry
          ? carry
          : apply;
  const primaryLabel =
    mode === "prepare"
      ? site === "cinema" && bookingStages.cinema !== "confirmed"
        ? "Prepare my seats →"
        : site === "cinema"
          ? "Plan dinner from my tickets →"
          : dinnerReady
            ? "Refresh my dinner plan"
            : "Prepare my dinner →"
      : hasFit
        ? site === "cinema"
          ? "Continue to dinner →"
          : dinnerReady
            ? textScale[site] >= 2.2
              ? "Text size: maximum"
              : textScale[site] > 1
                ? "Larger again"
                : "A little larger"
            : "Find dinner that fits →"
        : canCarry
          ? "Use my preferences here →"
          : "Make it easier →";

  return (
    <div className="evening-shell">
      <a className="skip-link" href="#adaptation">
        Skip to adaptation
      </a>
      <header className="experience-top">
        <span className="aia-wordmark">
          As I Am<span aria-hidden="true">.</span>
        </span>
        <div className="experience-links">
          <span className="connection-status">{transport}</span>
          <button
            aria-expanded={agentOpen}
            aria-controls="agent-details"
            onClick={() => setAgentOpen(!agentOpen)}
          >
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
        <p className="inclusion-intro">
          <strong>Inclusion means having a choice.</strong>
          Bigger controls. Clearer information. Help when you want it. An
          ordinary evening, on your terms.
        </p>
      </section>
      {agentOpen && (
        <section className="agent-details" id="agent-details">
          <h2>Try it with your agent.</h2>
          <p>
            Give your agent this request in a WebMCP-enabled browser. The guided
            demo uses preset requests, not an embedded AI.
          </p>
          <pre>{agentPrompt}</pre>
          <button
            className="shell-primary"
            onClick={() => {
              void navigator.clipboard
                .writeText(agentPrompt)
                .then(() => setCopied(true))
                .catch(() => setError("Select and copy the request above."));
            }}
          >
            {copied ? "Copied" : "Copy agent request"}
          </button>
          <p>
            If your browser does not expose tools inside frames, open each site
            directly and use its native tools:{" "}
            <a href={siteUrl("cinema", false)} target="_blank" rel="noreferrer">
              LUNA Cinema
            </a>{" "}
            ·{" "}
            <a
              href={siteUrl("restaurant", false)}
              target="_blank"
              rel="noreferrer"
            >
              OLIVA Restaurant
            </a>
          </p>
        </section>
      )}
      <main className="experience-stage" aria-label="One evening, two websites">
        <section className="help-choice" aria-label="How would you like help?">
          <div>
            <h2>You decide how much help.</h2>
            <p>
              For people who need easier pointing, fewer distractions, or
              clearer steps.
            </p>
          </div>
          <div
            className="help-modes"
            role="group"
            aria-label="Choose your assistance"
          >
            <button
              aria-pressed={mode === "choose"}
              disabled={busy}
              onClick={() => {
                setMode("choose");
                setCopied(false);
              }}
            >
              Help me choose
            </button>
            <button
              aria-pressed={mode === "prepare"}
              disabled={busy}
              onClick={() => {
                setMode("prepare");
                setCopied(false);
              }}
            >
              Prepare for me
            </button>
          </div>
        </section>
        <section
          className="example-request"
          aria-label="Editable example request"
        >
          <button
            className="example-summary"
            aria-expanded={requestOpen}
            aria-controls="example-controls"
            disabled={busy}
            onClick={() => setRequestOpen(!requestOpen)}
          >
            <span>
              Example request{" "}
              <strong>
                Two seats · {example.diet === "any" ? "any menu" : example.diet}{" "}
                dinner · €{example.maxPrice} per dish
                {example.quietTable ? " · quiet table" : ""}
              </strong>
            </span>
            <span className="example-edit">
              {requestOpen ? "Close" : "Edit"}
            </span>
          </button>
          {requestOpen && (
            <div id="example-controls" className="example-controls">
              <p>
                This is an example you can change. The agent uses what you
                choose here; it does not guess your needs.
              </p>
              <div className="example-fields">
                <label>
                  Menu preference
                  <select
                    disabled={busy}
                    value={example.diet}
                    onChange={(event) =>
                      updateExample({
                        diet: event.target.value as ExampleRequest["diet"],
                      })
                    }
                  >
                    <option value="any">Any menu</option>
                    <option value="vegan">Vegan</option>
                    <option value="vegetarian">Vegetarian</option>
                  </select>
                </label>
                <label>
                  Maximum price per dish (€)
                  <input
                    disabled={busy}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={example.maxPrice}
                    onChange={(event) => {
                      const value = event.target.valueAsNumber;
                      if (Number.isFinite(value))
                        updateExample({
                          maxPrice: Math.max(0, Math.min(100, value)),
                        });
                    }}
                  />
                </label>
                <label className="example-check">
                  <input
                    disabled={busy}
                    type="checkbox"
                    checked={example.quietTable}
                    onChange={(event) =>
                      updateExample({ quietTable: event.target.checked })
                    }
                  />
                  Prefer a quiet table
                </label>
              </div>
              <fieldset className="example-allergens">
                <legend>
                  Only if you choose to share an allergen to avoid
                </legend>
                {[
                  { code: "milk", label: "Milk" },
                  { code: "tree_nuts", label: "Tree nuts" },
                ].map(({ code, label }) => (
                  <label key={code}>
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={example.avoidAllergens.includes(code)}
                      onChange={(event) =>
                        updateExample({
                          avoidAllergens: event.target.checked
                            ? [...example.avoidAllergens, code]
                            : example.avoidAllergens.filter(
                                (value) => value !== code,
                              ),
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
                <p>
                  {example.avoidAllergens.length
                    ? "The menu will show declared ingredients, possible cross-contact and missing information. Confirm allergy requirements with the restaurant."
                    : "No allergy checks selected in this example. Vegan is a food preference, not an allergy guarantee."}{" "}
                  Additional allergen choices on OLIVA’s menu stay active.
                </p>
              </fieldset>
            </div>
          )}
        </section>
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
        <section
          className="agent-dock"
          id="adaptation"
          tabIndex={-1}
          aria-label="Try a personal adaptation"
        >
          <span className="agent-mark" aria-hidden="true">
            ✳
          </span>
          <div>
            <p className="agent-request">
              {mode === "prepare"
                ? site === "cinema"
                  ? hasFit
                    ? "“Use my tickets to plan the rest.”"
                    : "“Find two seats together. I’ll check the details.”"
                  : "“Find a table and menu that fit my evening.”"
                : hasFit
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
              {mode === "prepare"
                ? hasFit || site === "restaurant"
                  ? "Uses your confirmed film time and chosen preferences at OLIVA. You confirm the table."
                  : "The demo researches and prepares a review. You make the final decision."
                : canCarry
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
              (mode === "choose" &&
                dinnerReady &&
                hasFit &&
                site === "restaurant" &&
                textScale[site] >= 2.2)
            }
            onClick={() => void perform(primaryAction)}
          >
            {busy ? "One moment…" : primaryLabel}
          </button>
        </section>
        {site === "restaurant" && dinnerPlan?.recommended && (
          <section
            className="evening-plan"
            aria-labelledby="evening-plan-title"
          >
            <div className="plan-heading">
              <div>
                <h2 id="evening-plan-title">
                  {dinnerPlan.kept_booking
                    ? "A suggested plan for your evening."
                    : "Your evening fits together."}
                </h2>
                <p>
                  Planned from your confirmed LUNA tickets. Every step is yours
                  to review.
                </p>
              </div>
              <button
                className="shell-primary"
                disabled={busy || bookingStages.restaurant === "confirmed"}
                onClick={() => void perform(reviewSuggestedTable)}
              >
                {bookingStages.restaurant === "confirmed"
                  ? "Table confirmed by you"
                  : dinnerPlan.kept_booking
                    ? "Review my table choice"
                    : "Review suggested table"}
              </button>
            </div>
            <ol
              className="plan-timeline"
              aria-label="Suggested evening timeline"
            >
              <li>
                <strong>{dinnerPlan.recommended.time}</strong>
                <span>Dinner at OLIVA</span>
                <small>{dinnerPlan.recommended.table.name} · two people</small>
              </li>
              <li>
                <strong>{dinnerPlan.calculation.meal_ends}</strong>
                <span>Leave for LUNA</span>
                <small>{dinnerPlan.calculation.walk_minutes}-minute walk</small>
              </li>
              <li>
                <strong>{dinnerPlan.calculation.cinema_arrival}</strong>
                <span>Arrive, without rushing</span>
                <small>
                  {dinnerPlan.calculation.actual_arrival_buffer_minutes} minutes
                  before the film
                </small>
              </li>
              <li>
                <strong>{dinnerPlan.film_time}</strong>
                <span>Your film starts</span>
                <small>LUNA · confirmed by you</small>
              </li>
            </ol>
            <p className="plan-reason">{dinnerPlan.explanation}</p>
            {dinnerPlan.kept_booking && (
              <p className="plan-kept-choice">
                {dinnerPlan.kept_booking.stage === "confirmed"
                  ? "Your confirmed table is "
                  : "Your existing table choice is "}
                {dinnerPlan.kept_booking.time} ·{" "}
                {dinnerPlan.kept_booking.table?.name} (
                {dinnerPlan.kept_booking.table_id}). Your choice has been kept.
                The timeline and arrival buffer above describe the suggested
                alternative, not your booking.
              </p>
            )}
            {menuResult && (
              <p className="plan-menu-note">
                Your menu choices, ingredients and any open questions are shown
                below. Food preferences stay separate from your accessibility
                receipt.
              </p>
            )}
          </section>
        )}
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
              aria-expanded={proofOpen}
              aria-controls="proof-details"
              onClick={() => setProofOpen(!proofOpen)}
            >
              How it works
            </button>
            {trace.length > 0 && (
              <button className="shell-link" onClick={() => location.reload()}>
                Start again
              </button>
            )}
          </div>
        </div>
        <p className="sr-only" role="status" aria-atomic="true">
          {status}
        </p>
        {connectionTimedOut && (!ready.cinema || !ready.restaurant) && (
          <div className="experience-error" role="alert">
            <p>
              {!ready.cinema && !ready.restaurant
                ? "The example sites are taking longer to connect."
                : `${SITE_NAMES[!ready.cinema ? "cinema" : "restaurant"]} is taking longer to connect.`}{" "}
              Reload the experience, or open a site directly.
            </p>
            <div className="connection-actions">
              <button className="shell-link" onClick={() => location.reload()}>
                Reload experience
              </button>
              {SITES.filter((value) => !ready[value]).map((value) => (
                <a
                  key={value}
                  href={siteUrl(value, false)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open {SITE_NAMES[value]} ↗
                </a>
              ))}
            </div>
          </div>
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
        <section
          className="proof-details"
          id="proof-details"
          aria-labelledby="how-it-works-title"
        >
          <h2 id="how-it-works-title">How the web adapts to you.</h2>
          <p className="proof-intro">
            Your agent can do the legwork. The page can give you a clearer way
            to choose. Inclusion means you decide which kind of help works for
            you.
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
                {Number(receipt.profile.visual?.text_scale ?? 1) > 1 && (
                  <li>
                    Larger text ·{" "}
                    {Math.round(
                      Number(receipt.profile.visual?.text_scale) * 100,
                    )}
                    %
                  </li>
                )}
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
              <p>
                This receipt contains no name, seat choices, food requirements
                or personal reasons.
              </p>
              {dinnerPlan && (
                <p className="receipt-task-note">
                  Dinner planning separately uses your confirmed film time and
                  the food preferences you chose to share. They are not added to
                  the accessibility receipt.
                </p>
              )}
            </section>
          )}
          <div className="beyond-evening">
            <h3>Ordinary things. More ways to take part.</h3>
            <p>
              Shopping. Travel. Everyday forms. Supporting websites can offer
              clearer information and agent assistance while you stay in
              control.
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
        Free, open-source prototype · Built for participation and choice. No
        real bookings.
      </p>
    </div>
  );
}
