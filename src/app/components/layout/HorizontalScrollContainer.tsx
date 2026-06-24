import { useEffect, useRef, useState, type ReactNode } from "react";

type HorizontalScrollContainerProps = {
  children: ReactNode;
  className?: string;
};

type BarMetrics = {
  visible: boolean;
  left: number;
  width: number;
};

export function HorizontalScrollContainer({ children, className = "" }: HorizontalScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [barMetrics, setBarMetrics] = useState<BarMetrics>({ visible: false, left: 0, width: 0 });
  const syncing = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const overflow = content.scrollWidth > content.clientWidth + 1;
      const inView = rect.bottom > 64 && rect.top < window.innerHeight;

      if (spacerRef.current) {
        spacerRef.current.style.width = `${content.scrollWidth}px`;
      }

      setBarMetrics({
        visible: overflow && inView,
        left: Math.max(rect.left, 0),
        width: rect.width,
      });
    };

    const syncFromContent = () => {
      const bar = barRef.current;
      if (!bar || syncing.current) return;
      syncing.current = true;
      bar.scrollLeft = content.scrollLeft;
      syncing.current = false;
    };

    content.addEventListener("scroll", syncFromContent, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(content);
    if (content.firstElementChild) {
      resizeObserver.observe(content.firstElementChild);
    }
    resizeObserver.observe(container);

    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);

    update();

    return () => {
      content.removeEventListener("scroll", syncFromContent);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [children]);

  useEffect(() => {
    const bar = barRef.current;
    const content = contentRef.current;
    if (!bar || !content || !barMetrics.visible) return;

    const syncFromBar = () => {
      if (syncing.current) return;
      syncing.current = true;
      content.scrollLeft = bar.scrollLeft;
      syncing.current = false;
    };

    bar.scrollLeft = content.scrollLeft;
    bar.addEventListener("scroll", syncFromBar, { passive: true });

    return () => {
      bar.removeEventListener("scroll", syncFromBar);
    };
  }, [barMetrics.visible, children]);

  return (
    <>
      <div ref={containerRef} className={className}>
        <div
          ref={contentRef}
          className={`overflow-x-auto ${
            barMetrics.visible
              ? "scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : ""
          }`}
        >
          {children}
        </div>
      </div>

      {barMetrics.visible ? (
        <div
          ref={barRef}
          className="fixed bottom-0 z-50 overflow-x-auto overflow-y-hidden border-t border-gray-300 bg-white/95 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm"
          style={{
            left: barMetrics.left,
            width: barMetrics.width,
            height: 18,
          }}
          aria-label="Rolagem horizontal da tabela"
        >
          <div ref={spacerRef} className="h-px" />
        </div>
      ) : null}
    </>
  );
}
