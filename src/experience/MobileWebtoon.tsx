import { useEffect, useRef, type MutableRefObject } from "react";
import type { Issue } from "../types";
import { Colophon } from "./Colophon";

type Props = {
  issue: Issue;
  negative: boolean;
  onActive: (panelId: string, frame: number) => void;
  onProgress: (value: number) => void;
  scrollApi: MutableRefObject<((panelId: string) => void) | null>;
};

export function MobileWebtoon({ issue, negative, onActive, onProgress, scrollApi }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      onProgress(max <= 0 ? 0 : window.scrollY / max);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const figures = [...root.querySelectorAll<HTMLElement>("figure.webtoon-panel")];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const frame = Number(visible.target.getAttribute("data-frame") || 1);
        const id = visible.target.getAttribute("data-id") || "";
        onActive(id, frame);
      },
      { threshold: 0.45 },
    );
    figures.forEach((figure) => io.observe(figure));

    scrollApi.current = (panelId: string) => {
      const el = root.querySelector<HTMLElement>(`[data-id="${panelId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      scrollApi.current = null;
    };
  }, [issue, onActive, onProgress, scrollApi]);

  return (
    <div className={`webtoon${negative ? " is-negative" : ""}`} ref={rootRef}>
      <header className="webtoon-hero">
        <small>
          {issue.masthead} · {issue.author}
        </small>
        <h1>
          Oops, I Don&apos;t Have a <span>Portfolio.</span>
        </h1>
        <p>{issue.subtitle}</p>
      </header>

      {issue.chapters.map((chapter, chapterIndex) => (
        <section key={chapter.id} className="webtoon-chapter">
          <div className="webtoon-gate">
            <small>
              Chapter {String(chapterIndex + 1).padStart(2, "0")} · {chapter.kicker}
            </small>
            <h2>{chapter.title}</h2>
          </div>
          {chapter.panels.map((panel, index) => (
            <figure
              key={panel.id}
              className="webtoon-panel"
              data-id={panel.id}
              data-frame={panel.frame}
            >
              <img
                src={panel.src}
                alt={panel.caption || chapter.title}
                width={panel.width}
                height={panel.height}
                loading={chapterIndex === 0 && index < 2 ? "eager" : "lazy"}
              />
              {(panel.caption || panel.quote) && (
                <figcaption className="caption-stack">
                  {panel.caption ? <div className="caption">{panel.caption}</div> : null}
                  {panel.quote ? <div className="quote">{panel.quote}</div> : null}
                </figcaption>
              )}
            </figure>
          ))}
        </section>
      ))}

      <Colophon issue={issue} className="webtoon-colophon" />
    </div>
  );
}
