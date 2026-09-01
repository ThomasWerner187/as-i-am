/**
 * Adaptive Web Contract — tools.ts
 * Every tool is defined once here; WebMCP registration AND the local dev
 * harness (?agent=1) dispatch to the SAME handlers.
 *
 * Tool names ≤ 30 chars, descriptions ≤ 500 chars (WebMCP limits).
 * Handlers return compact structured JSON strings.
 * Responses are produced AFTER the UI change actually happened.
 */

import { CONTRACT_NAME, CONTRACT_VERSION, type FunctionalProfile } from "./schema";
import { discoverCapabilities, requestedKeys } from "./capabilities";
import { scanForDiagnosisTerms } from "./privacy";
import { buildReceipt, countPreferences } from "./receipts";
import { collectMeasurements, verifyFit } from "./measurements";
import { engine } from "../engine/adaptationEngine";
import { speech } from "../engine/speech";
import { activity } from "../data/activityStore";
import {
  COUPONS, findCoupon, findProduct, money, priceBreakdown, PRODUCTS,
  type Coupon, type Product,
} from "../data/products";
import {
  APPOINTMENTS, HELP_TOPICS, PERMIT_FORM_STEPS, REQUESTS, SERVICE_TASKS,
} from "../data/services";
import { filteredProducts, focusStore, shopStore } from "../data/shopState";

const j = (v: unknown): string => JSON.stringify(v);
const err = (code: string, message: string): string =>
  j({ ok: false, code, error: message });

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    untrustedContentHint?: boolean;
  };
  run: (pageId: string, args: Record<string, unknown>) => string | Promise<string>;
}

function currentRoute(): string {
  if (typeof location === "undefined") return "shop";
  const p = location.pathname.replace(/\/+$/, "");
  if (p.endsWith("/services")) return "services";
  if (p.endsWith("/shop")) return "shop";
  return "home";
}

function activePageId(): string {
  const route = currentRoute();
  return route === "services" ? "services-portal" : route === "shop" ? "shop-catalog" : "landing";
}

function productSummary(p: Product) {
  return {
    id: p.id, name: p.name, category: p.category, price: p.price,
    original_price: p.original_price ?? null, shipping: p.shipping,
    total_incl_shipping: Math.round((p.price + p.shipping + (p.fee ?? 0)) * 100) / 100,
    rating: p.rating, stock: p.stock,
  };
}

