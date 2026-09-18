import { CHAPTER_DIRECTION } from "../content/direction";
import type {
  CameraSegment,
  CameraShot,
  CameraPose,
  CameraTransition,
  Chapter,
  Issue,
  Panel,
  Rect,
  ShotEdit,
} from "../types";
import { heroPanelFor } from "./issue";

export const FULL_PAGE: Rect = { x: 0.034, y: 0.022, w: 0.932, h: 0.956 };

export function boxToRect(box: [number, number, number, number]): Rect {
  return { x: box[0], y: box[1], w: box[2], h: box[3] };
}

export function expandBox(box: Rect, amount: number): Rect {
  const w = Math.min(1, Math.max(0.08, box.w * (1 + amount)));
  const h = Math.min(1, Math.max(0.08, box.h * (1 + amount)));
  const x = Math.min(Math.max(0, box.x - (w - box.w) / 2), 1 - w);
  const y = Math.min(Math.max(0, box.y - (h - box.h) / 2), 1 - h);
  return { x, y, w, h };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smootherstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t),
    h: lerp(a.h, b.h, t),
  };
}

export function fitCamera(
  box: Rect,
  pageWidth: number,
  pageHeight: number,
  gateW: number,
  gateH: number,
): CameraPose {
  const portrait = gateH > gateW * 1.08;
  const insetTop = gateH * (portrait ? 0.12 : 0.08);
  const insetBottom = gateH * (portrait ? 0.24 : 0.16);
  const insetX = gateW * (portrait ? 0.05 : 0.04);
  const viewW = Math.max(gateW - insetX * 2, 1);
  const viewH = Math.max(gateH - insetTop - insetBottom, 1);
  const pad = 0.9;
  const bw = Math.max(box.w * pageWidth, 1);
  const bh = Math.max(box.h * pageHeight, 1);
  const scale = Math.min((viewW * pad) / bw, (viewH * pad) / bh);
  const cx = (box.x + box.w / 2) * pageWidth;
  const cy = (box.y + box.h / 2) * pageHeight;
  return {
    scale,
    x: insetX + viewW / 2 - cx * scale,
    y: insetTop + viewH / 2 - cy * scale,
    rotate: 0,
  };
}

export function applyDrift(pose: CameraPose, amount: number, t: number, driftX = 0, driftY = 0): CameraPose {
  const d = amount * t;
  return {
    ...pose,
    scale: pose.scale * (1 + d * 0.28),
    x: pose.x - d * 8 - driftX * t * 36,
    y: pose.y - d * 3 - driftY * t * 28,
  };
}

export function easeMove(t: number, entry: CameraTransition): number {
  const x = Math.min(1, Math.max(0, t));
  if (entry === "cut") return x < 0.42 ? 0 : 1;
  if (entry === "snap") return 1 - (1 - x) ** 4;
  if (entry === "push") return x ** 4;
  if (entry === "creep") return x * 0.82 + x * x * 0.18;
  if (entry === "pull") return 1 - (1 - x) ** 3;
  if (entry === "reveal") return smootherstep(x);
  return x;
}

export function revealStart(box: Rect): Rect {
  return {
    x: Math.max(0, box.x - 0.028),
    y: Math.max(0, box.y - 0.012),
    w: Math.min(1 - Math.max(0, box.x - 0.028), box.w + 0.04),
    h: Math.min(1 - Math.max(0, box.y - 0.012), box.h + 0.03),
  };
}

export function resolveBox(shot: CameraShot, portrait: boolean): Rect {
  if (portrait && shot.mobileBox) return shot.mobileBox;
  if (portrait && shot.kind === "settle" && !isNearFull(shot.box)) {
    return expandBox(shot.box, 0.16);
  }
  return shot.box;
}

function isNearFull(box: Rect): boolean {
  return box.w >= 0.84 && box.h >= 0.82;
}

function comicOrder(panels: Panel[]): Panel[] {
  const items = panels.map((panel) => ({ panel, box: boxToRect(panel.box) }));
  const remaining = [...items];
  const ordered: Panel[] = [];

  while (remaining.length) {
    remaining.sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
    const current = remaining[0];
    const tallRight = remaining.find(
      (other) =>
        other !== current &&
        other.box.h >= Math.max(current.box.h * 1.7, 0.28) &&
        other.box.x >= current.box.x + current.box.w * 0.3 &&
        other.box.y <= current.box.y + 0.1 &&
        other.box.y + other.box.h >= current.box.y + current.box.h * 0.45,
    );

    if (tallRight) {
      const leftStack = remaining
        .filter(
          (item) =>
            item.box.x + item.box.w <= tallRight.box.x + 0.05 &&
            item.box.y < tallRight.box.y + tallRight.box.h &&
            item.box.y + item.box.h > tallRight.box.y - 0.03,
        )
        .sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
      if (leftStack.length) {
        leftStack.forEach((item) => {
          ordered.push(item.panel);
          remaining.splice(remaining.indexOf(item), 1);
        });
        continue;
      }
    }

    const row = remaining.filter((item) => {
      const topClose = Math.abs(item.box.y - current.box.y) <= 0.07;
      const heightClose = Math.abs(item.box.h - current.box.h) / Math.max(item.box.h, current.box.h, 0.01) < 0.5;
      return topClose && heightClose;
    });
    row.sort((a, b) => a.box.x - b.box.x);
    const next = row[0] ?? current;
    ordered.push(next.panel);
    remaining.splice(remaining.indexOf(next), 1);
  }

  return ordered;
}

