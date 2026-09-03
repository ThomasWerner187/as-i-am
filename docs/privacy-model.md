# Privacy and task boundaries

As I Am separates how an interface should behave from the information needed to plan an
evening. Both can be sensitive. The person chooses what help to request; the prototype does
not infer a diagnosis, a food allergy or a personal preference from a presentation setting.

## Functional interface receipt

The closed functional schema contains bounded presentation values such as larger targets,
clearer steps or reduced motion. It has no fields for identity, diagnosis, diet, allergens,
budget, seat selections or table bookings. Receipt export reconstructs that functional object;
import validates its envelope and applies only the destination-supported subset.

The receiving restaurant can learn how to present its interface without receiving the reason
for that preference. This is data minimisation, not a claim that interface preferences are
nonpersonal or that a combination of them cannot identify someone.

## Separate planning inputs

Dinner timing uses a separate domain request. After the person confirms demo tickets,
**Plan dinner from my tickets →** reads the cinema booking state and sends the film time to
the restaurant's planning tool. It does not put the cinema booking in the functional receipt.
The agent needs the time for this requested task, not the seat IDs, booking reference or price.

The example film time is 20:15. The restaurant calculates against its own synthetic table
availability, 90-minute meal, 15-minute walk and requested arrival buffer. The visible plan
explains the result. The read-only planning tool cannot prove a person consented or has a
confirmed booking; an external agent must check the booking state and the person's request
before using that information.

The **Example request** supplies separate, editable domain inputs: vegan food, €20 per dish
and a quiet table by default. They are labelled fictional examples. Declared-allergen filters
are optional explicit selections, never inferred from appearance, disability or prior interface
preferences. Tools accept only supported, structured inputs; the functional receipt remains unchanged.

## Menu evidence and uncertainty

Menu searches use six fictional dishes with declared prices, ingredients and allergen metadata.
A declared match supports a comparison, not an allergy-safety judgment. Known excluded allergens
are reported; incomplete information, possible traces or unknown cross-contact are surfaced as
questions for the restaurant. No tool certifies a dish as safe for a particular person.
The Food Standards Agency likewise distinguishes a vegan label from allergen absence and
warns about cross-contamination. See [Vegan food and allergens](https://www.food.gov.uk/safety-hygiene/vegan-food-and-allergens).

Food requirements may reveal sensitive information even without a diagnosis field. Use example
requirements for this demo. A production agent should obtain a clear request, share the minimum
necessary information and avoid sending free-form medical history to a menu tool.

## What the prototype enforces

- Closed argument schemas reject unknown keys, wrong types and malformed nested fields.
- The functional profile has a defence-in-depth protected-health-term scan before mutation;
  bounded schemas are its primary minimisation boundary.
- Receipts validate contract/version, timestamps, profile, statistics and privacy markers.
- App state stays in session memory; there are no profile cookies, localStorage, IndexedDB or analytics.
- Navigation alone does not transfer a functional receipt. **Use my preferences here →** is
  an explicit transfer action. **Plan dinner from my tickets →** also carries chosen interface
  preferences when needed; its visible hint discloses that it uses the confirmed film time
  and chosen preferences at OLIVA. The receipt and planning request remain separate.
- The demo bridge validates controller origin, source window, destination and request correlation.
- Native tools expose research and review preparation, with no booking-confirmation operation.

The guided controller receives the results it requests. Its buttons run presets, not a private
AI service. Native agents and their browsers are responsible for obtaining the person's request
and any transfer consent. Tool availability alone is not a consent grant or authenticated identity.

## What remains outside the prototype

Receipts are unsigned session objects with claimed provenance, not authenticated credentials.
They have no production expiry, integrity proof, cross-device consent policy or issuer identity.
A finite term scanner cannot establish that arbitrary content contains no sensitive information.

The local setup uses three browser origins, but the sites share an implementation and operator.
A single-origin static deployment loses that origin boundary and is labelled accordingly.
Same-origin code or extensions may inspect runtime state. External agents have their own data
handling and retention; this app does not control them.

Production work includes agent-side consent, request scoping, expiry and integrity protection,
independent deployment review and a clear privacy manifest for each requested field. Preserve
only the information needed for the task the person chose.
