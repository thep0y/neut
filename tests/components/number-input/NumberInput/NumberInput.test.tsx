import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { NumberInput } from "~/components/number-input/NumberInput/NumberInput";
import type { NumberInputChangeEventDetails } from "~/components/number-input/NumberInput/NumberInput.types";

/**
 * NumberInput：受控/非受控、解析与格式化、按钮/键盘步进、失焦收敛、边界与取消。
 *
 * 观察面全部选**使用者能看到的东西**：`role="spinbutton"` 的 `value` 与
 * `aria-valuenow` 表达提交后的值、按钮的 `disabled`、`onValueChange` 的
 * 实参与事件详情、以及 `fireEvent` 的返回值（`preventDefault` 是否被调用）。
 */

function setup(props: Parameters<typeof NumberInput>[0] = {}) {
  // 一律包一层 spy：调用方自定义 onValueChange 时也保留可断言性
  const onValueChange = props.onValueChange
    ? vi.fn(props.onValueChange)
    : vi.fn();
  const view = render(() => (
    <NumberInput {...props} onValueChange={onValueChange} />
  ));
  const input = () =>
    view.container.querySelector<HTMLInputElement>('[role="spinbutton"]')!;
  const button = (name: "Increase" | "Decrease") =>
    view.getByRole("button", { name }) as HTMLButtonElement;

  /** 模拟真实输入：先聚焦（真实用户必然已聚焦），再改值并派发 input 事件 */
  const type = (text: string) => {
    fireEvent.focus(input());
    input().value = text;
    fireEvent.input(input());
  };

  return { ...view, input, button, type, onValueChange };
}

/** 取最后一次 onValueChange 的值与 reason */
function lastChange(onValueChange: ReturnType<typeof vi.fn>) {
  const call = onValueChange.mock.calls.at(-1);
  return {
    value: call?.[0] as number | null,
    details: call?.[1] as NumberInputChangeEventDetails,
  };
}

describe("NumberInput - 渲染与属性透传", () => {
  it("渲染一个 spinbutton 与一减一加两个按钮", () => {
    const { input, button } = setup();

    expect(input().getAttribute("inputmode")).toBe("decimal");
    expect(input().getAttribute("autocomplete")).toBe("off");
    expect(button("Decrease")).not.toBeNull();
    expect(button("Increase")).not.toBeNull();
  });

  it("透传 id / name / placeholder / required / aria-label / class", () => {
    const { input, container } = setup({
      id: "qty",
      name: "quantity",
      placeholder: "数量",
      required: true,
      "aria-label": "商品数量",
      class: "my-number-input",
    });

    expect(input().id).toBe("qty");
    expect(input().name).toBe("quantity");
    expect(input().placeholder).toBe("数量");
    expect(input().required).toBe(true);
    expect(input().getAttribute("aria-label")).toBe("商品数量");
    expect(container.querySelector(".my-number-input")).not.toBeNull();
  });

  it("受控值渲染成文本，null 渲染成空串", () => {
    expect(setup({ value: 42 }).input().value).toBe("42");
    expect(setup({ value: null }).input().value).toBe("");
  });

  it("非受控时用 defaultValue 作为初始值", () => {
    expect(setup({ defaultValue: 7 }).input().value).toBe("7");
    expect(setup({ defaultValue: null }).input().value).toBe("");
  });

  it("min / max 映射成 aria-valuemin / aria-valuemax，值为空时没有 aria-valuenow", () => {
    const empty = setup({ min: 1, max: 9 });
    expect(empty.input().getAttribute("aria-valuemin")).toBe("1");
    expect(empty.input().getAttribute("aria-valuemax")).toBe("9");
    expect(empty.input().hasAttribute("aria-valuenow")).toBe(false);

    expect(setup({ value: 5 }).input().getAttribute("aria-valuenow")).toBe("5");
  });

  it("disabled 会同时禁用输入框与两个按钮", () => {
    const { input, button } = setup({ disabled: true, value: 5 });

    expect(input().disabled).toBe(true);
    expect(button("Increase").disabled).toBe(true);
    expect(button("Decrease").disabled).toBe(true);
  });

  it("readOnly 不禁用输入框，但禁用两个按钮", () => {
    const { input, button } = setup({ readOnly: true, value: 5 });

    expect(input().readOnly).toBe(true);
    expect(button("Increase").disabled).toBe(true);
    expect(button("Decrease").disabled).toBe(true);
  });
});

