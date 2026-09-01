/** Shared site chrome pieces: adaptive main navigation. */

import { type ReactNode } from "react";
import { engine } from "../engine/adaptationEngine";
import { useEngineState } from "./Primitives";

export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  render?: ReactNode;
}

/** Navigation that respects cognitive.maximum_primary_actions: extra
 *  entries collapse into a "More" disclosure — content kept, never deleted. */
export function MainNav({ items, label }: { items: NavItem[]; label: string }) {
  const snap = useEngineState();
  const max = (snap.active.cognitive?.maximum_primary_actions as number | undefined) ?? items.length;
  const primary = items.slice(0, Math.max(1, max - (items.length > max ? 1 : 0)));
  const rest = items.slice(primary.length);

  return (
    <nav aria-label={label} data-testid="main-nav">
      <ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "var(--aia-target-gap)", margin: 0, padding: 0 }}>
        {primary.map((item, i) => (
          <li key={item.label} data-aia="primary">
            {item.render ?? (
              <a
                href={item.href ?? "#"}
                onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick?.(); } : undefined}
                style={{ display: "inline-flex", alignItems: "center", minHeight: "var(--aia-target-min)", paddingInline: "0.5em" }}
              >
                {item.label}
              </a>
            )}
            {i === primary.length - 1 && rest.length > 0 && (
              <details style={{ display: "inline-block", marginInlineStart: "0.4em" }}>
                <summary
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", minHeight: "var(--aia-target-min)" }}
                  data-testid="nav-more"
                >
                  More ({rest.length}) ▾
                </summary>
                <ul style={{ listStyle: "none", position: "absolute", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 8, padding: "0.5rem", margin: 0, zIndex: 60, boxShadow: "var(--shadow)" }}>
                  {rest.map((r) => (
                    <li key={r.label}>
                      <a
                        href={r.href ?? "#"}
                        onClick={r.onClick ? (e) => { e.preventDefault(); r.onClick?.(); } : undefined}
                        style={{ display: "inline-flex", alignItems: "center", minHeight: "var(--aia-target-min)", paddingInline: "0.5em" }}
                      >
                        {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Content text honoring the reading mode, with original always reachable. */
export function ReadingText({
  original,
  plain,
  keyPoints,
}: {
  original: string;
  plain?: string;
  keyPoints?: string[];
}) {
  const snap = useEngineState();
  const mode = (snap.active.reading?.mode as string | undefined) ?? "original";
  if (mode === "plain_language" && plain) {
    return (
      <p data-reading="plain">
        {plain}{" "}
        <details style={{ display: "inline" }}>
          <summary style={{ display: "inline", cursor: "pointer", color: "var(--accent-ink)" }}>Original text</summary>{" "}
          {original}
        </details>
      </p>
    );
  }
  if ((mode === "key_points" || mode === "step_by_step") && keyPoints?.length) {
    return (
      <div data-reading="key-points">
        <ul style={{ margin: "0 0 0.5em", paddingLeft: "1.2em" }}>
          {keyPoints.map((k) => (
            <li key={k} style={mode === "step_by_step" ? { marginBlockEnd: "0.3em" } : undefined}>
              {mode === "step_by_step" ? `Step: ${k}` : k}
            </li>
          ))}
        </ul>
        <details>
          <summary style={{ cursor: "pointer", color: "var(--accent-ink)" }}>Original text</summary>
          {original}
        </details>
      </div>
    );
  }
  return <p>{original}</p>;
}
