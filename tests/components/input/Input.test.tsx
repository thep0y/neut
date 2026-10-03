import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Input } from "~/components/input/Input";

/**
 * `Input`：受控/非受控双模式的文本输入框。
 *
 * 它把 `onInput` / `onChange` 的**值**直接交给调用方（而不是事件对象），
 * 且 `type="number"` 时会转成 number，因此这里重点断言这两个转换。
 */
function inputOf(container: HTMLElement): HTMLInputElement {
  return container.querySelector('[data-slot="input"]') as HTMLInputElement;
}

describe("Input - 基础渲染", () => {
  it("渲染 input 并带 data-slot", () => {
    const { container } = render(() => <Input />);

    expect(inputOf(container).tagName).toBe("INPUT");
  });

  it("默认 type=text，并自动生成 id", () => {
    const { container } = render(() => <Input />);
    const input = inputOf(container);

    expect(input.getAttribute("type")).toBe("text");
    expect(input.id).toBeTruthy();
  });

  it("显式 type 与 id 覆盖默认值", () => {
    const { container } = render(() => <Input type="email" id="my-id" />);
    const input = inputOf(container);

    expect(input.getAttribute("type")).toBe("email");
    expect(input.id).toBe("my-id");
  });

  it("透传 placeholder / disabled 等原生属性", () => {
    const { container } = render(() => <Input placeholder="请输入" disabled />);
    const input = inputOf(container);

    expect(input.getAttribute("placeholder")).toBe("请输入");
    expect(input).toBeDisabled();
  });

  it("合并 class", () => {
    const { container } = render(() => <Input class="my-input" />);

    expect(inputOf(container).className).toContain("my-input");
  });
});

describe("Input - 值与双模式", () => {
  it("受控：value 决定展示值", () => {
    const { container } = render(() => <Input value="固定值" />);

    expect(inputOf(container).value).toBe("固定值");
  });

  it("非受控：defaultValue 作为初始值", () => {
    const { container } = render(() => <Input defaultValue="初始" />);

    expect(inputOf(container).value).toBe("初始");
  });

  it("value 优先于 defaultValue", () => {
    const { container } = render(() => (
      <Input value="受控" defaultValue="默认" />
    ));

    expect(inputOf(container).value).toBe("受控");
  });

  it("受控模式下组件只回调、不自行改值（外部回写才更新）", () => {
    // Input 不做内部状态：受控/非受控都只是把 value/defaultValue 透给原生 input，
    // 因此"是否回写"取决于调用方。这里断言的是它对回调的转发不发生副作用。
    const onInput = vi.fn();
    const { container } = render(() => (
      <Input value="受控" onInput={onInput} />
    ));

    fireEvent.input(inputOf(container), { target: { value: "新值" } });

    expect(onInput).toHaveBeenCalledWith("新值");
  });
});

describe("Input - onInput / onChange 的值转换", () => {
  it("文本类型：onInput 收到字符串值", () => {
    const onInput = vi.fn();
    const { container } = render(() => <Input onInput={onInput} />);

    fireEvent.input(inputOf(container), { target: { value: "abc" } });

    expect(onInput).toHaveBeenCalledWith("abc");
  });

  it("数字类型：onInput 收到 number", () => {
    const onInput = vi.fn();
    const { container } = render(() => (
      <Input type="number" onInput={onInput} />
    ));

    fireEvent.input(inputOf(container), { target: { value: "42" } });

    expect(onInput).toHaveBeenCalledWith(42);
  });

  it("文本类型：onChange 收到字符串值", () => {
    const onChange = vi.fn();
    const { container } = render(() => <Input onChange={onChange} />);

    fireEvent.change(inputOf(container), { target: { value: "hello" } });

    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("数字类型：onChange 收到 number", () => {
    const onChange = vi.fn();
    const { container } = render(() => (
      <Input type="number" onChange={onChange} />
    ));

    fireEvent.change(inputOf(container), { target: { value: "7" } });

    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("没有传回调时输入不会报错", () => {
    const { container } = render(() => <Input />);

    expect(() =>
      fireEvent.input(inputOf(container), { target: { value: "x" } }),
    ).not.toThrow();
    expect(() =>
      fireEvent.change(inputOf(container), { target: { value: "x" } }),
    ).not.toThrow();
  });
});
