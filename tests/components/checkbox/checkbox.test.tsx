import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox } from "~/components/checkbox/Checkbox/Checkbox";

/**
 * Checkbox 测试。
 *
 * 实现要点（决定了断言该怎么写）：
 * - 可见元素是 `role="checkbox"` 的 `<span>`，真正的 `<input type="checkbox">`
 *   是 `sr-only` + `aria-hidden`（只负责表单提交与可访问状态镜像）；
 * - `onChange` 是**自研回调**：收到的是新的 `boolean`，不是原生事件；
 * - `data-checked` / `data-disabled` 驱动样式。
 */
function renderCheckbox(
  props: {
    defaultChecked?: boolean;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
    name?: string;
  } = {},
) {
  return render(() => (
    <Checkbox
      defaultChecked={props.defaultChecked}
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
      id={props.id}
      name={props.name}
    />
  ));
}

function box(): HTMLElement {
  return document.querySelector('[role="checkbox"]') as HTMLElement;
}

function hiddenInput(): HTMLInputElement {
  return document.querySelector("input[type='checkbox']") as HTMLInputElement;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Checkbox - 渲染与 ARIA", () => {
  it("可见元素是 role=checkbox", () => {
    renderCheckbox();

    expect(box()).toHaveAttribute("role", "checkbox");
  });

  it("带 data-slot", () => {
    renderCheckbox();

    expect(box()).toHaveAttribute("data-slot", "checkbox");
  });

  it("渲染 sr-only 的原生 checkbox 用于表单提交", () => {
    renderCheckbox({ name: "terms" });

    expect(hiddenInput()).toHaveAttribute("type", "checkbox");
    expect(hiddenInput()).toHaveAttribute("name", "terms");
    expect(hiddenInput()).toHaveAttribute("aria-hidden", "true");
  });

  it("可见元素可聚焦（tabIndex=0）", () => {
    renderCheckbox();

    expect(box()).toHaveAttribute("tabindex", "0");
  });

  it("默认未选中", () => {
    renderCheckbox();

    expect(box()).toHaveAttribute("aria-checked", "false");
    // 注意：data-checked 是 "false"/"true" 字符串，未选中时**仍然存在**
    expect(box()).toHaveAttribute("data-checked", "false");
  });

  it("defaultChecked 时初始选中", () => {
    renderCheckbox({ defaultChecked: true });

    expect(box()).toHaveAttribute("aria-checked", "true");
    expect(box()).toHaveAttribute("data-checked", "true");
  });

  it("原生 input 的 checked 与可见状态保持一致", () => {
    renderCheckbox({ defaultChecked: true });

    expect(hiddenInput().checked).toBe(true);
  });

  it("aria-labelledby 关联到原生 input 的 id", () => {
    renderCheckbox({ id: "my-checkbox" });

    expect(box()).toHaveAttribute("aria-labelledby", "my-checkbox");
    expect(hiddenInput()).toHaveAttribute("id", "my-checkbox");
  });

  it("未显式传 id 时自动生成并成对关联", () => {
    renderCheckbox();

    const id = hiddenInput().getAttribute("id");
    expect(id).toBeTruthy();
    expect(box()).toHaveAttribute("aria-labelledby", id!);
  });

  it("name 默认回退到 id", () => {
    renderCheckbox();

    expect(hiddenInput().getAttribute("name")).toBe(
      hiddenInput().getAttribute("id"),
    );
  });
});

