# Privacy Model

**Principle: the agent can know the person. The website only receives the functional
preferences it needs.**

## What the website never receives

- Diagnoses, conditions, medications, case numbers, identities.
- Anything beyond the session. There is no storage: no cookies, no localStorage,
  no IndexedDB, no service worker cache of profile data.
- No network traffic exists for adaptation logic; no analytics, no third-party requests,
  no profile values in URLs or share links.

## How it is enforced (not just promised)

1. **Schema level** — the contract has no field a diagnosis could occupy. Unknown keys are
   rejected (`validateProfile`).
2. **Runtime scanner** — every tool argument payload is scanned by
   `scanForDiagnosisTerms()` against a diagnosis-term list. Hits return
   `{ ok: false, code: "privacy_violation" }` and are never executed.
3. **Log level** — the activity timeline stores human summaries and functional parameters
   only; a test asserts no diagnosis term ever appears in the log.
4. **Receipt level** — `export_adaptation_receipt` builds a diagnosis-free summary and
   re-runs both the validator and the scanner before returning it.

## Transparency to the user

The demo panel on every page lists the exact functional key/value pairs the site received
("What this website received"), separates what the (simulated) agent knows privately from
what was sent, and offers Undo / Reset / Receipt at all times.

## Consent & confirmations

- Cart changes and submissions are staged tools (`prepare_cart_change`): the agent only
  stages; a human clicks the confirmation in the page.
- `confirmation_level: "confirm-all"` widens explicit confirmation to every action.
- Every adaptation is reversible (`undo_adaptation`, `reset_adaptations`).

## Demo data

All profiles, products, coupons, requests and appointments are synthetic. The demo
profiles are labeled bundles, not user data.
