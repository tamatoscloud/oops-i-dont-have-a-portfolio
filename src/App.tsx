import { useCallback, useEffect, useRef, useState } from "react";
import issueData from "./content/issue.json";
import type { Issue, ShotEdit } from "./types";
import { usePrefersReducedMotion } from "./hooks/useMedia";
import { unlockAudio } from "./lib/sound";
import { shareFrame } from "./lib/share";
import { chapterIndexOf, frameHash, hydrateIssue, panelByFrame, panelById, parseIssueHash } from "./lib/issue";
import { ColdOpen } from "./experience/ColdOpen";
import { ContactSheet } from "./experience/ContactSheet";
import { CinematicCamera } from "./experience/CinematicCamera";
import { FrameCounter } from "./experience/FrameCounter";
import { GrainOverlay } from "./experience/GrainOverlay";
import { LensCursor } from "./experience/LensCursor";

const issue = hydrateIssue(issueData as Issue);

function initialFromHash() {
  const parsed = parseIssueHash();
  if (!parsed) return { opened: false, edit: "full" as ShotEdit, jump: null as string | null };
  const panel = parsed.panelId
    ? panelById(issue, parsed.panelId)
    : parsed.frame
      ? panelByFrame(issue, parsed.frame)
      : null;
  return {
    opened: true,
    edit: parsed.edit ?? "full",
    jump: panel?.id ?? null,
  };
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const boot = useRef(initialFromHash()).current;
  const [opened, setOpened] = useState(boot.opened);
  const [sheet, setSheet] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [negative, setNegative] = useState(false);
  const [director, setDirector] = useState(false);
  const [edit, setEdit] = useState<ShotEdit>(boot.edit);
  const [frame, setFrame] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(issue.chapters[0]?.panels[0]?.id ?? null);
  const [toast, setToast] = useState("");
  const holdTimer = useRef(0);
  const scrollApi = useRef<((panelId: string) => void) | null>(null);
  const cutToRef = useRef<string | null>(boot.jump);
  const progressBar = useRef<HTMLSpanElement>(null);

  const onActive = useCallback(
    (panelId: string, nextFrame: number) => {
      setActiveId(panelId);
      setFrame(nextFrame);
      const nextHash = frameHash(nextFrame, edit);
      if (window.location.hash !== nextHash) {
        history.replaceState(null, "", `${window.location.pathname}${nextHash}`);
      }
    },
    [edit],
  );

  const onProgress = useCallback((value: number) => {
    if (progressBar.current) {
      progressBar.current.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
    }
  }, []);

  const openIssue = async (nextEdit: ShotEdit = "full") => {
    await unlockAudio();
    setSoundOn(true);
    setEdit(nextEdit);
    setOpened(true);
  };

  const jump = (panelId: string) => {
    setSheet(false);
    scrollApi.current?.(panelId);
  };

  const reread = () => {
    setSheet(false);
    const first = issue.chapters[0]?.panels[0]?.id;
    if (first) scrollApi.current?.(first);
  };

  const onShare = async () => {
    const panel = panelById(issue, activeId ?? "") ?? panelByFrame(issue, frame);
    const result = await shareFrame({
      issue,
      panel,
      frame,
      argument: edit === "argument",
    });
    setToast(result === "shared" ? "Shared" : "Link copied");
    window.setTimeout(() => setToast(""), 1800);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(false);
      if (event.key.toLowerCase() === "i") setSheet((value) => !value);
      if (event.key.toLowerCase() === "n") setNegative((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (event.pointerType === "touch") return;
      if (target.closest("button, a, .sheet, .cold-open")) return;
      holdTimer.current = window.setTimeout(() => setNegative(true), 420);
    };
    const onUp = () => {
      window.clearTimeout(holdTimer.current);
      setNegative(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  useEffect(() => {
    const next = issue.chapters[1]?.pageSrc;
    if (!next) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = next;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("is-reading", Boolean(opened));
    return () => document.body.classList.remove("is-reading");
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const id = cutToRef.current;
    if (!id) return;
    const timer = window.setInterval(() => {
      if (!scrollApi.current) return;
      scrollApi.current(id);
      cutToRef.current = null;
      window.clearInterval(timer);
    }, 40);
    return () => window.clearInterval(timer);
  }, [opened, edit]);

  useEffect(() => {
    const onHash = () => {
      const parsed = parseIssueHash();
      if (!parsed) return;
      if (parsed.edit) setEdit(parsed.edit);
      const panel = parsed.panelId
        ? panelById(issue, parsed.panelId)
        : parsed.frame
          ? panelByFrame(issue, parsed.frame)
          : null;
      if (panel) {
        cutToRef.current = panel.id;
        setOpened(true);
        if (scrollApi.current) {
          scrollApi.current(panel.id);
          cutToRef.current = null;
        }
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const finePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
  const chapterNo = chapterIndexOf(issue, activeId) + 1;

  return (
    <>
      <GrainOverlay />
      <LensCursor enabled={opened && !sheet && finePointer} />
      <div className="progress" aria-hidden="true">
        <span ref={progressBar} />
      </div>
      {toast ? <div className="share-toast">{toast}</div> : null}

      {opened && (
        <header className="hud hud-top">
          <div className="masthead">
            <small>{issue.masthead}</small>
            <strong>{issue.author}</strong>
          </div>
          <FrameCounter current={frame} total={issue.totalFrames} chapter={chapterNo} chapters={issue.chapters.length} />
          <div className="hud-actions">
            <button className={`hud-btn${soundOn ? " is-on" : ""}`} type="button" onClick={() => setSoundOn((value) => !value)}>
              {soundOn ? "Sound on" : "Sound off"}
            </button>
            <button className="hud-btn" type="button" onClick={() => void onShare()}>
              Share
            </button>
            <button className="hud-btn" type="button" onClick={() => setSheet(true)}>
              Index
            </button>
          </div>
        </header>
      )}

      {!opened && <ColdOpen issue={issue} onOpen={openIssue} />}

      {opened && (
        <CinematicCamera
          issue={issue}
          reducedMotion={reducedMotion}
          soundOn={soundOn}
          negative={negative}
          director={director}
          edit={edit}
          onActive={onActive}
          onProgress={onProgress}
          onReread={reread}
          onOpenIndex={() => setSheet(true)}
          scrollApi={scrollApi}
          cutToRef={cutToRef}
        />
      )}

      <ContactSheet
        issue={issue}
        open={sheet}
        activeId={activeId}
        argument={edit === "argument"}
        director={director}
        onJump={jump}
        onClose={() => setSheet(false)}
        onSetArgument={(value) => {
          cutToRef.current = activeId;
          setEdit(value ? "argument" : "full");
        }}
        onToggleDirector={() => setDirector((value) => !value)}
      />
    </>
  );
}
