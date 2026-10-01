import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Switch } from "~/components/switch/Switch";

/**
 * Switch 测试。
 *
 * 与 Checkbox 同族：可见 `role="switch"` 的 `<span>` + sr-only `<input type="checkbox">` 镜像，
 * `data-checked` 驱动滑块位移。差异是回调名为 `onCheckedChange`、且有 `size` 变体。
 */
function renderSwitch(
  props: {
    defaultChecked?: boolean;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md";
    id?: string;
  } = {},
) {
  return render(() => (
    <Switch
      defaultChecked={props.defaultChecked}
      checked={props.checked}
      onCheckedChange={props.onCheckedChange}
      disabled={props.disabled}
      size={props.size}
      id={props.id}
    />
  ));
}

function sw(): HTMLElement {
  return document.querySelector('[data-slot="switch"]') as HTMLElement;
}

function thumb(): HTMLElement {
  return document.querySelector('[data-slot="switch-thumb"]') as HTMLElement;
}

function hiddenInput(): HTMLInputElement {
  return document.querySelector("input[type='checkbox']") as HTMLInputElement;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Switch - 渲染与 ARIA", () => {
  it("可见元素是 role=switch", () => {
    renderSwitch();

    expect(sw()).toHaveAttribute("role", "switch");
  });

  it("带 data-slot", () => {
    renderSwitch();

    expect(sw()).toHaveAttribute("data-slot", "switch");
  });

  it("默认 size 为 md", () => {
    renderSwitch();

    expect(sw()).toHaveAttribute("data-size", "md");
  });

  it("size 可覆盖为 sm", () => {
    renderSwitch({ size: "sm" });

    expect(sw()).toHaveAttribute("data-size", "sm");
  });

  it("可聚焦（tabIndex=0）", () => {
    renderSwitch();

    expect(sw()).toHaveAttribute("tabindex", "0");
  });

  it("默认未打开", () => {
    renderSwitch();

    expect(sw()).toHaveAttribute("aria-checked", "false");
    expect(sw()).toHaveAttribute("data-checked", "false");
  });

  it("defaultChecked 时初始打开", () => {
    renderSwitch({ defaultChecked: true });

    expect(sw()).toHaveAttribute("aria-checked", "true");
    expect(sw()).toHaveAttribute("data-checked", "true");
  });

  it("滑块也镜像 data-checked（驱动位移动画）", () => {
    renderSwitch({ defaultChecked: true });

    expect(thumb()).toHaveAttribute("data-checked", "true");
  });

  it("渲染 sr-only 的原生 checkbox", () => {
    renderSwitch();

    expect(hiddenInput()).toHaveAttribute("type", "checkbox");
    expect(hiddenInput()).toHaveAttribute("aria-hidden", "true");
    expect(hiddenInput()).toHaveAttribute("tabindex", "-1");
  });

  it("原生 input 的 checked 与可见状态同步", () => {
    renderSwitch({ defaultChecked: true });

    expect(hiddenInput().checked).toBe(true);
  });

  it("id 透传到原生 input", () => {
    renderSwitch({ id: "my-switch" });

    expect(hiddenInput()).toHaveAttribute("id", "my-switch");
  });
});

describe("Switch - 点击交互", () => {
  it("非受控：点击后打开并回调 true", () => {
    const onCheckedChange = vi.fn();
    renderSwitch({ onCheckedChange });

    fireEvent.click(sw());

    expect(sw()).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("非受控：再次点击关闭并回调 false", () => {
    const onCheckedChange = vi.fn();
    renderSwitch({ defaultChecked: true, onCheckedChange });

    fireEvent.click(sw());

    expect(sw()).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("点击后滑块镜像状态", () => {
    renderSwitch();

    fireEvent.click(sw());

    expect(thumb()).toHaveAttribute("data-checked", "true");
  });

  it("点击后原生 input 同步", () => {
    renderSwitch();

    fireEvent.click(sw());

    expect(hiddenInput().checked).toBe(true);
  });

  it("受控：点击时内部信号被写回外部值，UI 保持外部状态", () => {
    const onCheckedChange = vi.fn();
    renderSwitch({ checked: false, onCheckedChange });

    fireEvent.click(sw());

    // 回调收到取反后的新值
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // UI 仍由 props.checked 决定
    expect(sw()).toHaveAttribute("aria-checked", "false");
  });

  it("受控：外部回写后 UI 与原生 input 跟随", async () => {
    const [checked, setChecked] = createSignal(false);
    render(() => <Switch checked={checked()} />);
    expect(sw()).toHaveAttribute("aria-checked", "false");

    setChecked(true);
    await Promise.resolve();

    expect(sw()).toHaveAttribute("aria-checked", "true");
    expect(hiddenInput().checked).toBe(true);
  });

  it("disabled 时点击不切换也不回调", () => {
    const onCheckedChange = vi.fn();
    renderSwitch({ disabled: true, onCheckedChange });

    fireEvent.click(sw());

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(sw()).toHaveAttribute("aria-checked", "false");
  });
});

describe("Switch - disabled 状态", () => {
  it("未 disabled 时 data-disabled 为 undefined", () => {
    renderSwitch();

    expect(sw()).not.toHaveAttribute("data-disabled");
  });

  it("disabled 时 data-disabled 存在", () => {
    renderSwitch({ disabled: true });

    expect(sw()).toHaveAttribute("data-disabled", "true");
  });

  it("disabled 时原生 input 也禁用", () => {
    renderSwitch({ disabled: true });

    expect(hiddenInput()).toBeDisabled();
  });

  it("[回归] disabled 时受控模式同样不回调", () => {
    const onCheckedChange = vi.fn();
    renderSwitch({ disabled: true, checked: false, onCheckedChange });

    fireEvent.click(sw());

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("disabled 时暴露 aria-disabled", () => {
    renderSwitch({ disabled: true });

    expect(sw()).toHaveAttribute("aria-disabled", "true");
  });

  it("未 disabled 时不带 aria-disabled", () => {
    renderSwitch();

    expect(sw()).not.toHaveAttribute("aria-disabled");
  });
});

describe("Switch - 透传与样式", () => {
  it("自定义 class 被合并", () => {
    render(() => <Switch class="my-switch" />);

    expect(sw()).toHaveClass("my-switch");
  });

  it("[回归] classList 生效", () => {
    render(() => <Switch classList={{ extra: true, missing: false }} />);

    expect(sw()).toHaveClass("extra");
    expect(sw()).not.toHaveClass("missing");
  });

  it("其余属性透传到可见元素", () => {
    render(() => <Switch data-testid="probe" aria-label="开启" />);

    expect(sw()).toHaveAttribute("data-testid", "probe");
    expect(sw()).toHaveAttribute("aria-label", "开启");
  });
});
