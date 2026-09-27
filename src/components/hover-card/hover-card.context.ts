import { createContext, useContext } from "solid-js";
import type { HoverCardContextValue } from "./hover-card.types";

export const HoverCardContext = createContext<HoverCardContextValue>();

export function useHoverCardContext(component: string): HoverCardContextValue {
  const ctx = useContext(HoverCardContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <HoverCard> 内部`);
  }
  return ctx;
}
