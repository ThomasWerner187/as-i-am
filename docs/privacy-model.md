# Privacy model

## The boundary

A trusted agent may understand the person. A participating website receives a bounded
functional request, such as larger targets or step-by-step presentation. The profile schema
does not define diagnosis, identity, account or medication fields.

The guided controller is a preset demonstration, not a private AI service. It receives the
functional receipt and actual tool results it requests. It is not a production consent broker.

## What the prototype enforces

1. **Closed schemas:** unknown keys, wrong types and malformed nested fields are rejected.
2. **Defence-in-depth scan:** tool arguments are checked for protected-health terms before mutation.
3. **Destination negotiation:** the receiving site accepts only supported or inherent preferences.
4. **Memory-only app state:** no profile cookies, localStorage, IndexedDB or analytics.
5. **Receipt validation:** exports rebuild a closed functional object; imports validate the envelope,
   version, timestamp, profile, statistics and privacy markers before application.
6. **Explicit guided transfer:** the person clicks “Share preferences with OLIVA.” No background
   preference transfer occurs merely by switching tabs.
7. **Origin/source checks:** fallback messages require the configured controller origin and parent
   window; replies require the expected frame, origin and request ID.
8. **No booking details in receipts:** seat IDs, time selections and identity are not exported.
   The shared film schedule is static synthetic fixture data already present in both sites.

Native tools rely on the external agent/browser to obtain transfer consent. The prototype has
no browser-managed permission grant for each exported receipt. Tool registration alone does not
establish consent or a trusted agent identity.

## What this does not prove

- A finite term scanner cannot prove that arbitrary text contains no sensitive information.
  The closed functional schema is the primary minimisation boundary.
- Functional preferences may be sensitive or identifying in combination. “No diagnosis field”
  does not mean “no personal data.”
- Receipts are unsigned, with no issuer authentication, expiry, integrity proof or cross-device
  consent model. Their origin field is claimed provenance, not a credential.
- Local ports provide browser origin separation, but all three sites share a source repository
  and developer-controlled implementation. They are not independent organizations.
- A same-origin static deployment loses that origin boundary; the UI says so.
- Same-origin code and browser extensions may inspect runtime state. External agents have their
  own data handling and retention policies; this app does not control them.

## Human control

Adaptations support undo, reset and temporary base preview. Booking selections survive those
operations. Domain tools stage a review but expose no confirmation operation. The visible
buttons confirm only synthetic transactions; no payment or real reservation occurs.

## Production work still needed

Agent-side consent and minimisation policy; receipt scope, expiry and integrity protection;
independent deployment review; real user research; and a site privacy manifest explaining the
purpose of each requested functional field. Keep only the minimum subset needed for the task.
