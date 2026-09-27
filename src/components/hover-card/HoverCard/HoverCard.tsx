import {
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  type JSX,
} from "solid-js";
import { HoverCardContext } from "../hover-card.context";
import type {
  HoverCardContextValue,
  HoverCardProps,
} from "../hover-card.types";

const DEFAULT_DELAY = 700;
const DEFAULT_CLOSE_DELAY = 300;

/**
 * HoverCard 根:只管理开关状态与延迟计时,不渲染 DOM。
 * 打开延迟默认 700ms、关闭延迟 300ms;trigger 上的 delay/closeDelay 优先。
 */
export function HoverCard(props: HoverCardProps): JSX.Element {
  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = createMemo(() =>
    props.open !== undefined ? props.open : internalOpen(),
  );
  const disabled = createMemo(() => !!props.disabled);

  const [reference, setReference] = createSignal<Element>();
  const [floating, setFloating] = createSignal<HTMLElement>();

  let openTimer: number | undefined;
  let closeTimer: number | undefined;
  const clearTimers = () => {
    if (openTimer !== undefined) {
      window.clearTimeout(openTimer);
      openTimer = undefined;
    }
    if (closeTimer !== undefined) {
      window.clearTimeout(closeTimer);
      closeTimer = undefined;
    }
  };

  const commit = (next: boolean) => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const requestOpen = (delayOverride?: number) => {
    clearTimers();
    if (disabled() || open()) return;
    openTimer = window.setTimeout(
      () => commit(true),
      delayOverride ?? props.delay ?? DEFAULT_DELAY,
    );
  };

  const requestClose = (closeDelayOverride?: number) => {
    clearTimers();
    closeTimer = window.setTimeout(
      () => commit(false),
      closeDelayOverride ?? props.closeDelay ?? DEFAULT_CLOSE_DELAY,
    );
  };

  const openImmediate = () => {
    if (disabled()) return;
    clearTimers();
    commit(true);
  };

  const closeImmediate = () => {
    clearTimers();
    commit(false);
  };

  const keepOpen = () => {
    if (closeTimer !== undefined) {
      window.clearTimeout(closeTimer);
      closeTimer = undefined;
    }
  };

  onCleanup(clearTimers);

  const ctx: HoverCardContextValue = {
    open,
    disabled,
    contentId: `hover-card-${createUniqueId()}`,
    reference,
    setReference,
    floating,
    setFloating,
    requestOpen,
    requestClose,
    openImmediate,
    closeImmediate,
    keepOpen,
  };

  return (
    <HoverCardContext.Provider value={ctx}>
      {props.children}
    </HoverCardContext.Provider>
  );
}
