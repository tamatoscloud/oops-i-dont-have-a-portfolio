import type { Panel } from "../types";

type Props = {
  panel: Panel;
  active: boolean;
  eager?: boolean;
};

export function PanelCard({ panel, active, eager }: Props) {
  const text = panel.caption || panel.quote;
  return (
    <figure
      className={`panel${active ? " is-active" : ""}${panel.pin ? " is-pinned" : ""}`}
      data-role={panel.role}
      data-frame={panel.frame}
      data-id={panel.id}
    >
      <img
        className={`panel-art${panel.kenBurns ? " ken" : ""}`}
        src={panel.src}
        alt={text || `Frame ${panel.frame}`}
        width={panel.width}
        height={panel.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
      {(panel.caption || panel.quote) && (
        <figcaption className="caption-stack">
          {panel.caption ? <div className="caption">{panel.caption}</div> : null}
          {panel.quote ? <div className="quote">{panel.quote}</div> : null}
        </figcaption>
      )}
    </figure>
  );
}
