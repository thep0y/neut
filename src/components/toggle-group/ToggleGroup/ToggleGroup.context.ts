import { createContext, useContext } from "solid-js";
import type { ToggleGroupContextValue } from "./ToggleGroup.types";

export const ToggleGroupContext = createContext<ToggleGroupContextValue>();

export function useToggleGroupContext(
  component: string,
): ToggleGroupContextValue {
  const ctx = useContext(ToggleGroupContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <ToggleGroup> 内部`);
  }
  return ctx;
}
