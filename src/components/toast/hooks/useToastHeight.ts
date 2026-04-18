import { createEffect, createSignal, onCleanup } from "solid-js";
import type { HeightT, Position, ToastT } from "../types";

interface UseToastHeightOptions {
  toastRef: () => HTMLLIElement | undefined;
  toast: ToastT;
  mounted: () => boolean;
  setHeights: (updater: (prev: HeightT[]) => HeightT[]) => void;
}

export function useToastHeight(opts: UseToastHeightOptions) {
  const [initialHeight, setInitialHeight] = createSignal(0);

  // Register height on first mount
  createEffect(() => {
    const el = opts.toastRef();
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    setInitialHeight(h);
    opts.setHeights((prev) => [
      {
        toastId: opts.toast.id,
        height: h,
        position: opts.toast.position as Position,
      },
      ...prev,
    ]);
    onCleanup(() =>
      opts.setHeights((prev) =>
        prev.filter((x) => x.toastId !== opts.toast.id),
      ),
    );
  });

  // Keep height in sync when content changes
  createEffect(() => {
    if (!opts.mounted()) return;
    const el = opts.toastRef();
    if (!el) return;

    // Read deps so effect re-runs on content change
    void opts.toast.title;
    void opts.toast.description;
    void opts.toast.jsx;
    void opts.toast.action;
    void opts.toast.cancel;

    const orig = el.style.height;
    el.style.height = "auto";
    const newH = el.getBoundingClientRect().height;
    el.style.height = orig;
    setInitialHeight(newH);

    opts.setHeights((prev) => {
      const exists = prev.find((x) => x.toastId === opts.toast.id);
      if (!exists) {
        return [
          {
            toastId: opts.toast.id,
            height: newH,
            position: opts.toast.position as Position,
          },
          ...prev,
        ];
      }
      return prev.map((x) =>
        x.toastId === opts.toast.id ? { ...x, height: newH } : x,
      );
    });
  });

  return { initialHeight };
}
