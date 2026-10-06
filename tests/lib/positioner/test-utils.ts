import type {
  Boundary,
  Coords,
  MiddlewareState,
  Placement,
  Rect,
  Strategy,
} from "~/lib/positioner/types";
import { computeCoordsFromPlacement } from "~/lib/positioner/core/placement";

/** 构造一个矩形，只需传关心的字段 */
export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
): Rect {
  return { x, y, width, height };
}

/**
 * 构造 middleware 的输入状态。
 *
 * middleware 是纯函数：给它们一个状态对象就能断言输出。
 * 这里只填 middleware 真正读取的字段，元素用最小 stub（避免依赖 jsdom 的真实布局，
 * jsdom 里 getBoundingClientRect 全都是 0，无法表达"溢出"场景）。
 */
export function middlewareState(options: {
  x: number;
  y: number;
  placement: Placement;
  initialPlacement?: Placement;
  reference?: Rect;
  floating?: Rect;
  strategy?: Strategy;
  middlewareData?: Record<string, unknown>;
}): MiddlewareState {
  const placement = options.placement;
  return {
    x: options.x,
    y: options.y,
    placement,
    initialPlacement: options.initialPlacement ?? placement,
    strategy: options.strategy ?? "absolute",
    rects: {
      reference: options.reference ?? rect(0, 0, 100, 40),
      floating: options.floating ?? rect(0, 0, 200, 100),
    },
    elements: {
      reference: {} as Element,
      floating: {} as HTMLElement,
    },
    middlewareData: options.middlewareData ?? {},
  };
}

/**
 * 构造**自洽**的状态：x/y 由 reference 与 floating 按 placement 真实推导得出，
 * 而不是手写。
 *
 * 为什么需要它：`flip` 会用 `reference` 重新推导候选 placement 的坐标
 * （这正是它比"镜像估算"更准的原因）。如果测试里手写一个与 reference
 * 不匹配的 x/y，就会出现"当前 placement 溢出、候选也算不出好结果"的假象，
 * 测不到真实行为。用这个 helper 保证 reference / placement / x,y 三者一致。
 */
export function consistentState(options: {
  placement: Placement;
  initialPlacement?: Placement;
  reference: Rect;
  floating: Rect;
  boundary?: Boundary;
  middlewareData?: Record<string, unknown>;
}): MiddlewareState {
  const placement = options.placement;
  const rects = { reference: options.reference, floating: options.floating };
  const { x, y } = computeCoordsFromPlacement(rects, placement);
  return middlewareState({
    x,
    y,
    placement,
    initialPlacement: options.initialPlacement ?? placement,
    reference: options.reference,
    floating: options.floating,
    middlewareData: options.middlewareData,
  });
}

export { computeCoordsFromPlacement };

/**
 * 把测试用矩形适配成 `getBoundingClientRect()` 要求的 `DOMRect`。
 *
 * jsdom 返回的 DOMRect 还带 bottom/left/right/top/toJSON，
 * 但我们只关心 xywh —— 被测代码也只读这四个字段。用这个 helper
 * 避免在每个测试里重复伪造完整 DOMRect，又不引入 `as any`。
 */
export function asDOMRect(r: Rect): DOMRect {
  return {
    ...r,
    top: r.y,
    left: r.x,
    right: r.x + r.width,
    bottom: r.y + r.height,
  } as DOMRect;
}

/** 常见边界：0..1000 x 0..800 的视口 */
export const VIEWPORT: Boundary = rect(0, 0, 1000, 800);

/** 把 middleware 的返回值收敛成坐标，便于断言 */
export function coords(result: Partial<Coords>): Coords {
  return { x: result.x ?? 0, y: result.y ?? 0 };
}
