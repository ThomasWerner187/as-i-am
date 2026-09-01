# Standards Positioning and Evidence Map

> **Prototype status — no conformance claim.** Adaptive Web Contract v0.1 is a
> project-defined experiment transported through WebMCP. It is not a W3C
> specification, a WAI-Adapt implementation, an accessibility certification, or
> evidence that either demo conforms to WCAG. The standards links below explain
> related user needs and evaluation targets; they do not make the contract keys
> equivalent to success criteria.

The experiment asks whether a user agent can negotiate diagnosis-free functional
preferences with a participating site, let that site adapt its own interface,
measure the rendered result, refine it, undo it, and carry the preference profile
to another participating site. This is intended to complement — never replace —
semantic HTML, accessible authoring, assistive technology, and formal WCAG
evaluation of the base experience. It does not transfer an author's accessibility
responsibility to an agent.

## How the W3C sources are used

| Source | Current publication status | Role in this project | What we do **not** claim |
| --- | --- | --- | --- |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | W3C Recommendation, 12 December 2024 | Normative accessibility baseline and source of related, testable success criteria | A key-to-criterion mapping, DOM metric, or automated scan does not establish WCAG conformance. |
| [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/) | W3C Working Group Note, 29 April 2021 | Supplemental user needs, design patterns, and usability-testing guidance | The Note explicitly says its guidance is beyond WCAG and is not required for WCAG conformance. Alignment is not certification. |
| [WAI-Adapt](https://www.w3.org/WAI/adapt/) and its [Explainer](https://www.w3.org/TR/adapt/) | A family with mixed maturity; the Explainer is a Group Draft Note | Conceptual reference for preference-driven personalization, author-provided semantics, simplification, and user-agent support | The prototype does not implement WAI-Adapt attributes, vocabulary modules, or a WAI-Adapt conformance model. |
| [Adaptive Web Contract v0.1](adaptive-web-contract.md) | Project draft / hackathon prototype | Experimental negotiation, adaptation, measurement, undo, and receipt format | Standardization, independent interoperability, production readiness, or accessibility conformance. |

WAI-Adapt primarily explores author-supplied semantics that user agents can use
for personalization. This prototype explores a different but adjacent mechanism:
a user agent calls site-owned WebMCP tools with functional preference values and
the site reports what it applied and measured. The overlap is the user need; the
syntax and implementation model are not interchangeable.

COGA's [Enable APIs and Extensions](https://www.w3.org/TR/coga-usable/#enable-apis-and-extensions)
pattern is a particularly relevant design reference: WebMCP is the experimental
channel through which this prototype tests that idea. This is design alignment,
not validation of the COGA pattern.

## Representative mapping

“Related” below means a useful design or evaluation connection, not that applying
the preference satisfies the cited guidance.

| Adaptive Web Contract key(s) | Related user need or guidance | Prototype behavior | Measurement and test strategy |
| --- | --- | --- | --- |
| `visual.text_scale`, `line_height`, `letter_spacing`, `word_spacing`, `max_line_length` | [WCAG 1.4.4 Resize Text](https://www.w3.org/TR/WCAG22/#resize-text), [1.4.10 Reflow](https://www.w3.org/TR/WCAG22/#reflow), [1.4.12 Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing); COGA [personalized and familiar interface](https://www.w3.org/TR/coga-usable/#support-a-personalized-and-familiar-interface) | Applies site-owned typography and measure tokens. | Record computed text sizes and horizontal overflow; run viewport/reflow and content-loss checks. A final font-size sample is not the WCAG 200% resize test. |
| `visual.contrast`, `color_independent_status` | [WCAG 1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color), [1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) | Changes the site palette and requests redundant labels/icons for status. | Sample rendered text contrast, then manually inspect all states, non-text controls, images, gradients, and color-independent meaning. Sampling alone cannot prove either criterion. |
| `interaction.minimum_target_size`, `target_spacing` | [WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum) and [2.5.5 Target Size (Enhanced)](https://www.w3.org/TR/WCAG22/#target-size-enhanced) | Applies a requested minimum target token and action-group gap. | Measure visible target rectangles and adjacent action gaps on both demo routes; manually review WCAG exceptions and inline targets. The contract's 44–60 px range is a user preference, not a restatement of WCAG 2.5.8. |
| `interaction.keyboard_first`, `focus_strength` | [WCAG 2.1.1 Keyboard](https://www.w3.org/TR/WCAG22/#keyboard), [2.4.7 Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible), [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum) | Strengthens site focus styling and preserves native keyboard operation. | Exercise representative journeys by keyboard; inspect focus order and visibility; report fully occluded focusables as a diagnostic signal. Manual coverage remains necessary. |
| `interaction.drag_alternatives`, `double_click_disabled` | [WCAG 2.5.7 Dragging Movements](https://www.w3.org/TR/WCAG22/#dragging-movements) and COGA clear, predictable controls | Requests single-pointer alternatives to drag and single activation instead of double-click. | Inventory applicable interactions, exercise their alternatives with pointer and keyboard, and manually check essential-function exceptions. The current demos contain only limited examples. |
| `cognitive.information_density`, `maximum_primary_actions`, `hide_nonessential` | WAI-Adapt's simplification use case; COGA [important tasks](https://www.w3.org/TR/coga-usable/#make-it-easy-to-find-the-most-important-tasks-and-features-of-the-site) and [Support Simplification](https://www.w3.org/TR/coga-usable/#support-simplification) | De-emphasizes or collapses nonessential regions while keeping the original experience recoverable. | Count visible primary actions, assert key tasks remain reachable, verify undo/reset, then test task finding and cognitive load with representative users. A lower DOM count is not a usability result. |
| `cognitive.step_by_step`, `progress_indicators`, `persistent_labels`, `plain_error_messages` | COGA [Make Each Step Clear](https://www.w3.org/TR/coga-usable/#make-each-step-clear), clear labels, mistake prevention, and feedback | Exposes a guided flow, persistent labels, progress, and plain-language error treatment where the site supports them. | Test step state, labels, errors, focus transfer, recovery, and backtracking; add comprehension and task-completion studies with users with cognitive and learning disabilities. |
| `cognitive.consistent_help` | [WCAG 3.2.6 Consistent Help](https://www.w3.org/TR/WCAG22/#consistent-help) and COGA help/support patterns | Keeps the site's help affordance visible and predictably placed. | Check repeated-page order and availability across the defined page set, plus manual and user testing of whether help is findable and useful. |
| `motion_media.reduce_motion`, `disable_animation`, `disable_autoplay` | [WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/TR/WCAG22/#pause-stop-hide); COGA [control moving or changing content](https://www.w3.org/TR/coga-usable/#let-users-control-when-the-content-moves-or-changes) | Stops supported animation and autoplay and honors reduced-motion preference. | Count running Web Animations, test native and adapted pause controls, and inspect CSS, canvas, video, audio, and third-party motion manually. A zero Web Animations count is not exhaustive. |
| `reading.mode`, `cognitive.step_by_step` | WAI-Adapt personalization goals; COGA simplification, clear language, summaries, and alternative content | Selects a site-authored plain-language, key-points, or step-by-step representation while preserving a route back to the original. | Verify semantic structure, content provenance, reversibility, and task-critical equivalence; use comprehension testing rather than readability scores alone. |
| `safety.confirm_destructive`, `cognitive.confirmation_level` | [WCAG 3.3.4 Error Prevention (Legal, Financial, Data)](https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data) and COGA mistake-prevention, undo, and safety patterns | Requests confirmation for risky, paid, or destructive actions and preserves undo where supported. | Exercise risky flows and verify review, confirmation, cancellation, error recovery, and retained data. Test the complete process, not only the confirmation component. |

The project-specific `measure_rendered_ui` and `verify_profile_fit` tools implement
an observe → adapt → measure → refine loop. They collect indicators such as text
size, target geometry, action gaps, sampled contrast, visible primary actions,
running animations, horizontal overflow, and occluded focusables. See the
[measurement implementation](../src/adaptive-contract/measurements.ts),
[contract schema](../src/adaptive-contract/schema.ts), and
[end-to-end accessibility and portability checks](../tests/e2e/portability-a11y.spec.ts).
These indicators can reveal regressions and unmet requests; they are not a
standards-defined evaluation method.

## Evidence boundary and next validation gates

- Automated axe-core checks are regression evidence for the rules and states covered
  by the configured scan. A clean result — or filtering to serious/critical
  findings — is not a complete WCAG 2.2 audit.
- Rendered DOM measurements are samples. They can miss browser zoom behavior,
  content loss, WCAG exceptions, accessibility-tree problems, comprehension,
  fatigue, and barriers in untested states or third-party content.
- COGA recommends involving people with cognitive and learning disabilities in
  research and usability testing. No user-study result is currently claimed.
- Receipt portability is demonstrated between two routes using one codebase and
  engine. Independent sites and implementations are required before claiming
  interoperability or ecosystem portability.
- Stronger public claims require: a scoped WCAG 2.2 audit at the stated level;
  assistive-technology and manual testing; representative user research; a
  versioned, independently implementable schema; independent implementations;
  and a published conformance/evaluation suite with known limitations.

## Primary sources

- W3C WAI, [WAI-Adapt Overview](https://www.w3.org/WAI/adapt/)
- W3C, [WAI-Adapt Explainer](https://www.w3.org/TR/adapt/), Group Draft Note, 3 January 2023
- W3C, [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/), Working Group Note, 29 April 2021
- W3C, [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/), Recommendation, 12 December 2024

Source status last checked: 1 September 2026.