function validCoupons(product?: Product): Coupon[] {
  const now = new Date();
  return COUPONS.filter((c) => {
    if (!c.valid) return false;
    if (new Date(c.expires) < now) return false;
    if (c.applies_to_category && product && product.category !== c.applies_to_category) return false;
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* Page descriptors for explain_page / list_available_tasks           */
/* ------------------------------------------------------------------ */

interface PageTask { id: string; description: string; tool: string }
interface PageDescriptor {
  page_id: string;
  site_name: string;
  what: string;
  for_whom: string;
  main_sections: readonly string[];
  tasks: PageTask[];
  costs: string;
  risks: string;
}

const PAGE_DESCRIPTORS: Record<string, PageDescriptor> = {
  shop: {
    page_id: "shop-catalog",
    site_name: "Hearth & Signal",
    what: "An electronics comparison and shopping demo with product cards, filters, a comparison table and a cart simulation.",
    for_whom: "People comparing and buying consumer electronics.",
    main_sections: ["Deal ticker", "Filters", "Product grid", "Comparison table", "Coupons", "Cart"],
    tasks: [
      { id: "search_products", description: "Search the catalog by free text.", tool: "search_products" },
      { id: "filter_products", description: "Filter by category, price, tags.", tool: "filter_products" },
      { id: "compare_products", description: "Compare selected products side by side.", tool: "compare_products" },
      { id: "review_price", description: "Explain a product's full price incl. shipping, fees, coupons.", tool: "explain_price" },
      { id: "add_to_cart", description: "Stage a cart change (needs human confirmation in the page).", tool: "prepare_cart_change" },
      { id: "find_coupons", description: "List valid coupons.", tool: "find_available_coupons" },
    ],
    costs: "No real purchases. Prices are synthetic demo data.",
    risks: "Adding to the cart is staged and always needs explicit human confirmation. No checkout exists.",
  },
  services: {
    page_id: "services-portal",
    site_name: "City of Meridian — Resident Services",
    what: "A resident services portal demo: multi-step application form, request status table, appointments and help.",
    for_whom: "Residents handling city administrative tasks.",
    main_sections: ["Service tasks", "Application form (3 steps)", "My requests", "Appointments", "Help"],
    tasks: [
      { id: "understand_page", description: "Get a plain overview of this portal.", tool: "explain_page" },
      { id: "complete_form", description: "Fill the parking permit application step by step.", tool: "focus_task" },
      { id: "check_requests", description: "Read request statuses and next steps.", tool: "summarize_content" },
      { id: "find_appointment", description: "List available appointments.", tool: "summarize_content" },
    ],
    costs: "Synthetic fees only (e.g. €32.50 permit fee). No real payments.",
    risks: "No destructive actions exist on this page. Submissions are simulated.",
  },
  home: {
    page_id: "landing",
    site_name: "As I Am",
    what: "Project landing page explaining the Adaptive Web Contract demo and linking to the two demo sites.",
    for_whom: "Hackathon judges and visitors.",
    main_sections: ["Pitch", "Privacy model", "Demo links", "Try-it prompts"],
    tasks: [
      { id: "understand_page", description: "Understand the project and go to a demo.", tool: "explain_page" },
    ],
    costs: "None.",
    risks: "None.",
  },
};

/* ------------------------------------------------------------------ */
/* Universal adaptation tools                                         */
/* ------------------------------------------------------------------ */

const universalTools: ToolDef[] = [
  {
    name: "get_adaptation_capabilities",
    description:
      "Discover which visual, interaction, cognitive, motion/media, reading and safety adaptations this page supports (Adaptive Web Contract 0.1). Call before applying a profile.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: () => {
      const disc = discoverCapabilities(activePageId(), PAGE_DESCRIPTORS[currentRoute()].site_name);
      return j({
        ok: true, contract: disc.contract, version: disc.version,
        page_id: disc.page_id, site_name: disc.site_name,
        capability_count: disc.capabilities.length,
        capabilities: disc.capabilities.map((c) => ({ key: c.key, domain: c.domain, values: c.supported_values })),
        unsupported_domains: disc.unsupported_domains,
      });
    },
  },
  {
    name: "get_adaptation_state",
    description:
      "Read the currently applied adaptation state: adaptation_version, active functional preferences, undo availability and quick rendered metrics.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: () => {
      const snap = engine.getSnapshot();
      const undo = engine.getUndoInfo();
      return j({
        ok: true,
        contract: CONTRACT_NAME,
        version: CONTRACT_VERSION,
        adaptation_version: snap.adaptationVersion,
        page_id: activePageId(),
        active_preferences: snap.active,
        active_parameter_count: countPreferences(snap.active as unknown as FunctionalProfile),
        applied_changes_logged: snap.applied.length,
        undo,
      });
    },
  },
  {
    name: "apply_adaptation_profile",
    description:
      "Apply a functional preference profile (diagnosis-free, Adaptive Web Contract 0.1 schema) as one atomic, undoable operation. Only functional parameters are accepted; diagnosis terms are rejected.",
    inputSchema: {
      type: "object",
      properties: { profile: { type: "object", description: "Functional profile per contract 0.1" } },
      required: ["profile"],
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const profile = args.profile as FunctionalProfile | undefined;
      if (!profile) return err("missing_argument", "profile is required");
      const scan = scanForDiagnosisTerms(profile);
      if (!scan.ok) {
        activity.push("apply_adaptation_profile", "Rejected: payload contained diagnosis-like terms (blocked).");
        return j({
          ok: false, code: "privacy_violation",
          error: "Profile contains diagnosis-like terms. Send functional parameters only, e.g. text_scale, minimum_target_size.",
          findings: scan.findings.map((f) => f.where),
        });
      }
      const result = engine.applyProfile(profile, profile.label ?? "Agent profile");
      engine.syncDom();
      const m = collectMeasurements();
      activity.push("apply_adaptation_profile", `Applied ${result.applied.length} functional preferences (v${result.adaptation_version}).`, j(profile));
      return j({ ...result, measurements: m });
    },
  },
  {
    name: "adapt_for_task",
    description:
      "Adapt the page for a concrete task: compare_products, understand_page, complete_form, review_price or find_information. Applies a sensible functional preset atomically.",
    inputSchema: {
      type: "object",
      properties: { task: { type: "string", enum: ["compare_products", "understand_page", "complete_form", "review_price", "find_information"] } },
      required: ["task"],
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const task = String(args.task ?? "");
      const presets: Record<string, FunctionalProfile> = {
        compare_products: {
          version: CONTRACT_VERSION, label: "Task: compare products",
          visual: { important_text_scale: 1.25, max_line_length: 60 },
          cognitive: { information_density: "reduced", hide_nonessential: true, maximum_primary_actions: 3, progress_indicators: true },
          motion_media: { disable_autoplay: true },
        },
        understand_page: {
          version: CONTRACT_VERSION, label: "Task: understand the page",
          reading: { mode: "plain_language" },
          cognitive: { information_density: "reduced", hide_nonessential: true, consistent_help: true },
          motion_media: { disable_autoplay: true, disable_animation: true },
        },
        complete_form: {
          version: CONTRACT_VERSION, label: "Task: complete the form",
          interaction: { minimum_target_size: 52, target_spacing: 16, focus_strength: "maximum", error_tolerance: "high" },
          cognitive: { step_by_step: true, progress_indicators: true, plain_error_messages: true, maximum_primary_actions: 3, hide_nonessential: true },
          safety: { confirm_destructive: true },
        },
        review_price: {
          version: CONTRACT_VERSION, label: "Task: review the price",
          visual: { important_text_scale: 1.4 },
          safety: { complete_price_totals: true },
          cognitive: { information_density: "reduced", hide_nonessential: true },
        },
        find_information: {
          version: CONTRACT_VERSION, label: "Task: find information",
          cognitive: { information_density: "reduced", hide_nonessential: true },
          reading: { mode: "key_points" },
          motion_media: { disable_autoplay: true },
        },
      };
      const preset = presets[task];
      if (!preset) return err("bad_task", `Unknown task "${task}".`);
      const result = engine.applyProfile(preset, `Task adaptation: ${task}`);
      engine.syncDom();
      if (task === "complete_form") focusStore.set("permit-form");
      if (task === "compare_products") focusStore.set("comparison");
      activity.push("adapt_for_task", `Adapted the page for task "${task}" (v${result.adaptation_version}).`);
      return j({ ...result, task });
    },
  },
  {
    name: "tune_visual_presentation",
    description:
      "Granular visual tuning: text_scale, important_text_scale, line_height, letter_spacing, word_spacing, max_line_length, contrast, brightness, glare, color_mode, color_independent_status, font_style. Atomic + undoable.",
    inputSchema: {
      type: "object",
      properties: {
        text_scale: { type: "number", minimum: 1, maximum: 2.2 },
        important_text_scale: { type: "number", minimum: 1, maximum: 2 },
        line_height: { type: "number", minimum: 1, maximum: 2.2 },
        letter_spacing: { type: "number", minimum: 0, maximum: 0.2 },
        word_spacing: { type: "number", minimum: 0, maximum: 0.5 },
        max_line_length: { type: "number", minimum: 30, maximum: 90 },
        contrast: { type: "string", enum: ["normal", "high", "maximum"] },
        brightness: { type: "number", minimum: 0.55, maximum: 1 },
        glare: { type: "string", enum: ["normal", "low"] },
        color_mode: { type: "string", enum: ["normal", "grayscale", "protanopia-safe", "deuteranopia-safe", "tritanopia-safe", "invert"] },
        color_independent_status: { type: "boolean" },
        font_style: { type: "string", enum: ["default", "readable"] },
      },
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const result = engine.tuneSection("visual", args, "Visual tuning");
      engine.syncDom();
      activity.push("tune_visual_presentation", `Visual tuning applied (${result.applied.length} changes).`, j(args));
      return j({ ...result });
    },
  },
  {
    name: "tune_interaction",
    description:
      "Granular interaction tuning: minimum_target_size (44–60px), target_spacing, keyboard_first, focus_strength, cursor_size, drag_alternatives, double_click_disabled, timeout_multiplier, error_tolerance. Atomic + undoable.",
    inputSchema: {
      type: "object",
      properties: {
        minimum_target_size: { type: "number", minimum: 44, maximum: 60 },
        target_spacing: { type: "number", minimum: 8, maximum: 32 },
        keyboard_first: { type: "boolean" },
        focus_strength: { type: "string", enum: ["default", "strong", "maximum"] },
        cursor_size: { type: "number", minimum: 16, maximum: 48 },
        drag_alternatives: { type: "boolean" },
        double_click_disabled: { type: "boolean" },
        timeout_multiplier: { type: "number", minimum: 1, maximum: 4 },
        error_tolerance: { type: "string", enum: ["normal", "high"] },
      },
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const result = engine.tuneSection("interaction", args, "Interaction tuning");
      engine.syncDom();
      activity.push("tune_interaction", `Interaction tuning applied (${result.applied.length} changes).`, j(args));
      return j({ ...result });
    },
  },
  {
    name: "tune_cognitive_support",
    description:
      "Granular cognitive tuning: information_density, maximum_primary_actions, step_by_step, hide_nonessential, persistent_labels, consistent_help, progress_indicators, plain_error_messages, confirmation_level. Atomic + undoable.",
    inputSchema: {
      type: "object",
      properties: {
        information_density: { type: "string", enum: ["normal", "reduced", "minimal"] },
        maximum_primary_actions: { type: "number", minimum: 2, maximum: 5 },
        step_by_step: { type: "boolean" },
        hide_nonessential: { type: "boolean" },
        persistent_labels: { type: "boolean" },
        consistent_help: { type: "boolean" },
        progress_indicators: { type: "boolean" },
        plain_error_messages: { type: "boolean" },
        confirmation_level: { type: "string", enum: ["normal", "confirm-risky", "confirm-all"] },
      },
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const result = engine.tuneSection("cognitive", args, "Cognitive tuning");
      engine.syncDom();
      activity.push("tune_cognitive_support", `Cognitive support tuned (${result.applied.length} changes).`, j(args));
      return j({ ...result });
    },
  },
  {
    name: "tune_motion_and_media",
    description:
      "Granular motion/media tuning: reduce_motion, disable_animation, disable_autoplay, disable_parallax, mute_nonessential_audio, enable_captions, enable_transcripts, static_media_alternatives. Atomic + undoable.",
    inputSchema: {
      type: "object",
      properties: {
        reduce_motion: { type: "boolean" },
        disable_animation: { type: "boolean" },
        disable_autoplay: { type: "boolean" },
        disable_parallax: { type: "boolean" },
        mute_nonessential_audio: { type: "boolean" },
        enable_captions: { type: "boolean" },
        enable_transcripts: { type: "boolean" },
        static_media_alternatives: { type: "boolean" },
      },
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const result = engine.tuneSection("motion_media", args, "Motion & media tuning");
      engine.syncDom();
      activity.push("tune_motion_and_media", `Motion/media tuned (${result.applied.length} changes).`, j(args));
      return j({ ...result });
    },
  },
  {
    name: "set_reading_mode",
    description:
      "Set how content is presented: original, plain_language, key_points, step_by_step, read_aloud, bilingual_or_explained. Optional speech_rate 0.5–2.0. Original stays reachable; simplified versions are clearly labelled.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["original", "plain_language", "key_points", "step_by_step", "read_aloud", "bilingual_or_explained"] },
        speech_rate: { type: "number", minimum: 0.5, maximum: 2 },
      },
      required: ["mode"],
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const patch: Record<string, unknown> = { mode: args.mode };
      if (typeof args.speech_rate === "number") patch.speech_rate = args.speech_rate;
      const result = engine.tuneSection("reading", patch, `Reading mode: ${String(args.mode)}`);
      engine.syncDom();
      activity.push("set_reading_mode", `Reading mode set to "${String(args.mode).replace(/_/g, " ")}".`, j(args));
      return j({ ...result });
    },
  },
  {
    name: "measure_rendered_ui",
    description:
      "Measure the REAL rendered page: smallest text, price sizes, smallest click target, action gaps, min contrast, visible primary actions, running animations, horizontal overflow, occluded focusables. Use after adapting, then refine.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: () => {
      const m = collectMeasurements();
      activity.push("measure_rendered_ui", "Measured the rendered page.", j(m));
      return j({ ok: true, measurements: m });
    },
  },
  {
    name: "verify_profile_fit",
    description:
      "Compare requested functional preferences with the actually rendered page. Reports satisfied / partially_satisfied / unsupported, conflicts and suggested_refinements for an observe→adapt→measure→refine loop.",
    inputSchema: {
      type: "object",
      properties: { profile: { type: "object", description: "Optional profile to verify; defaults to the active one" } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: (_pageId, args) => {
      const src = (args.profile as Record<string, Record<string, unknown>> | undefined) ?? engine.getSnapshot().active;
      const keys = requestedKeys(src);
      const requested: Record<string, number | string | boolean> = {};
      for (const key of keys) {
        const [section, field] = key.split(".");
        const v = (src[section] as Record<string, unknown> | undefined)?.[field];
        if (v !== undefined) requested[key] = v as number | string | boolean;
      }
      const m = collectMeasurements();
      const fit = verifyFit(requested, m);
      activity.push("verify_profile_fit", `Profile fit: ${fit.overall} (${fit.partially_satisfied.length} partial).`);
      return j({ ok: true, fit, measurements: m });
    },
  },
  {
    name: "undo_adaptation",
    description: "Undo the last adaptation operation and restore the previous state exactly.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => {
      const result = engine.undo();
      engine.syncDom();
      activity.push("undo_adaptation", result.restored ? "Undid the last adaptation." : "Nothing to undo.");
      return j(result);
    },
  },
  {
    name: "reset_adaptations",
    description: "Remove ALL adaptations and restore the normal base view. Still reversible via undo.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => {
      const result = engine.reset();
      engine.syncDom();
      focusStore.set(null);
      activity.push("reset_adaptations", "Reset to the normal base view.");
      return j(result);
    },
  },
  {
    name: "explain_adaptation",
    description:
      "Explain in plain language what was changed on this page and why — a diagnosis-free summary the agent can relay to the user.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: () => {
      const snap = engine.getSnapshot();
      const explanations = engine.explainCurrent();
      return j({
        ok: true,
        adaptation_version: snap.adaptationVersion,
        last_operation: snap.lastOp ?? null,
        changes: explanations,
        privacy_note: "Only functional preferences were received. No diagnosis was shared.",
      });
    },
  },
  {
    name: "export_adaptation_receipt",
    description:
      "Export a compact, diagnosis-free functional receipt of the adaptations applied in this session, so the same preferences can be applied on the next participating website. Not stored by this site.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => {
      const snap = engine.getSnapshot();
      const page = PAGE_DESCRIPTORS[currentRoute()];
      try {
        const receipt = buildReceipt({
          origin_site: page.site_name,
          profile: { version: CONTRACT_VERSION, ...(snap.active as object) } as unknown as FunctionalProfile,
          adaptations_applied: snap.stats.adaptations_applied,
          refinements: snap.stats.refinements,
        });
        activity.push("export_adaptation_receipt", "Exported a diagnosis-free functional receipt.");
        return j({ ok: true, receipt });
      } catch (e) {
        return err("receipt_failed", e instanceof Error ? e.message : String(e));
      }
    },
  },
];

