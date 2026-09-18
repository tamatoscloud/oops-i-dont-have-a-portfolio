import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { CameraPose, Issue } from "../types";
import {
  buildSegments,
  buildShots,
  chapterShowsCard,
  closestSnapIndex,
  easeMove,
  entryLabel,
  lerp,
  lerpRect,
  oneStepSnap,
  poseFor,
  resolveBox,
  revealStart,
  sampleSegment,
  shotLabel,
  snapPoints,
} from "../lib/camera";
import { Colophon } from "./Colophon";
import { playCameraCue } from "../lib/sound";
import type { ShotEdit } from "../types";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  issue: Issue;
  reducedMotion: boolean;
  soundOn: boolean;
  negative: boolean;
  director: boolean;
  edit: ShotEdit;
  onActive: (panelId: string, frame: number) => void;
  onProgress: (value: number) => void;
  onReread: () => void;
  onOpenIndex: () => void;
  scrollApi: MutableRefObject<((panelId: string) => void) | null>;
  cutToRef: MutableRefObject<string | null>;
};

function poseStyle(pose: CameraPose): string {
  return `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotate}deg) scale(${pose.scale})`;
}

export function CinematicCamera({
  issue,
  reducedMotion,
  soundOn,
  negative,
  director,
  edit,
  onActive,
  onProgress,
  onReread,
  onOpenIndex,
  scrollApi,
  cutToRef,
}: Props) {
  const pinRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const finderRef = useRef<HTMLSpanElement>(null);
  const directorRef = useRef<HTMLDivElement>(null);
  const monitorImgRef = useRef<HTMLImageElement>(null);
  const modeRef = useRef<HTMLParagraphElement>(null);
  const lastId = useRef("");
  const progressRef = useRef(0);
  const loadedPages = useRef(new Set([1, 2]));
  const desktopHud = useRef(
    typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches,
  ).current;
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  const shots = useMemo(() => buildShots(issue, edit), [issue, edit]);
  const segments = useMemo(() => buildSegments(shots), [shots]);
  const points = useMemo(() => snapPoints(segments), [segments]);
  const pages = useMemo(
    () =>
      issue.chapters.map((chapter) => ({
        src: chapter.pageSrc,
        page: chapter.page,
        width: chapter.pageWidth,
        height: chapter.pageHeight,
      })),
    [issue],
  );

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const gate = gateRef.current;
    if (!pin || !gate) return;

    const layers = [...pin.querySelectorAll<HTMLElement>("[data-page-layer]")];
    const getGate = () => ({ w: gate.clientWidth, h: gate.clientHeight });
    const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);

    let lenis: Lenis | null = null;
    let whipTimer = 0;
    let st: ScrollTrigger | null = null;
    let settledIndex = 0;
    let panX = 0;
    let panY = 0;
    let panShot = "";
    let panRepeat = 0;
    let dragging = false;
    let lastVelocity = 0;
    let settleTimer = 0;
    const dragStart = { x: 0, y: 0, panX: 0, panY: 0 };

    const panLimit = () => Math.max(getGate().w, getGate().h) * 0.48;
    const clampPan = (x: number, y: number) => {
      const limit = panLimit();
      return {
        x: Math.max(-limit, Math.min(limit, x)),
        y: Math.max(-limit, Math.min(limit, y)),
      };
    };
    const drawPose = (pose: CameraPose) => poseStyle({ ...pose, x: pose.x + panX, y: pose.y + panY });

    const progressToY = (value: number) => {
      if (!st) return 0;
      return st.start + value * (st.end - st.start);
    };

    const apply = (progress: number) => {
      progressRef.current = progress;
      const { w, h } = getGate();
      const { segment, local } = sampleSegment(segments, progress);
      const portrait = h > w * 1.08;
      const moving = segment.mode === "move";
      const from = segment.from;
      const to = segment.to;
      const pageChange = from.page !== to.page;
      const entry = pageChange ? (from.exit === "pull" ? "pull" : to.entry) : to.entry;
      const t = reducedMotion ? (moving ? (local > 0.5 ? 1 : 0) : 1) : moving ? easeMove(local, entry) : local;
      let liveBox = moving
        ? lerpRect(
            to.entry === "reveal" && !pageChange ? revealStart(resolveBox(from, portrait)) : resolveBox(from, portrait),
            resolveBox(to, portrait),
            t,
          )
        : resolveBox(to, portrait);
      if (to.id !== panShot) {
        panShot = to.id;
        panX = 0;
        panY = 0;
      }

      const wanted = new Set<number>();
      [from.page, to.page, from.page + 1, from.page - 1, to.page + 1, to.page - 1, to.page + 2].forEach((n) => {
        if (layers.some((layer) => Number(layer.dataset.page) === n)) wanted.add(n);
      });
      layers.forEach((layer) => {
        const page = Number(layer.dataset.page);
        const img = layer.querySelector("img");
        if (!img) return;
        const src = img.dataset.src;
        if (!src) return;
        if (wanted.has(page)) {
          loadedPages.current.add(page);
          if (img.getAttribute("src") !== src) img.src = src;
        } else if (img.getAttribute("src")) {
          loadedPages.current.delete(page);
          img.removeAttribute("src");
        }
      });

      pin.classList.toggle("is-moving", moving);
      pin.classList.toggle("is-holding", !moving);
      pin.classList.toggle("has-scrolled", progress > 0.008);
      pin.classList.toggle("is-turning", Boolean(pageChange && moving));
      pin.classList.toggle(
        "is-zoomed",
        !moving && to.kind === "settle" && (to.box.h < 0.82 || to.box.w < 0.88),
      );
      pin.style.setProperty("--film", `${progress * 480}px`);

      if (pageChange && moving) {
        const pull = poseFor({ ...from, box: { x: 0.034, y: 0.022, w: 0.932, h: 0.956 } }, w, h);
        const start = poseFor(from, w, h);
        const incomingWide = poseFor({ ...to, box: { x: 0.034, y: 0.022, w: 0.932, h: 0.956 } }, w, h);
        const incoming = poseFor(to, w, h, 0);
        const outT = Math.min(1, t * 1.15);
        const inT = Math.max(0, (t - 0.18) / 0.82);
        layers.forEach((layer) => {
          const page = Number(layer.dataset.page);
          if (page === from.page) {
            layer.style.opacity = String(1 - outT);
            layer.style.transform = drawPose({
              x: lerp(start.x, pull.x, outT),
              y: lerp(start.y, pull.y, outT),
              scale: lerp(start.scale, pull.scale, outT),
              rotate: 0,
            });
          } else if (page === to.page) {
            layer.style.opacity = String(inT);
            layer.style.transform = drawPose({
              x: lerp(incomingWide.x, incoming.x, inT),
              y: lerp(incomingWide.y, incoming.y, inT),
              scale: lerp(incomingWide.scale, incoming.scale, inT),
              rotate: 0,
            });
          } else {
            layer.style.opacity = "0";
          }
        });
      } else {
        const driftT = moving ? 0 : local;
        const pose = poseFor({ ...to, box: liveBox, mobileBox: undefined, drift: to.drift }, w, h, driftT);
        layers.forEach((layer) => {
          const page = Number(layer.dataset.page);
          layer.style.opacity = page === to.page ? "1" : "0";
          if (page === to.page) {
            layer.style.transform = drawPose(pose);
          }
        });
      }

      const active = moving && t < 0.55 ? from : to;
      const panelId = active.panel?.id ?? active.chapter.id;
      const frame = active.panel?.frame ?? active.chapter.panels[0]?.frame ?? 1;
      if (panelId !== lastId.current) {
        lastId.current = panelId;
        onActive(active.panel?.id ?? panelId, frame);
        const intensity = Math.min(1.25, 0.55 + lastVelocity / 2800);
        if (pageChange) playCameraCue("page", soundRef.current, intensity);
        else if (active.kind === "chapter" && edit !== "argument" && chapterShowsCard(active.chapter.id)) {
          playCameraCue("chapter", soundRef.current);
        } else if (edit !== "argument" && active.panel?.pin && active.entry === "push") {
          playCameraCue("shutter", soundRef.current, 0.5);
        }
      }

      if (finderRef.current) {
        finderRef.current.style.left = `${liveBox.x * 100}%`;
        finderRef.current.style.top = `${liveBox.y * 100}%`;
        finderRef.current.style.width = `${liveBox.w * 100}%`;
        finderRef.current.style.height = `${liveBox.h * 100}%`;
      }
      layers.forEach((layer) => {
        const mark = layer.querySelector<HTMLElement>("[data-page-finder]");
        if (!mark) return;
        mark.style.left = `${liveBox.x * 100}%`;
        mark.style.top = `${liveBox.y * 100}%`;
        mark.style.width = `${liveBox.w * 100}%`;
        mark.style.height = `${liveBox.h * 100}%`;
      });
      if (directorRef.current) {
        const line = directorRef.current.querySelector("[data-dir-line]");
        const tag = (
          active.semanticTag ??
          (active.kind === "chapter" ? "wide" : active.kind === "pullback" ? "pull" : active.kind === "ending" ? "end" : "panel")
        ).toUpperCase();
        if (line) line.textContent = `FRAME ${String(frame).padStart(3, "0")} · ${entryLabel(active.entry)} · ${tag}`;
      }
      if (monitorImgRef.current && !monitorImgRef.current.getAttribute("src")?.includes(active.pageSrc)) {
        monitorImgRef.current.src = active.pageSrc;
      }
      if (modeRef.current) {
        modeRef.current.textContent = shotLabel(active.kind);
      }
      const slateFrame = pin.querySelector<HTMLElement>("[data-slate-frame]");
      const slateMode = pin.querySelector<HTMLElement>("[data-slate-mode]");
      if (slateFrame) slateFrame.textContent = String(frame).padStart(2, "0");
      if (slateMode) slateMode.textContent = shotLabel(active.kind);
      pin.querySelectorAll<HTMLElement>("[data-rail]").forEach((btn, railIndex) => {
        btn.classList.toggle("is-on", issue.chapters[railIndex]?.id === active.chapter.id);
      });

      const showCopy = active.kind === "settle" && (!moving || t > 0.72);
      const capEl = captionRef.current?.querySelector<HTMLElement>("[data-caption]");
      const quoteEl = captionRef.current?.querySelector<HTMLElement>("[data-quote]");
      if (capEl) {
        capEl.textContent = active.caption;
        capEl.hidden = !active.caption;
      }
      if (quoteEl) {
        quoteEl.textContent = active.quote;
        quoteEl.hidden = !active.quote;
      }
      captionRef.current?.classList.toggle("is-on", Boolean(showCopy && (active.caption || active.quote)));

      const kickerEl = chapterRef.current?.querySelector("[data-kicker]");
      const titleEl = chapterRef.current?.querySelector("[data-title]");
      if (kickerEl) kickerEl.textContent = `Chapter ${String(issue.chapters.findIndex((chapter) => chapter.id === active.chapter.id) + 1).padStart(2, "0")}`;
      if (titleEl) titleEl.textContent = active.chapter.title;
      chapterRef.current?.classList.toggle(
        "is-on",
        active.kind === "chapter" && chapterShowsCard(active.chapter.id) && (!moving || t > 0.35),
      );

      if (endRef.current) {
        endRef.current.classList.toggle("is-on", active.kind === "ending" && (!moving || t > 0.55));
      }
      pin.classList.toggle("is-ending", active.kind === "ending" && (!moving || t > 0.55));

      onProgress(progress);
    };

    const nudgePan = (dx: number, dy: number) => {
      const next = clampPan(panX + dx, panY + dy);
      panX = next.x;
      panY = next.y;
      apply(progressRef.current);
    };

    const resetPan = () => {
      panX = 0;
      panY = 0;
      apply(progressRef.current);
    };

    const look = (dir: string) => {
      const step = 70;
      if (dir === "up") nudgePan(0, step);
      if (dir === "down") nudgePan(0, -step);
      if (dir === "left") nudgePan(step, 0);
      if (dir === "right") nudgePan(-step, 0);
      if (dir === "reset") resetPan();
    };

    const goToProgress = (value: number, duration = 0.7) => {
      const clamped = Math.min(1, Math.max(0, value));
      settledIndex = closestSnapIndex(points, clamped);
      const y = progressToY(clamped);
      if (duration === 0) {
        window.scrollTo(0, y);
        lenis?.scrollTo(y, { duration: 0, immediate: true });
        apply(clamped);
        return;
      }
      lenis?.scrollTo(y, { duration, immediate: false });
    };

    const coarseScroll = window.matchMedia("(pointer: coarse)").matches;
    lenis = new Lenis({
      duration: coarseScroll ? 0.92 : 0.7,
      wheelMultiplier: 0.48,
      touchMultiplier: coarseScroll ? 1.12 : 0.7,
      autoRaf: false,
      syncTouch: false,
    });
    const ticker = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    const ctx = gsap.context(() => {
      st = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: () => `+=${Math.max(totalWeight * window.innerHeight * 0.82, window.innerHeight * 12)}`,
        pin: true,
        scrub: 0.35,
        anticipatePin: 0,
        invalidateOnRefresh: true,
        ...(reducedMotion
          ? {}
          : {
              snap: {
                snapTo: (value: number) => oneStepSnap(points, value, settledIndex),
                duration: { min: 0.22, max: 0.48 },
                delay: 0.1,
                ease: "power1.out",
              },
            }),
        onUpdate: (self) => {
          apply(self.progress);
          const velocity = Math.abs(self.getVelocity());
          lastVelocity = velocity;
          const { segment } = sampleSegment(segments, self.progress);
          if (segment.mode === "hold" && velocity < 420) {
            settledIndex = closestSnapIndex(points, self.progress);
          }
          if (velocity > 2400 && !pin.classList.contains("is-whipping")) {
            pin.classList.add("is-whipping");
            window.clearTimeout(whipTimer);
            whipTimer = window.setTimeout(() => pin.classList.remove("is-whipping"), 220);
          }
        },
      });
    }, pin);

    const jumpToShot = (shotId: string) => {
      let acc = 0;
      let holdStart = 0;
      let holdWeight = 0;
      for (const segment of segments) {
        if (segment.to.id === shotId && segment.mode === "hold") {
          holdStart = acc;
          holdWeight = segment.weight;
          break;
        }
        acc += segment.weight;
      }
      const cutPoint = (holdStart + holdWeight * 0.04) / totalWeight;
      const settlePoint = (holdStart + holdWeight * 0.28) / totalWeight;
      goToProgress(cutPoint, 0);
      apply(cutPoint);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => goToProgress(settlePoint, 0.2), 16);
    };

    const jumpToPanel = (panelId: string) => {
      const shot =
        shots.find((item) => item.panel?.id === panelId && item.kind === "settle") ??
        shots.find((item) => item.panel?.id === panelId) ??
        shots.find((item) => item.chapter.panels.some((panel) => panel.id === panelId) && item.kind === "chapter");
      if (shot) jumpToShot(shot.id);
    };

    const startId = cutToRef.current;
    cutToRef.current = null;
    ScrollTrigger.refresh();
    if (startId) jumpToPanel(startId);
    else apply(0);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (startId && progressRef.current < 0.002) jumpToPanel(startId);
      else if (!startId) apply(progressRef.current);
    });

    scrollApi.current = jumpToPanel;

    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, .sheet")) return;
      const zoomed = pin.classList.contains("is-zoomed");
      const key = event.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        event.preventDefault();
        if (key === "w") look("up");
        if (key === "s") look("down");
        if (key === "a") look("left");
        if (key === "d") look("right");
        return;
      }
      if (zoomed && (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        if (event.key === "ArrowUp") look("up");
        if (event.key === "ArrowDown") look("down");
        if (event.key === "ArrowLeft") look("left");
        if (event.key === "ArrowRight") look("right");
        return;
      }
      const at = closestSnapIndex(points, progressRef.current);
      if (event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        goToProgress(points[Math.min(points.length - 1, at + 1)] ?? 1);
      }
      if (event.key === "PageUp") {
        event.preventDefault();
        goToProgress(points[Math.max(0, at - 1)] ?? 0);
      }
      if (!zoomed && (event.key === "ArrowDown" || event.key === "ArrowRight")) {
        event.preventDefault();
        goToProgress(points[Math.min(points.length - 1, at + 1)] ?? 1);
      }
      if (!zoomed && (event.key === "ArrowUp" || event.key === "ArrowLeft")) {
        event.preventDefault();
        goToProgress(points[Math.max(0, at - 1)] ?? 0);
      }
    };
    window.addEventListener("keydown", onKey);

    const onRail = (event: Event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>("[data-rail]");
      if (!button) return;
      const id = button.dataset.rail;
      const shot = shots.find((item) => item.chapter.id === id && item.kind === "chapter");
      if (shot) jumpToShot(shot.id);
    };
    pin.addEventListener("click", onRail);

    const onPanPointer = (event: PointerEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>("[data-pan]");
      if (!button) return;
      event.preventDefault();
      const dir = button.dataset.pan ?? "";
      look(dir);
      window.clearInterval(panRepeat);
      if (dir !== "reset") {
        panRepeat = window.setInterval(() => look(dir), 80);
      }
    };
    const stopPanRepeat = () => window.clearInterval(panRepeat);
    pin.addEventListener("pointerdown", onPanPointer);
    window.addEventListener("pointerup", stopPanRepeat);
    window.addEventListener("pointercancel", stopPanRepeat);

    const onDragStart = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (event.pointerType === "touch") return;
      const target = event.target as HTMLElement;
      if (target.closest("button, a, .sheet, .hud, .pan-pad")) return;
      if (!pin.classList.contains("is-zoomed") && !pin.classList.contains("is-holding")) return;
      dragging = true;
      pin.classList.add("is-panning");
      dragStart.x = event.clientX;
      dragStart.y = event.clientY;
      dragStart.panX = panX;
      dragStart.panY = panY;
      lenis?.stop();
      gate.setPointerCapture(event.pointerId);
    };
    const onDragMove = (event: PointerEvent) => {
      if (!dragging) return;
      const next = clampPan(dragStart.panX + (event.clientX - dragStart.x), dragStart.panY + (event.clientY - dragStart.y));
      panX = next.x;
      panY = next.y;
      apply(progressRef.current);
    };
    const onDragEnd = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      pin.classList.remove("is-panning");
      if (gate.hasPointerCapture(event.pointerId)) gate.releasePointerCapture(event.pointerId);
      lenis?.start();
    };
    gate.addEventListener("pointerdown", onDragStart);
    gate.addEventListener("pointermove", onDragMove);
    gate.addEventListener("pointerup", onDragEnd);
    gate.addEventListener("pointercancel", onDragEnd);

    return () => {
      window.clearTimeout(whipTimer);
      window.clearTimeout(settleTimer);
      window.clearInterval(panRepeat);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerup", stopPanRepeat);
      window.removeEventListener("pointercancel", stopPanRepeat);
      pin.removeEventListener("click", onRail);
      pin.removeEventListener("pointerdown", onPanPointer);
      gate.removeEventListener("pointerdown", onDragStart);
      gate.removeEventListener("pointermove", onDragMove);
      gate.removeEventListener("pointerup", onDragEnd);
      gate.removeEventListener("pointercancel", onDragEnd);
      gsap.ticker.remove(ticker);
      lenis?.destroy();
      ctx.revert();
      scrollApi.current = null;
    };
  }, [cutToRef, edit, issue, onActive, onProgress, points, reducedMotion, scrollApi, segments, shots]);

  return (
    <div className={`cinema${reducedMotion ? " is-reduced" : ""}${negative ? " is-negative" : ""}${director ? " is-director" : ""}`} ref={pinRef}>
      <div className="letterbox top" />
      <div className="letterbox bottom" />
      <div className="cinema-vignette" />
      {desktopHud ? <div className="cinema-corners" aria-hidden="true" /> : null}
      <div className="light-leak" aria-hidden="true" />

      <div className="cinema-gate" ref={gateRef}>
        {pages.map((page, index) => (
          <div key={page.src} className="page-layer" data-page-layer data-page={page.page}>
            <img
              alt=""
              width={page.width}
              height={page.height}
              draggable={false}
              decoding={index < 2 ? "sync" : "async"}
              fetchPriority={index === 0 ? "high" : "low"}
              loading={index < 2 ? "eager" : "lazy"}
              data-src={page.src}
              {...(loadedPages.current.has(page.page) ? { src: page.src } : {})}
            />
            <span className="director-box" data-page-finder aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="cinema-hint">
        <span className="hint-desk">Scroll to move the camera</span>
        <span className="hint-phone">Swipe for the next panel</span>
        <small className="hint-desk">Drag, WASD, or the pad to pan when zoomed</small>
        <small className="hint-phone">Use the pad to pan when zoomed</small>
      </div>

      {desktopHud ? (
        <aside className="monitor" aria-hidden="true">
          <p ref={modeRef}>Wide</p>
          <div className="monitor-frame">
            <img ref={monitorImgRef} alt="" />
            <span className="finder" ref={finderRef} />
          </div>
        </aside>
      ) : null}

      {desktopHud ? (
        <div className="cinema-slate" aria-hidden="true">
          <small>Shot</small>
          <strong data-slate-frame>01</strong>
          <span data-slate-mode>Wide</span>
        </div>
      ) : null}

      {desktopHud ? (
        <nav className="chapter-rail" aria-label="Chapters">
          {issue.chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              type="button"
              data-rail={chapter.id}
              title={chapter.title}
              className={index === 0 ? "is-on" : ""}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </nav>
      ) : null}

      <div className="pan-pad" aria-label="Move the page">
        <button type="button" className="pan-n" data-pan="up" aria-label="Look up" />
        <button type="button" className="pan-w" data-pan="left" aria-label="Look left" />
        <button type="button" className="pan-c" data-pan="reset" aria-label="Recenter">
          ·
        </button>
        <button type="button" className="pan-e" data-pan="right" aria-label="Look right" />
        <button type="button" className="pan-s" data-pan="down" aria-label="Look down" />
        <small>Move page</small>
      </div>

      <div className="next-cue" aria-hidden="true">
        Next panel
      </div>

      <div className="cinema-chapter" ref={chapterRef}>
        <small data-kicker />
        <h2 data-title />
      </div>

      <div className="cinema-copy" ref={captionRef}>
        <p className="caption" data-caption />
        <p className="quote" data-quote />
      </div>

      <div className="director-slate" ref={directorRef} aria-hidden="true">
        <span data-dir-line>FRAME 001 · REVEAL · WIDE</span>
      </div>
      <div className="director-gate" aria-hidden="true" />

      <div className="cinema-end" ref={endRef}>
        <Colophon issue={issue} variant="strip" onReread={onReread} onOpenIndex={onOpenIndex} />
      </div>
    </div>
  );
}
