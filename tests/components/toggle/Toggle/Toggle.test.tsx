import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Toggle } from "~/components/toggle/Toggle/Toggle";

/**
 * Toggle：带 `aria-pressed` 的两态按钮。
 *
 * 状态语义对齐 Base UI：`pressed` 受控、`defaultPressed` 非受控，
 * 点击翻转状态并回调 `onPressedChange`；用户自己的 `onClick` 先执行，
 * `preventDefault()` 可以取消翻转。
 */
function toggleOf(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('[data-slot="toggle"]') as HTMLButtonElement;
}

function renderToggle(props: Record<string, unknown> = {}) {
  const view = render(() => <Toggle {...props} />);
  return { ...view, toggle: toggleOf(view.container) };
}

describe("Toggle - 结构与初始状态", () => {
  it("渲染 button[data-slot=toggle]，默认关闭、type=button", () => {
    const { toggle } = renderToggle();

    expect(toggle.tagName).toBe("BUTTON");
    expect(toggle.getAttribute("data-slot")).toBe("toggle");
    expect(toggle.getAttribute("type")).toBe("button");
    expect(toggle.getAttribute("data-state")).toBe("off");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("defaultPressed 决定初始状态，未传时为 off", () => {
    expect(
      renderToggle({ defaultPressed: true }).toggle.getAttribute("data-state"),
    ).toBe("on");
    expect(
      renderToggle({ defaultPressed: true }).toggle.getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");

    expect(
      renderToggle({ defaultPressed: false }).toggle.getAttribute("data-state"),
    ).toBe("off");
  });

  it("type 可被覆盖", () => {
    const { toggle } = renderToggle({ type: "submit" });

    expect(toggle.getAttribute("type")).toBe("submit");
  });
});

describe("Toggle - 非受控交互", () => {
  it("点击在 on/off 之间切换，并回调 onPressedChange", () => {
    const onPressedChange = vi.fn();
    const { toggle } = renderToggle({ onPressedChange });

    fireEvent.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("on");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("off");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("从 defaultPressed=true 开始点一下回到 off", () => {
    const { toggle } = renderToggle({ defaultPressed: true });

    fireEvent.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("off");
  });
});

describe("Toggle - 受控模式", () => {
  it("点击只回调 onPressedChange，自身状态不变", () => {
    const onPressedChange = vi.fn();
    const { toggle } = renderToggle({
      pressed: false,
      onPressedChange,
    });

    fireEvent.click(toggle);

    expect(onPressedChange).toHaveBeenLastCalledWith(true);
    expect(toggle.getAttribute("data-state")).toBe("off");
  });

  it("受控 pressed=true 时点击请求关闭，状态仍由外部决定", () => {
    const onPressedChange = vi.fn();
    const { toggle } = renderToggle({ pressed: true, onPressedChange });

    fireEvent.click(toggle);

    expect(onPressedChange).toHaveBeenLastCalledWith(false);
    expect(toggle.getAttribute("data-state")).toBe("on");
  });

  it("外部回写 pressed 后 UI 跟随", () => {
    const [pressed, setPressed] = createSignal(false);
    const view = render(() => <Toggle pressed={pressed()} />);
    const toggle = toggleOf(view.container);

    expect(toggle.getAttribute("data-state")).toBe("off");

    setPressed(true);
    expect(toggle.getAttribute("data-state")).toBe("on");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    setPressed(false);
    expect(toggle.getAttribute("data-state")).toBe("off");
  });
});

describe("Toggle - 用户 onClick 与取消", () => {
  it("用户 onClick 先于状态翻转执行", () => {
    const calls: string[] = [];
    const onClick = vi.fn(() => {
      calls.push("user");
    });
    const onPressedChange = vi.fn(() => {
      calls.push("change");
    });
    const { toggle } = renderToggle({ onClick, onPressedChange });

    fireEvent.click(toggle);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["user", "change"]);
  });

  it("onClick 里 preventDefault() 后不翻转状态、不回调", () => {
    const onPressedChange = vi.fn();
    const { toggle } = renderToggle({
      onClick: (event: MouseEvent) => event.preventDefault(),
      onPressedChange,
    });

    fireEvent.click(toggle);

    expect(toggle.getAttribute("data-state")).toBe("off");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("onClick 收到原生事件对象", () => {
    const onClick = vi.fn();
    const { toggle } = renderToggle({ onClick });

    fireEvent.click(toggle);

    expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });
});

describe("Toggle - 样式与属性透传", () => {
  it("variant / size 变体会改变输出类名", () => {
    const byDefault = renderToggle().toggle;
    const outline = renderToggle({ variant: "outline" }).toggle;
    const small = renderToggle({ size: "sm" }).toggle;
    const large = renderToggle({ size: "lg" }).toggle;

    expect(outline.className).toContain("border-input");
    expect(byDefault.className).not.toContain("border-input");
    expect(small.className).toContain("h-7");
    expect(large.className).toContain("h-9");
  });

  it("合并外部 class 与 classList", () => {
    const { toggle } = renderToggle({
      class: "my-toggle",
      classList: { "is-active": true },
    });

    expect(toggle.className).toContain("my-toggle");
    expect(toggle.className).toContain("is-active");
  });

  it("透传其余属性，且 value 不落到 DOM 上", () => {
    const { toggle } = renderToggle({
      id: "bold",
      "aria-label": "加粗",
      "data-custom": "yes",
      disabled: true,
      value: "bold",
      style: { color: "red" },
    });

    expect(toggle.id).toBe("bold");
    expect(toggle.getAttribute("aria-label")).toBe("加粗");
    expect(toggle.getAttribute("data-custom")).toBe("yes");
    expect(toggle.disabled).toBe(true);
    expect(toggle.hasAttribute("value")).toBe(false);
    expect(toggle.style.color).toBe("red");
  });

  it("渲染 children（文案或图标）", () => {
    const { getByTestId } = render(() => (
      <Toggle>
        <span data-testid="label">加粗</span>
      </Toggle>
    ));

    expect(getByTestId("label").textContent).toBe("加粗");
  });
});

describe("Toggle - onClick 的 [handler, data] 形式（回归）", () => {
  it("数组形式的 handler 会拿到 data，且状态照常翻转", () => {
    // 此前 `(local.onClick as any)?.(e)` 对数组调用会静默失效：
    // handler 不执行、data-state 也不翻转
    const handler = vi.fn();
    const { container } = render(() => (
      <Toggle onClick={[handler, { reason: "test" }]} />
    ));
    const toggle = container.querySelector(
      '[data-slot="toggle"]',
    ) as HTMLElement;

    fireEvent.click(toggle);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toEqual({ reason: "test" });
    expect(toggle.getAttribute("data-state")).toBe("on");
  });

  it("普通函数形式的 handler 仍然可用", () => {
    const handler = vi.fn();
    const { container } = render(() => <Toggle onClick={handler} />);

    fireEvent.click(
      container.querySelector('[data-slot="toggle"]') as HTMLElement,
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
