# Accessibility position

## Baseline first

As I Am is a personalization layer, not an accessibility repair tool and not assistive
technology. A participating site still needs a semantic, keyboard-operable and perceivable
baseline. WebMCP complements HTML, WCAG-oriented engineering and assistive technology; it does
not excuse defects underneath the adaptation layer.

The demo uses landmarks, labelled controls, live-region announcements, visible focus, textual
status alongside colour, explicit form errors and human confirmation for staged actions.

## Functional, not medical

Preferences are combinable functional values grouped into visual, interaction, cognitive,
motion/media, reading and safety domains. They can describe permanent, temporary or situational
needs without asking a participating website to classify the person.

Examples:

- Increase body and important text independently.
- Enforce a larger effective click target and wider action spacing.
- Remove autoplay and authored animation.
- Reduce visible primary actions and present a task step by step.
- Keep labels and progress visible.
- Preserve full prices and confirmations around risky actions.

## Adaptation invariants

- The agent never sends CSS or DOM selectors.
- Reduced density collapses or hides only designated nonessential content; reset restores it.
- Reading presentations retain access to the original content.
- Status never relies on colour alone.
- Keyboard focus remains visible and task-focus changes move to a known page region.
- The interface respects operating-system reduced-motion preference independently of an agent.
- Adaptations are reversible and announced.

## Evidence model

The prototype distinguishes three kinds of evidence:

1. **Rendered measurements** — text size, effective target size, action gap, contrast samples,
   visible primary actions, running animations, horizontal overflow and occluded focusables.
2. **Rendered signals** — document flags and component state that can be inspected after commit.
3. **Implementation support** — capabilities that exist in code but cannot be reduced to one
   browser metric. These must not be described as measured conformance.

Fit reporting marks each requested value satisfied, partial or unsupported and returns suggested
refinements where an actionable rendered miss exists.

## Automated checks and their limits

Unit tests exercise schema validation, privacy rejection, token mapping, measurement and state
reversibility. Playwright covers normal and adapted flows, keyboard interaction, overflow,
portability and axe scans for serious/critical issues.

These checks are engineering evidence, not a WCAG conformance claim. Axe cannot establish full
accessibility, and automated tests cannot determine whether a cognitive adaptation is genuinely
usable. Production work requires manual review with assistive technology and research with people
who use adaptive interfaces.

See [standards mapping](standards-mapping.md) for the project’s non-normative relationship to
WAI-Adapt, COGA guidance and WCAG 2.2.
