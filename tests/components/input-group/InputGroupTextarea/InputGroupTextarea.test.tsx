import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { InputGroupTextarea } from "~/components/input-group/InputGroupTextarea/InputGroupTextarea";

/** InputGroupTextarea：InputGroup 内的多行输入，复用 Textarea 但去掉边框/圆角。 */
describe("InputGroupTextarea", () => {
  it("渲染 textarea，带 data-slot=input-group-control 与合并类名", () => {
    const { container } = render(() => (
      <InputGroupTextarea class="my-area" classList={{ tall: true }} />
    ));
    const textarea = container.querySelector("textarea");

    expect(textarea?.getAttribute("data-slot")).toBe("input-group-control");
    expect(textarea?.className).toContain("resize-none");
    expect(textarea?.className).toContain("my-area");
    expect(textarea?.className).toContain("tall");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <InputGroupTextarea placeholder="备注" rows={3} disabled />
    ));
    const textarea = container.querySelector("textarea");

    expect(textarea?.placeholder).toBe("备注");
    expect(textarea?.rows).toBe(3);
    expect(textarea?.disabled).toBe(true);
  });
});