/* ------------------------------------------------------------------ */
/* Semantic page tools                                                */
/* ------------------------------------------------------------------ */

function productPriceLine(p: Product): string {
  const b = priceBreakdown(p);
  return `${p.name}: ${money(b.total)} total including shipping of ${money(b.shipping)}`;
}

function collectReadableText(scope: string): string {
  const route = currentRoute();
  if (route === "services") {
    if (scope === "requests") {
      return REQUESTS.map(
        (r) => `Request ${r.id}, ${r.task}. Status: ${r.status_label}. Next step: ${r.next_step}`,
      ).join("\n");
    }
    if (scope === "appointments") {
      return APPOINTMENTS.map(
        (a) => `${a.topic}, ${a.office}, on ${a.date} at ${a.time}, ${a.location}. ${a.slots} slots.`,
      ).join("\n");
    }
    return [
      "City of Meridian resident services portal.",
      `Tasks: ${SERVICE_TASKS.map((t) => t.title).join("; ")}.`,
      `Requests: ${REQUESTS.length} open. Appointments available: ${APPOINTMENTS.length}.`,
    ].join("\n");
  }
  if (scope === "comparison") {
    const ids = shopStore.get().compare;
    const list = ids.length ? ids.map((id) => findProduct(id)).filter(Boolean) : PRODUCTS.slice(0, 3);
    return (list as Product[]).map(productPriceLine).join("\n");
  }
  const list = filteredProducts().slice(0, 6);
  return [
    `Hearth & Signal electronics catalog, ${PRODUCTS.length} products.`,
    ...list.map(productPriceLine),
  ].join("\n");
}

