import { CHAPTER_HEROES, FRAME_DIRECTION } from "../content/direction";
import type { Chapter, Issue, Panel, ShotEdit, StripItem } from "../types";

export function flattenIssue(issue: Issue): StripItem[] {
  const items: StripItem[] = [];
  for (const chapter of issue.chapters) {
    items.push({ kind: "gate", chapter });
    for (const panel of chapter.panels) {
      items.push({ kind: "panel", chapter, panel });
    }
  }
  return items;
}

export function padFrame(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}

export function withBase(path: string): string {
  if (!path || /^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export function hydrateIssue(issue: Issue): Issue {
  return {
    ...issue,
    chapters: issue.chapters.map((chapter) => ({
      ...chapter,
      heroFrame: chapter.heroFrame ?? CHAPTER_HEROES[chapter.id],
      pageSrc: withBase(chapter.pageSrc),
      panels: chapter.panels.map((panel) => {
        const directed = FRAME_DIRECTION[panel.id];
        const sourced: Panel = {
          ...panel,
          src: withBase(panel.src),
          thumb: withBase(panel.thumb),
          pageSrc: withBase(panel.pageSrc),
        };
        if (!directed) return sourced;
        return {
          ...sourced,
          hold: directed.hold ?? sourced.hold,
          semanticTag: directed.semanticTag ?? sourced.semanticTag,
          camera: {
            ...sourced.camera,
            entry: directed.entry ?? sourced.camera?.entry,
            exit: directed.exit ?? sourced.camera?.exit,
            mobile: directed.mobile ?? sourced.camera?.mobile,
            drift: directed.drift ?? sourced.camera?.drift,
            omit: directed.omit ?? sourced.camera?.omit,
            narrate: directed.narrate ?? sourced.camera?.narrate,
          },
        };
      }),
    })),
    characters: issue.characters?.map((member) => ({
      ...member,
      src: withBase(member.src),
    })),
  };
}

export function panelByFrame(issue: Issue, frame: number): Panel | null {
  for (const chapter of issue.chapters) {
    const match = chapter.panels.find((panel) => panel.frame === frame);
    if (match) return match;
  }
  return null;
}

export function panelById(issue: Issue, id: string): Panel | null {
  for (const chapter of issue.chapters) {
    if (chapter.id === id) return chapter.panels[0] ?? null;
    const match = chapter.panels.find((panel) => panel.id === id);
    if (match) return match;
  }
  return null;
}

export function chapterIndexOf(issue: Issue, panelId: string | null): number {
  if (!panelId) return 0;
  const index = issue.chapters.findIndex(
    (chapter) => chapter.id === panelId || chapter.panels.some((panel) => panel.id === panelId),
  );
  return Math.max(0, index);
}

export function heroPanelFor(chapter: Chapter): Panel | null {
  if (chapter.heroFrame) {
    const named = chapter.panels.find((panel) => panel.id === chapter.heroFrame);
    if (named) return named;
  }
  return (
    chapter.panels.find((panel) => panel.pin && panel.quote) ??
    chapter.panels.find((panel) => panel.pin) ??
    chapter.panels.find((panel) => panel.quote) ??
    chapter.panels.find((panel) => panel.role !== "splash") ??
    chapter.panels[0] ??
    null
  );
}

export function argumentPanels(issue: Issue): Panel[] {
  return issue.chapters.map((chapter) => heroPanelFor(chapter)).filter((panel): panel is Panel => Boolean(panel));
}

export function parseIssueHash(hash = typeof window === "undefined" ? "" : window.location.hash): {
  frame?: number;
  panelId?: string;
  edit?: ShotEdit;
} | null {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;
  const parts = raw.split("/").filter(Boolean);
  let edit: ShotEdit | undefined;
  let token = parts[0];
  if (parts[0] === "argument") {
    edit = "argument";
    token = parts[1] ?? "";
  }
  if (!token && edit) return { edit };
  const frameMatch = token.match(/^frame-(\d+)$/i);
  if (frameMatch) return { frame: Number(frameMatch[1]), edit };
  if (token) return { panelId: token, edit };
  return edit ? { edit } : null;
}

export function frameHash(frame: number, edit: ShotEdit = "full"): string {
  return edit === "argument" ? `#argument/frame-${frame}` : `#frame-${frame}`;
}
