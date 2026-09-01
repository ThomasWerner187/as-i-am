/** Shared site chrome pieces: adaptive main navigation. */

import { type ReactNode } from "react";
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
      <ul className="main-nav-list">
        {primary.map((item) => (
          <li className="main-nav-item" key={item.label} data-aia="primary">
            {item.render ?? (
              <a
                href={item.href ?? "#"}
                onClick={(e) => {
                  if (item.onClick || (item.href ?? "#") === "#") e.preventDefault();
                  item.onClick?.();
                }}
                className="main-nav-link"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
        {rest.length > 0 && (
          <li className="main-nav-item main-nav-item--overflow" data-aia="primary">
            <details className="main-nav-overflow">
              <summary data-testid="nav-more">More ({rest.length}) ▾</summary>
              <ul>
                {rest.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href ?? "#"}
                      onClick={(e) => {
                        if (item.onClick || (item.href ?? "#") === "#") e.preventDefault();
                        item.onClick?.();
                      }}
                      className="main-nav-link"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        )}
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
      <div className="reading-text" data-reading="plain">
        <p>{plain}</p>
        <details>
          <summary>Original text</summary>
          <p>{original}</p>
        </details>
      </div>
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
        <details className="reading-text__original">
          <summary>Original text</summary>
          <p>{original}</p>
        </details>
      </div>
    );
  }
  return <p>{original}</p>;
}
