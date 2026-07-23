/** All widget CSS, injected into the shadow root so it is fully isolated from
 *  the host page (and cannot leak out). Kept as a single string on purpose —
 *  no external CSS framework, no build-time CSS extraction. */
export const styles = /* css */ `
  :host { all: initial; }

  *, *::before, *::after { box-sizing: border-box; }

  .pn-root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a2e;
    line-height: 1.4;
  }

  /* Both widgets mount sibling shadow hosts on document.body, so their fixed
     children share the root stacking context and compare z-index directly.
     The annotations widget tops out at 2147483060 (a focused callout), so the
     nav sits in a band above it: its toolbar and modal gallery must never be
     covered by a note. */

  /* ---- Floating draggable toolbar (Menu + optional Notes) ---- */
  .pn-toolbar {
    position: fixed;
    z-index: 2147483500;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    /* Extra room on the right so the last icon isn't tight against the edge —
       the grip already provides that breathing room on the left. */
    padding: 5px 11px 5px 5px;
    border-radius: 999px;
    background: #1a1a2e;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    user-select: none;
    touch-action: none;
  }
  .pn-toolbar.pn-dragging { cursor: grabbing; }
  .pn-grip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 30px;
    color: #6b6b85;
    font-size: 15px;
    cursor: grab;
  }
  .pn-grip:active { cursor: grabbing; }
  /* Icon-only buttons — the label lives in the tooltip below, so the bar stays
     compact as controls are added. */
  .pn-tool-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: #fff;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
  }
  /* Hover is the only background state: the notes buttons carry their on/off
     state in the icon itself (eye vs struck-through eye, chevrons in vs out)
     and in the tooltip label, not in a filled pill. */
  .pn-tool-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); }
  .pn-tool-btn:disabled { color: #6b6b85; cursor: default; }
  .pn-tool-ico { display: block; }

  /* Tooltip: the button's label, revealed on hover/keyboard focus. */
  .pn-tool-btn::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 9px);
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 9px;
    border-radius: 7px;
    background: #fff;
    color: #1a1a2e;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease 0.25s;
  }
  .pn-toolbar.pn-tip-below .pn-tool-btn::after { bottom: auto; top: calc(100% + 9px); }
  .pn-tool-btn:hover::after,
  .pn-tool-btn:focus-visible::after { opacity: 1; }
  /* No tooltips mid-drag — the bar is moving under the cursor. */
  .pn-toolbar.pn-dragging .pn-tool-btn::after { opacity: 0; }

  .pn-pos-bottom-right { bottom: 20px; right: 20px; }
  .pn-pos-bottom-left  { bottom: 20px; left: 20px; }
  .pn-pos-top-right    { top: 20px; right: 20px; }
  .pn-pos-top-left     { top: 20px; left: 20px; }

  /* ---- Overlay + gallery ---- */
  .pn-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483600;
    background: rgba(10, 10, 20, 0.55);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow: auto;
    padding: 48px 24px;
    animation: pn-fade 0.15s ease;
  }
  @keyframes pn-fade { from { opacity: 0; } to { opacity: 1; } }

  .pn-panel {
    width: 100%;
    max-width: 960px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  .pn-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #ececf1;
  }
  .pn-title { margin: 0; font-size: 20px; font-weight: 700; }
  .pn-header-actions { display: flex; align-items: center; gap: 10px; }
  .pn-notes {
    border: 1px solid #d8d8e0;
    background: #fff;
    color: #333;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .pn-notes:hover { background: #f5f5f9; }
  .pn-notes-on { background: #4f46e5; border-color: #4f46e5; color: #fff; }
  .pn-notes-on:hover { background: #4338ca; }
  .pn-close {
    border: none;
    background: #f2f2f6;
    width: 32px; height: 32px;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    color: #555;
    line-height: 1;
  }
  .pn-close:hover { background: #e6e6ee; color: #000; }

  .pn-body { padding: 8px 24px 28px; }

  .pn-section-title {
    margin: 20px 0 12px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8a8a9a;
  }

  .pn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .pn-card {
    display: flex;
    flex-direction: column;
    text-align: left;
    border: 1px solid #ececf1;
    border-radius: 12px;
    background: #fff;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease;
  }
  .pn-card:hover {
    border-color: #c9c9d6;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  .pn-card.pn-active { border-color: #1a1a2e; box-shadow: 0 0 0 2px #1a1a2e inset; }

  .pn-thumb { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; background: #f2f2f6; }
  .pn-preview { position: relative; overflow: hidden; }
  .pn-preview iframe {
    position: absolute;
    top: 0;
    left: 0;
    border: 0;
    pointer-events: none;
    background: #fff;
    transition: opacity 0.2s ease;
  }
  /* Shown under the frame until it has loaded, so a card is never blank. */
  .pn-preview-fallback { position: absolute; inset: 0; }
  .pn-preview-fallback.pn-loading { animation: pn-pulse 1.2s ease-in-out infinite; }
  @keyframes pn-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }

  .pn-card-body { display: block; padding: 12px 14px 14px; }
  .pn-card-title { display: block; font-size: 15px; font-weight: 600; margin: 0 0 4px; }
  .pn-card-desc { display: block; font-size: 13px; color: #6a6a7a; margin: 0; }

  .pn-empty { padding: 40px 0; text-align: center; color: #8a8a9a; font-size: 14px; }

  @media (max-width: 560px) {
    .pn-overlay { padding: 24px 12px; }
    .pn-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  }
`;
