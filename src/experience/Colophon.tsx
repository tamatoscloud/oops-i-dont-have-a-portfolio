import type { Issue } from "../types";

type Props = {
  issue: Issue;
  onReread?: () => void;
  onOpenIndex?: () => void;
  className?: string;
  variant?: "card" | "strip";
};

export function Colophon({ issue, onReread, onOpenIndex, className = "", variant = "card" }: Props) {
  const place = issue.location.split("·")[0]?.trim() || issue.location;

  if (variant === "strip") {
    return (
      <aside className={`colophon colophon-strip ${className}`.trim()}>
        <p className="colophon-byline">
          <strong>{issue.author}</strong>
          <span>
            {issue.role} · {place}
          </span>
        </p>
        <div className="colophon-actions">
          {onReread ? (
            <button className="hud-btn" type="button" onClick={onReread}>
              Re-read
            </button>
          ) : null}
          {onOpenIndex ? (
            <button className="hud-btn" type="button" onClick={onOpenIndex}>
              Open index
            </button>
          ) : null}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`colophon ${className}`.trim()}>
      <div>
        <p className="chapter-kicker">{issue.tagline}</p>
        <h2>
          There is <span>more.</span>
        </h2>
        <p>{issue.cta.line}</p>
      </div>
      <div className="colophon-end">
        <p className="colophon-byline">
          {issue.author}
          <br />
          {issue.role}
          <br />
          {issue.location}
        </p>
        <p className="cta">{issue.cta.label}</p>
        <div className="colophon-actions">
          {onReread ? (
            <button className="hud-btn" type="button" onClick={onReread}>
              Re-read issue
            </button>
          ) : null}
          {onOpenIndex ? (
            <button className="hud-btn" type="button" onClick={onOpenIndex}>
              Open index
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
