import type { CameraIntent, SemanticTag } from "../types";

export type FrameDirection = {
  entry?: CameraIntent["entry"];
  exit?: CameraIntent["exit"];
  hold?: number;
  semanticTag?: SemanticTag;
  mobile?: [number, number, number, number];
  drift?: { x?: number; y?: number };
  omit?: boolean;
  narrate?: boolean;
};

export type ArgumentCut = "wide" | "arrive" | "punch";

export type ChapterDirection = {
  card?: boolean;
  pullback?: boolean;
  footer?: boolean;
  argument?: ArgumentCut;
};

export const CHAPTER_HEROES: Record<string, string> = {
  cover: "cover-quote",
  "what-is-a-portfolio": "p2-quote",
  "the-market": "p3-quote",
  "building-strategy": "p4-quote",
  career: "p5-quote",
  "trenches-1": "p6-tiger-quote",
  "trenches-2": "p7-josh-copy",
  "behind-the-work": "p8-splash",
  "interlude-wait": "p9-method",
  pattern: "p10-center",
  system: "p11-quote",
  upstream: "p12-quote",
  vintage: "p13-splash",
  "tiger-deep": "p14-quote",
  encore: "p15-splash",
  "olpers-deep": "p16-quote",
  "one-last": "p17-splash",
  hbl: "p18-quote",
  colophon: "p19-splash",
};

export const CHAPTER_DIRECTION: Record<string, ChapterDirection> = {
  cover: { card: false, pullback: true, footer: false, argument: "arrive" },
  "what-is-a-portfolio": { card: true, pullback: true, footer: false, argument: "arrive" },
  "the-market": { card: true, pullback: false, footer: false, argument: "punch" },
  "building-strategy": { card: true, pullback: true, footer: false, argument: "arrive" },
  career: { card: true, pullback: false, footer: false, argument: "arrive" },
  "trenches-1": { card: true, pullback: true, footer: false, argument: "punch" },
  "trenches-2": { card: true, pullback: false, footer: false, argument: "punch" },
  "behind-the-work": { card: false, pullback: false, footer: false, argument: "wide" },
  "interlude-wait": { card: false, pullback: false, footer: false, argument: "punch" },
  pattern: { card: true, pullback: true, footer: false, argument: "arrive" },
  system: { card: true, pullback: false, footer: false, argument: "arrive" },
  upstream: { card: true, pullback: true, footer: false, argument: "arrive" },
  vintage: { card: false, pullback: false, footer: false, argument: "wide" },
  "tiger-deep": { card: true, pullback: true, footer: false, argument: "punch" },
  encore: { card: false, pullback: false, footer: false, argument: "wide" },
  "olpers-deep": { card: true, pullback: false, footer: false, argument: "punch" },
  "one-last": { card: false, pullback: false, footer: false, argument: "wide" },
  hbl: { card: true, pullback: true, footer: false, argument: "arrive" },
  colophon: { card: false, pullback: false, footer: false, argument: "wide" },
};

export const FRAME_DIRECTION: Record<string, FrameDirection> = {
  "cover-airport": { entry: "push", hold: 1.15 },
  "cover-context": { entry: "creep", semanticTag: "context", hold: 1.2 },
  "cover-step-1": { omit: true, mobile: [0.04, 0.46, 0.54, 0.18] },
  "cover-step-2": { entry: "snap", hold: 0.62 },
  "cover-step-3": { entry: "snap", hold: 0.62 },
  "cover-step-4": { entry: "push", semanticTag: "problem", hold: 1.18 },
  "cover-quote": { entry: "creep", hold: 1.55, semanticTag: "problem" },
  "p2-quote": { entry: "creep", hold: 1.5, semanticTag: "strategy" },
  "p3-quote": { entry: "push", hold: 1.25, semanticTag: "audience" },
  "p3-desk": { semanticTag: "craft" },
  "p4-quote": { entry: "creep", hold: 1.4, semanticTag: "craft" },
  "p5-quote": { entry: "creep", hold: 1.35, semanticTag: "problem" },
  "p6-tiger-quote": { entry: "push", semanticTag: "belief", hold: 1.2 },
  "p6-rimula-quote": { entry: "snap", semanticTag: "audience" },
  "p7-josh-copy": { entry: "push", semanticTag: "belief", hold: 1.25 },
  "p8-splash": { entry: "reveal", hold: 1.45, semanticTag: "belief" },
  "p9-method": { entry: "push", semanticTag: "strategy", hold: 1.2 },
  "p10-center": { entry: "creep", hold: 1.45, semanticTag: "belief" },
  "p11-quote": { entry: "creep", hold: 1.4, semanticTag: "craft" },
  "p12-quote": { entry: "creep", hold: 1.4, semanticTag: "strategy" },
  "p13-splash": { entry: "reveal", hold: 1.35 },
  "p14-quote": { entry: "push", hold: 1.35, semanticTag: "outcome" },
  "p15-splash": { entry: "reveal", hold: 1.3 },
  "p16-quote": { entry: "push", hold: 1.3, semanticTag: "belief" },
  "p17-splash": { entry: "reveal", hold: 1.3 },
  "p18-quote": { entry: "creep", hold: 1.4, semanticTag: "outcome" },
  "p19-splash": { entry: "reveal", hold: 1.45, semanticTag: "craft" },
  "p19-thanks": { omit: true },
};
