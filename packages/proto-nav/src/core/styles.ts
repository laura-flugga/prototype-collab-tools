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

  /* ---- Floating Menu button ---- */
  .pn-button {
    position: fixed;
    z-index: 2147483000;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    border-radius: 999px;
    background: #1a1a2e;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    user-select: none;
    touch-action: none;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .pn-button:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); }
  .pn-button:active { transform: translateY(0); }
  .pn-button.pn-dragging { cursor: grabbing; transition: none; }
  .pn-button-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; }

  .pn-pos-bottom-right { bottom: 20px; right: 20px; }
  .pn-pos-bottom-left  { bottom: 20px; left: 20px; }
  .pn-pos-top-right    { top: 20px; right: 20px; }
  .pn-pos-top-left     { top: 20px; left: 20px; }

  /* ---- Overlay + gallery ---- */
  .pn-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483001;
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
  .pn-preview iframe { position: absolute; top: 0; left: 0; border: 0; pointer-events: none; background: #fff; }

  .pn-card-body { display: block; padding: 12px 14px 14px; }
  .pn-card-title { display: block; font-size: 15px; font-weight: 600; margin: 0 0 4px; }
  .pn-card-desc { display: block; font-size: 13px; color: #6a6a7a; margin: 0; }

  .pn-empty { padding: 40px 0; text-align: center; color: #8a8a9a; font-size: 14px; }

  @media (max-width: 560px) {
    .pn-overlay { padding: 24px 12px; }
    .pn-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  }
`;
