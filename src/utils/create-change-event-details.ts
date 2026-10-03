/**
 * 构造 `onXxxChange` 的第二个参数(对齐 Base UI 的 `ChangeEventDetails`)。
 *
 * `isCanceled` / `isPropagationAllowed` 必须用 **getter** 暴露:回调内部要能即时读到
 * `cancel()` / `allowPropagation()` 之后的最新值,而不是创建时的快照。
 * 这是本文件复用的核心原因——四处重复实现里最容易写错的就是这一点。
 *
 * 各组件的事件详情类型结构相同,只是 `reason` 的联合类型不同,因此用泛型
 * 把 `reason` 交给调用方,返回结构统一。
 *
 * 注意:`trigger` 在部分组件里是必填、部分是可选的,这里统一为可选;
 * 需要非空的地方由调用方自行断言或在类型里收窄。
 */
export interface ChangeEventDetails<R extends string = string> {
  reason: R;
  event: Event | undefined;
  trigger: Element | undefined;
  /** 阻止组件处理本次变更(例如受控模式下不关闭) */
  cancel: () => void;
  /** API 对齐保留:允许事件继续传播(本实现不主动阻止传播,故为记录语义) */
  allowPropagation: () => void;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
}

export function createChangeEventDetails<R extends string = string>(
  reason: R,
  event?: Event,
  trigger?: Element,
): ChangeEventDetails<R> {
  let canceled = false;
  let propagationAllowed = false;

  return {
    reason,
    event,
    trigger,
    cancel: () => {
      canceled = true;
    },
    allowPropagation: () => {
      propagationAllowed = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isPropagationAllowed() {
      return propagationAllowed;
    },
  };
}
