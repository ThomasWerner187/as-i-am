# Accessibility Model

## Positioning

As I Am is **not** an accessibility fix and not a screen reader. It is a personalization
layer on top of a solid semantic base. WebMCP complements:

- semantic HTML and correct landmarks, labels, roles;
- WCAG-conformant base contrast and focus visibility;
- assistive technology (screen readers, switch access, magnifiers).

**Personalization never excuses a missing accessible base.** Both demo sites are axe-scanned
in normal *and* adapted view with zero serious/critical violations.

## Functional, not medical

Needs are modelled as **combinable functional profiles**, never presets of conditions:
visual, interaction, cognitive, motion/media, reading, safety. Situational states
("migraine day", "one-handed") are temporary session state — the same system serves
permanent, temporary and situational needs.

## Engineering guarantees

- All adaptations flow through design tokens + data attributes + component states. The
  agent never sends CSS; the site stays in control of its own rendering.
- Adaptation must not lose content: reduced density *hides* nonessential blocks
  (restorable), navigation *collapses* into a disclosure, reading modes keep the original
  reachable, focus mode collapses rather than removes.
- Focus is preserved across transformations; announcements go through a polite live
  region; every tool answer arrives after the change is rendered.
- Targets: minimum 44×44 px baseline, contract range up to 60×60 px, enforced on all
  interactive elements and **measured** after application (`measure_rendered_ui`).
- Status is never colour-only: icon + text label always; the colour-independence
  adaptation adds distinct patterns and remapped safe palettes (design adaptation, not a
  CSS filter).
- `prefers-reduced-motion` is respected natively and by `reduce_motion`; the adaptation
  animation disables itself under it.
- Keyboard-only operation is tested end-to-end; text scaling produces no horizontal
  overflow (tested).
