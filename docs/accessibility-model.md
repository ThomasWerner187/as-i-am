# Inclusion and accessibility

## Participation with a choice of help

An ordinary evening should leave room for different ways of taking part. Precise pointing
can make small seat controls difficult to use. A dense menu or several decisions at once can
make it harder to find and compare information. As I Am responds to those functional needs
without assigning a diagnosis or assuming one preferred experience for a group of people.

The person chooses between two forms of help:

- **Help me choose:** clearer information and larger controls support the person's own exploration.
- **Prepare for me:** the agent researches options and stages a proposal the person can inspect,
  change and confirm.

Delegating research is one option; exploring the complete interface is another. Both preserve
self-determination. The example does not claim to work for every person, and no user study has
been conducted as part of the evidence documented here.

## A usable baseline

A participating website still needs semantic, keyboard-operable and perceivable HTML. WebMCP
and interface preferences complement that baseline, WCAG-oriented engineering and assistive
technology. An adaptation layer does not excuse an inaccessible original page.

The demo uses landmarks, labelled controls, live-region announcements, visible focus, text
alongside colour, explicit errors and human confirmation for staged actions. The original
cinema, full restaurant menu and manual selection controls remain available.

## Different requests, different responsibilities

Functional interface preferences describe presentation: target size, action spacing, text size,
focus visibility, reduced motion or clearer steps. They can be combined, refined and undone.
The receiving website accepts only the subset it supports.

Task requirements describe what the person is trying to arrange: adjacent seats, a dinner time,
a quiet table, a budget or a chosen eating preference. These remain separate from interface preferences.
The menu can show the full selection or a view focused on the stated request, with prices,
ingredient information, exclusions and uncertainty still available for inspection.

The fictional **Example request** is visibly editable. Vegan food, €20 per dish and a quiet
table are defaults for demonstration, not facts inferred about the person. Allergen constraints
must be chosen explicitly. A dish match means it matches declared menu data; it does not
establish allergy safety or resolve unknown cross-contact information.
This distinction follows the Food Standards Agency's [guidance on vegan food and allergens](https://www.food.gov.uk/safety-hygiene/vegan-food-and-allergens).

## Invariants

- Agents send supported functional values and domain inputs, not CSS or DOM selectors.
- The person can return to the original presentation and the full menu.
- Presentation changes preserve the current booking selection.
- A filtered view keeps relevant price, ingredient and uncertainty information available.
- Status does not rely on colour alone; focus and labels remain visible.
- The interface respects operating-system reduced-motion preference independently of an agent.
- Adaptation changes are reversible and announced.
- Research and preparation tools never confirm tickets or tables.
- Functional receipts contain no diet, allergen requirements, budget or booking selections.

## Evidence model

The contract distinguishes rendered measurements, rendered component signals and implementation
support. Measurements include text and target size, action gaps, contrast samples, motion,
horizontal overflow and occluded focusable elements. Not every feature can be summarized by
a browser metric. A satisfied fit report is specific evidence about requested fields and a
rendered viewport, not a universal accessibility score.

The unit and browser suites exercise validation, state preservation, keyboard interaction,
overflow, receipt portability and normal/adapted axe scans. The final integrated feature set
must be rerun before release; [verification](verification.md) records the actual tested commits.

Automated checks do not establish WCAG conformance or show whether a cognitive presentation
works well for a particular person. Assistive-technology review and research with people who
use adaptive interfaces remain necessary production work. See [standards mapping](standards-mapping.md)
for the project's non-normative relationship to WAI-Adapt, COGA guidance and WCAG 2.2.
