import type { ScrollMetrics } from "./ScrollArea.types";

export function computeMetrics(
  client: number,
  scroll: number,
  scrollSize: number,
): ScrollMetrics {
  // +1 吸收亚像素舍入：仅超出 1px 以内视为不可滚动
  const scrollable = scrollSize > client + 1;
  if (!scrollable) return { thumbRatio: 1, thumbOffset: 0, scrollable: false };
  // scrollable 蕴含 maxScroll >= 2，因此这里不需要再兜底除零
  const maxScroll = scrollSize - client;
  return {
    thumbRatio: client / scrollSize,
    thumbOffset: scroll / maxScroll,
    scrollable,
  };
}
