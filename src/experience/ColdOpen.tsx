import type { Issue, ShotEdit } from "../types";

type Props = {
  issue: Issue;
  onOpen: (edit?: ShotEdit) => void;
};

export function ColdOpen({ issue, onOpen }: Props) {
  const cover = issue.chapters[0];

  return (
    <div className="cold-open">
      <div className="cold-open-inner">
        <p className="kicker">
          {issue.masthead} · {issue.author}
        </p>
        <h1>
          Oops, I Don&apos;t Have a <span>Portfolio.</span>
        </h1>
        <p className="sub">{issue.subtitle}</p>
        <button className="cold-open-cta" type="button" onClick={() => onOpen("full")}>
          Roll camera
        </button>
        <button className="cold-open-alt" type="button" onClick={() => onOpen("argument")}>
          The Argument · 19 frames
        </button>
        <p className="hint-line">Scroll to move the lens. One beat at a time.</p>
      </div>
      {cover ? (
        <figure className="cold-open-poster">
          <img
            src={cover.pageSrc}
            alt={`${issue.title} cover`}
            width={cover.pageWidth}
            height={cover.pageHeight}
            fetchPriority="high"
            decoding="async"
          />
        </figure>
      ) : null}
    </div>
  );
}
