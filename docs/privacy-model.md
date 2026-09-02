# Privacy model

## Boundary

The product principle is deliberately narrow:

> A trusted agent may understand the person. A participating website receives a bounded
> functional request describing how its interface should behave.

Examples of functional values are `text_scale: 1.5`, `minimum_target_size: 52` and
`disable_animation: true`. The profile wire schema does not define diagnosis, condition,
identity, medication or account fields.

## What this prototype enforces

1. **Closed profile schema** — profile sections and fields are enumerated. Unknown keys,
   wrong types and malformed nested objects are rejected at the dispatch boundary.
2. **Runtime content scan** — tool argument payloads are scanned for protected-health terms
   before handlers execute. A match returns a privacy error without mutating state.
3. **Data minimisation by capability** — discovery reports the capabilities of the active
   page, enabling an agent to send only supported, task-relevant values.
4. **Session scope** — adaptation, shop and activity state live in JavaScript memory. The
   prototype does not place profile data in cookies, localStorage, IndexedDB, analytics or URLs.
5. **Receipt validation** — exported functional receipts are rebuilt from active contract
   state, validated and scanned before they are returned. Imports revalidate the full receipt,
   then capability-negotiate the profile before changing the destination surface.
6. **Visible payload** — judge mode shows the exact functional JSON used by the website and
   clearly labels its private-agent context as a simulation.

## What this does not prove

- A finite term scanner is defence in depth, not a general proof that arbitrary text contains
  no medical information. The closed wire schema is the primary boundary.
- Functional preferences can still be sensitive or identifying in combination. “No diagnosis
  field” does not mean “no personal data.” A production system needs purpose limitation,
  consent, minimisation and policy at the agent boundary.
- The receipt is a prototype data object, not a signed credential. It has no issuer trust,
  integrity proof, expiry or cross-device consent model yet.
- The self-guided proof and both demo sites currently ship in one SPA. The visual boundary
  demonstrates the protocol, but it is not process or origin isolation.
- Browser memory can still be inspected by code running in the same origin. A production
  architecture should isolate the trusted agent from participating sites.

## Human control

- Adaptations are reversible through exact undo and reset operations.
- Temporary base preview does not mutate adaptation history or statistics.
- Domain actions with user impact are staged. For example, a cart tool prepares a change;
  a person confirms it in the page.
- Fit reports expose partial and unsupported requests instead of silently declaring success.

## Production direction

A real deployment should add separate origins, an agent-side consent and minimisation policy,
receipt scope and expiry, integrity protection, and a small privacy manifest describing each
site’s requested fields and purpose. The contract should carry the minimum functional subset
needed for the current page and task.

All profiles, products, coupons, requests and appointments in this repository are synthetic.
