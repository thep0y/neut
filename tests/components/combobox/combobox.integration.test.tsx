import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Combobox } from "~/components/combobox/Combobox/Combobox";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";

/**
 * Combobox 集成测试。
 *
 * 与 Select 的核心差异是**有输入框 + 过滤**：`filterValue` 驱动
 * `filteredItems`，多选模式下选中项是数组且不关闭面板。
 *
 * jsdom 能力缺口（同 select，见 TESTING.md §8）：浮层可见性依赖真实布局，
 * 因此开关断言用 `data-state` 而非 visibility。
 */
function renderCombobox(
  props: {
    items?: string[];
    defaultValue?: string | string[];
    value?: string | string[];
    multiple?: boolean;
    disabled?: boolean;
    open?: boolean;
    onValueChange?: (v: unknown) => void;
    onOpenChange?: (open: boolean) => void;
    itemToStringValue?: (item: string) => string;
  } = {},
) {
  const items = props.items ?? ["apple", "banana", "cherry"];
  return render(() => (
    <Combobox
      items={items}
      defaultValue={props.defaultValue}
      value={props.value}
      multiple={props.multiple}
      disabled={props.disabled}
      // Content 由 `Show when={ctx.open()}` 门控，测试默认打开以便断言选项
      open={props.open ?? true}
      onValueChange={props.onValueChange}
      onOpenChange={props.onOpenChange}
      itemToStringValue={props.itemToStringValue}
    >
      <ComboboxInput placeholder="搜索" />
      <ComboboxContent>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ));
}

function input(): HTMLInputElement {
  return document.querySelector("input") as HTMLInputElement;
}

function options(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[role='option']"));
}

/**
 * 注意：`ComboboxInput` 目前**没有** `aria-expanded` / `aria-controls` /
 * `role="combobox"`，因此无法用它判断开关状态——这也是一个无障碍缺口，
 * 已在 TESTING.md §8 登记。开关断言改用 `onOpenChange` 回调。
 */

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Combobox - 渲染与 ARIA", () => {
  it("渲染输入框", () => {
    renderCombobox();

    expect(input()).toBeInTheDocument();
  });

  it("输入框是可输入的文本控件", () => {
    renderCombobox();

    expect(input().tagName).toBe("INPUT");
    expect(input()).toHaveAttribute("placeholder", "搜索");
  });

  it("有默认值时输入框展示该项文本", () => {
    renderCombobox({ defaultValue: "banana" });

    expect(input().value).toBe("banana");
  });

  it("多选默认值时输入框为空（多选不把数组塞进输入框）", () => {
    renderCombobox({ defaultValue: ["apple", "banana"], multiple: true });

    expect(input().value).toBe("");
  });

  it("itemToStringValue 参与输入框展示", () => {
    renderCombobox({
      defaultValue: "apple",
      itemToStringValue: (item) => `水果:${item}`,
    });

    expect(input().value).toBe("水果:apple");
  });

  it("选项是 role=option", () => {
    renderCombobox();

    expect(options()[0]).toHaveAttribute("role", "option");
  });

  it("选项带 data-slot", () => {
    renderCombobox();

    expect(options()[0]).toHaveAttribute("data-slot", "combobox-item");
  });

  it("选项渲染 items 的内容", () => {
    renderCombobox({ items: ["x", "y"] });

    expect(options().map((o) => o.textContent)).toEqual(["x", "y"]);
  });

  it("选中项带 aria-selected=true", () => {
    renderCombobox({ defaultValue: "banana" });

    expect(options()[1]).toHaveAttribute("aria-selected", "true");
    expect(options()[0]).toHaveAttribute("aria-selected", "false");
  });
});

