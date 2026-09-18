import type { Issue, Panel } from "../types";
import { argumentPanels } from "../lib/issue";

type Props = {
  issue: Issue;
  open: boolean;
  activeId: string | null;
  argument: boolean;
  director: boolean;
  onJump: (panelId: string) => void;
  onClose: () => void;
  onSetArgument: (value: boolean) => void;
  onToggleDirector: () => void;
};

export function ContactSheet({
  issue,
  open,
  activeId,
  argument,
  director,
  onJump,
  onClose,
  onSetArgument,
  onToggleDirector,
}: Props) {
  if (!open) return null;
  const panels: Panel[] = argument ? argumentPanels(issue) : issue.chapters.flatMap((chapter) => chapter.panels);

  return (
    <div className="sheet" role="dialog" aria-label="Issue index">
      <button className="hud-btn sheet-close" type="button" onClick={onClose}>
        Close
      </button>
      <h2>{argument ? "The Argument" : "Contact sheet"}</h2>
      <p className="hint">{argument ? "Nineteen beats. One directed cut of the issue." : "Jump any frame. The issue stays in one piece."}</p>
      <div className="sheet-toolbar">
        <button className={`hud-btn${argument ? "" : " is-on"}`} type="button" onClick={() => onSetArgument(false)}>
          Full issue
        </button>
        <button className={`hud-btn${argument ? " is-on" : ""}`} type="button" onClick={() => onSetArgument(true)}>
          The Argument
        </button>
        <button className={`hud-btn${director ? " is-on" : ""}`} type="button" onClick={onToggleDirector}>
          Director&apos;s cut
        </button>
      </div>
      <div className="sheet-grid">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className={`sheet-cell${activeId === panel.id ? " is-active" : ""}`}
            onClick={() => onJump(panel.id)}
            title={panel.caption || panel.quote || panel.id}
          >
            <img src={panel.thumb} alt="" loading="lazy" decoding="async" />
            <span>{String(panel.frame).padStart(3, "0")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