describe("Checkbox - 点击交互", () => {
  it("非受控：点击后切换为选中并回调新值", () => {
    const onChange = vi.fn();
    renderCheckbox({ onChange });

    fireEvent.click(box());

    expect(box()).toHaveAttribute("aria-checked", "true");
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("非受控：再次点击切回未选中", () => {
    const onChange = vi.fn();
    renderCheckbox({ defaultChecked: true, onChange });

    fireEvent.click(box());

    expect(box()).toHaveAttribute("aria-checked", "false");
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("点击后原生 input 的 checked 同步", () => {
    renderCheckbox();

    fireEvent.click(box());

    expect(hiddenInput().checked).toBe(true);
  });

  it("受控：点击只回调，状态不变", () => {
    const onChange = vi.fn();
    renderCheckbox({ checked: false, onChange });

    fireEvent.click(box());

    expect(onChange).toHaveBeenCalledWith(true);
    expect(box()).toHaveAttribute("aria-checked", "false");
  });

  it("受控：外部回写后 UI 跟随", async () => {
    const [checked, setChecked] = createSignal(false);
    render(() => <Checkbox checked={checked()} />);
    expect(box()).toHaveAttribute("aria-checked", "false");

    setChecked(true);
    await Promise.resolve();

    expect(box()).toHaveAttribute("aria-checked", "true");
  });

  it("受控：外部回写后原生 input 也跟随", async () => {
    const [checked, setChecked] = createSignal(false);
    render(() => <Checkbox checked={checked()} />);

    setChecked(true);
    await Promise.resolve();

    expect(hiddenInput().checked).toBe(true);
  });

  it("disabled 时点击不切换也不回调", () => {
    const onChange = vi.fn();
    renderCheckbox({ disabled: true, onChange });

    fireEvent.click(box());

    expect(onChange).not.toHaveBeenCalled();
    expect(box()).toHaveAttribute("aria-checked", "false");
  });
});

describe("Checkbox - disabled 状态", () => {
  it("未 disabled 时不输出 aria-disabled 与 data-disabled", () => {
    renderCheckbox();

    expect(box()).not.toHaveAttribute("aria-disabled");
    expect(box()).not.toHaveAttribute("data-disabled");
  });

  it("disabled 时输出 aria-disabled=true 与 data-disabled", () => {
    renderCheckbox({ disabled: true });

    expect(box()).toHaveAttribute("aria-disabled", "true");
    expect(box()).toHaveAttribute("data-disabled", "true");
  });

  it("disabled 时原生 input 也禁用", () => {
    renderCheckbox({ disabled: true });

    expect(hiddenInput()).toBeDisabled();
  });
});

describe("Checkbox - 透传与样式", () => {
  it("自定义 class 被合并", () => {
    render(() => <Checkbox class="my-checkbox" />);

    expect(box()).toHaveClass("my-checkbox");
  });

  it("classList 生效", () => {
    render(() => <Checkbox classList={{ extra: true, missing: false }} />);

    expect(box()).toHaveClass("extra");
    expect(box()).not.toHaveClass("missing");
  });

  it("其余属性透传到可见元素", () => {
    render(() => <Checkbox data-testid="probe" aria-label="接受" />);

    expect(box()).toHaveAttribute("data-testid", "probe");
    expect(box()).toHaveAttribute("aria-label", "接受");
  });

  it("children 被类型有意禁用（Omit），不渲染任何文本", () => {
    // CheckboxProps 是 `Omit<..., "children" | "onClick">`：标签文字由外部
    // `<label>` 承载，组件自身只渲染可视方块 + sr-only input。
    render(() => <Checkbox />);

    expect(box()).toHaveTextContent("");
  });
});

describe("Checkbox - 隐藏 input 的 change（回归）", () => {
  it("input 的 change 事件把状态回写（表单语义的落点）", () => {
    // 隐藏 input 是表单语义与 `<label for>` 原生转发的落点；
    // jsdom 的程序化 click() 不会自动派发 change，这里显式派发来验证回写链路
    const onChange = vi.fn();
    render(() => <Checkbox id="cb-change" onChange={onChange} />);
    const input = document.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;

    input.checked = true;
    fireEvent.change(input);

    expect(onChange).toHaveBeenCalledWith(true);
    expect(
      document
        .querySelector('[data-slot="checkbox"]')
        ?.getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("change 到相同值也如实同步状态", () => {
    render(() => <Checkbox id="cb-same" defaultChecked />);
    const input = document.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;

    fireEvent.change(input);

    expect(
      document
        .querySelector('[data-slot="checkbox"]')
        ?.getAttribute("aria-checked"),
    ).toBe("true");
  });
});

describe("Checkbox - 隐藏 input 自身收到点击（回归）", () => {
  it("直接点隐藏 input 只翻转一次，不被 span 再代理一遍", () => {
    // span 的 onClick 会把点击"代理"给隐藏 input；而 `<label for>` 的原生转发
    // 产生的点击 target 就是 input 本身，冒泡到 span 时若再代理一次，
    // 同一个 input 会被点两遍、状态翻回原值（onChange 也会触发两次）
    const onChange = vi.fn();
    render(() => <Checkbox id="cb-direct" onChange={onChange} />);

    fireEvent.click(document.querySelector("input[type='checkbox']")!);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(
      (document.querySelector("input[type='checkbox']") as HTMLInputElement)
        .checked,
    ).toBe(true);
  });
});
