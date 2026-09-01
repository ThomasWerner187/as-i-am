/** Landing: the pitch, the privacy model, honest limits, demo links. */

import type { Route } from "../App";

export default function Landing({ onNavigate }: { onNavigate: (r: Route) => void }) {
  return (
    <div className="wrap landing" id="main" tabIndex={-1}>
      <header className="landing-hero">
        <h1>
          As&nbsp;I&nbsp;Am
          <span className="landing-tagline">The web adapts. You don’t have to.</span>
        </h1>
        <p className="landing-lede">
          Your agent can know what you need — larger text, bigger targets, less motion, plain
          language. Websites know what they can adapt. <strong>As I Am</strong> is a working
          contract between the two: the agent sends functional preferences only, the website
          applies, <em>measures</em> and reports back — no diagnoses, no tracking, everything
          undoable.
        </p>
        <figure className="landing-claim">
          <blockquote>
            “Your agent knows you. This website only receives what it needs to adapt.”
          </blockquote>
        </figure>
      </header>

      <section aria-labelledby="try" className="landing-demos">
        <h2>Two different sites. The same contract.</h2>
        <div className="landing-grid">
          <a
            className="landing-demo-card card"
            href="/shop"
            onClick={(e) => { e.preventDefault(); onNavigate("shop"); }}
            data-testid="landing-shop-link"
          >
            <span className="landing-demo-meta">Demo 1 · Comparison shop</span>
            <span className="landing-demo-title">Hearth &amp; Signal</span>
            <span className="landing-demo-desc">
              A dense electronics store — filters, comparison table, coupons, cart simulation.
              Apply the “Precision &amp; readability” profile, then say the text is still too
              small and watch the agent refine and re-measure.
            </span>
            <span className="landing-demo-go">Open the shop demo →</span>
          </a>
          <a
            className="landing-demo-card card"
            href="/services"
            onClick={(e) => { e.preventDefault(); onNavigate("services"); }}
            data-testid="landing-services-link"
          >
            <span className="landing-demo-meta">Demo 2 · Resident services</span>
            <span className="landing-demo-title">City of Meridian</span>
            <span className="landing-demo-desc">
              A completely different layout — forms, deadlines, request statuses, appointments.
              The same profile from the shop adapts this site too, without sharing a diagnosis.
            </span>
            <span className="landing-demo-go">Open the services demo →</span>
          </a>
        </div>
      </section>

      <section aria-labelledby="privacy" className="landing-privacy prose">
        <h2>Privacy, in one paragraph</h2>
        <p>
          No tool accepts diagnoses — the schemas only contain functional parameters. Payloads are
          scanned and refused if they contain diagnosis-like terms. Nothing is stored: no cookies,
          no localStorage, no analytics, no profile values in URLs. The panel on every demo site
          shows exactly which functional values the site received. Export is a diagnosis-free
          receipt your agent carries to the next website.
        </p>
      </section>

      <section aria-labelledby="limits" className="landing-limits prose">
        <h2>Honest limits</h2>
        <ul>
          <li>No magic: a website must implement the Adaptive Web Contract — we cannot restyle arbitrary sites.</li>
          <li>WebMCP complements, never replaces, semantic HTML, WCAG and assistive technology.</li>
          <li>All data is synthetic; no real purchases, no real accounts.</li>
          <li>
            WebMCP needs Chrome 149+ with <code>chrome://flags/#enable-webmcp-testing</code>. Without
            it, every tool is testable via the built-in harness at <code>?agent=1</code>.
          </li>
        </ul>
      </section>
    </div>
  );
}
