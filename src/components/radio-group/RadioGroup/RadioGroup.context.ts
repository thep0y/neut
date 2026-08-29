import { createContext, useContext } from "solid-js";
import type { RadioGroupContextValue } from "./RadioGroup.types";

export const RadioGroupContext = createContext<RadioGroupContextValue>();

export function useRadioGroupContext(
  component: string,
): RadioGroupContextValue {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <RadioGroup> 内部`);
  }
  return ctx;
}
