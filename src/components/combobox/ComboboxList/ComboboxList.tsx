import { For, createSignal, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { ScrollArrows } from "~/components/scroll-arrows";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxList(props: {
  children?: JSX.Element | ((item: any, index: number) => JSX.Element);
  class?: string;
}) {
  const ctx = useComboboxContext("ComboboxList");
  const [listElement, setListElement] = createSignal<HTMLElement>();
  const listItems = () => (ctx.isGrouped() ? ctx.items() : ctx.filteredItems());

  return (
    // 外层只做相对定位，供滚动箭头贴住列表上下沿；自身不滚动
    <div class="relative">
      <div
        ref={setListElement}
        data-slot="combobox-list"
        class={clsx(
          "max-h-72 overflow-y-auto overscroll-contain p-1",
          "no-scrollbar [&::-webkit-scrollbar]:hidden",
          props.class,
        )}
        role="listbox"
      >
        <For each={listItems()}>
          {(item, index) =>
            typeof props.children === "function"
              ? props.children(item, index())
              : props.children
          }
        </For>
      </div>
      <ScrollArrows target={listElement} />
    </div>
  );
}
