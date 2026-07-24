import { useEffect } from "preact/hooks";
import { toast } from "../core/store";

const DISMISS_MS = 1800;

/** Transient confirmation shown after a pick copies a target. Self-dismisses. */
export function Toast() {
  const msg = toast.value;
  useEffect(() => {
    if (msg == null) return;
    const t = setTimeout(() => {
      toast.value = null;
    }, DISMISS_MS);
    return () => clearTimeout(t);
  }, [msg]);

  if (msg == null) return null;
  return (
    <div class="an-toast" role="status">
      {msg}
    </div>
  );
}
