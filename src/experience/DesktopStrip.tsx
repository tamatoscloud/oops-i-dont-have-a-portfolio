import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { Issue } from "../types";
import { flattenIssue } from "../lib/issue";
import { ChapterGate } from "./ChapterGate";
import { PanelCard } from "./PanelCard";
import { Colophon } from "./Colophon";
import { playShutter, playWhoosh } from "../lib/sound";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  issue: Issue;
  reducedMotion: boolean;
  soundOn: boolean;
  negative: boolean;
  onActive: (panelId: string, frame: number) => void;
  onProgress: (value: number) => void;
  scrollApi: MutableRefObject<((panelId: string) => void) | null>;
  activeId: string | null;
};

type Segment = {
  fromX: number;
  toX: number;
  weight: number;
};

export function DesktopStrip({
  issue,
  reducedMotion,
  soundOn,
  negative,
  onActive,
  onProgress,
  scrollApi,
  activeId,
}: Props) {
  const pinRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => flattenIssue(issue), [issue]);
  const lastFrame = useRef(0);
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const strip = stripRef.current;
    if (!pin || !strip) return;

    const measure = () => {
      const maxX = Math.max(0, strip.scrollWidth - window.innerWidth);
      const nodes = [...strip.querySelectorAll<HTMLElement>("[data-seg]")];
      const segs: Segment[] = [];
      let cursor = 0;
      nodes.forEach((node, i) => {
        const left = Math.min(node.offsetLeft, maxX);
        const next = nodes[i + 1];
        const nextLeft = next ? Math.min(next.offsetLeft, maxX) : maxX;
        const pinned = node.dataset.pin === "true";
        if (pinned && left > cursor) {
          segs.push({ fromX: cursor, toX: left, weight: 1 });
          segs.push({ fromX: left, toX: left, weight: 1.75 });
          cursor = left;
        }
        segs.push({
          fromX: cursor,
          toX: nextLeft,
          weight: pinned ? 1.15 : node.dataset.kind === "gate" ? 0.7 : 1,
        });
        cursor = nextLeft;
      });
      if (!segs.length) {
        segs.push({ fromX: 0, toX: maxX, weight: 1 });
      }
      const totalWeight = segs.reduce((sum, seg) => sum + seg.weight, 0);
      return { segs, totalWeight, maxX };
    };

    if (reducedMotion) {
      pin.classList.add("is-reduced");
      strip.style.transform = "";
      scrollApi.current = (panelId: string) => {
        const el = strip.querySelector<HTMLElement>(`[data-id="${panelId}"]`);
        el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      };
      return () => {
        scrollApi.current = null;
      };
    }

    let lenis: Lenis | null = null;
    let whipTimer = 0;
    const model = { current: measure() };

    const apply = (progress: number) => {
      const { segs, totalWeight, maxX } = model.current;
      let rest = progress * totalWeight;
      let x = 0;
      for (const seg of segs) {
        if (rest <= seg.weight) {
          const local = seg.weight === 0 ? 1 : rest / seg.weight;
          x = seg.fromX + (seg.toX - seg.fromX) * local;
          break;
        }
        rest -= seg.weight;
        x = seg.toX;
      }
      gsap.set(strip, { x: -Math.min(Math.max(x, 0), maxX) });
    };

    lenis = new Lenis({
      duration: 1.15,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      autoRaf: false,
    });

    const ticker = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () => `+=${Math.max(model.current.maxX * 1.35, window.innerHeight * 4)}`,
        pin: true,
        anticipatePin: 1,
        scrub: 0.75,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          apply(self.progress);
          onProgress(self.progress);
          const velocity = Math.abs(self.getVelocity());
          if (velocity > 2800 && !pin.classList.contains("is-whipping")) {
            pin.classList.add("is-whipping");
            playWhoosh(soundRef.current);
            window.clearTimeout(whipTimer);
            whipTimer = window.setTimeout(() => pin.classList.remove("is-whipping"), 220);
          }
        },
      });
    }, pin);

    ScrollTrigger.addEventListener("refreshInit", () => {
      model.current = measure();
    });

    let lastWidth = 0;
    let refreshTimer = 0;
    const refresh = () => {
      const width = strip.scrollWidth;
      if (Math.abs(width - lastWidth) < 12) return;
      lastWidth = width;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        model.current = measure();
        ScrollTrigger.refresh();
      }, 120);
    };

    const images = [...strip.querySelectorAll("img")];
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", refresh, { once: true });
    });
    const ro = new ResizeObserver(refresh);
    ro.observe(strip);

    const onWinScroll = () => ScrollTrigger.update();
    window.addEventListener("scroll", onWinScroll, { passive: true });

    requestAnimationFrame(() => {
      model.current = measure();
      ScrollTrigger.refresh();
    });

    scrollApi.current = (panelId: string) => {
      const el = strip.querySelector<HTMLElement>(`[data-id="${panelId}"]`);
      if (!el) return;
      const st = ScrollTrigger.getAll().find((trigger) => trigger.trigger === pin);
      if (!st) return;
      const { maxX } = model.current;
      const x = Math.min(Math.max(el.offsetLeft - window.innerWidth * 0.18, 0), maxX);
      const y = st.start + (maxX === 0 ? 0 : x / maxX) * (st.end - st.start);
      lenis?.scrollTo(y, { duration: 1.1 });
    };

    return () => {
      window.clearTimeout(whipTimer);
      window.clearTimeout(refreshTimer);
      ro.disconnect();
      window.removeEventListener("scroll", onWinScroll);
      gsap.ticker.remove(ticker);
      lenis?.destroy();
      ctx.revert();
      scrollApi.current = null;
    };
  }, [issue, onProgress, reducedMotion, scrollApi]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const figures = [...strip.querySelectorAll<HTMLElement>("figure.panel")];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const frame = Number((visible.target as HTMLElement).dataset.frame || 1);
        const id = (visible.target as HTMLElement).dataset.id || "";
        if (frame !== lastFrame.current) {
          const jumped = Math.abs(frame - lastFrame.current) > 0;
          lastFrame.current = frame;
          onActive(id, frame);
          if (jumped && (visible.target as HTMLElement).classList.contains("is-pinned")) {
            playShutter(soundRef.current);
          }
        }
      },
      { root: null, threshold: [0.35, 0.55, 0.75] },
    );
    figures.forEach((figure) => io.observe(figure));
    return () => io.disconnect();
  }, [items, onActive]);

  return (
    <div className={`desktop-root${reducedMotion ? " is-reduced" : ""}`} ref={pinRef}>
      <div className="film-gate">
        <div className="sprockets" />
        <div className={`strip-window${reducedMotion ? " is-reduced" : ""}`} style={reducedMotion ? { overflowX: "auto" } : undefined}>
          <div className={`strip${negative ? " is-negative" : ""}`} ref={stripRef}>
            {items.map((item, index) => {
              if (item.kind === "gate") {
                const chapterIndex = issue.chapters.findIndex((chapter) => chapter.id === item.chapter.id);
                return (
                  <div key={`gate-${item.chapter.id}`} data-seg data-kind="gate">
                    <ChapterGate chapter={item.chapter} index={chapterIndex} />
                  </div>
                );
              }
              return (
                <div
                  key={item.panel.id}
                  data-seg
                  data-kind="panel"
                  data-id={item.panel.id}
                  data-pin={item.panel.pin ? "true" : "false"}
                >
                  <PanelCard panel={item.panel} active={activeId === item.panel.id} eager={index < 6} />
                </div>
              );
            })}
            <div data-seg data-kind="gate">
              <Colophon issue={issue} />
            </div>
          </div>
        </div>
        <div className="sprockets bottom" />
      </div>
    </div>
  );
}