function settleBox(panel: Panel): Rect {
  const box = boxToRect(panel.box);
  if (isNearFull(box)) return FULL_PAGE;
  return expandBox(box, 0.1);
}

function readingBoxes(panel: Panel): Rect[] {
  const box = settleBox(panel);
  if (panel.quote || panel.camera?.entry === "creep" || isNearFull(box) || box.h < 0.4) return [box];
  const top = { ...box, h: Math.min(box.h * 0.58, 0.36) };
  const bottomY = Math.min(box.y + box.h - top.h, box.y + box.h * 0.42);
  const bottom = { x: box.x, y: bottomY, w: box.w, h: box.y + box.h - bottomY };
  if (bottom.h < 0.16 || bottom.y - top.y < 0.1) return [box];
  return [top, bottom];
}

function bottomOf(box: Rect): number {
  return box.y + box.h;
}

function overlayCopy(panel: Panel): { caption: string; quote: string } {
  if (!panel.camera?.narrate) return { caption: "", quote: "" };
  return { caption: panel.caption, quote: panel.quote };
}

function holdMotion(panel: Panel | null): { drift: number; driftX: number; driftY: number } {
  if (!panel) return { drift: 0, driftX: 0, driftY: 0 };
  const authored = panel.camera?.drift;
  if (authored && ((authored.x ?? 0) !== 0 || (authored.y ?? 0) !== 0)) {
    return { drift: 0, driftX: authored.x ?? 0, driftY: authored.y ?? 0 };
  }
  if (panel.quote || panel.camera?.entry === "creep") {
    return { drift: 0, driftX: 0, driftY: 0 };
  }
  if (panel.kenBurns) return { drift: 0.016, driftX: 0, driftY: 0 };
  return { drift: 0, driftX: 0, driftY: 0 };
}

function classifyEntry(panel: Panel, recalled: boolean): CameraTransition {
  if (panel.camera?.entry) return panel.camera.entry;
  if (recalled) return "snap";
  if (panel.quote) return "creep";
  if (panel.pin) return "push";
  if (panel.role === "splash" || panel.role === "interstitial") return "reveal";
  return "snap";
}

export function chapterShowsCard(chapterId: string): boolean {
  return CHAPTER_DIRECTION[chapterId]?.card !== false;
}

function readablePanels(chapter: Chapter): Panel[] {
  const filtered = chapter.panels.filter((panel) => {
    if (panel.camera?.omit) return false;
    return !isNearFull(boxToRect(panel.box));
  });
  if (chapter.id === "cover") return filtered;
  return comicOrder(filtered);
}

function pushChapterWide(shots: CameraShot[], chapter: Chapter, hold: number, entry: CameraTransition = "reveal") {
  shots.push(
    makeShot({
      id: `chapter-${chapter.id}`,
      kind: "chapter",
      chapter,
      panel: null,
      box: FULL_PAGE,
      caption: "",
      quote: "",
      drift: 0,
      entry,
      exit: "push",
      hold,
    }),
  );
}

function pushPullback(shots: CameraShot[], chapter: Chapter, panel: Panel | null, hold = 0.7) {
  shots.push(
    makeShot({
      id: `pull-${chapter.id}`,
      kind: "pullback",
      chapter,
      panel,
      box: FULL_PAGE,
      caption: "",
      quote: "",
      drift: 0,
      entry: "pull",
      exit: "pull",
      hold,
    }),
  );
}

function pushEnding(shots: CameraShot[], chapter: Chapter) {
  shots.push(
    makeShot({
      id: "ending",
      kind: "ending",
      chapter,
      panel: chapter.panels[chapter.panels.length - 1] ?? null,
      box: FULL_PAGE,
      caption: "",
      quote: "",
      drift: 0,
      entry: "creep",
      exit: "cut",
      hold: 1.55,
    }),
  );
}

