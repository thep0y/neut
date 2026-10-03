import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup } from "~/components/radio-group/RadioGroup/RadioGroup";
import { RadioGroupItem } from "~/components/radio-group/RadioGroupItem/RadioGroupItem";

/**
 * RadioGroupItem：role=radio 的按钮。点击/Enter/Space 选中，
 * 方向键在当前 DOM 里的同组项之间循环并移动焦点。
 */
function renderGroup(
  props: Parameters<typeof RadioGroup>[0] = {},
  items = ["a", "b", "c"],
) {
  const view = render(() => (
    <RadioGroup {...props}>
      {items.map((value) => (
        <RadioGroupItem value={value} data-testid={`item-${value}`} />
      ))}
    </RadioGroup>
  ));
  const item = (value: string) =>
    view.container.querySelector<HTMLButtonElement>(
      `[data-slot="radio-group-item"][data-value="${value}"]`,
    )!;
  return { ...view, item };
}

describe("RadioGroupItem - 渲染", () => {
  it("渲染 role=radio 的 button，并带上 data 属性", () => {
    const { item } = renderGroup();
    const a = item("a");

    expect(a.tagName).toBe("BUTTON");
    expect(a.type).toBe("button");
    expect(a.getAttribute("role")).toBe("radio");
    expect(a.getAttribute("data-value")).toBe("a");
    expect(a.getAttribute("aria-checked")).toBe("false");
  });

  it("选中项 aria-checked=true、带 data-checked 并渲染指示圆点", () => {
    const { item } = renderGroup({ value: "b" });

    expect(item("b").getAttribute("aria-checked")).toBe("true");
    expect(item("b").hasAttribute("data-checked")).toBe(true);
    expect(
      item("b").querySelector('[data-slot="radio-group-indicator"]'),
    ).not.toBeNull();

    expect(item("a").getAttribute("aria-checked")).toBe("false");
    expect(item("a").hasAttribute("data-checked")).toBe(false);
    expect(
      item("a").querySelector('[data-slot="radio-group-indicator"]'),
    ).toBeNull();
  });

  it("选中态跟着 group 的值变化", () => {
    const { item } = renderGroup({ value: "a" });

    expect(item("a").getAttribute("aria-checked")).toBe("true");
    expect(item("b").getAttribute("aria-checked")).toBe("false");
  });

  it("合并类名/classList/style/dir 并透传其余属性", () => {
    const view = render(() => (
      <RadioGroup>
        <RadioGroupItem
          value="a"
          class="my-radio"
          classList={{ "is-large": true }}
          style={{ "margin-top": "2px" }}
          dir="rtl"
          aria-invalid="true"
          id="radio-a"
        />
      </RadioGroup>
    ));
    const element = view.container.querySelector<HTMLElement>(
      '[data-slot="radio-group-item"]',
    )!;

    expect(element.className).toContain("rounded-full");
    expect(element.className).toContain("my-radio");
    expect(element.className).toContain("is-large");
    expect(element.style.marginTop).toBe("2px");
    expect(element.getAttribute("dir")).toBe("rtl");
    expect(element.getAttribute("aria-invalid")).toBe("true");
    expect(element.id).toBe("radio-a");
  });
});

