import type { Issue, Panel } from "../types";

function frameUrl(frame: number, argument: boolean): string {
  const hash = argument ? `#argument/frame-${frame}` : `#frame-${frame}`;
  return `${window.location.origin}${window.location.pathname}${hash}`;
}

export async function shareFrame(options: {
  issue: Issue;
  panel: Panel | null;
  frame: number;
  argument: boolean;
}): Promise<"shared" | "copied"> {
  const url = frameUrl(options.frame, options.argument);
  const title = `${options.issue.title} — Frame ${String(options.frame).padStart(3, "0")} / ${options.issue.totalFrames}`;
  const text = options.panel?.quote || options.panel?.caption || options.issue.subtitle;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return "copied";
    }
  }

  await navigator.clipboard.writeText(url);
  return "copied";
}
