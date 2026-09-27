import { createContext, useContext } from "solid-js";
import type { MessageScrollerContextValue } from "./message-scroller.types";

export const MessageScrollerContext =
  createContext<MessageScrollerContextValue>();

export function useMessageScrollerContext(
  component: string,
): MessageScrollerContextValue {
  const ctx = useContext(MessageScrollerContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <MessageScrollerProvider> 内部`);
  }
  return ctx;
}
