import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Combobox } from "~/components/combobox/Combobox/Combobox";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import {
  bySlot,
  comboboxInput,
  comboboxOptions,
  renderCombobox,
} from "../test-utils";

/**
 * `Combobox` 根组件：开关维度、`items` 形态判定、默认 `itemToStringValue`、
 * 滚动锁（`lockScroll`）。
 *
 * 过滤/选中/键盘等组合行为在 `combobox.integration.test.tsx` 与各子组件用例里覆盖。
 */
function panel(options: Parameters<typeof renderCombobox>[0]) {
  return renderCombobox(options, () => (
    <ComboboxContent>
      <ComboboxList>
        {(item: any) => (
          <ComboboxItem value={item}>{String(item)}</ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  ));
}

describe("Combobox - 开关", () => {
  it("open=false 时面板不挂载", () => {
    panel({ open: false, items: ["apple", "banana"] });

    expect(bySlot("combobox-content")).toBeNull();
    expect(comboboxOptions()).toHaveLength(0);
  });

  it("defaultOpen 非受控初始打开并渲染全部选项", () => {
    panel({ defaultOpen: true, items: ["apple", "banana"] });

    expect(bySlot("combobox-content")).not.toBeNull();
    expect(comboboxOptions().map((o) => o.textContent)).toEqual([
      "apple",
      "banana",
    ]);
  });
});

describe("Combobox - items 形态", () => {
  it("默认 itemToStringValue 用 String() 展示数字值", () => {
    renderCombobox({ items: [1, 2, 3], defaultValue: 2 }, () => (
      <ComboboxInput />
    ));

    expect(comboboxInput().value).toBe("2");
  });

  it("只有带 items 数组的对象才算分组；数字/字符串/普通对象都不算", () => {
    panel({ open: true, items: [0, "a", { label: "x" }] });

    expect(comboboxOptions()).toHaveLength(3);
  });

  it("条目为 null 时不误判为分组", () => {
    panel({ open: true, items: [null, "a"] });

    expect(comboboxOptions()).toHaveLength(2);
    expect(comboboxOptions()[0]).toHaveTextContent("null");
  });
});

describe("Combobox - 滚动锁", () => {
  it("打开时默认锁住页面滚动（body overflowY hidden）", () => {
    renderCombobox({ open: true, items: ["apple"] }, () => <ComboboxInput />);

    expect(document.body.style.overflowY).toBe("hidden");
  });

  it("lockScroll=false 时打开不锁页面滚动", () => {
    renderCombobox({ open: true, lockScroll: false, items: ["apple"] }, () => (
      <ComboboxInput />
    ));

    expect(document.body.style.overflowY).toBe("");
  });

  it("关闭后恢复页面滚动", async () => {
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Combobox items={["apple"]} open={open()}>
        <ComboboxInput />
      </Combobox>
    ));
    expect(document.body.style.overflowY).toBe("hidden");

    setOpen(false);
    await Promise.resolve();

    expect(document.body.style.overflowY).toBe("");
  });
});

describe("Combobox - 受控 value", () => {
  it("value=null 时输入框为空且没有选中项", () => {
    renderCombobox(
      { open: true, items: ["apple", "banana"], value: null },
      () => (
        <>
          <ComboboxInput />
          <ComboboxContent>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem value={item}>{item}</ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </>
      ),
    );

    expect(comboboxInput().value).toBe("");
    expect(
      comboboxOptions().map((o) => o.getAttribute("aria-selected")),
    ).toEqual(["false", "false"]);
  });

  it("非受控 defaultValue 未传时内部值为 undefined", () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <>
        <ComboboxInput />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </>
    ));

    expect(comboboxInput().value).toBe("");
    expect(comboboxOptions()[0]).toHaveAttribute("aria-selected", "false");
  });
});
