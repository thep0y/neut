import {
  type Accessor,
  createContext,
  type Setter,
  useContext,
} from "solid-js";
import type { ScrollMetrics } from "./ScrollArea.types";

interface ScrollAreaContextValue {
  hovering: Accessor<boolean>;
  viewportRef: () => HTMLDivElement | undefined;
  dragging: Accessor<"vertical" | "horizontal" | null>;
  setDragging: Setter<"vertical" | "horizontal" | null>;
  vertical: Accessor<ScrollMetrics>;
  horizontal: Accessor<ScrollMetrics>;
  /** 视口元素的 id，供 scrollbar 的 aria-controls 引用 */
  viewportId: string;
}

export const ScrollAreaContext = createContext<ScrollAreaContextValue>();

export const useScrollAreaContext = () => {
  const context = useContext(ScrollAreaContext);
  if (!context) {
    throw new Error("useScrollAreaContext 必须用在 <ScrollArea> 内部");
  }
  return context;
};
