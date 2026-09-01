/** Landing: the pitch, the privacy model, honest limits, demo links. */

import type { Route } from "../App";

export default function Landing({ onNavigate }: { onNavigate: (r: Route) => void }) {
  return (
    <div className="wrap" id="main" tabIndex={-1}>
      <header style={{ paddingBlock: "3.5rem 2rem", maxWidth: "58rem" }}>
        <p style={{ letterSpacing: "0.22em", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--ink-faint)", margin: 0 }}>
          OpenAI WebMCP Challenge 2026 · Demo
        </p>
        <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.2rem)", margin: "0.2em 0 0.15em" }}>
          As&nbsp;I&nbsp;Am
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.35rem", color: "var(--ink-soft)", margin: 0 }}>
          The web adapts. You don’t have to.
        </p>
      </header>

      <section aria-labelledby="pitch" className="prose" style={{ paddingBlockEnd: "1.5rem" }}>
        <h2 id="pitch">One private profile. Every participating website adapts.</h2>
        <p>
          Your personal agent can know what you need — larger text, bigger targets, less motion,
          plain language. Websites know what they can adapt. <strong>As I Am</strong> is a working
          contract between the two: the agent sends <em>functional preferences only</em>, the website
          applies, <em>measures</em> and reports back — no diagnoses, no tracking, everything undoable.
        </p>
        <p style={{ fontSize: "1.1rem" }} className="aia-important">
          “Your agent knows you. This website only receives what it needs to adapt.”
        </p>
      </section>

      <section aria-labelledby="try" style={{ paddingBlockEnd: "1.5rem" }}>
        <h2 id="try">Two different sites, the same contract</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <div className="card" style={{ padding: "1.2rem" }}>
            <h3>Hearth &amp; Signal — a dense electronics shop</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
              Product cards, filters, comparison table, coupons, cart simulation. Watch it transform
              under the “Precision &amp; readability” profile — then say the text is still too small
              and watch the agent refine and re-measure.
            </p>
            <a className="btn btn--primary" href="/shop" onClick={(e) => { e.preventDefault(); onNavigate("shop"); }}>
              Open the shop demo →
            </a>
          </div>
          <div className="card" style={{ padding: "1.2rem" }}>
            <h3>City of Meridian — a resident services portal</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
              A completely different layout: forms, deadlines, request statuses, appointments. The
              same profile from the shop adapts this site too — “Preference profile applied without
              sharing a diagnosis.”
            </p>
            <a className="btn btn--primary" href="/services" onClick={(e) => { e.preventDefault(); onNavigate("services"); }}>
              Open the services demo →
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="privacy" className="prose" style={{ paddingBlockEnd: "1.5rem" }}>
        <h2 id="privacy">The privacy model in one paragraph</h2>
        <p>
          No tool accepts diagnoses — the schemas only contain functional parameters. Payloads are
          scanned and refused if they contain diagnosis-like terms. Nothing is stored: no cookies,
          no localStorage, no analytics, no profile values in URLs. The panel on every demo site
          shows <em>exactly</em> which functional values the site received. Export is a
          diagnosis-free receipt your agent can carry to the next website.
        </p>
      </section>

      <section aria-labelledby="limits" className="prose" style={{ paddingBlockEnd: "3.5rem" }}>
        <h2 id="limits">Honest limits</h2>
        <ul>
          <li>No magic: a website must implement the Adaptive Web Contract — we cannot restyle arbitrary sites.</li>
          <li>WebMCP complements, never replaces, semantic HTML, WCAG and assistive technology.</li>
          <li>All data is synthetic; no real purchases, no real accounts.</li>
          <li>WebMCP needs Chrome 149+ with <code>chrome://flags/#enable-webmcp-testing</code>. Without it, use <code>?agent=1</code>.</li>
        </ul>
      </section>
    </div>
  );
}