describe("NumberInput - 按钮步进（非受控）", () => {
  it("空值时从 0 开始加，reason 为 button-press", () => {
    const { button, input, onValueChange } = setup();

    fireEvent.click(button("Increase"));

    expect(input().value).toBe("1");
    expect(input().getAttribute("aria-valuenow")).toBe("1");
    expect(lastChange(onValueChange)).toMatchObject({ value: 1 });
    expect(lastChange(onValueChange).details.reason).toBe("button-press");
  });

  it("空值但有 min 时从 min 开始加", () => {
    const { button, input } = setup({ min: 5 });

    fireEvent.click(button("Increase"));

    expect(input().value).toBe("6");
  });

  it("空值且无 min 时可以减到负数", () => {
    const { button, input } = setup();

    fireEvent.click(button("Decrease"));

    expect(input().value).toBe("-1");
  });

  it("step 可覆盖，减按钮用负步长", () => {
    const plus = setup({ step: 5 });
    fireEvent.click(plus.button("Increase"));
    expect(plus.input().value).toBe("5");

    const minus = setup({ step: 5, defaultValue: 20 });
    fireEvent.click(minus.button("Decrease"));
    expect(minus.input().value).toBe("15");
  });

  it("到达 min 时减按钮禁用，到达 max 时加按钮禁用", () => {
    const atMin = setup({ value: 1, min: 1, max: 9 });
    expect(atMin.button("Decrease").disabled).toBe(true);
    expect(atMin.button("Increase").disabled).toBe(false);

    const atMax = setup({ value: 9, min: 1, max: 9 });
    expect(atMax.button("Increase").disabled).toBe(true);
    expect(atMax.button("Decrease").disabled).toBe(false);
  });

  it("值在边界内时两个按钮都可用（不只比较等于边界）", () => {
    const { button } = setup({ value: 5, min: 1, max: 9 });

    expect(button("Increase").disabled).toBe(false);
    expect(button("Decrease").disabled).toBe(false);
  });
});

describe("NumberInput - 输入解析", () => {
  it("输入数字会用 reason=input 提交，并更新 aria-valuenow", () => {
    const { input, type, onValueChange } = setup();

    type("12");

    expect(input().value).toBe("12");
    expect(input().getAttribute("aria-valuenow")).toBe("12");
    expect(lastChange(onValueChange)).toMatchObject({ value: 12 });
    expect(lastChange(onValueChange).details.reason).toBe("input");
  });

  it("输入过程中不 clamp（否则敲不进越界中间值）", () => {
    const { input, type, onValueChange } = setup({ max: 10, value: 1 });

    type("99");

    expect(lastChange(onValueChange).value).toBe(99);
    expect(input().value).toBe("99");
  });

  it('非法中间值（"-"）不提交', () => {
    const { input, type, onValueChange } = setup({ value: 3 });

    type("-");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(input().getAttribute("aria-valuenow")).toBe("3");
  });

  it("接受逗号作为小数点（默认解析）", () => {
    const { type, onValueChange } = setup();

    type("1,5");

    expect(lastChange(onValueChange).value).toBe(1.5);
  });

  it("自定义 parse 优先于默认解析", () => {
    const parse = vi.fn(() => 100);
    const { type, onValueChange } = setup({ parse });

    type("whatever");

    expect(parse).toHaveBeenCalledWith("whatever");
    expect(lastChange(onValueChange).value).toBe(100);
  });

  it("自定义 format 决定文本回显（初始值、外部更新、步进回显）", () => {
    const format = (value: number) => `${value}%`;
    const [value, setValue] = createSignal<number | null>(5);
    const view = render(() => <NumberInput format={format} value={value()} />);
    const input = () =>
      view.container.querySelector<HTMLInputElement>('[role="spinbutton"]')!;

    expect(input().value).toBe("5%");

    setValue(12);
    expect(input().value).toBe("12%");
  });

  it("自定义 format 用于步进后的回显（非受控）", () => {
    const format = (value: number) => `${value}%`;
    const { button, input } = setup({ format, defaultValue: 12 });

    fireEvent.click(button("Increase"));

    expect(input().value).toBe("13%");
  });
});

