import { padFrame } from "../lib/issue";

export function FrameCounter({
  current,
  total,
  chapter,
  chapters,
}: {
  current: number;
  total: number;
  chapter: number;
  chapters: number;
}) {
  return (
    <div className="frame-counter" aria-live="polite">
      <small>
        {padFrame(chapter, 2)} / {padFrame(chapters, 2)}
      </small>
      <span>
        {padFrame(current)} // {padFrame(total)}
      </span>
    </div>
  );
}
