/**
 * 调用用户传入的事件处理器（兼容 Solid 的 `EventHandlerUnion`）。
 *
 * 为什么需要它：`splitProps` 的 restKeys 提取出的处理器类型是 `EventHandlerUnion`，
 * 可能是普通函数，也可能是 Solid 的 **bound handler**，不能直接 `handler(event)` 调用；
 * 而组件内部又必须把"自己的默认行为"和"用户回调"都执行一遍，不能互相覆盖。
 *
 * `EventHandlerUnion` 的两种形态（见 solid-js 的 `jsx.d.ts`）：
 * - 普通函数：`(event) => void`
 * - bound handler：`{ 0: (data, event) => void; 1: data }`——
 *   JSX 里写 `onClick={[handler, data]}` 得到的就是它，调用约定是
 *   `handler[0](handler[1], event)`，即 **data 在前、event 在后**。
 *
 * 抽到 `~/utils` 之前，`tabs` 与 `toggle-group` 各有一份逐字重复的实现。
 */
export function callEventHandler<E extends Event>(
  handler: unknown,
  event: E,
): void {
  if (handler == null) return;

  // bound handler：数组字面量，或带数字键 0/1 的绑定对象
  const isBound =
    Array.isArray(handler) ||
    (typeof handler === "object" && handler !== null && 0 in handler);

  if (isBound) {
    // 注意用属性访问而不是数组解构：绑定对象不是可迭代对象，
    // 数组解构会走 Symbol.iterator 从而抛 TypeError。
    const slot = handler as Record<number, unknown>;
    const boundHandler = slot[0];
    const data = slot[1];
    if (typeof boundHandler === "function") {
      (boundHandler as (data: unknown, event: E) => void)(data, event);
    }
    return;
  }

  if (typeof handler === "function") (handler as (event: E) => void)(event);
}
