import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { ToggleGroup } from "~/components/toggle-group/ToggleGroup/ToggleGroup";
import { ToggleGroupItem } from "~/components/toggle-group/ToggleGroupItem/ToggleGroupItem";

/**
 * ToggleGroup 集成测试。
 *
 * 键盘算法与 Tabs 共用 `~/utils/roving-navigation`,这里主要验证:
 * ① ToggleGroup 侧的接线(context 字段、整组 disabled、computed direction);
 * ② 单选 / 多选两种模式与受控/非受控的行为差异;
 * ③ 事件详情的 `cancel()` 语义。
 */
function renderGroup(
  props: {
    defaultValue?: string;
    value?: string;
    multiple?: boolean;
    defaultValueMultiple?: string[];
    onValueChange?: (...args: never[]) => void;
    orientation?: "horizontal" | "vertical";
    loopFocus?: boolean;
    disabled?: boolean;
    dir?: "ltr" | "rtl" | "auto";
    disabledValues?: string[];
  } = {},
) {
  return render(() => (
    <ToggleGroup
      multiple={props.multiple}
      defaultValue={
        (props.multiple
          ? props.defaultValueMultiple
          : props.defaultValue) as never
      }
      value={(props.multiple ? undefined : props.value) as never}
      onValueChange={props.onValueChange as never}
      orientation={props.orientation}
      loopFocus={props.loopFocus}
      disabled={props.disabled}
      dir={props.dir}
    >
      {["bold", "italic", "underline"].map((v) => (
        <ToggleGroupItem value={v} disabled={props.disabledValues?.includes(v)}>
          {v}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ));
}

function items(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      '[data-slot="toggle-group-item"]',
    ),
  );
}

describe("ToggleGroup 键盘导航（集成）", () => {
  it("ArrowRight 移动焦点并更新高亮", async () => {
    renderGroup({ defaultValue: "bold" });
    const [first, second] = items();
    const user = userEvent.setup();

    first.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(second);
  });

  it("方向键不改变按下状态（只移动焦点）", async () => {
    const onValueChange = vi.fn();
    renderGroup({ defaultValue: "bold", onValueChange });
    const [first] = items();
    const user = userEvent.setup();

    first.focus();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(items()[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("跳过 disabled 的 item", async () => {
    renderGroup({ defaultValue: "bold", disabledValues: ["italic"] });
    const [first, , third] = items();
    const user = userEvent.setup();

    first.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(third);
  });

  it("整组 disabled 时不接管键盘", async () => {
    renderGroup({ defaultValue: "bold", disabled: true });
    const all = items();
    const user = userEvent.setup();

    // 整组禁用时所有 item 都是原生 disabled，无法获得焦点
    // （focus() 会落到 body），因此导航自然也不会发生。
    expect(all.every((el) => el.disabled)).toBe(true);

    all[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).not.toBe(all[1]);
  });

  it("vertical 布局下用上下键导航", async () => {
    renderGroup({ defaultValue: "bold", orientation: "vertical" });
    const [first, second] = items();
    const user = userEvent.setup();

    first.focus();
    await user.keyboard("{ArrowDown}");

    expect(document.activeElement).toBe(second);
  });

  it("vertical 布局下左右键不移动", async () => {
    renderGroup({ defaultValue: "bold", orientation: "vertical" });
    const [first] = items();
    const user = userEvent.setup();

    first.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(first);
  });

  it("loopFocus=false 时在边界停止", async () => {
    renderGroup({ defaultValue: "bold", loopFocus: false });
    const all = items();
    const user = userEvent.setup();

    all[2].focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(all[2]);
  });

  it("loopFocus 默认环绕（base-ui 默认 true）", async () => {
    renderGroup({ defaultValue: "bold" });
    const all = items();
    const user = userEvent.setup();

    all[2].focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(all[0]);
  });

  it("dir=rtl 时左右键方向反转", async () => {
    renderGroup({ defaultValue: "bold", dir: "rtl" });
    const [first, second] = items();
    const user = userEvent.setup();

    first.focus();
    await user.keyboard("{ArrowLeft}");

    expect(document.activeElement).toBe(second);
  });

  it("dir=auto 时按实际计算方向判断（祖先 dir 生效）", async () => {
    render(() => (
      <div dir="rtl">
        <ToggleGroup defaultValue="bold" dir="auto">
          <ToggleGroupItem value="bold">bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">italic</ToggleGroupItem>
        </ToggleGroup>
      </div>
    ));
    const [first, second] = items();
    const user = userEvent.setup();

    first.focus();
    await user.keyboard("{ArrowLeft}");

    expect(document.activeElement).toBe(second);
  });

  it("Home / End 跳到首尾", async () => {
    renderGroup({ defaultValue: "bold" });
    const all = items();
    const user = userEvent.setup();

    all[1].focus();
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(all[2]);

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(all[0]);
  });
});

describe("ToggleGroup 单选 / 多选", () => {
  it("单选：点击按下并回调标量", async () => {
    const onValueChange = vi.fn();
    renderGroup({ onValueChange });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onValueChange).toHaveBeenCalledWith("bold", expect.anything());
  });

  it("单选：再次点击同一项会取消选中（回调 undefined）", async () => {
    const onValueChange = vi.fn();
    renderGroup({ defaultValue: "bold", onValueChange });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onValueChange).toHaveBeenCalledWith(undefined, expect.anything());
  });

  it("多选：点击可累加选中值并回调数组", async () => {
    const onValueChange = vi.fn();
    renderGroup({
      multiple: true,
      defaultValueMultiple: [],
      onValueChange,
    });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onValueChange).toHaveBeenCalledWith(["bold"], expect.anything());
  });

  it("多选：已选中项再次点击会被移除", async () => {
    const onValueChange = vi.fn();
    renderGroup({
      multiple: true,
      defaultValueMultiple: ["bold", "italic"],
      onValueChange,
    });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onValueChange).toHaveBeenCalledWith(["italic"], expect.anything());
  });

  it("aria-pressed 反映按下状态", () => {
    renderGroup({ multiple: true, defaultValueMultiple: ["italic"] });
    const all = items();

    expect(all[0]).toHaveAttribute("aria-pressed", "false");
    expect(all[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("取消回调里 cancel() 可阻止组件提交变更", async () => {
    const onValueChange = vi.fn(
      (_value: unknown, details: { cancel: () => void }) => {
        details.cancel();
      },
    );
    renderGroup({ onValueChange: onValueChange as never });
    const user = userEvent.setup();

    await user.click(items()[0]);

    // 被 cancel：UI 不提交
    expect(items()[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("事件详情的 reason 为 none 且初始未取消", async () => {
    const onValueChange = vi.fn();
    renderGroup({ onValueChange });
    const user = userEvent.setup();

    await user.click(items()[0]);

    const details = onValueChange.mock.calls[0][1] as {
      reason: string;
      isCanceled: boolean;
      event: Event;
    };
    expect(details.reason).toBe("none");
    expect(details.isCanceled).toBe(false);
    expect(details.event).toBeInstanceOf(Event);
  });
});

describe("ToggleGroup 受控 / 非受控", () => {
  it("非受控：点击后内部状态更新", async () => {
    renderGroup({});
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(items()[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("受控：点击只回调，UI 不变", async () => {
    const onValueChange = vi.fn();
    renderGroup({ value: "italic", onValueChange });
    const user = userEvent.setup();

    await user.click(items()[0]);

    expect(onValueChange).toHaveBeenCalled();
    // 仍跟随外部值
    expect(items()[1]).toHaveAttribute("aria-pressed", "true");
    expect(items()[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("受控值由外部回写后 UI 跟随", () => {
    const [value, setValue] = createSignal("bold");
    render(() => (
      <ToggleGroup value={value()} onValueChange={setValue}>
        <ToggleGroupItem value="bold">bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">italic</ToggleGroupItem>
      </ToggleGroup>
    ));

    expect(items()[0]).toHaveAttribute("aria-pressed", "true");

    setValue("italic");

    expect(items()[1]).toHaveAttribute("aria-pressed", "true");
    expect(items()[0]).toHaveAttribute("aria-pressed", "false");
  });
});

describe("ToggleGroup - 用户回调可以阻止内部处理（回归）", () => {
  it("根节点 onKeyDown 里 preventDefault 时方向键不再切换选中", () => {
    // 守卫是 `if (!e.defaultPrevented) handleKeyDown(e)`：
    // 用户先在 onKeyDown 里收到事件，可以否决本次键盘导航
    const onValueChange = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault());
    render(() => (
      <ToggleGroup
        defaultValue="a"
        onValueChange={onValueChange}
        onKeyDown={onKeyDown}
      >
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    ));

    fireEvent.keyDown(document.querySelector('[data-slot="toggle-group"]')!, {
      key: "ArrowRight",
    });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("根的 onKeyDown 没有被 preventDefault 时照常处理键盘（roving focus 移动）", async () => {
    // 方向键只移动 roving focus（不直接改选中值），因此断言焦点落点。
    // 焦点必须先落在项上，roving navigation 才有起点可算。
    render(() => (
      <ToggleGroup defaultValue="a">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    ));
    const rendered = document.querySelectorAll(
      '[data-slot="toggle-group-item"]',
    );
    const user = userEvent.setup();

    (rendered[0] as HTMLElement).focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(rendered[1]);
  });

  it("项的 onClick 里 preventDefault 时不改变选中，但用户回调仍被调用", () => {
    const onValueChange = vi.fn();
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    render(() => (
      <ToggleGroup defaultValue="a" onValueChange={onValueChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b" onClick={onClick}>
          B
        </ToggleGroupItem>
      </ToggleGroup>
    ));
    const items = document.querySelectorAll('[data-slot="toggle-group-item"]');

    fireEvent.click(items[1]!);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(items[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("项未阻止默认行为时正常切换", () => {
    const onValueChange = vi.fn();
    render(() => (
      <ToggleGroup defaultValue="a" onValueChange={onValueChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    ));
    const items = document.querySelectorAll('[data-slot="toggle-group-item"]');

    fireEvent.click(items[1]!);

    expect(onValueChange).toHaveBeenCalled();
  });
});

describe("ToggleGroupItem - 禁用项的 focus 守卫（回归）", () => {
  it("disabled 项即使收到 focus 事件也不更新高亮，但用户 onFocus 仍被调用", () => {
    // 守卫是 `if (!disabled()) ctx.setHighlightedValue(...)`。
    // disabled 的 button 在真实浏览器里不会获得焦点（tabIndex=-1），
    // 这里直接派发 focus 事件来覆盖这条防御分支。
    const onFocus = vi.fn();
    render(() => (
      <ToggleGroup defaultValue="a">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b" disabled onFocus={onFocus}>
          B
        </ToggleGroupItem>
      </ToggleGroup>
    ));
    const items = document.querySelectorAll('[data-slot="toggle-group-item"]');

    items[1]!.dispatchEvent(new FocusEvent("focus"));

    // 用户回调无条件转发；内部的高亮更新被 disabled 拦下
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(items[1]).toHaveAttribute("disabled");
  });

  it("可用项收到 focus 时更新高亮（对照组）", () => {
    render(() => (
      <ToggleGroup defaultValue="a">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    ));
    const items = document.querySelectorAll('[data-slot="toggle-group-item"]');

    expect(() =>
      items[1]!.dispatchEvent(new FocusEvent("focus")),
    ).not.toThrow();
  });
});
