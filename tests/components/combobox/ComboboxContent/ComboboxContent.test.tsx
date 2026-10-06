import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "~/components/combobox/Combobox/Combobox";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import { bySlot, comboboxInput, renderCombobox } from "../test-utils";

/**
 * `ComboboxContent`：Portal 浮层。
 *
 * 定位本身由 positioner 单测覆盖（jsdom 无布局）；这里只断言 Portal、状态属性、
 * 外点关闭的接线与监听清理。
 */
function renderContent(
  options: Parameters<typeof renderCombobox>[0] = {},
  contentProps: Record<string, unknown> = {},
) {
  return renderCombobox(
    { open: true, items: ["apple", "banana"], ...options },
    () => (
      <>
        <ComboboxInput />
        <ComboboxContent {...contentProps}>
          <ComboboxList>
            {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </>
    ),
  );
}

describe("ComboboxContent - 渲染", () => {
  it("open=false 时不挂载", () => {
    renderContent({ open: false });

    expect(bySlot("combobox-content")).toBeNull();
  });

  it("open=true 时通过 Portal 挂到 document.body（脱离渲染容器）", () => {
    const { container } = renderContent();

    const content = bySlot("combobox-content");
    expect(content).not.toBeNull();
    expect(container.contains(content)).toBe(false);
    expect(document.body.contains(content as HTMLElement)).toBe(true);
  });

  it("默认 side=bottom、align=start", () => {
    renderContent();

    const content = bySlot("combobox-content");
    expect(content).toHaveAttribute("data-side", "bottom");
    expect(content).toHaveAttribute("data-align", "start");
  });

  it("自定义 side/align 反映到 data 属性", () => {
    renderContent({}, { side: "top", align: "center" });

    const content = bySlot("combobox-content");
    expect(content).toHaveAttribute("data-side", "top");
    expect(content).toHaveAttribute("data-align", "center");
  });

  it("class 透传且 children 渲染在内容层内", () => {
    renderContent({}, { class: "my-content" });

    const content = bySlot("combobox-content");
    expect(content).toHaveClass("my-content");
    expect(
      bySlot("combobox-list")?.closest('[data-slot="combobox-content"]'),
    ).toBe(content);
  });

  it("额外属性透传到内容层", () => {
    renderContent({}, { "data-custom": "x" });

    expect(bySlot("combobox-content")).toHaveAttribute("data-custom", "x");
  });
});

describe("ComboboxContent - 外点关闭", () => {
  it("指针按下浮层外部时关闭面板", () => {
    const onOpenChange = vi.fn();
    renderContent({ onOpenChange });

    fireEvent.pointerDown(document.body);

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("指针按下锚点（输入组）时不关闭", () => {
    const onOpenChange = vi.fn();
    renderContent({ onOpenChange });

    fireEvent.pointerDown(comboboxInput());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("指针按下浮层内部时不关闭", () => {
    const onOpenChange = vi.fn();
    renderContent({ onOpenChange });

    fireEvent.pointerDown(bySlot("combobox-list") as HTMLElement);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("没有锚点元素时按外部处理并关闭", () => {
    const onOpenChange = vi.fn();
    renderCombobox({ open: true, items: ["apple"], onOpenChange }, () => (
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    ));

    fireEvent.pointerDown(document.body);

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("关闭后移除监听，不再响应外点", async () => {
    const onOpenChange = vi.fn();
    const [open, setOpen] = createSignal(true);
    render(() => (
      <Combobox items={["apple"]} open={open()} onOpenChange={onOpenChange}>
        <ComboboxInput />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ));

    fireEvent.pointerDown(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    setOpen(false);
    await Promise.resolve();
    fireEvent.pointerDown(document.body);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