function buildArgumentShots(issue: Issue): CameraShot[] {
  const shots: CameraShot[] = [];

  issue.chapters.forEach((chapter) => {
    const cut = CHAPTER_DIRECTION[chapter.id]?.argument ?? "punch";
    const hero = heroPanelFor(chapter);
    const splash = !hero || hero.role === "splash" || hero.role === "interstitial" || isNearFull(boxToRect(hero.box));

    if (cut === "wide" || (splash && cut !== "arrive" && cut !== "punch")) {
      pushChapterWide(shots, chapter, 1.42, "reveal");
      return;
    }

    if (cut === "arrive" && hero) {
      const motion = holdMotion(hero);
      const copy = overlayCopy(hero);
      shots.push(
        makeShot({
          id: `settle-${hero.id}`,
          kind: "settle",
          chapter,
          panel: hero,
          box: isNearFull(boxToRect(hero.box)) ? FULL_PAGE : settleBox(hero),
          caption: copy.caption,
          quote: copy.quote,
          drift: motion.drift,
          driftX: motion.driftX,
          driftY: motion.driftY,
          entry: classifyEntry(hero, false),
          exit: hero.camera?.exit ?? (hero.quote ? "creep" : "push"),
          hold: hero.hold ?? 1.42,
          mobileBox: hero.camera?.mobile ? boxToRect(hero.camera.mobile) : undefined,
          semanticTag: hero.semanticTag,
        }),
      );
      return;
    }

    pushChapterWide(shots, chapter, 0.52, "reveal");
    if (hero && !isNearFull(boxToRect(hero.box))) {
      const motion = holdMotion(hero);
      const copy = overlayCopy(hero);
      shots.push(
        makeShot({
          id: `settle-${hero.id}`,
          kind: "settle",
          chapter,
          panel: hero,
          box: settleBox(hero),
          caption: copy.caption,
          quote: copy.quote,
          drift: motion.drift,
          driftX: motion.driftX,
          driftY: motion.driftY,
          entry: classifyEntry(hero, false),
          exit: hero.camera?.exit ?? "push",
          hold: hero.hold ?? 1.28,
          mobileBox: hero.camera?.mobile ? boxToRect(hero.camera.mobile) : undefined,
          semanticTag: hero.semanticTag,
        }),
      );
    }
  });

  const lastChapter = issue.chapters[issue.chapters.length - 1];
  if (lastChapter) pushEnding(shots, lastChapter);
  return shots;
}

export function buildShots(issue: Issue, edit: ShotEdit = "full"): CameraShot[] {
  if (edit === "argument") return buildArgumentShots(issue);

  const shots: CameraShot[] = [];
  const seenTags = new Set<string>();

  issue.chapters.forEach((chapter) => {
    const direction = CHAPTER_DIRECTION[chapter.id] ?? {};
    const readable = readablePanels(chapter);
    const splashOnly = readable.length === 0;
    const wideHold = splashOnly ? 1.42 : chapter.id === "cover" ? 1.08 : direction.card === false ? 1.12 : 0.7;

    pushChapterWide(shots, chapter, wideHold, "reveal");

    readable.forEach((panel) => {
      readingBoxes(panel).forEach((box, part) => {
        const recalled = Boolean(panel.semanticTag && seenTags.has(panel.semanticTag));
        if (panel.semanticTag) seenTags.add(panel.semanticTag);
        const entry = classifyEntry(panel, recalled);
        const motion = holdMotion(panel);
        const copy = overlayCopy(panel);
        const hold =
          panel.hold ??
          (panel.quote ? 1.28 : panel.pin ? 1.12 : box.y >= 0.58 ? 0.98 : 0.86) * (recalled ? 0.86 : 1);
        shots.push(
          makeShot({
            id: part === 0 ? `settle-${panel.id}` : `settle-${panel.id}-b`,
            kind: "settle",
            chapter,
            panel,
            box,
            caption: copy.caption,
            quote: copy.quote,
            drift: motion.drift,
            driftX: motion.driftX,
            driftY: motion.driftY,
            entry,
            exit: panel.camera?.exit ?? (panel.quote ? "creep" : entry === "snap" ? "snap" : "push"),
            hold,
            mobileBox: panel.camera?.mobile ? boxToRect(panel.camera.mobile) : undefined,
            semanticTag: panel.semanticTag,
            recalled,
          }),
        );
      });
    });

    if (direction.footer && readable.length > 0) {
      const last = readable[readable.length - 1];
      const lastBox = settleBox(last);
      if (bottomOf(lastBox) < 0.9) {
        shots.push(
          makeShot({
            id: `foot-${chapter.id}`,
            kind: "settle",
            chapter,
            panel: last,
            box: { x: 0.034, y: 0.66, w: 0.932, h: 0.32 },
            caption: "",
            quote: "",
            drift: 0,
            entry: "pull",
            exit: "pull",
            hold: 0.92,
          }),
        );
      }
    }

    if (direction.pullback && readable.length > 0) {
      pushPullback(shots, chapter, readable[readable.length - 1] ?? null);
    }
  });

  const lastChapter = issue.chapters[issue.chapters.length - 1];
  if (lastChapter) pushEnding(shots, lastChapter);
  return shots;
}