const semanticTools: ToolDef[] = [
  {
    name: "explain_page",
    description:
      "Explain what this page is, who it is for, its main sections, achievable tasks, costs/risks and which WebMCP tools are available. Adjustable detail: brief or full.",
    inputSchema: {
      type: "object",
      properties: { detail_level: { type: "string", enum: ["brief", "full"] } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: (_pageId, args) => {
      const page = PAGE_DESCRIPTORS[currentRoute()];
      const brief = args.detail_level !== "full";
      const out = brief
        ? {
            ok: true, page_id: page.page_id, site_name: page.site_name,
            what: page.what, tasks: page.tasks.map((t) => t.description), costs: page.costs,
          }
        : page;
      activity.push("explain_page", `Explained the page (${brief ? "brief" : "full"}).`);
      return j({ ...out, tools_hint: "get_adaptation_capabilities, apply_adaptation_profile, adapt_for_task, measure_rendered_ui" });
    },
  },
  {
    name: "list_available_tasks",
    description:
      "List the user-level tasks this page offers (not DOM elements): each with id, description and the tool that serves it.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: () => {
      const page = PAGE_DESCRIPTORS[currentRoute()];
      return j({ ok: true, page_id: page.page_id, tasks: page.tasks });
    },
  },
  {
    name: "summarize_content",
    description:
      "Summarize page content. Params: scope (page|requests|appointments|comparison|products), detail_level (brief|full), reading_level (plain|standard), include_prices, include_warnings (booleans).",
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string", enum: ["page", "requests", "appointments", "comparison", "products"] },
        detail_level: { type: "string", enum: ["brief", "full"] },
        reading_level: { type: "string", enum: ["plain", "standard"] },
        include_prices: { type: "boolean" },
        include_warnings: { type: "boolean" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: (_pageId, args) => {
      const scope = String(args.scope ?? "page");
      const plain = args.reading_level === "plain";
      let summary: string;
      let warnings: string[] = [];
      if (scope === "requests") {
        summary = REQUESTS.map((r) => `${r.task} (${r.id}): ${r.status_label}. ${plain ? r.next_step : r.next_step}`).join(" | ");
        warnings = REQUESTS.filter((r) => r.status === "action_needed").map((r) => `${r.id}: ${r.next_step}`);
      } else if (scope === "appointments") {
        summary = APPOINTMENTS.map((a) => `${a.topic}: ${a.date} ${a.time}, ${a.location} (${a.slots} slots)`).join(" | ");
      } else if (scope === "comparison" || scope === "products") {
        const list = filteredProducts();
        summary = plain
          ? list.slice(0, 4).map((p) => `${p.name}. Costs ${money(p.price)}. ${p.plain_description}`).join(" | ")
          : list.slice(0, 6).map(productPriceLine).join(" | ");
        if (args.include_prices) {
          summary += ` Totals include shipping. Example: ${productPriceLine(list[0])}.`;
        }
      } else {
        const page = PAGE_DESCRIPTORS[currentRoute()];
        summary = plain ? `${page.site_name}. ${page.what}` : `${page.site_name}: ${page.what} Sections: ${page.main_sections.join(", ")}.`;
        if (args.include_warnings) warnings = [page.risks];
      }
      activity.push("summarize_content", `Summarized "${scope}" (${plain ? "plain" : "standard"}).`);
      return j({ ok: true, scope, summary, warnings: args.include_warnings === false ? [] : warnings });
    },
  },
  {
    name: "read_content",
    description:
      "Return structured, speakable text for a scope (page|requests|appointments|comparison|products). Optional speak:true starts LOCAL text-to-speech (Web Speech API) with pause/resume via the page; a text alternative always remains.",
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string", enum: ["page", "requests", "appointments", "comparison", "products"] },
        speak: { type: "boolean" },
        rate: { type: "number", minimum: 0.5, maximum: 2 },
      },
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const scope = String(args.scope ?? "page");
      const text = collectReadableText(scope);
      let speechState = "idle";
      if (args.speak === true) {
        if (speech.supported()) {
          speech.speak(text, { rate: typeof args.rate === "number" ? args.rate : undefined });
          speechState = speech.snapshot().status;
        } else {
          speechState = "unsupported";
        }
      }
      activity.push("read_content", `Prepared readable content for "${scope}"${args.speak ? " and started local speech" : ""}.`);
      return j({
        ok: true, scope, text, speech: { state: speechState, controls: "pause/resume/stop available on the page", text_alternative: true },
      });
    },
  },
  {
    name: "focus_task",
    description:
      "Temporarily reduce the interface to the elements needed for one task id (see list_available_tasks). Hidden parts stay in the DOM and come back via undo/reset or focus_task(null).",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: ["string", "null"], description: "Task id or null to unfocus" } },
      required: ["task_id"],
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const id = args.task_id === null ? null : String(args.task_id);
      focusStore.set(id);
      const page = PAGE_DESCRIPTORS[currentRoute()];
      const task = page.tasks.find((t) => t.id === id);
      engine.announceNow(`Focused on task: ${task?.description ?? id ?? "none"}`);
      activity.push("focus_task", id ? `Focused the page on task "${id}".` : "Removed task focus.");
      return j({
        ok: true, focused_task: id, known: Boolean(task),
        effect: id ? "Page reduced to the task's essential areas; everything else is collapsed but kept." : "Full page restored.",
        reversible: "undo_adaptation / reset_adaptations / focus_task(null)",
      });
    },
  },
];