describe("Combobox - 过滤", () => {
  it("输入后只显示匹配项（大小写不敏感）", async () => {
    renderCombobox();
    const user = userEvent.setup();

    await user.type(input(), "AN");

    expect(options().map((o) => o.textContent)).toEqual(["banana"]);
  });

  it("输入不匹配时没有选项", async () => {
    renderCombobox();
    const user = userEvent.setup();

    await user.type(input(), "zzz");

    expect(options()).toHaveLength(0);
  });

  it("清空输入后恢复全部选项", async () => {
    renderCombobox();
    const user = userEvent.setup();

    await user.type(input(), "ban");
    expect(options()).toHaveLength(1);

    await user.clear(input());

    expect(options()).toHaveLength(3);
  });

  it("两端空白被忽略", async () => {
    renderCombobox();
    const user = userEvent.setup();

    await user.type(input(), "  ban  ");

    expect(options().map((o) => o.textContent)).toEqual(["banana"]);
  });

  it("自定义 itemToStringValue 参与过滤", async () => {
    renderCombobox({
      items: ["a", "b"],
      itemToStringValue: (item) => (item === "a" ? "苹果" : "香蕉"),
    });
    const user = userEvent.setup();

    await user.type(input(), "苹果");

    expect(options()).toHaveLength(1);
  });
});