function makeShot(partial: {
  id: string;
  kind: CameraShot["kind"];
  chapter: Chapter;
  panel: Panel | null;
  box: Rect;
  caption: string;
  quote: string;
  drift: number;
  driftX?: number;
  driftY?: number;
  entry: CameraShot["entry"];
  exit: CameraShot["exit"];
  hold: number;
  mobileBox?: Rect;
  semanticTag?: CameraShot["semanticTag"];
  recalled?: boolean;
}): CameraShot {
  return {
    id: partial.id,
    kind: partial.kind,
    page: partial.chapter.page,
    pageSrc: partial.chapter.pageSrc,
    pageWidth: partial.chapter.pageWidth,
    pageHeight: partial.chapter.pageHeight,
    box: partial.box,
    mobileBox: partial.mobileBox,
    chapter: partial.chapter,
    panel: partial.panel,
    caption: partial.caption,
    quote: partial.quote,
    drift: partial.drift,
    driftX: partial.driftX ?? 0,
    driftY: partial.driftY ?? 0,
    entry: partial.entry,
    exit: partial.exit,
    hold: partial.hold,
    semanticTag: partial.semanticTag,
    recalled: Boolean(partial.recalled),
  };
}

export function buildSegments(shots: CameraShot[]): CameraSegment[] {
  const segments: CameraSegment[] = [];
  shots.forEach((shot, index) => {
    const prev = shots[index - 1] ?? shot;
    const pageChange = prev.page !== shot.page;
    const moveWeight = pageChange
      ? 0.66
      : shot.entry === "snap"
        ? 0.18
        : shot.entry === "cut"
          ? 0.1
          : shot.entry === "creep"
            ? 0.94
            : shot.entry === "push"
              ? 0.5
              : shot.kind === "pullback" || shot.entry === "pull"
                ? 0.74
                : shot.entry === "reveal"
                  ? 0.46
                  : 0.4;
    segments.push({
      from: prev,
      to: shot,
      weight: moveWeight,
      mode: "move",
    });
    segments.push({
      from: shot,
      to: shot,
      weight: shot.hold,
      mode: "hold",
    });
  });
  return segments;
}

export function sampleSegment(
  segments: CameraSegment[],
  progress: number,
): { segment: CameraSegment; local: number; index: number } {
  const total = segments.reduce((sum, segment) => sum + segment.weight, 0);
  let rest = Math.min(1, Math.max(0, progress)) * total;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (rest <= segment.weight) {
      return { segment, local: segment.weight === 0 ? 1 : rest / segment.weight, index };
    }
    rest -= segment.weight;
  }
  const last = segments[segments.length - 1];
  return { segment: last, local: 1, index: segments.length - 1 };
}

export function poseFor(
  shot: CameraShot,
  gateW: number,
  gateH: number,
  driftT = 0,
): CameraPose {
  const portrait = gateH > gateW * 1.08;
  const box = resolveBox(shot, portrait);
  const pose = fitCamera(box, shot.pageWidth, shot.pageHeight, gateW, gateH);
  return applyDrift(pose, shot.drift, driftT, shot.driftX, shot.driftY);
}

export function snapPoints(segments: CameraSegment[]): number[] {
  const total = segments.reduce((sum, segment) => sum + segment.weight, 0) || 1;
  let acc = 0;
  const points: number[] = [];
  segments.forEach((segment) => {
    if (segment.mode === "hold") {
      points.push((acc + segment.weight * 0.12) / total);
    }
    acc += segment.weight;
  });
  return points;
}

export function nearestSnap(points: number[], value: number): number {
  return points.reduce((best, point) => (Math.abs(point - value) < Math.abs(best - value) ? point : best), points[0] ?? value);
}

export function closestSnapIndex(points: number[], value: number): number {
  let best = 0;
  points.forEach((point, index) => {
    if (Math.abs(point - value) < Math.abs(points[best] - value)) best = index;
  });
  return best;
}

export function oneStepSnap(points: number[], value: number, fromIndex: number): number {
  if (!points.length) return value;
  const target = closestSnapIndex(points, value);
  const clamped = Math.max(0, Math.min(points.length - 1, Math.max(fromIndex - 1, Math.min(fromIndex + 1, target))));
  return points[clamped];
}

export function shotLabel(kind: CameraShot["kind"]): string {
  if (kind === "chapter") return "Wide";
  if (kind === "pullback") return "The whole page";
  if (kind === "ending") return "The end";
  if (kind === "approach") return "Push in";
  return "On panel";
}

export function entryLabel(entry: CameraTransition): string {
  return entry.toUpperCase();
}
