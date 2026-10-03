import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";
import { SelectTrigger } from "~/components/select/SelectTrigger/SelectTrigger";
import { SelectValue } from "~/components/select/SelectValue/SelectValue";

/**
 * Select 集成测试。
 *
 * 覆盖：受控/非受控的 value 与 open 两个维度、trigger 开关与键盘、
 * item 注册/选中/高亮、选中后关闭并把焦点还给 trigger、ARIA 关联。
 *
 * 定位（flip/shift/size）已被 positioner 单测覆盖，且需要真实布局，
 * 因此这里不断言浮层的最终坐标。
 */
function renderSelect(
  props: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (v: string) => void;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    placeholder?: string;
    items?: Array<{ value: string; label: string; disabled?: boolean }>;
  } = {},
) {
  const items = props.items ?? [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
  ];
  return render(() => (
    <Select
      defaultValue={props.defaultValue}
      value={props.value}
      onValueChange={props.onValueChange}
      defaultOpen={props.defaultOpen}
      open={props.open}
      onOpenChange={props.onOpenChange}
      disabled={props.disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={props.placeholder ?? "请选择"} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ));
}

/**
 * 注意：`SelectTrigger` 默认渲染 `<Button>`，因此 DOM 上是
 * `data-slot="button"` 而不是 `select-trigger`。
 */
function trigger(): HTMLElement {
  return document.querySelector("button") as HTMLElement;
}

/**
 * `SelectContent` **始终挂载**（关闭时用 `visibility: hidden` 隐藏，而不是卸载）。
 * 而且可见性还依赖 `pos.isPositioned()`（需要真实布局），jsdom 下无法达到可见态。
 *
 * 因此这里用**不依赖布局**的信号判断开关状态：trigger 的 `data-state`。
 */
function isOpen(): boolean {
  const trg = trigger();
  return trg?.getAttribute("data-state") === "open";
}

/** `SelectItem` 用 `data-value` 标识（没有 data-slot） */
function items(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[role='option']"));
}

/**
 * 当前高亮的选项。
 *
 * `isActive` 通过 `bg-neutral-100` 类表达（没有 data-* 属性），
 * 而 `aria-selected` 表达的是"已选中"，两者是不同概念（对齐 base-ui：
 * 高亮 = 焦点位置，选中 = 值）。这里用类名判断高亮。
 */
function highlightedItem(): HTMLElement | null {
  return items().find((el) => el.className.includes("bg-neutral-100")) ?? null;
}

/**
 * 等挂载完成再交互。
 *
 * `SelectItem` 在 `onMount` 里注册到根 context，而 trigger 打开时会读 `items`
 * 做初始高亮。测试里 `render()` 与交互可能落在同一 tick，注册还没完成
 * （同 `dropdown-menu-sub` 的 `waitForMount`，见 TESTING.md §5.6）。
 */
async function waitForMount(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Select - 基础状态", () => {
  it("默认关闭：不渲染 content", () => {
    renderSelect();

    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("defaultOpen 时初始打开", () => {
    renderSelect({ defaultOpen: true });

    expect(isOpen()).toBe(true);
    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("未选中时展示 placeholder", () => {
    renderSelect({ placeholder: "选择水果" });

    expect(trigger()).toHaveTextContent("选择水果");
  });

  it("已选中时展示选中项的 label", () => {
    renderSelect({ defaultValue: "apple" });

    expect(trigger()).toHaveTextContent("苹果");
  });

  it("点击 trigger 打开", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(isOpen()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("再次点击 trigger 关闭", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ defaultOpen: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(isOpen()).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disabled 时点击不打开", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ disabled: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(isOpen()).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Select - 选项交互", () => {
  it("点击选项后更新值、关闭面板并把焦点还给 trigger", async () => {
    const onValueChange = vi.fn();
    renderSelect({ defaultOpen: true, onValueChange });
    await waitForMount();

    // 用 fireEvent.click：jsdom 下浮层是 visibility:hidden（依赖真实布局），
    // userEvent 会因 element 不可见而拒绝点击。
    fireEvent.click(items()[1]);

    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it("选中后 trigger 展示新的 label", async () => {
    renderSelect({ defaultOpen: true });
    await waitForMount();

    fireEvent.click(items()[1]);

    expect(trigger()).toHaveTextContent("香蕉");
  });

  it("disabled 的选项点击无效", async () => {
    const onValueChange = vi.fn();
    renderSelect({
      defaultOpen: true,
      onValueChange,
      items: [
        { value: "apple", label: "苹果" },
        { value: "banana", label: "香蕉", disabled: true },
      ],
    });
    await waitForMount();

    fireEvent.click(items()[1]);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it("hover 选项时设置高亮", async () => {
    renderSelect({ defaultOpen: true });
    await waitForMount();

    // SelectItem 的 mouseenter 走原生 addEventListener，fireEvent.mouseEnter
    // 不会触发它（Solid 事件系统与原生监听是两套），用 dispatchEvent 派发原生 mouseenter。
    items()[1].dispatchEvent(new MouseEvent("mouseenter"));

    expect(highlightedItem()).toBe(items()[1]);
  });

  it("选中项带 aria-selected=true", () => {
    renderSelect({ defaultOpen: true, defaultValue: "apple" });

    expect(items()[0]).toHaveAttribute("aria-selected", "true");
    expect(items()[1]).toHaveAttribute("aria-selected", "false");
  });

  it("选项是 role=option", () => {
    renderSelect({ defaultOpen: true });

    expect(items()[0]).toHaveAttribute("role", "option");
  });
});

describe("Select - Trigger 键盘", () => {
  it.each(["ArrowDown", "ArrowUp"])("关闭时按 %s 打开", async (key) => {
    const onOpenChange = vi.fn();
    renderSelect({ onOpenChange });
    await waitForMount();

    fireEvent.keyDown(trigger(), { key });

    expect(isOpen()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  /**
   * trigger 默认渲染原生 `<button>`。Enter/Space 在真实浏览器里会
   * 触发 keydown 打开 + 一次合成 click，而 click 处理器是 toggle。
   *
   * 这里**不**断言两者叠加后的净效果：jsdom 不会自动合成 click，
   * 手动补 click 又与真实时序难以对齐（多次尝试结果不稳定）。
   * 按 TESTING.md §5.5，这种依赖真实浏览器事件合成序列的交互属于
   * jsdom 能力缺口，只分别验证两个分支本身是否正确。
   */
  it("不冒泡的 keydown Enter 能正常打开（隔离 keydown 分支）", async () => {
    renderSelect();
    await waitForMount();

    trigger().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: false,
        cancelable: true,
      }),
    );

    expect(isOpen()).toBe(true);
  });

  it("不冒泡的 keydown 空格能正常打开", async () => {
    renderSelect();
    await waitForMount();

    trigger().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        bubbles: false,
        cancelable: true,
      }),
    );

    expect(isOpen()).toBe(true);
  });

  it("关闭时按其他键不打开", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ onOpenChange });
    await waitForMount();

    fireEvent.keyDown(trigger(), { key: "a" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("打开时按 Escape 关闭", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ defaultOpen: true, onOpenChange });
    await waitForMount();

    fireEvent.keyDown(trigger(), { key: "Escape" });

    expect(isOpen()).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("打开时按方向键不重复触发 onOpenChange", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ defaultOpen: true, onOpenChange });
    await waitForMount();

    fireEvent.keyDown(trigger(), { key: "ArrowDown" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disabled 时键盘不打开", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ disabled: true, onOpenChange });
    await waitForMount();

    fireEvent.keyDown(trigger(), { key: "Enter" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("打开时高亮当前选中值（未按键前）", async () => {
    renderSelect({ defaultValue: "banana", defaultOpen: true });
    await waitForMount();

    // 打开时 openAndHighlightSelected 会把高亮设成当前值；
    // 注意这是 trigger 的 click/keydown 处理逻辑，defaultOpen 不经过它，
    // 因此这里手动用 click 打开来验证该契约。
    fireEvent.click(trigger()); // 先关闭
    fireEvent.click(trigger()); // 再打开 → 走 openAndHighlightSelected
    await Promise.resolve();

    expect(highlightedItem()).toBe(items()[1]);
  });

  it("ArrowDown 在最后一个选项上环绕到第一个", async () => {
    renderSelect({ defaultValue: "banana", defaultOpen: true });
    await waitForMount();
    // 先让高亮落在选中项上
    fireEvent.click(trigger());
    fireEvent.click(trigger());
    await Promise.resolve();
    expect(highlightedItem()).toBe(items()[1]);

    fireEvent.keyDown(trigger(), { key: "ArrowDown" });

    // loop 生效：从第 2 项环绕到第 1 项
    expect(highlightedItem()).toBe(items()[0]);
  });

  it("无选中值时高亮第一个可用选项", async () => {
    renderSelect();
    await waitForMount();

    fireEvent.click(trigger());
    await Promise.resolve();

    expect(highlightedItem()).toBe(items()[0]);
  });

  it("无选中值时跳过 disabled 选项作为初始高亮", async () => {
    renderSelect({
      items: [
        { value: "apple", label: "苹果", disabled: true },
        { value: "banana", label: "香蕉" },
      ],
    });
    await waitForMount();

    fireEvent.click(trigger());
    await Promise.resolve();

    expect(highlightedItem()).toBe(items()[1]);
  });

  it("用户的 onKeyDown 与内部监听互不覆盖", async () => {
    const onKeyDown = vi.fn();
    render(() => (
      <Select>
        <SelectTrigger onKeyDown={onKeyDown}>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">苹果</SelectItem>
        </SelectContent>
      </Select>
    ));
    await waitForMount();

    fireEvent.keyDown(trigger(), { key: "ArrowDown" });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(true);
  });
});

describe("Select - 受控模式", () => {
  it("受控 value 决定 trigger 展示的 label", () => {
    renderSelect({ value: "banana" });

    expect(trigger()).toHaveTextContent("香蕉");
  });

  it("受控 value 时点击选项只回调，展示不变", async () => {
    const onValueChange = vi.fn();
    renderSelect({ open: true, value: "apple", onValueChange });
    await waitForMount();

    fireEvent.click(items()[1]);

    expect(onValueChange).toHaveBeenCalledWith("banana");
    // 受控：UI 仍显示外部传入的 apple
    expect(trigger()).toHaveTextContent("苹果");
  });

  it("外部回写受控 value 后展示跟随", async () => {
    const [value, setValue] = createSignal("apple");
    render(() => (
      <Select value={value()}>
        <SelectTrigger>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">苹果</SelectItem>
          <SelectItem value="banana">香蕉</SelectItem>
        </SelectContent>
      </Select>
    ));
    await waitForMount();

    expect(trigger()).toHaveTextContent("苹果");

    setValue("banana");
    await Promise.resolve();

    expect(trigger()).toHaveTextContent("香蕉");
  });

  it("受控 open=false 时点击只回调，不打开", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ open: false, onOpenChange });
    await waitForMount();
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(isOpen()).toBe(false);
  });

  it("受控 open=true 时 Escape 只回调，不关闭", async () => {
    const onOpenChange = vi.fn();
    renderSelect({ open: true, onOpenChange });
    await waitForMount();

    fireEvent.keyDown(trigger(), { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(isOpen()).toBe(true);
  });
});