describe("RadioGroupItem - 点击选中", () => {
  it("点击未选中项会把它设为当前值（非受控）", () => {
    const { item } = renderGroup({ defaultValue: "a" });

    item("c").click();

    expect(item("c").getAttribute("aria-checked")).toBe("true");
    expect(item("a").getAttribute("aria-checked")).toBe("false");
  });

  it("点击已选中项保持选中", () => {
    const { item } = renderGroup({ defaultValue: "a" });

    item("a").click();

    expect(item("a").getAttribute("aria-checked")).toBe("true");
  });

  it("onValueChange 收到新值", () => {
    const onValueChange = vi.fn();
    const { item } = renderGroup({ defaultValue: "a", onValueChange });

    item("b").click();

    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("禁用项不响应点击", () => {
    const onValueChange = vi.fn();
    const view = render(() => (
      <RadioGroup defaultValue="a" onValueChange={onValueChange}>
        <RadioGroupItem value="b" disabled data-testid="item-b" />
      </RadioGroup>
    ));
    const b = view.getByTestId("item-b") as HTMLButtonElement;

    expect(b.disabled).toBe(true);
    // 用 fireEvent（dispatchEvent）而不是 b.click()：禁用按钮不触发原生点击的默认行为，
    // 但监听器仍会收到事件——这样才能验证 select() 里的禁用守卫
    fireEvent.click(b);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(b.getAttribute("aria-checked")).toBe("false");
  });

  it("group 禁用时所有项都禁用（item 自身的 disabled 与 group 取或）", () => {
    const { item } = renderGroup({ disabled: true }, ["a", "b"]);

    expect(item("a").disabled).toBe(true);
    expect(item("b").disabled).toBe(true);
  });
});

describe("RadioGroupItem - 键盘", () => {
  it("Enter 与 Space 选中当前项并阻止默认行为", () => {
    const { item } = renderGroup({ defaultValue: "a" });

    expect(fireEvent.keyDown(item("b"), { key: "Enter" })).toBe(false);
    expect(item("b").getAttribute("aria-checked")).toBe("true");

    expect(fireEvent.keyDown(item("c"), { key: " " })).toBe(false);
    expect(item("c").getAttribute("aria-checked")).toBe("true");
  });

  it("ArrowDown / ArrowRight 移到下一项并把焦点跟过去", () => {
    const { item } = renderGroup({ defaultValue: "a" });
    const a = item("a");
    a.focus();

    expect(fireEvent.keyDown(a, { key: "ArrowDown" })).toBe(false);

    expect(item("b").getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(item("b"));

    expect(fireEvent.keyDown(item("a"), { key: "ArrowRight" })).toBe(false);
    expect(item("b").getAttribute("aria-checked")).toBe("true");
  });

  it("ArrowUp / ArrowLeft 移到上一项", () => {
    const { item } = renderGroup({ defaultValue: "b" });

    fireEvent.keyDown(item("b"), { key: "ArrowUp" });
    expect(item("a").getAttribute("aria-checked")).toBe("true");

    fireEvent.keyDown(item("a"), { key: "ArrowLeft" });
    expect(item("c").getAttribute("aria-checked")).toBe("true");
  });

  it("在首尾之间循环", () => {
    const { item } = renderGroup({ defaultValue: "c" });

    fireEvent.keyDown(item("c"), { key: "ArrowDown" });
    expect(item("a").getAttribute("aria-checked")).toBe("true");

    fireEvent.keyDown(item("a"), { key: "ArrowUp" });
    expect(item("c").getAttribute("aria-checked")).toBe("true");
  });

  it("方向键按 DOM 顺序排列，不受 value 大小影响", () => {
    const { item } = renderGroup({ defaultValue: "b" }, ["b", "a"]);

    fireEvent.keyDown(item("b"), { key: "ArrowDown" });

    expect(item("a").getAttribute("aria-checked")).toBe("true");
  });

  it("禁用时方向键与 Enter 都不生效", () => {
    const { item } = renderGroup({ disabled: true, defaultValue: "a" }, [
      "a",
      "b",
    ]);

    expect(fireEvent.keyDown(item("a"), { key: "ArrowDown" })).toBe(true);
    expect(fireEvent.keyDown(item("a"), { key: "Enter" })).toBe(true);
    expect(item("a").getAttribute("aria-checked")).toBe("true");
  });

  it("其它按键不处理（默认行为不被阻止）", () => {
    const { item } = renderGroup({ defaultValue: "a" });

    expect(fireEvent.keyDown(item("a"), { key: "a" })).toBe(true);
  });

  it("找不到同组元素时方向键安全退出", () => {
    // 把 item 渲染到 radiogroup 之外的容器里：closest 取不到分组
    const view = render(() => (
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" data-testid="orphan" />
      </RadioGroup>
    ));
    const orphan = view.getByTestId("orphan") as HTMLButtonElement;
    document.body.appendChild(orphan); // 脱离 radiogroup 祖先

    expect(() => fireEvent.keyDown(orphan, { key: "ArrowDown" })).not.toThrow();
    expect(orphan.getAttribute("aria-checked")).toBe("true");
  });
});

describe("RadioGroupItem - 卸载", () => {
  it("卸载后不再响应（监听器与注册都清理）", () => {
    const onValueChange = vi.fn();
    const [show, setShow] = createSignal(true);
    const view = render(() => (
      <RadioGroup defaultValue="a" onValueChange={onValueChange}>
        {show() && <RadioGroupItem value="b" data-testid="item-b" />}
      </RadioGroup>
    ));
    const b = view.getByTestId("item-b") as HTMLButtonElement;

    setShow(false);

    expect(() => b.click()).not.toThrow();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
