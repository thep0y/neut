import { createContext, useContext } from "solid-js";
import type { ComboboxContextValue } from "./Combobox.types";

export const ComboboxContext = createContext<ComboboxContextValue>();

export function useComboboxContext(component: string): ComboboxContextValue {
  const ctx = useContext(ComboboxContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <Combobox> 内部`);
  }
  return ctx;
}
