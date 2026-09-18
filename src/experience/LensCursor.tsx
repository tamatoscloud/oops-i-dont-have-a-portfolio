import { useEffect, useRef } from "react";

export function LensCursor({ enabled }: { enabled: boolean }) {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const node = ring.current;
    if (!node) return;
    const move = (event: PointerEvent) => {
      node.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      node.classList.toggle("is-hot", Boolean((event.target as HTMLElement | null)?.closest("button, a")));
    };
    const down = () => node.classList.add("is-down");
    const up = () => node.classList.remove("is-down");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="lens-cursor" ref={ring} aria-hidden="true">
      <span />
    </div>
  );
}
