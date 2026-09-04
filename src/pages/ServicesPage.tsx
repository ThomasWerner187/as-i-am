/** City of Meridian — Resident Services. A deliberately different layout:
 *  official, form-led, multi-pane — same Adaptive Web Contract underneath. */

import { useEffect, useState } from "react";
import { MainNav, ReadingText } from "../components/SiteChrome";
import { ProgressLine, StatusPill, useEngineState } from "../components/Primitives";
import { IconPhone, IconInfo, IconHourglass } from "../components/Icons";
import { APPOINTMENTS, HELP_TOPICS, PERMIT_FORM_STEPS, REQUESTS, SERVICE_ANNOUNCEMENTS, SERVICE_TASKS } from "../data/services";
import { FOCUS_TASK_LABELS, focusRegionForTask, focusStore, useFocusedTask } from "../data/shopState";
import { activity } from "../data/activityStore";
import type { Route } from "../App";

export default function ServicesPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const snap = useEngineState();
  const focused = useFocusedTask();
  const focusRegion = focusRegionForTask(focused);
  const serviceFocus = focusRegion && ["page", "permit-form", "requests", "appointments"].includes(focusRegion)
    ? focusRegion
    : null;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const density = snap.active.cognitive?.information_density;
  const plainErrors = snap.active.cognitive?.plain_error_messages === true;
  const stepsOn = snap.active.cognitive?.step_by_step === true;
  const progressOn = snap.active.cognitive?.progress_indicators === true || stepsOn;

  useEffect(() => {
    if (focused !== "complete_form") return;
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-testid="focus-banner"]')?.scrollIntoView({ block: "start" });
      document.getElementById("form-title")?.focus({ preventScroll: true });
    });
  }, [focused]);

  function updateField(id: string, value: string) {
    setForm((current) => ({ ...current, [id]: value }));
    setErrors((current) => {
      if (!current[id]) return current;
      const nextErrors = { ...current };
      delete nextErrors[id];
      return nextErrors;
    });
  }

  function validateCurrentStep(): boolean {
    const def = PERMIT_FORM_STEPS[step - 1];
    const errs: Record<string, string> = {};
    for (const field of def.fields) {
      if (field.type === "checkbox") {
        if (field.required && form[field.id] !== "yes") errs[field.id] = plainErrors ? "Please tick the box to continue." : "Field must be confirmed.";
      } else if (field.required && !form[field.id]?.trim()) {
        errs[field.id] = plainErrors ? "This field is empty — please fill it in." : "Required field.";
      }
    }
    setErrors(errs);
    const firstInvalid = Object.keys(errs)[0];
    if (firstInvalid) requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus());
    return Object.keys(errs).length === 0;
  }

  function moveToStep(nextStep: number) {
    setStep(nextStep);
    setErrors({});
    requestAnimationFrame(() => document.getElementById("form-step-title")?.focus());
  }

  function next() {
    if (!validateCurrentStep()) return;
    if (step < PERMIT_FORM_STEPS.length) {
      moveToStep(step + 1);
      activity.push("ui", `Form: moved to step ${step + 1}.`);
    } else {
      setSubmitted(true);
      activity.push("ui", "Application submitted (simulated — demo only).");
    }
  }

  const showIntro = serviceFocus === null || serviceFocus === "page";
  const showTasks = serviceFocus === null;
  const showForm = serviceFocus === null || serviceFocus === "permit-form";
  const showHelp = serviceFocus === null || serviceFocus === "page";
  const showRequests = serviceFocus === null || serviceFocus === "requests";
  const showAppointments = serviceFocus === null || serviceFocus === "appointments";
  const showAside = showRequests || showAppointments;
  const focusedLayoutClass = serviceFocus === "requests" || serviceFocus === "appointments"
    ? " services-layout--focused-aside"
    : serviceFocus !== null
      ? " services-layout--focused-main"
      : "";

  return (
    <div id="main" tabIndex={-1}>
      <div className="gov-banner">
        <div className="wrap">
          <span>City of Meridian — official resident portal</span>
          <span style={{ marginInlineStart: "auto" }}>DE-EN · Accessibility statement · Contact</span>
        </div>
      </div>

      <header className="gov-header">
        <div className="wrap">
          <div className="coat">
            <svg className="shield" viewBox="0 0 44 52" aria-hidden="true">
              <path d="M2 2 h40 v28 c0 12 -10 18 -20 20 C12 48 2 42 2 30 z" fill="var(--accent)" />
              <path d="M22 10 l4 8 9 1 -6.5 6 1.5 9 -8 -4.5 -8 4.5 1.5 -9 -6.5 -6 9 -1 z" fill="var(--paper-raised)" />
            </svg>
            <div className="gov-title">
              <div className="site">City of Meridian</div>
              <div className="sub">Resident Services</div>
            </div>
          </div>
          <nav className="gov-nav" aria-label="Portal sections" data-testid="secondary-nav">
            <h2>Services</h2>
            <MainNav
              label="Portal main"
              items={[
                { label: "All services", href: "#" },
                { label: "Mobility & parking", href: "#" },
                { label: "Waste & environment", href: "#" },
                { label: "Library", href: "#" },
                { label: "Citizen centre", href: "#" },
                { label: "Housing", href: "#" },
                { label: "Business", href: "#" },
                { label: "Fees & forms", href: "#" },
              ]}
            />
            <h2 style={{ marginTop: "0.6rem" }}>Quick links</h2>
            <ul className="aia-secondary-nav" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: "var(--aia-target-gap)", flexWrap: "wrap" }}>
              {["Forms A–Z", "Office hours", "Fees", "Appointments", "News"].map((l) => (
                <li key={l}>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ display: "inline-flex", alignItems: "center", minHeight: "var(--aia-target-min)" }}>{l}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="gov-aside aia-aside-block">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4em" }}><IconPhone size={15} /> 0800 555 0199 (Mon–Fri 8–18)</span>
            <a href="#" onClick={(e) => e.preventDefault()}>My requests ({REQUESTS.length})</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Log in</a>
            <span>Last update: 2026-09-01</span>
          </div>
        </div>
      </header>

      {focused && serviceFocus && serviceFocus !== "page" && (
        <div className="wrap" data-testid="focus-banner">
          <div className="card focus-banner">
            <span data-aia="focus-note">
              Focused on task: <strong>{FOCUS_TASK_LABELS[focused]}</strong> — unrelated portal sections are temporarily collapsed, never deleted.
            </span>
            <button type="button" className="btn btn--small" onClick={() => focusStore.set(null)}>Exit focus</button>
          </div>
        </div>
      )}

      <div className={`wrap services-layout${focusedLayoutClass}`}>
        <div>
          <div hidden={!showIntro}>
            <h1 style={{ fontSize: "1.9rem" }}>Your city services online</h1>
            <p className="prose" style={{ color: "var(--ink-soft)" }}>
              Apply, track and manage resident services. Processing times and fees are stated
              before you submit anything.
            </p>
          </div>

          <div className="announcements aia-promo" data-aia-essential="false" aria-label="Announcements" hidden={!showIntro}>
            {SERVICE_ANNOUNCEMENTS.map((a) => (
              <p className="announcement" key={a.id}>
                <span aria-hidden="true" style={{ display: "inline-flex", flex: "none" }}><IconInfo size={16} /></span> {a.text}
              </p>
            ))}
          </div>

          {/* Service tasks */}
          <section className="task-list" aria-labelledby="tasks-title" hidden={!showTasks} data-testid="service-tasks">
            <h2 id="tasks-title">Popular services</h2>
            {SERVICE_TASKS.map((t) => (
              <article className="card task-card" key={t.id}>
                <h3>{t.title}</h3>
                <ReadingText original={t.summary} plain={t.plain_summary} />
                <div className="meta">
                  <span>Office: {t.office}</span>
                  <span>Fee: {t.fee === null ? "—" : t.fee === 0 ? "free" : `€${t.fee.toFixed(2)}`}</span>
                </div>
                <p className="deadline-box" style={{ display: "flex", gap: "0.5em", alignItems: "baseline" }}>
                  <IconHourglass size={15} className="deadline-icon" /> {t.deadline_note}
                </p>
                {focused === "complete_form" && t.id === "parking-permit" ? null : (
                  <div data-aia="actions">
                    <button type="button" className="btn btn--small btn--primary" onClick={() => {
                      focusStore.set("complete_form");
                      setStep(1);
                      setErrors({});
                    }}>
                      Start application
                    </button>
                    <button type="button" className="btn btn--small" onClick={() => activity.push("ui", `Opened details for ${t.title} (demo).`)}>
                      More information
                    </button>
                  </div>
                )}
              </article>
            ))}
          </section>

          {/* Multi-step permit form */}
          <section
            className="aia-step-panel card"
            id="permit-form"
            aria-labelledby="form-title"
            hidden={!showForm}
            data-testid="permit-form"
            style={{ marginTop: "1.4rem" }}
          >
            <h2 id="form-title" tabIndex={-1}>Apply: resident parking permit (zone B)</h2>
            {progressOn && <ProgressLine current={submitted ? PERMIT_FORM_STEPS.length : step} total={PERMIT_FORM_STEPS.length} label="Application progress" />}
            {submitted ? (
              <div className="deadline-box" data-testid="form-success" role="status">
                ✔ Application received (simulation). Reference: <strong>REQ-20455</strong>. You can find it under “My requests”.
              </div>
            ) : (
              <form noValidate onSubmit={(e) => { e.preventDefault(); next(); }}>
                <ol className="form-steps">
                  {PERMIT_FORM_STEPS.map((s, i) => (
                    <li key={s.id} aria-current={step === i + 1 ? "step" : undefined}>
                      <span className="step-no">{i + 1}</span> {s.title}
                    </li>
                  ))}
                </ol>
                <p className="required-note">Every field marked “(required)” must be completed before you continue.</p>
                <h3 id="form-step-title" tabIndex={-1}>{PERMIT_FORM_STEPS[step - 1].title}</h3>
                {PERMIT_FORM_STEPS[step - 1].fields.map((f) => {
                  if (f.type === "select") {
                    const errorId = `${f.id}-error`;
                    return (
                      <div className="field" key={f.id}>
                        <label htmlFor={f.id}>{f.label}{f.required && <span className="required-marker"> (required)</span>}</label>
                        <select
                          id={f.id}
                          value={form[f.id] ?? ""}
                          required={f.required}
                          aria-invalid={errors[f.id] ? "true" : "false"}
                          aria-describedby={errors[f.id] ? errorId : undefined}
                          onChange={(e) => updateField(f.id, e.target.value)}
                        >
                          <option value="">Please choose…</option>
                          {f.options.map((o) => <option key={o}>{o}</option>)}
                        </select>
                        {errors[f.id] && <span className="error" id={errorId} role="alert">{errors[f.id]}</span>}
                      </div>
                    );
                  }
                  if (f.type === "checkbox") {
                    const hintId = `${f.id}-hint`;
                    const errorId = `${f.id}-error`;
                    return (
                      <div className="field" key={f.id}>
                        <label className="checkbox-label" htmlFor={f.id}>
                          <input
                            id={f.id}
                            type="checkbox"
                            checked={form[f.id] === "yes"}
                            required={f.required}
                            aria-invalid={errors[f.id] ? "true" : "false"}
                            aria-describedby={`${hintId}${errors[f.id] ? ` ${errorId}` : ""}`}
                            onChange={(e) => updateField(f.id, e.target.checked ? "yes" : "")}
                          />
                          <span>{f.label}{f.required && <span className="required-marker"> (required)</span>}</span>
                        </label>
                        <span className="hint" id={hintId}>{f.hint}</span>
                        {errors[f.id] && <span className="error" id={errorId} role="alert">{errors[f.id]}</span>}
                      </div>
                    );
                  }
                  const hintId = `${f.id}-hint`;
                  const errorId = `${f.id}-error`;
                  return (
                    <div className="field" key={f.id}>
                      <label htmlFor={f.id}>{f.label}{f.required && <span className="required-marker"> (required)</span>}</label>
                      <input
                        id={f.id}
                        type={f.type}
                        value={form[f.id] ?? ""}
                        required={f.required}
                        aria-invalid={errors[f.id] ? "true" : "false"}
                        aria-describedby={`${hintId}${errors[f.id] ? ` ${errorId}` : ""}`}
                        onChange={(e) => updateField(f.id, e.target.value)}
                      />
                      <span className="hint" id={hintId}>{f.hint}</span>
                      {errors[f.id] && <span className="error" id={errorId} role="alert">{errors[f.id]}</span>}
                    </div>
                  );
                })}
                <div className="aia-step-nav" data-aia="actions">
                  <button type="button" className="btn" disabled={step === 1} onClick={() => moveToStep(step - 1)}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn--primary" data-testid="form-next">
                    {step === PERMIT_FORM_STEPS.length ? "Submit application" : "Continue →"}
                  </button>
                </div>
                <p style={{ fontSize: "0.74rem", color: "var(--ink-faint)" }}>
                  Simulated application — nothing is sent or stored. Fee €32.50 is demo-only.
                </p>
              </form>
            )}
          </section>

          {/* Help */}
          <section className="help-accordion aia-aside-block" aria-labelledby="help-title" style={{ marginTop: "1.4rem" }} hidden={!showHelp}>
            <h2 id="help-title">Help &amp; common questions</h2>
            {HELP_TOPICS.map((h) => (
              <details key={h.id}>
                <summary>{h.question}</summary>
                <div className="answer">
                  <ReadingText original={h.answer} plain={h.plain_answer} />
                </div>
              </details>
            ))}
          </section>
        </div>

        {/* Right aside */}
        <aside aria-label="My requests and appointments" hidden={!showAside}>
          <section className="card panel" data-testid="requests" aria-labelledby="requests-title" hidden={!showRequests}>
            <h2 id="requests-title">My requests</h2>
            <div className="status-table">
              <table>
                <thead>
                  <tr><th scope="col">Request</th><th scope="col">Status</th></tr>
                </thead>
                <tbody>
                  {REQUESTS.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.task}</strong>
                        <br />
                        <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>{r.id} · since {r.submitted}</span>
                        <br />
                        <span style={{ fontSize: "0.76rem" }}>{r.next_step}</span>
                      </td>
                      <td><StatusPill status={r.status} label={r.status_label} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card panel aia-aside-block" data-testid="appointments" aria-labelledby="appt-title" hidden={!showAppointments}>
            <h2 id="appt-title">Appointments</h2>
            <div className="appt-list">
              {APPOINTMENTS.map((a) => (
                <div className="appt" key={a.id}>
                  <span className="date">{a.date}</span>
                  <span>
                    <strong>{a.topic}</strong>
                    <br />
                    <span className="when">{a.time} · {a.office}</span>
                    <br />
                    <span className="loc">{a.location}</span>
                  </span>
                  <button type="button" className="btn btn--small">Book</button>
                </div>
              ))}
            </div>
          </section>

          <section className="card panel aia-aside-block" aria-labelledby="hours-title" hidden={serviceFocus !== null}>
            <h2 id="hours-title">Opening hours</h2>
            <p style={{ fontSize: "0.84rem", margin: 0 }}>
              Citizen Centre: Mon–Thu 8–18, Fri 8–13.
              <br />
              Library: Mon–Sat 10–20.
            </p>
          </section>
        </aside>
      </div>

      <footer className="site-footer" hidden={serviceFocus !== null && serviceFocus !== "page"}>
        <div className="wrap cols">
          <div>
            <h3>Portal</h3>
            <a href="#" onClick={(e) => e.preventDefault()}>Accessibility statement</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
          </div>
          <div>
            <h3>Contact</h3>
            <a href="#" onClick={(e) => e.preventDefault()}>Citizen Centre</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Emergency numbers</a>
          </div>
          <div>
            <h3>Fine print</h3>
            <p style={{ fontSize: "0.72rem" }}>
              Fictional demo portal for the As I Am WebMCP demo. No real applications, no real data.
            </p>
          </div>
        </div>
      </footer>
      {density === "minimal" && serviceFocus === null && (
        <p className="wrap" style={{ fontSize: "0.76rem", color: "var(--ink-faint)" }}>
          Reduced view: secondary navigation areas and promotional announcements are hidden (restorable any time).
        </p>
      )}
    </div>
  );
}
