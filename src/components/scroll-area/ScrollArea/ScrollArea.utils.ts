import type { ScrollMetrics } from "./ScrollArea.types";

export function computeMetrics(
  client: number,
  scroll: number,
  scrollSize: number,
): ScrollMetrics {
  const scrollable = scrollSize > client + 1; // +1 to absorb sub-pixel rounding
  if (!scrollable) return { thumbRatio: 1, thumbOffset: 0, scrollable: false };
  const thumbRatio = client / scrollSize;
  const maxScroll = scrollSize - client;
  const thumbOffset = maxScroll > 0 ? scroll / maxScroll : 0;
  return { thumbRatio, thumbOffset, scrollable };
}
