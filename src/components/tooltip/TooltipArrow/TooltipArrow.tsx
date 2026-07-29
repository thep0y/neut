import { useTooltipContentContext } from "../TooltipContent/TooltipContent.context";
import { TOOLTIP_SURFACE_FILL_CLASS } from "../TooltipContent/TooltipContent.utils";

export interface TooltipArrowProps {
  /** 箭头沿 tooltip 边缘方向的长度（像素），默认 8 */
  width?: number;
  /** 箭头突出的深度（像素），默认 4 */
  height?: number;
  /**
   * 箭头颜色（Tailwind text-* class，因为 SVG 用 fill="currentColor"）。
   * 不传的话默认跟 TooltipContent 的默认背景色一致；如果你自定义了
   * TooltipContent 的背景色，记得这里也传一个匹配的颜色，两者不会自动同步。
   */
  class?: string;
}

/**
 * 箭头组件，必须渲染在 <TooltipContent> 内部（依赖它的 context）。
 * 通过 context 拿到 arrow middleware 算出的偏移量，以及最终生效的 placement，
 * 从而知道该贴哪条边、三角形尖端朝哪个方向。
 *
 * 四个方向用四套独立坐标画三角形，而不是画一个形状再用 CSS rotate 复用——
 * 这是有意的：arrow middleware 用 el.offsetWidth/offsetHeight 判断"沿边长度"，
 * 而 CSS transform 不会改变这两个值，如果靠 rotate(90deg) 让同一个 8x4 的形状
 * "看起来"变成 4x8，offsetWidth/offsetHeight 读到的还是旋转前的 8x4，
 * 会导致 left/right 方向的偏移计算对不上。直接让未旋转的 SVG 本身尺寸
 * 就随方向切换（沿边方向用 width，突出方向用 height），从根上避免这个偏差。
 *
 * 进出场动画是箭头自己独立播放的一份（data-state + animate-in/out），
 * 和 TooltipContent 内层元素用的是同一个 animationState 信号驱动，
 * 保证两者严格同步开始/结束——而不是让箭头被动继承内层元素的动画。
 * 后者看似更省事，但内层元素的 zoom-in-95 动画会给它加一个非 none 的
 * transform，CSS 规范规定这会让内层变成子元素新的"包含块"，这和箭头
 * 故意跳过内层、以外层为基准定位的设计（避免触发滚动条那次的修复）相冲突，
 * 动画播放期间"父子两层谁负责定位"这个假设会变得不可靠，箭头容易之前观察到
 * "入场看起来比内容慢一拍"这类问题。独立播放同一份动画彻底避开这个耦合。
 */
export function TooltipArrow(props: TooltipArrowProps) {
  const ctx = useTooltipContentContext("TooltipArrow");

  const alongLen = () => props.width ?? 8;
  const protrusion = () => props.height ?? 4;

  const side = () =>
    ctx.placement().split("-")[0] as "top" | "bottom" | "left" | "right";
  const isVertical = () => side() === "top" || side() === "bottom";

  const arrowData = () =>
    ctx.middlewareData().arrow as { x?: number; y?: number } | undefined;

  const points = () => {
    const a = alongLen();
    const p = protrusion();
    switch (side()) {
      case "top":
        return `0,0 ${a},0 ${a / 2},${p}`; // 尖端朝下，指向下方的 trigger
      case "bottom":
        return `0,${p} ${a},${p} ${a / 2},0`; // 尖端朝上
      case "left":
        return `0,0 0,${a} ${p},${a / 2}`; // 尖端朝右
      default:
        return `${p},0 ${p},${a} 0,${a / 2}`; // 尖端朝左
    }
  };

  const positionStyle = () => {
    const p = protrusion();
    const crossOffset = isVertical()
      ? (arrowData()?.x ?? 0)
      : (arrowData()?.y ?? 0);
    switch (side()) {
      case "top":
        return { bottom: `-${p}px`, left: `${crossOffset}px` };
      case "bottom":
        return { top: `-${p}px`, left: `${crossOffset}px` };
      case "left":
        return { right: `-${p}px`, top: `${crossOffset}px` };
      default:
        return { left: `-${p}px`, top: `${crossOffset}px` };
    }
  };

  return (
    <svg
      ref={ctx.setArrowElement}
      width={isVertical() ? alongLen() : protrusion()}
      height={isVertical() ? protrusion() : alongLen()}
      viewBox={
        isVertical()
          ? `0 0 ${alongLen()} ${protrusion()}`
          : `0 0 ${protrusion()} ${alongLen()}`
      }
      data-state={ctx.animationState()}
      style={{ position: "absolute", ...positionStyle() }}
      class={`${props.class ?? TOOLTIP_SURFACE_FILL_CLASS} data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95`}
      aria-hidden="true"
    >
      <polygon points={points()} fill="currentColor" />
    </svg>
  );
}