/* ------------------------------------------------------------------ */
/* Domain tools (demo shop)                                           */
/* ------------------------------------------------------------------ */

const domainTools: ToolDef[] = [
  {
    name: "search_products",
    description: "Search the synthetic electronics catalog by free text (name, description, category, tags). Updates the visible product grid and returns matches with totals incl. shipping.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: (_pageId, args) => {
      const query = String(args.query ?? "");
      shopStore.setQuery(query);
      const results = filteredProducts().map(productSummary);
      activity.push("search_products", `Searched for "${query}" — ${results.length} matches.`);
      return j({ ok: true, query, count: results.length, results: results.slice(0, 8) });
    },
  },
  {
    name: "filter_products",
    description: "Filter the catalog: category, max_price (EUR), tag, sort (price_asc|price_desc|rating|relevance). Updates the visible grid deterministically.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string" },
        max_price: { type: "number" },
        tag: { type: "string" },
        sort: { type: "string", enum: ["relevance", "price_asc", "price_desc", "rating"] },
      },
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const s = shopStore.get();
      shopStore.setCategory(args.category !== undefined ? String(args.category) : s.category);
      if (args.max_price !== undefined) shopStore.setMaxPrice(Number(args.max_price));
      if (args.tag !== undefined) shopStore.setTag(String(args.tag));
      if (args.sort !== undefined) shopStore.setSort(args.sort as never);
      const results = filteredProducts().map(productSummary);
      activity.push("filter_products", `Applied filters — ${results.length} products shown.`, j(args));
      return j({ ok: true, applied: args, count: results.length, results: results.slice(0, 8) });
    },
  },
  {
    name: "get_product_details",
    description: "Full synthetic details for one product id: description, plain-language version, key points, specs, price components, stock (text+icon in UI), rating.",
    inputSchema: {
      type: "object",
      properties: { product_id: { type: "string" } },
      required: ["product_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: (_pageId, args) => {
      const p = findProduct(String(args.product_id ?? ""));
      if (!p) return err("not_found", `No product "${String(args.product_id)}". Use search_products first.`);
      const breakdown = priceBreakdown(p);
      const coupons = validCoupons(p).map((c) => c.code);
      activity.push("get_product_details", `Fetched details for ${p.name}.`);
      return j({
        ok: true, product: {
          ...p, specs: p.specs,
          price_breakdown: { ...breakdown, explanation: `${money(breakdown.item_price)} item + ${money(breakdown.shipping)} shipping${breakdown.fees ? ` + ${money(breakdown.fees)} handling fee` : ""} = ${money(breakdown.total)} total` },
          valid_coupons: coupons,
        },
      });
    },
  },
  {
    name: "compare_products",
    description: "Structured comparison of 2–4 product ids across price components, key specs and ratings. Highlights the meaningful differences instead of colour-coding them.",
    inputSchema: {
      type: "object",
      properties: { product_ids: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 } },
      required: ["product_ids"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: (_pageId, args) => {
      const ids = (args.product_ids as string[] | undefined) ?? shopStore.get().compare;
      const products = (ids ?? []).map((id) => findProduct(id)).filter(Boolean) as Product[];
      if (products.length < 2) return err("need_two", "Provide 2–4 known product ids (use search_products).");
      const rows = Object.keys(products[0].specs).map((spec) => ({
        spec, values: products.map((p) => p.specs[spec] ?? "—"),
      }));
      const totals = products.map((p) => ({ id: p.id, name: p.name, ...priceBreakdown(p), rating: p.rating }));
      const cheapest = [...totals].sort((a, b) => a.total - b.total)[0];
      activity.push("compare_products", `Compared ${products.length} products.`);
      return j({
        ok: true,
        products: products.map((p) => p.name),
        price_rows: totals,
        spec_rows: rows,
        cheapest_total: { id: cheapest.id, total: cheapest.total },
        note: "Differences are stated in words; nothing relies on colour alone.",
      });
    },
  },
  {
    name: "explain_price",
    description: "Explain one product's REAL total price: item price, original price, discount, shipping, fees, coupon savings and final total — the answer to 'what does it really cost?'.",
    inputSchema: {
      type: "object",
      properties: { product_id: { type: "string" }, coupon_code: { type: "string" } },
      required: ["product_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: (_pageId, args) => {
      const p = findProduct(String(args.product_id ?? ""));
      if (!p) return err("not_found", `No product "${String(args.product_id)}".`);
      const coupon = args.coupon_code ? findCoupon(String(args.coupon_code)) ?? null : shopStore.get().active_coupon ? findCoupon(shopStore.get().active_coupon!) ?? null : null;
      const b = priceBreakdown(p, coupon ?? undefined);
      const lines = [
        `Item price: ${money(b.item_price)}`,
        b.original_price ? `Original price: ${money(b.original_price)} (you save ${money(b.discount)})` : null,
        `Shipping: ${b.shipping === 0 ? "free" : money(b.shipping)}`,
        b.fees ? `Handling fee: ${money(b.fees)}` : null,
        b.coupon_savings ? `Coupon ${b.coupon_code}: −${money(b.coupon_savings)}` : null,
        `FINAL TOTAL: ${money(b.total)} — everything included.`,
      ].filter(Boolean);
      activity.push("explain_price", `Explained the full price of ${p.name}: ${money(b.total)} total.`);
      return j({ ok: true, product: p.name, currency: "EUR", breakdown: b, plain_explanation: lines.join(". ") });
    },
  },
  {
    name: "calculate_total_cost",
    description: "Deterministic total cost for a cart: items [{product_id, qty}], optional coupon_code. Item prices, shipping, fees and coupon savings computed exactly.",
    inputSchema: {
      type: "object",
      properties: {
        items: { type: "array", items: { type: "object", properties: { product_id: { type: "string" }, qty: { type: "number", minimum: 1 } }, required: ["product_id"] } },
        coupon_code: { type: "string" },
      },
      required: ["items"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: (_pageId, args) => {
      const items = (args.items as { product_id: string; qty?: number }[] | undefined) ?? [];
      if (!items.length) return err("missing_items", "Provide at least one item.");
      const coupon = args.coupon_code ? findCoupon(String(args.coupon_code)) : null;
      let subtotal = 0, shipping = 0, fees = 0, couponTotal = 0;
      const lines: Record<string, unknown>[] = [];
      for (const item of items) {
        const p = findProduct(item.product_id);
        if (!p) return err("not_found", `Unknown product "${item.product_id}".`);
        const b = priceBreakdown(p, coupon, item.qty ?? 1);
        subtotal += b.item_price; shipping += b.shipping; fees += b.fees; couponTotal += b.coupon_savings;
        lines.push({ product_id: p.id, name: p.name, qty: item.qty ?? 1, total_incl_shipping: b.total });
      }
      subtotal = Math.round(subtotal * 100) / 100;
      shipping = Math.round(shipping * 100) / 100;
      fees = Math.round(fees * 100) / 100;
      const total = Math.round((subtotal + shipping + fees - couponTotal) * 100) / 100;
      activity.push("calculate_total_cost", `Calculated a cart total of ${money(total)}.`);
      return j({
        ok: true, currency: "EUR", lines, item_subtotal: subtotal, shipping, fees,
        coupon_savings: Math.round(couponTotal * 100) / 100, grand_total: total,
        plain: `Everything included, the total is ${money(total)}.`,
      });
    },
  },
  {
    name: "find_available_coupons",
    description: "List currently VALID coupons only (deterministic synthetic data — never invent codes). Optionally restricted to one product's category.",
    inputSchema: {
      type: "object",
      properties: { product_id: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
    run: (_pageId, args) => {
      const p = args.product_id ? findProduct(String(args.product_id)) : undefined;
      const coupons = validCoupons(p).map((c) => ({
        code: c.code, description: c.description, kind: c.kind, value: c.value,
        min_cart: c.min_cart ?? null, applies_to: c.applies_to_category ?? "any product", expires: c.expires,
      }));
      activity.push("find_available_coupons", `Found ${coupons.length} valid coupons.`);
      return j({ ok: true, coupons, note: "Only these codes are real. Anything else must not be applied." });
    },
  },
  {
    name: "apply_coupon",
    description: "Validate and apply a coupon code to the visible cart preview. Invalid or expired codes are rejected with a plain-language reason (never guessed).",
    inputSchema: {
      type: "object",
      properties: { code: { type: "string" } },
      required: ["code"],
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const code = String(args.code ?? "").toUpperCase();
      const coupon = findCoupon(code);
      if (!coupon || !COUPONS.includes(coupon)) return j({ ok: false, code: "unknown_coupon", error: `Coupon "${code}" does not exist. Call find_available_coupons for real codes.` });
      const now = new Date();
      if (!coupon.valid || new Date(coupon.expires) < now) return j({ ok: false, code: "expired_coupon", error: `Coupon "${code}" expired on ${coupon.expires}.` });
      shopStore.setActiveCoupon(coupon.code);
      activity.push("apply_coupon", `Applied coupon ${coupon.code}.`);
      return j({ ok: true, applied: coupon.code, description: coupon.description, note: "Savings appear in the visible cart preview and in explain_price." });
    },
  },
  {
    name: "read_comparison",
    description: "Speakable, structured reading of the current comparison (or 2–4 given ids): names, totals incl. shipping, the two most important differences. Optionally starts local speech.",
    inputSchema: {
      type: "object",
      properties: { product_ids: { type: "array", items: { type: "string" } }, speak: { type: "boolean" } },
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const ids = (args.product_ids as string[] | undefined) ?? shopStore.get().compare;
      const products = ((ids ?? []).map((id) => findProduct(id)).filter(Boolean)) as Product[];
      const list = products.length >= 2 ? products : filteredProducts().slice(0, 2);
      if (list.length < 2) return err("need_two", "Select or provide two products first.");
      const totals = list.map((p) => ({ name: p.name, total: priceBreakdown(p).total, rating: p.rating }));
      const cheapest = [...totals].sort((a, b) => a.total - b.total)[0];
      const bestRated = [...totals].sort((a, b) => b.rating - a.rating)[0];
      const text = `Comparing ${list.map((p) => p.name).join(" and ")}. ` +
        list.map((p) => productPriceLine(p)).join(". ") + ". " +
        `${cheapest.name} has the lowest total at ${money(cheapest.total)}. ` +
        `${bestRated.name} has the higher rating with ${bestRated.rating} of 5.`;
      if (args.speak === true && speech.supported()) speech.speak(text);
      activity.push("read_comparison", `Read a comparison of ${list.length} products${args.speak ? " aloud" : ""}.`);
      return j({ ok: true, text, totals, verdict: { cheapest: cheapest.name, best_rated: bestRated.name } });
    },
  },
  {
    name: "prepare_cart_change",
    description:
      "STAGE a cart change (product_id + qty). Nothing is added until the human confirms visibly in the page. Returns a preview the agent can describe; the site always keeps the confirmation.",
    inputSchema: {
      type: "object",
      properties: { product_id: { type: "string" }, qty: { type: "number", minimum: 1, maximum: 9 } },
      required: ["product_id"],
      additionalProperties: false,
    },
    run: (_pageId, args) => {
      const p = findProduct(String(args.product_id ?? ""));
      if (!p) return err("not_found", `No product "${String(args.product_id)}".`);
      const qty = Math.max(1, Math.min(9, Number(args.qty ?? 1)));
      const staged = shopStore.stageAdd(p.id, qty);
      engine.announceNow(`Cart change staged: ${qty}× ${p.name}. Awaiting your confirmation.`);
      activity.push("prepare_cart_change", `Staged ${qty}× ${p.name} — waiting for human confirmation.`);
      return j({
        ok: true, staged: true, product: p.name, qty, preview_total: money(staged!.total),
        requires: "explicit human confirmation in the page (button) — the agent cannot confirm for the user",
        cancel: "undo_cart_change",
      });
    },
  },
  {
    name: "undo_cart_change",
    description: "Undo the last cart change: cancels a staged change or removes the most recent confirmed cart item.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () => {
      const removed = shopStore.undoLastCartChange();
      activity.push("undo_cart_change", removed ? "Undid the last cart change." : "Cart already empty.");
      return removed
        ? j({ ok: true, removed, cart_size: shopStore.get().cart.length })
        : j({ ok: true, removed: null, note: "Nothing to undo; the cart is empty and nothing is staged." });
    },
  },
];

export const ALL_TOOLS: ToolDef[] = [...universalTools, ...semanticTools, ...domainTools];

/** Dispatch used by BOTH the WebMCP bridge and the dev harness. */
export async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  pageId?: string,
): Promise<string> {
  const def = ALL_TOOLS.find((t) => t.name === name);
  if (!def) return err("unknown_tool", `Unknown tool "${name}".`);
  const scan = scanForDiagnosisTerms(args);
  if (!scan.ok) {
    activity.push(name, "Blocked: arguments contained diagnosis-like terms.");
    return j({ ok: false, code: "privacy_violation", error: "Arguments contain diagnosis-like terms; refused.", findings: scan.findings.map((f) => f.where) });
  }
  try {
    return await def.run(pageId ?? activePageId(), args ?? {});
  } catch (e) {
    return err("internal_error", `Tool "${name}" failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
