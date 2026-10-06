import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { InputGroupAddon } from "~/components/input-group/InputGroupAddon/InputGroupAddon";

/**
 * InputGroupAddon：输入框前后缀容器。点击它会把焦点交给同组输入框
 * （但点在内部的按钮上时不抢焦点，避免"点按钮却聚焦输入框"）。
 */
function renderAddon(
  align?: "inline-start" | "inline-end" | "block-start" | "block-end",
) {
  return render(() => (
    <div>
      <input id="target" />
      <InputGroupAddon align={align}>
        <button type="button" id="inner">
          内部按钮
        </button>
      </InputGroupAddon>
    </div>
  ));
}

describe("InputGroupAddon", () => {
  it("默认 inline-start，可用 align 覆盖并映射成 data-align", () => {
    const start = render(() => <InputGroupAddon />);
    expect(
      start.container
        .querySelector('[data-slot="input-group-addon"]')
        ?.getAttribute("data-align"),
    ).toBe("inline-start");

    for (const align of ["inline-end", "block-start", "block-end"] as const) {
      const view = renderAddon(align);
      expect(
        view.container
          .querySelector('[data-slot="input-group-addon"]')
          ?.getAttribute("data-align"),
        align,
      ).toBe(align);
    }
  });

  it("渲染 role=group 与外部 class / classList", () => {
    const { container } = render(() => (
      <InputGroupAddon class="my-addon" classList={{ "is-block": true }} />
    ));
    const addon = container.querySelector('[data-slot="input-group-addon"]');

    expect(addon?.getAttribute("role")).toBe("group");
    expect(addon?.className).toContain("my-addon");
    expect(addon?.className).toContain("is-block");
  });

  it("点击空白处会把焦点交给同组输入框", () => {
    const { container } = renderAddon();
    const addon = container.querySelector<HTMLElement>(
      '[data-slot="input-group-addon"]',
    )!;

    fireEvent.click(addon);

    expect(document.activeElement?.id).toBe("target");
  });

  it("点击内部按钮时不抢焦点", () => {
    const { container } = renderAddon();
    const inner = container.querySelector<HTMLButtonElement>("#inner")!;

    inner.focus();
    fireEvent.click(inner);

    expect(document.activeElement?.id).toBe("inner");
  });

  it("同组没有输入框时点击不报错", () => {
    const { container } = render(() => (
      <div>
        <InputGroupAddon>只有后缀</InputGroupAddon>
      </div>
    ));
    const addon = container.querySelector<HTMLElement>(
      '[data-slot="input-group-addon"]',
    )!;

    expect(() => fireEvent.click(addon)).not.toThrow();
  });
});
