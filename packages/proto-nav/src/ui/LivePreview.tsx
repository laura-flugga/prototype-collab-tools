import { useEffect, useRef, useState } from "preact/hooks";

// The iframe renders at a fixed logical width, then is CSS-scaled down to fill
// the card's thumbnail area — giving a live, always-current page preview.
const BASE_W = 1280;
const BASE_H = (BASE_W * 10) / 16; // 16:10, matches the .pn-thumb aspect ratio

/** A live scaled-down `<iframe>` of the entry URL, used as a real page thumbnail.
 *  Note: pages that forbid framing (X-Frame-Options / CSP frame-ancestors, e.g.
 *  SSO-gated previews) will render blank — use a static `thumbnail` for those. */
export function LivePreview({ url }: { url: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / BASE_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} class="pn-thumb pn-preview" aria-hidden="true">
      <iframe
        src={url}
        width={BASE_W}
        height={BASE_H}
        loading="lazy"
        scrolling="no"
        tabIndex={-1}
        title=""
        sandbox="allow-same-origin allow-scripts"
        style={{
          width: `${BASE_W}px`,
          height: `${BASE_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