describe("NumberInput - 失焦收敛", () => {
  it("失焦时按 min / max 收敛并回显", () => {
    const above = setup({ max: 10 });
    above.type("99");
    fireEvent.blur(above.input());
    expect(above.input().value).toBe("10");

    const below = setup({ min: 1 });
    below.type("-5");
    fireEvent.blur(below.input());
    expect(below.input().value).toBe("1");
  });

  it("失焦时按步长的小数位四舍五入（抵消浮点误差）", () => {
    const { input, type } = setup({ step: 0.1 });

    type("0.30000000000000004");
    fireEvent.blur(input());

    expect(input().value).toBe("0.3");
  });

  it("失焦时解析失败且已有值：以 reason=blur 提交 null 并清空文本", () => {
    const { input, type, onValueChange } = setup({ value: 5 });

    type("abc");
    fireEvent.blur(input());

    expect(lastChange(onValueChange)).toMatchObject({ value: null });
    expect(lastChange(onValueChange).details.reason).toBe("blur");
    expect(input().value).toBe("");
  });

  it("非受控：失焦时解析失败会把已提交的值清空", () => {
    const { input, type, onValueChange } = setup({ defaultValue: 5 });

    type("abc");
    fireEvent.blur(input());

    expect(lastChange(onValueChange)).toMatchObject({ value: null });
    expect(input().hasAttribute("aria-valuenow")).toBe(false);
    expect(input().value).toBe("");
  });

  it("失焦时解析失败且本来就没有值：只清空文本，不提交", () => {
    const { input, type, onValueChange } = setup();

    type("abc");
    fireEvent.blur(input());

    expect(onValueChange).not.toHaveBeenCalled();
    expect(input().value).toBe("");
  });

  it("失焦时解析成功：按 step 的小数位取整后提交（reason=blur）", () => {
    // roundToStep 只按 **步长的小数位数** 四舍五入（抵消浮点误差），
    // 不做"吸附到步长整数倍"——step=2 时 7 仍是 7
    const { input, type, onValueChange } = setup({ step: 2 });

    type("7");
    fireEvent.blur(input());

    expect(lastChange(onValueChange)).toMatchObject({ value: 7 });
    expect(lastChange(onValueChange).details.reason).toBe("blur");
    expect(input().value).toBe("7");
  });
});

