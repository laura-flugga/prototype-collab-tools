/** All annotation widget CSS, injected into the shadow root for full isolation.
 *
 *  z-index budget: everything here stays at or below 2147483060 (a focused
 *  callout, see Marker.tsx). The sibling `proto-nav` widget deliberately sits in
 *  a band above that, so its toolbar and gallery are never covered by a note. */
export const styles = /* css */ `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }

  .an-root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a2e;
  }

  /* ---- Toggle button ---- */
  .an-toggle {
    position: fixed;
    bottom: 20px;
    left: 20px;
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
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .an-toggle:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); }
  .an-toggle.an-on { background: #4f46e5; }
  .an-toggle-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.25);
    font-size: 11px;
    font-weight: 700;
  }

  /* ---- Callout ---- */
  .an-callout {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483040;
    width: max-content;
    max-width: 280px;
    background: #1a1a2e;
    color: #fff;
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    font-size: 13px;
    line-height: 1.45;
    cursor: pointer;
  }
  .an-callout.an-focused {
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
    outline: 2px solid #39ff14;
  }

  .an-callout-head { display: flex; align-items: flex-start; gap: 8px; }
  .an-callout-head .an-callout-title { flex: 1; }
  .an-min {
    flex: none;
    width: 20px; height: 20px;
    margin: -2px -4px 0 0;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
  }
  .an-min:hover { background: rgba(255, 255, 255, 0.28); }

  /* Minimized: number-only badge anchored at the target. */
  .an-badge {
    position: fixed;
    top: 0;
    left: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 9px;
    border: 2px solid #fff;
    border-radius: 999px;
    background: #39ff14;
    color: #0a0a14;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  }
  .an-badge:hover { background: #2fe00f; }
  .an-badge.an-focused { outline: 2px solid #0a0a14; }

  .an-callout-title { font-weight: 700; margin: 0 0 2px; font-size: 13px; }
  .an-callout-body { margin: 0; color: #d8d8e6; white-space: pre-wrap; }

  /* ---- Cluster: several nearby annotations shown as one grouped bubble ---- */
  .an-cluster { max-width: 320px; }
  .an-cluster-count {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #9a9ab2;
    flex: 1;
  }
  .an-cluster-list {
    display: flex;
    flex-direction: column;
    max-height: 260px;
    overflow-y: auto;
    margin: 4px -4px 0;
  }
  .an-cluster-item { padding: 8px 6px; border-radius: 8px; }
  .an-cluster-item + .an-cluster-item { border-top: 1px solid rgba(255, 255, 255, 0.08); }
  .an-cluster-item:hover { background: rgba(255, 255, 255, 0.08); }
  .an-cluster-item .an-callout-title { margin: 0; }
  .an-cluster-item .an-callout-body { margin-top: 2px; }
  /* The member highlight ring is always the neon variant (shown only on row hover). */
  .an-member-ring { border-color: #39ff14; box-shadow: 0 0 0 4px rgba(57, 255, 20, 0.3), 0 0 12px rgba(57, 255, 20, 0.5); }
  .an-callout-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px; height: 16px;
    padding: 0 5px;
    margin-right: 6px;
    border-radius: 999px;
    background: #39ff14;
    color: #0a0a14;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
    flex: none;
    vertical-align: 1px;
  }
  .an-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #1a1a2e;
    transform: rotate(45deg);
  }

  /* ---- Target highlight ring: hidden until its annotation is selected ---- */
  .an-ring {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483000;
    border: 2px solid transparent;
    border-radius: 6px;
    pointer-events: none;
    box-shadow: none;
  }
  .an-ring.an-focused {
    border-color: #39ff14;
    box-shadow: 0 0 0 4px rgba(57, 255, 20, 0.3), 0 0 12px rgba(57, 255, 20, 0.5);
  }
`;
