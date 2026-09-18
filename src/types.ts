export type PanelRole =
  | "splash"
  | "wide"
  | "portrait"
  | "detail"
  | "grid-beat"
  | "interstitial";

export type CameraBox = [number, number, number, number];

export type CameraTransition = "cut" | "push" | "creep" | "snap" | "pull" | "reveal";

export type SemanticTag = "belief" | "strategy" | "audience" | "problem" | "craft" | "outcome" | "context";

export type CameraIntent = {
  entry?: CameraTransition;
  exit?: CameraTransition;
  mobile?: CameraBox;
  drift?: {
    x?: number;
    y?: number;
  };
  omit?: boolean;
  narrate?: boolean;
};

export type Panel = {
  id: string;
  src: string;
  thumb: string;
  role: PanelRole;
  caption: string;
  quote: string;
  pin: boolean;
  kenBurns: boolean;
  width: number;
  height: number;
  page: number;
  pageSrc: string;
  box: CameraBox;
  frame: number;
  hold?: number;
  semanticTag?: SemanticTag;
  camera?: CameraIntent;
};

export type Chapter = {
  id: string;
  title: string;
  kicker: string;
  page: number;
  pageSrc: string;
  pageWidth: number;
  pageHeight: number;
  panels: Panel[];
  heroFrame?: string;
};

export type CastMember = {
  id: string;
  src: string;
  chapterId: string;
  panelId: string;
  page: number;
  anchor: "left" | "right";
  x: number;
  y: number;
  w: number;
  h: number;
  width: number;
  height: number;
};

export type Issue = {
  title: string;
  subtitle: string;
  author: string;
  role: string;
  location: string;
  masthead: string;
  tagline: string;
  cta: {
    label: string;
    line: string;
  };
  chapters: Chapter[];
  characters?: CastMember[];
  totalFrames: number;
};

export type ShotKind = "chapter" | "establish" | "approach" | "settle" | "pullback" | "ending";

export type ShotEdit = "full" | "argument";

export type Rect = { x: number; y: number; w: number; h: number };

export type CameraShot = {
  id: string;
  kind: ShotKind;
  page: number;
  pageSrc: string;
  pageWidth: number;
  pageHeight: number;
  box: Rect;
  mobileBox?: Rect;
  chapter: Chapter;
  panel: Panel | null;
  caption: string;
  quote: string;
  drift: number;
  driftX: number;
  driftY: number;
  entry: CameraTransition;
  exit: CameraTransition;
  hold: number;
  semanticTag?: SemanticTag;
  recalled: boolean;
};

export type CameraSegment = {
  from: CameraShot;
  to: CameraShot;
  weight: number;
  mode: "move" | "hold";
};

export type CameraPose = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

export type StripItem =
  | { kind: "gate"; chapter: Chapter }
  | { kind: "panel"; chapter: Chapter; panel: Panel };