describe("NumberInput - 键盘", () => {
  it("ArrowUp / ArrowDown 走 step，且阻止默认行为", () => {
    const { input, onValueChange } = setup({ value: 5 });

    expect(fireEvent.keyDown(input(), { key: "ArrowUp" })).toBe(false);
    expect(lastChange(onValueChange)).toMatchObject({ value: 6 });
    expect(lastChange(onValueChange).details.reason).toBe("keyboard");

    expect(fireEvent.keyDown(input(), { key: "ArrowDown" })).toBe(false);
    expect(lastChange(onValueChange)).toMatchObject({ value: 4 });
  });

  it("PageUp / PageDown 用 largeStep（默认 step × 10）", () => {
    const { input, onValueChange } = setup({ value: 0, step: 2 });

    fireEvent.keyDown(input(), { key: "PageUp" });
    expect(lastChange(onValueChange).value).toBe(20);

    fireEvent.keyDown(input(), { key: "PageDown" });
    expect(lastChange(onValueChange).value).toBe(-20);
  });

  it("largeStep 可覆盖", () => {
    const { input, onValueChange } = setup({ value: 0, largeStep: 3 });

    fireEvent.keyDown(input(), { key: "PageUp" });

    expect(lastChange(onValueChange).value).toBe(3);
  });

  it("Home 有 min 时跳到 min 并阻止默认行为", () => {
    const { input, onValueChange } = setup({ value: 5, min: 2 });

    expect(fireEvent.keyDown(input(), { key: "Home" })).toBe(false);
    expect(lastChange(onValueChange).value).toBe(2);
  });

  it("Home 无 min 时不处理（不阻止默认行为，浏览器仍可移动光标）", () => {
    const { input, onValueChange } = setup({ value: 5 });

    expect(fireEvent.keyDown(input(), { key: "Home" })).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("End 有 max 时跳到 max 并阻止默认行为", () => {
    const { input, onValueChange } = setup({ value: 5, max: 9 });

    expect(fireEvent.keyDown(input(), { key: "End" })).toBe(false);
    expect(lastChange(onValueChange).value).toBe(9);
  });

  it("End 无 max 时不处理", () => {
    const { input, onValueChange } = setup({ value: 5 });

    expect(fireEvent.keyDown(input(), { key: "End" })).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Enter 提交当前文本并收敛", () => {
    const { input, type, onValueChange } = setup({ max: 10 });

    type("99");
    expect(fireEvent.keyDown(input(), { key: "Enter" })).toBe(false);

    expect(lastChange(onValueChange)).toMatchObject({ value: 10 });
    expect(input().value).toBe("10");
  });

  it("Enter 遇到无法解析的文本时不提交", () => {
    const { input, type, onValueChange } = setup({ value: 3 });

    type("abc");
    expect(fireEvent.keyDown(input(), { key: "Enter" })).toBe(false);

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Escape 还原为当前值的文本", () => {
    const { input, type } = setup({ value: 5 });

    type("123");
    expect(input().value).toBe("123");

    expect(fireEvent.keyDown(input(), { key: "Escape" })).toBe(false);
    expect(input().value).toBe("5");
  });

  it("其它按键不处理", () => {
    const { input, onValueChange } = setup({ value: 5 });

    expect(fireEvent.keyDown(input(), { key: "a" })).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disabled 时所有按键都不处理，也不阻止默认行为", () => {
    const { input, onValueChange } = setup({ value: 5, disabled: true });

    for (const key of ["ArrowUp", "ArrowDown", "PageUp", "Home", "Enter"]) {
      expect(fireEvent.keyDown(input(), { key }), key).toBe(true);
    }
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("readOnly 时所有按键都不处理", () => {
    const { input, onValueChange } = setup({ value: 5, readOnly: true });

    for (const key of ["ArrowUp", "PageDown", "End", "Escape"]) {
      expect(fireEvent.keyDown(input(), { key }), key).toBe(true);
    }
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("NumberInput - 受控模式", () => {
  it("受控时不写内部状态：文本等外部更新", () => {
    const onValueChange = vi.fn();
    const view = render(() => (
      <NumberInput value={1} onValueChange={onValueChange} />
    ));
    const input = view.container.querySelector<HTMLInputElement>(
      '[role="spinbutton"]',
    )!;

    fireEvent.click(view.getByRole("button", { name: "Increase" }));

    expect(onValueChange.mock.calls[0]?.[0]).toBe(2);
    // 受控：调用方不回写就不改文本（避免"显示的 2 其实没被接受"）
    expect(input.value).toBe("1");
    expect(input.getAttribute("aria-valuenow")).toBe("1");
  });

  it("受控：调用方回写后文本与 aria-valuenow 一起更新", () => {
    const [value, setValue] = createSignal<number | null>(1);
    const view = render(() => (
      <NumberInput value={value()} onValueChange={(next) => setValue(next)} />
    ));
    const input = () =>
      view.container.querySelector<HTMLInputElement>('[role="spinbutton"]')!;

    fireEvent.click(view.getByRole("button", { name: "Increase" }));

    expect(input().value).toBe("2");
    expect(input().getAttribute("aria-valuenow")).toBe("2");
  });

  it("外部值变化时同步文本", () => {
    const [value, setValue] = createSignal<number | null>(1);
    const view = render(() => <NumberInput value={value()} />);
    const input = () =>
      view.container.querySelector<HTMLInputElement>('[role="spinbutton"]')!;

    expect(input().value).toBe("1");

    setValue(8);
    expect(input().value).toBe("8");

    setValue(null);
    expect(input().value).toBe("");
  });

  it("聚焦期间外部值变化不会覆盖用户正在敲的内容", () => {
    const [value, setValue] = createSignal<number | null>(1);
    const view = render(() => <NumberInput value={value()} />);
    const input = view.container.querySelector<HTMLInputElement>(
      '[role="spinbutton"]',
    )!;

    fireEvent.focus(input);
    input.value = "12";
    fireEvent.input(input);

    setValue(99);
    expect(input.value).toBe("12");
  });

  it("非受控：外部不可见的状态只在内部提交，且初次聚焦前的内部变更会回显格式化文本", () => {
    const { input, onValueChange } = setup({ defaultValue: 2 });

    // 未经聚焦直接派发 input（例如程序化 input）：effect 会把文本收敛成格式化结果
    input().value = "3.";
    fireEvent.input(input());

    expect(lastChange(onValueChange).value).toBe(3);
    expect(input().value).toBe("3");
  });
});

describe("NumberInput - 事件详情", () => {
  it("提供 reason / cancel / allowPropagation 与 isCanceled 状态", () => {
    const { button, onValueChange } = setup({ value: 1 });

    fireEvent.click(button("Increase"));

    const { details } = lastChange(onValueChange);
    expect(typeof details.cancel).toBe("function");
    expect(typeof details.allowPropagation).toBe("function");
    expect(details.isCanceled).toBe(false);

    details.allowPropagation();
    expect(details.isPropagationAllowed).toBe(true);
  });

  it("cancel() 会阻止提交（非受控下内部值不变）", () => {
    const onValueChange = vi.fn(
      (_value: number | null, details: NumberInputChangeEventDetails) => {
        details.cancel();
      },
    );
    const { button, input } = setup({ value: 1, onValueChange });

    fireEvent.click(button("Increase"));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    // 受控 + 取消 → 面板值不变
    expect(input().getAttribute("aria-valuenow")).toBe("1");
  });

  it("非受控下 cancel() 不写入内部值", () => {
    const onValueChange = vi.fn(
      (_value: number | null, details: NumberInputChangeEventDetails) => {
        details.cancel();
      },
    );
    const { button, input } = setup({ onValueChange });

    fireEvent.click(button("Increase"));

    expect(input().hasAttribute("aria-valuenow")).toBe(false);
  });

  it("不带事件详情的调用方也能工作（onValueChange 可省略）", () => {
    const { button, input } = setup({ defaultValue: 1 });

    fireEvent.click(button("Increase"));

    expect(input().value).toBe("2");
  });
});
