import type { Chapter } from "../types";

export function ChapterGate({ chapter, index }: { chapter: Chapter; index: number }) {
  return (
    <section className="gate-card" data-chapter={chapter.id}>
      <small className="chapter-kicker">
        Chapter {String(index + 1).padStart(2, "0")} · {chapter.kicker}
      </small>
      <h2>{chapter.title}</h2>
    </section>
  );
}
