import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup } from "~/components/radio-group/RadioGroup/RadioGroup";
import { useRadioGroupContext } from "~/components/radio-group/RadioGroup/RadioGroup.context";

/** RadioGroup 根：radiogroup 容器 + 选中值/禁用/注册表 的 context */
function Probe() {
  const ctx = useRadioGroupContext("Probe");
  return (
    <div data-testid="probe">
      <span data-testid="value">{ctx.value() ?? "null"}</span>
      <span data-testid="disabled">{String(ctx.disabled())}</span>
      <button type="button" data-testid="set" onClick={() => ctx.setValue("b")}>
        设为 b
      </button>
    </div>
  );
}

function groupOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="radio-group"]');
}

describe("RadioGroup - 结构", () => {
  it("渲染 role=radiogroup 的容器并带 data-slot", () => {
    const { container } = render(() => (
      <RadioGroup>
        <Probe />
      </RadioGroup>
    ));
    const group = groupOf(container);

    expect(group?.tagName).toBe("DIV");
    expect(group?.getAttribute("role")).toBe("radiogroup");
  });

  it("合并类名、classList、style、dir 并透传其余属性", () => {
    const { container } = render(() => (
      <RadioGroup
        class="my-group"
        classList={{ "is-inline": true }}
        style={{ "row-gap": "4px" }}
        dir="rtl"
      >
        <Probe />
      </RadioGroup>
    ));
    const group = groupOf(container)!;

    expect(group.className).toContain("grid");
    expect(group.className).toContain("my-group");
    expect(group.className).toContain("is-inline");
    expect(group.style.rowGap).toBe("4px");
    expect(group.getAttribute("dir")).toBe("rtl");
  });
});

describe("RadioGroup - 受控与非受控", () => {
  it("非受控：defaultValue 初始值，setValue 后更新", () => {
    const { getByTestId } = render(() => (
      <RadioGroup defaultValue="a">
        <Probe />
      </RadioGroup>
    ));

    expect(getByTestId("value").textContent).toBe("a");

    getByTestId("set").click();

    expect(getByTestId("value").textContent).toBe("b");
  });

  it("非受控：没有 defaultValue 时是 null", () => {
    const { getByTestId } = render(() => (
      <RadioGroup>
        <Probe />
      </RadioGroup>
    ));

    expect(getByTestId("value").textContent).toBe("null");
  });

  it("受控：只回调不改自身，外部回写后才变", () => {
    const onValueChange = vi.fn();
    const { getByTestId } = render(() => (
      <RadioGroup value="a" onValueChange={onValueChange}>
        <Probe />
      </RadioGroup>
    ));

    getByTestId("set").click();

    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(getByTestId("value").textContent).toBe("a");
  });

  it("受控 value 为空串时视为没有选中项", () => {
    const { getByTestId } = render(() => (
      <RadioGroup value="">
        <Probe />
      </RadioGroup>
    ));

    expect(getByTestId("value").textContent).toBe("");
  });

  it("没有 onValueChange 时也能切换", () => {
    const { getByTestId } = render(() => (
      <RadioGroup>
        <Probe />
      </RadioGroup>
    ));

    expect(() => getByTestId("set").click()).not.toThrow();
    expect(getByTestId("value").textContent).toBe("b");
  });
});

describe("RadioGroup - disabled", () => {
  it("未传或传 false 时为 false，传 true 时向下暴露 true", () => {
    expect(
      render(() => (
        <RadioGroup>
          <Probe />
        </RadioGroup>
      )).getByTestId("disabled").textContent,
    ).toBe("false");

    expect(
      render(() => (
        <RadioGroup disabled={false}>
          <Probe />
        </RadioGroup>
      )).getByTestId("disabled").textContent,
    ).toBe("false");

    expect(
      render(() => (
        <RadioGroup disabled>
          <Probe />
        </RadioGroup>
      )).getByTestId("disabled").textContent,
    ).toBe("true");
  });
});

describe("RadioGroup - 注册表与聚焦", () => {
  it("registerItem 注册元素、注销后 focusItem 找不到目标（不报错）", () => {
    let ctx!: ReturnType<typeof useRadioGroupContext>;
    const Capture = () => {
      ctx = useRadioGroupContext("Capture");
      return null;
    };
    render(() => (
      <RadioGroup>
        <Capture />
      </RadioGroup>
    ));

    const element = document.createElement("button");
    const unregister = ctx.registerItem("x", element);
    ctx.focusItem("x");
    expect(document.activeElement).not.toBe(element); // 未挂进 DOM，focus 无效但不应抛错

    expect(() => unregister()).not.toThrow();
    expect(() => ctx.focusItem("x")).not.toThrow();
  });

  it("重复注册同一个值时，旧元素的注销不会误删新元素", () => {
    let ctx!: ReturnType<typeof useRadioGroupContext>;
    const Capture = () => {
      ctx = useRadioGroupContext("Capture");
      return null;
    };
    render(() => (
      <RadioGroup>
        <Capture />
      </RadioGroup>
    ));

    const first = document.createElement("button");
    const second = document.createElement("button");
    const unregisterFirst = ctx.registerItem("dup", first);
    ctx.registerItem("dup", second);

    unregisterFirst();
    // 新元素仍应留在注册表里：用一个探针元素验证 focusItem 仍指向 second
    document.body.append(first, second);
    second.focus();
    second.blur();
    ctx.focusItem("dup");
    expect(document.activeElement).toBe(second);
  });
});

describe("RadioGroup - 缺少 Provider", () => {
  it("子组件在 RadioGroup 之外使用时抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <Probe />)).toThrow(
      /<Probe> 必须渲染在 <RadioGroup> 内部/,
    );

    error.mockRestore();
  });
});
