/** Landing: one clear promise, one guided proof, then the technical truth. */

import type { Route } from "../App";
import { IconCheck, IconLock, IconReceipt, IconRobot, IconRuler, IconSpark } from "../components/Icons";

interface LandingProps {
  onNavigate: (route: Route) => void;
  onStartProof: () => void;
}

export default function Landing({ onNavigate, onStartProof }: LandingProps) {
  return (
    <main className="wrap landing" id="main" tabIndex={-1}>
      <header className="landing-hero">
        <h1>
          As&nbsp;I&nbsp;Am
          <span className="landing-tagline">The web adapts. You don’t have to.</span>
        </h1>
        <p className="landing-lede">
          People should not have to re-explain how they use the web on every site. <strong>As I Am</strong>
          {" "}lets a private agent negotiate a functional fit with participating websites — then checks
          the rendered result instead of merely trusting that a setting was applied.
        </p>
        <div className="landing-actions" data-aia="actions">
          <button type="button" className="btn btn--primary landing-proof-cta" onClick={onStartProof}>
            <IconSpark size={18} /> Run the 90-second proof
          </button>
          <a href="#how-it-works">See how the contract works</a>
        </div>
        <p className="landing-caption">Live UI · real tool calls · measured before and after · no setup required</p>
      </header>

      <figure className="landing-claim">
        <blockquote>
          “Your agent can know you. The website only needs to know what to change.”
        </blockquote>
      </figure>

      <section className="landing-contract" id="how-it-works" aria-labelledby="contract-title">
        <h2 id="contract-title">A small contract creates a complete feedback loop.</h2>
        <p className="landing-section-lede">
          The website stays in control of its own design system. The agent supplies closed-schema
          functional preferences, and the browser supplies evidence.
        </p>
        <ol className="contract-flow">
          <li>
            <span className="contract-flow__mark"><IconLock size={18} /></span>
            <div><strong>Keep context private</strong><span>The personal reason stays with the agent.</span></div>
          </li>
          <li>
            <span className="contract-flow__mark"><IconRobot size={18} /></span>
            <div><strong>Discover capabilities</strong><span>The agent asks what this page can honestly adapt.</span></div>
          </li>
          <li>
            <span className="contract-flow__mark"><IconSpark size={18} /></span>
            <div><strong>Apply functional values</strong><span>Text scale, target size, motion and cognitive support.</span></div>
          </li>
          <li>
            <span className="contract-flow__mark"><IconRuler size={18} /></span>
            <div><strong>Measure and refine</strong><span>The rendered DOM is checked against the request.</span></div>
          </li>
          <li>
            <span className="contract-flow__mark"><IconReceipt size={18} /></span>
            <div><strong>Carry the fit forward</strong><span>The next participating surface validates and negotiates a functional receipt.</span></div>
          </li>
        </ol>
      </section>

      <section className="landing-proof-points" aria-labelledby="proof-points-title">
        <div>
          <h2 id="proof-points-title">What the prototype proves today</h2>
          <ul>
            <li><IconCheck size={16} /> One WebMCP contract works across two visibly different product surfaces.</li>
            <li><IconCheck size={16} /> Tool payloads reject unknown fields and protected health terms.</li>
            <li><IconCheck size={16} /> Adaptation, refinement, receipt export/import, undo and reset share one validated path.</li>
            <li><IconCheck size={16} /> Fit is graded from rendered measurements, with unmet values reported.</li>
          </ul>
        </div>
        <aside>
          <h3>Why this matters</h3>
          <p>
            Accessibility preferences become portable without sending a medical profile to the website.
            Sites gain an explicit, testable interface for adaptation; people get continuity and control.
          </p>
        </aside>
      </section>

      <section className="landing-demos" aria-labelledby="demos-title">
        <h2 id="demos-title">Explore both product surfaces.</h2>
        <div className="landing-demo-list">
          <a href="/shop" onClick={(event) => { event.preventDefault(); onNavigate("shop"); }} data-testid="landing-shop-link">
            <span><strong>Hearth &amp; Signal</strong><small>Dense product comparison, filters, coupons and a staged cart.</small></span>
            <b>Open shop demo</b>
          </a>
          <a href="/services" onClick={(event) => { event.preventDefault(); onNavigate("services"); }} data-testid="landing-services-link">
            <span><strong>City of Meridian</strong><small>Forms, request statuses, appointments and step-by-step support.</small></span>
            <b>Open services demo</b>
          </a>
        </div>
      </section>

      <section className="landing-truth" aria-labelledby="truth-title">
        <div>
          <h2 id="truth-title">Privacy and scope, without hand-waving.</h2>
          <p>
            This prototype uses synthetic data and session memory only: no cookies, localStorage,
            analytics or profile values in URLs. The guided proof visibly separates its simulated
            private-agent context from the exact payload sent to the website.
          </p>
        </div>
        <div>
          <h3>Honest limits</h3>
          <ul>
            <li>A site must implement the contract; this does not restyle arbitrary websites.</li>
            <li>WebMCP complements semantic HTML, WCAG and assistive technology. It does not replace them.</li>
            <li>The two sites are prototype routes in one app; independent origins are the next deployment milestone.</li>
            <li>Native WebMCP needs a compatible experimental browser. The built-in harness exercises the same handlers everywhere.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
