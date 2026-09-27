import type { JSX } from "solid-js";
import { clsx } from "~/utils";
import { useScrollEdges } from "~/hooks";
import { ScrollArrowButton } from "./ScrollArrowButton";
import type { ScrollArrowsProps } from "./ScrollArrows.types";

/**
 * 列表/菜单弹层通用的滚动提示：隐藏原生滚动条后，在上/下沿叠加箭头，
 * 提示该方向还有内容。放在滚动容器(定位祖先)内部即可，需要容器自身是定位元素。
 *
 * 默认箭头**不可交互**(`pointer-events-none`)：避免覆盖列表边缘时抢走指针、
 * 以及"箭头显隐 ↔ 悬停自动滚动"互相触发导致列表持续滚动/闪动。
 * 需要悬停滚动时显式传 `interactive`。
 */
export function ScrollArrows(props: ScrollArrowsProps): JSX.Element {
  const { canScrollUp, canScrollDown } = useScrollEdges(() => props.target());

  return (
    <>
      <ScrollArrowButton
        direction="up"
        visible={canScrollUp()}
        interactive={!!props.interactive}
        target={props.target}
        class={clsx(props.class, props.upClass)}
      />
      <ScrollArrowButton
        direction="down"
        visible={canScrollDown()}
        interactive={!!props.interactive}
        target={props.target}
        class={clsx(props.class, props.downClass)}
      />
    </>
  );
}
