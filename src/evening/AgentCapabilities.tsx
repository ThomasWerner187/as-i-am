import { useState } from "react";
import { toolsForEvening } from "../adaptive-contract/tools";
import { siteUrl } from "./config";
import type { EveningSite } from "./state";

export default function AgentCapabilities({ site, nativeCount }: { site: EveningSite; nativeCount: number }) {
  const [copyStatus, setCopyStatus] = useState("");
  const tools = toolsForEvening(site);
  const cinema = site === "cinema";
  const request = cinema
    ? `Open ${siteUrl(site, false)} and discover its WebMCP tools. Ask which display settings, date, film time, seat row, aisle preference and total budget I want. Use only preferences I explicitly choose. Apply supported display settings and verify them. Read the listed showings and available adjacent seat pairs, then show a matching pair for my review. Preserve my existing choices unless I ask to change them. Leave final ticket confirmation to me. All bookings are synthetic.`
    : `Open ${siteUrl(site, false)} and discover its WebMCP tools. Ask which display settings, dinner date, film time, table preference, diet, per-dish budget, favorite and ingredient exclusions I want. Use only preferences I explicitly choose. Apply supported display settings and verify them. Research the declared menu and dinner times, show up to three matching dishes, and prepare a table for my review. Keep ingredient uncertainty and kitchen confirmation visible; never infer allergy safety. Preserve existing choices unless I ask to change them. Leave final table confirmation to me. All bookings are synthetic.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(request);
      setCopyStatus("Agent request copied.");
    } catch {
      setCopyStatus("Select and copy the request below.");
    }
  }

  return (
    <details className="venue-agent" onKeyDown={event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus();
    }}>
      <summary>Agent-friendly <span>{tools.length} tools</span></summary>
      <div className="venue-agent-panel">
        <h2>What an agent can do here</h2>
        <p className="venue-agent-connection">{nativeCount > 0
          ? `Native WebMCP connected · ${nativeCount} tools registered`
          : "Native WebMCP requires a compatible browser. You can still use this page yourself."}</p>
        <ul>
          <li>Adapt the page, check the result and restore your original view.</li>
          {cinema ? <>
            <li>Find available dates, showtimes and adjacent seat pairs.</li>
            <li>Prepare a ticket review using your row, aisle and price preferences.</li>
          </> : <>
            <li>Filter the declared menu by diet, budget and explicit ingredient exclusions.</li>
            <li>Plan dinner before your film and prepare a table review.</li>
          </>}
        </ul>
        <p>You keep the final confirmation. The agent does not make a real booking.</p>
        <details className="venue-tool-list">
          <summary>All {tools.length} tool names</summary>
          <ul>{tools.map(tool => <li key={tool.name}><code>{tool.name}</code></li>)}</ul>
        </details>
        <label className="venue-agent-request">
          <span>Request for your agent</span>
          <textarea readOnly value={request} rows={5} />
        </label>
        <button type="button" onClick={() => void copy()}>Copy an agent request</button>
        <p role="status" aria-live="polite">{copyStatus}</p>
      </div>
    </details>
  );
}
