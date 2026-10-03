import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "~/components/combobox/Combobox/Combobox";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import { ComboboxTrigger } from "~/components/combobox/ComboboxTrigger/ComboboxTrigger";

/**
 * combobox 的 ARIA 契约（回归）。
 *
 * 此前输入框是一个**裸 input**：没有 role、没有 aria-expanded、
 * 没有 aria-controls、没有 aria-activedescendant，listbox 与 option 也都没有 id，
 * 屏幕阅读器完全不知道这是"输入框 + 可过滤列表"。触发器同样没有
 * aria-haspopup / aria-expanded。下面这些断言此前全部失败。
 */
const ITEMS = ["apple", "banana", "cherry"];

function renderCombo(props: Record<string, unknown> = {}) {
  return render(() => (
    <Combobox defaultOpen items={ITEMS} {...props}>
      <ComboboxInput />
      <ComboboxList>
        {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
      </ComboboxList>
    </Combobox>
  ));
}

const input = () => document.querySelector("input") as HTMLInputElement;
const listbox = () =>
  document.querySelector('[role="listbox"]') as HTMLElement | null;
const options = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));

describe("Combobox - ARIA 语义（回归）", () => {
  it("输入框是 role=combobox，并带 aria-expanded / aria-controls / aria-autocomplete", () => {
    renderCombo();

    expect(input().getAttribute("role")).toBe("combobox");
    expect(input().getAttribute("aria-expanded")).toBe("true");
    expect(input().getAttribute("aria-autocomplete")).toBe("list");
    expect(input().getAttribute("aria-controls")).toBe(listbox()?.id);
    expect(listbox()?.id).toBeTruthy();
  });

  it("关闭时 aria-controls 不再指向列表", () => {
    renderCombo({ defaultOpen: false });

    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(input().getAttribute("aria-controls")).toBeNull();
  });

  it("listbox 有 id，每个 option 也有 id", () => {
    renderCombo();

    expect(listbox()?.id).toMatch(/combobox-list-/);
    for (const option of options()) {
      expect(option.id).toMatch(/combobox-list-.*-option-/);
    }
  });

  it("高亮项通过 aria-activedescendant 暴露，且指向真实的 option", () => {
    renderCombo();

    // 尚未高亮时没有 activedescendant
    expect(input().getAttribute("aria-activedescendant")).toBeNull();

    fireEvent.keyDown(input(), { key: "ArrowDown" });

    const activeId = input().getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    const active = document.getElementById(activeId as string);
    expect(active).not.toBeNull();
    expect(active?.getAttribute("role")).toBe("option");
    expect(active?.textContent).toBe("apple");
  });

  it("高亮移动时 aria-activedescendant 跟着换（焦点仍留在输入框）", () => {
    renderCombo();

    fireEvent.keyDown(input(), { key: "ArrowDown" });
    const first = input().getAttribute("aria-activedescendant");
    fireEvent.keyDown(input(), { key: "ArrowDown" });

    expect(input().getAttribute("aria-activedescendant")).not.toBe(first);
    expect(document.activeElement).not.toBe(input());
  });

  it("option 的 id 与 aria-activedescendant 一致（多值也能区分）", () => {
    renderCombo();

    fireEvent.keyDown(input(), { key: "ArrowDown" });
    fireEvent.keyDown(input(), { key: "ArrowDown" });

    const activeId = input().getAttribute("aria-activedescendant");
    const ids = options().map((option) => option.id);
    expect(ids).toContain(activeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ComboboxTrigger - ARIA（回归）", () => {
  function renderTrigger(open: boolean) {
    return render(() => (
      <Combobox defaultOpen={open} items={ITEMS}>
        <ComboboxTrigger>选择</ComboboxTrigger>
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </Combobox>
    ));
  }

  it("触发器带 aria-haspopup=listbox 与 aria-expanded", () => {
    renderTrigger(true);
    const trigger = document.querySelector(
      '[data-slot="combobox-trigger"]',
    ) as HTMLElement;

    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox()?.id);
  });

  it("关闭时 aria-expanded=false 且不指向列表", () => {
    renderTrigger(false);
    const trigger = document.querySelector(
      '[data-slot="combobox-trigger"]',
    ) as HTMLElement;

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBeNull();
  });
});

describe("Combobox - 事件详情（回归）", () => {
  it("onOpenChange 的第二参带 reason，Escape 为 escape-key", () => {
    const onOpenChange = vi.fn();
    renderCombo({ onOpenChange });

    fireEvent.keyDown(input(), { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
  });

  it("onValueChange 的第二参带 reason=item-press 与原始事件", () => {
    const onValueChange = vi.fn();
    renderCombo({ onValueChange });

    fireEvent.click(options()[0]!);

    expect(onValueChange).toHaveBeenCalledWith(
      "apple",
      expect.objectContaining({ reason: "item-press" }),
    );
    const details = onValueChange.mock.calls[0]?.[1] as { event?: Event };
    expect(details.event).toBeInstanceOf(Event);
  });

  it("cancel() 能阻止值变更（对齐 Base UI 语义）", () => {
    const onValueChange = vi.fn(
      (_value: unknown, details: { cancel: () => void }) => details.cancel(),
    );
    renderCombo({ onValueChange });

    fireEvent.click(options()[0]!);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    // 值没变，输入框也不该被回填（否则会出现"值没改但展示变了"的不一致）
    expect(input().value).toBe("");
  });

  it("cancel() 能阻止打开状态变更", () => {
    const onOpenChange = vi.fn(
      (_open: boolean, details: { cancel: () => void }) => details.cancel(),
    );
    const { container } = render(() => (
      <Combobox items={ITEMS} onOpenChange={onOpenChange}>
        <ComboboxTrigger>选择</ComboboxTrigger>
      </Combobox>
    ));

    fireEvent.click(
      container.querySelector('[data-slot="combobox-trigger"]') as HTMLElement,
    );

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(
      container
        .querySelector('[data-slot="combobox-trigger"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("false");
  });
});
