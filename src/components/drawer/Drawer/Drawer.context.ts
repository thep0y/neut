import { createContext, useContext } from "solid-js";
import type { DrawerContextValue } from "./Drawer.types";

export const DrawerContext = createContext<DrawerContextValue>();

export function useDrawerContext(component: string): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <Drawer> 内部`);
  }
  return ctx;
}