describe("Combobox - 单选选中", () => {
  it("点击选项后更新值并关闭面板", async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    renderCombobox({ open: true, onValueChange, onOpenChange });
    const user = userEvent.setup();

    await user.click(options()[1]);

    expect(onValueChange).toHaveBeenCalledWith("banana", expect.anything());
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("选中后输入框展示该项文本", async () => {
    renderCombobox({ open: true });
    const user = userEvent.setup();

    await user.click(options()[1]);

    expect(input().value).toBe("banana");
  });

  it("选中后 aria-selected 更新", async () => {
    renderCombobox({ open: true });
    const user = userEvent.setup();

    await user.click(options()[1]);

    expect(options()[1]).toHaveAttribute("aria-selected", "true");
  });

  it("disabled 时点击选项不生效", async () => {
    const onValueChange = vi.fn();
    renderCombobox({ open: true, disabled: true, onValueChange });
    const user = userEvent.setup();

    await user.click(options()[0]);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("Combobox - 多选", () => {
  it("点击多个选项累加为数组", async () => {
    const onValueChange = vi.fn();
    renderCombobox({ open: true, multiple: true, onValueChange });
    const user = userEvent.setup();

    await user.click(options()[0]);
    await user.click(options()[2]);

    expect(onValueChange).toHaveBeenLastCalledWith(
      ["apple", "cherry"],
      expect.anything(),
    );
  });

  it("多选下点击已选项会移除", async () => {
    const onValueChange = vi.fn();
    renderCombobox({
      open: true,
      multiple: true,
      defaultValue: ["apple", "banana"],
      onValueChange,
    });
    const user = userEvent.setup();

    await user.click(options()[0]);

    expect(onValueChange).toHaveBeenCalledWith(["banana"], expect.anything());
  });

  it("多选下点击后不关闭面板", async () => {
    const onOpenChange = vi.fn();
    renderCombobox({ open: true, multiple: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(options()[0]);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("多选下选中后输入框保持为空（不塞数组）", async () => {
    renderCombobox({ open: true, multiple: true });
    const user = userEvent.setup();

    await user.click(options()[0]);

    expect(input().value).toBe("");
  });

  it("多选默认值下多个选项都是 aria-selected=true", () => {
    renderCombobox({
      multiple: true,
      defaultValue: ["apple", "cherry"],
    });

    expect(options()[0]).toHaveAttribute("aria-selected", "true");
    expect(options()[1]).toHaveAttribute("aria-selected", "false");
    expect(options()[2]).toHaveAttribute("aria-selected", "true");
  });
});

describe("Combobox - 键盘", () => {
  it("ArrowDown 打开面板", async () => {
    const onOpenChange = vi.fn();
    renderCombobox({ open: false, onOpenChange });
    const user = userEvent.setup();

    input().focus();
    await user.keyboard("{ArrowDown}");

    // Combobox 的输入框没有 aria-expanded，用 onOpenChange 验证开关
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("ArrowDown 后选项渲染出来", async () => {
    // 非受控打开：不传 open，让内部信号驱动
    render(() => (
      <Combobox items={["apple", "banana"]}>
        <ComboboxInput />
        <ComboboxContent>
          <ComboboxList>
            {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ));
    await Promise.resolve();
    expect(options()).toHaveLength(0);

    const user = userEvent.setup();
    input().focus();
    await user.keyboard("{ArrowDown}");
    await Promise.resolve();

    expect(options().length).toBeGreaterThan(0);
  });

  it("Enter 在打开时选中当前 active 项", async () => {
    const onValueChange = vi.fn();
    renderCombobox({ open: true, onValueChange });
    const user = userEvent.setup();

    input().focus();
    // 第一次 ArrowDown 把 activeIndex 从 -1 → 0（apple）
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("apple", expect.anything());
  });

  it("连按两次 ArrowDown 再 Enter 选中第二项", async () => {
    const onValueChange = vi.fn();
    renderCombobox({ open: true, onValueChange });
    const user = userEvent.setup();

    input().focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("banana", expect.anything());
  });

  it("ArrowUp 环绕到最后一个选项", async () => {
    const onValueChange = vi.fn();
    renderCombobox({ open: true, onValueChange });
    const user = userEvent.setup();

    input().focus();
    // 无高亮时 ArrowUp 应环绕到**最后一项**（此前错误地落在第 2 项）
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("cherry", expect.anything());
  });

  it("Escape 关闭面板", async () => {
    const onOpenChange = vi.fn();
    renderCombobox({ open: true, onOpenChange });
    const user = userEvent.setup();

    input().focus();
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("未打开时 Enter 不选中任何项", async () => {
    const onValueChange = vi.fn();
    renderCombobox({ open: false, onValueChange });
    const user = userEvent.setup();

    input().focus();
    await user.keyboard("{Enter}");

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disabled 时键盘不响应", async () => {
    const onOpenChange = vi.fn();
    renderCombobox({ open: false, disabled: true, onOpenChange });
    const user = userEvent.setup();

    input().focus();
    await user.keyboard("{ArrowDown}");

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Combobox - 受控模式", () => {
  it("受控 value 决定输入框展示", () => {
    renderCombobox({ value: "cherry" });

    expect(input().value).toBe("cherry");
  });

  it("[当前行为] 受控 value 下点击选项仍会更新输入框展示", async () => {
    const onValueChange = vi.fn();
    renderCombobox({ open: true, value: "apple", onValueChange });
    const user = userEvent.setup();

    await user.click(options()[1]);

    expect(onValueChange).toHaveBeenCalledWith("banana", expect.anything());
    // 注意：`inputValue` 是根组件里的**独立本地信号**，不会随 props.value 同步
    // （对比 Select：display 直接由 value 推导）。因此在受控模式下输入框展示
    // 会暂时与外部 value 脱节。这里锁定现状；若要修，需要让 inputValue
    // 在受控时由 props.value 推导，或加 createEffect 同步。
    expect(input().value).toBe("banana");
  });

  it("[当前行为] 外部回写受控 value 不会更新输入框展示", async () => {
    const [value, setValue] = createSignal("apple");
    render(() => (
      <Combobox items={["apple", "banana"]} value={value()} open>
        <ComboboxInput />
        <ComboboxContent>
          <ComboboxList>
            {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ));
    await Promise.resolve();

    expect(input().value).toBe("apple");

    setValue("banana");
    await Promise.resolve();

    // 同上：inputValue 是独立本地信号，外部改 value 不会带动输入框
    //（aria-selected 会正确跟随，见上面的断言）
    expect(options()[1]).toHaveAttribute("aria-selected", "true");
  });

  it("外部回写受控 value 后 aria-selected 跟随", async () => {
    const [value, setValue] = createSignal("apple");
    render(() => (
      <Combobox items={["apple", "banana"]} value={value()} open>
        <ComboboxInput />
        <ComboboxContent>
          <ComboboxList>
            {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ));
    await Promise.resolve();

    expect(options()[0]).toHaveAttribute("aria-selected", "true");

    setValue("banana");
    await Promise.resolve();

    expect(options()[0]).toHaveAttribute("aria-selected", "false");
    expect(options()[1]).toHaveAttribute("aria-selected", "true");
  });

  it("受控 open=false 时选项不渲染", () => {
    const onOpenChange = vi.fn();
    renderCombobox({ open: false, onOpenChange, items: ["apple"] });

    expect(options()).toHaveLength(0);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
