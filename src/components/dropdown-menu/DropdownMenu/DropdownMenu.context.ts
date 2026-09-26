import { createContext, useContext } from "solid-js";
import type { DropdownMenuContextValue } from "./DropdownMenu.types";

export const DropdownMenuContext = createContext<DropdownMenuContextValue>();

export function useDropdownMenuContext(
  component: string,
): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <DropdownMenu> 内部`);
  }
  return ctx;
}
