import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { InputGroupInput } from "~/components/input-group/InputGroupInput/InputGroupInput";

/** InputGroupInput：InputGroup 内的输入框，去掉圆角/边框，`data-slot=input-group-control`。 */
describe("InputGroupInput", () => {
  it("渲染带 data-slot=input-group-control 的 input", () => {
    const { container } = render(() => <InputGroupInput />);
    const input = container.querySelector("input");

    expect(input?.getAttribute("data-slot")).toBe("input-group-control");
    expect(input?.type).toBe("text");
  });

  it("合并基础类名与外部 class / classList", () => {
    const { container } = render(() => (
      <InputGroupInput class="my-input" classList={{ "is-bad": true }} />
    ));
    const input = container.querySelector("input");

    expect(input?.className).toContain("rounded-none");
    expect(input?.className).toContain("my-input");
    expect(input?.className).toContain("is-bad");
  });

  it("透传其余属性（type / placeholder / disabled / aria-invalid）", () => {
    const { container } = render(() => (
      <InputGroupInput
        type="email"
        placeholder="邮箱"
        disabled
        aria-invalid="true"
      />
    ));
    const input = container.querySelector("input");

    expect(input?.type).toBe("email");
    expect(input?.placeholder).toBe("邮箱");
    expect(input?.disabled).toBe(true);
    expect(input?.getAttribute("aria-invalid")).toBe("true");
  });
});
