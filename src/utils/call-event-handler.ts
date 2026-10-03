/**
 * 调用用户传入的事件处理器(兼容 Solid 的函数 / 函数数组 / bound 对象形式)。
 *
 * 为什么需要它:`splitProps` 的 restKeys 提取出的处理器类型是 `EventHandlerUnion`
 * (可能是函数、函数数组或绑定对象),不能直接 `handler(event)` 调用;
 * 而组件内部又必须把"自己的默认行为"和"用户回调"都执行一遍,不能互相覆盖。
 *
 * 抽到 `~/utils` 之前,`tabs` 与 `toggle-group` 各有一份逐字重复的实现。
 */
export function callEventHandler<E extends Event>(
  handler: unknown,
  event: E,
): void {
  const list = Array.isArray(handler) ? handler : [handler];
  for (const h of list) {
    if (typeof h === "function") (h as (e: E) => void)(event);
  }
}
