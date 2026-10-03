import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { InputGroupText } from "~/components/input-group/InputGroupText/InputGroupText";

/** InputGroupText：纯文本说明（如 "https://"），不可交互。 */
describe("InputGroupText", () => {
  it("渲染 span 并合并类名", () => {
    const { container } = render(() => (
      <InputGroupText class="my-text" classList={{ muted: true }}>
        文本
      </InputGroupText>
    ));
    const span = container.querySelector("span");

    expect(span?.tagName).toBe("SPAN");
    expect(span?.textContent).toBe("文本");
    expect(span?.className).toContain("text-muted-foreground");
    expect(span?.className).toContain("my-text");
    expect(span?.className).toContain("muted");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <InputGroupText aria-hidden="true" data-testid="t" />
    ));
    const span = container.querySelector("span");

    expect(span?.getAttribute("aria-hidden")).toBe("true");
  });
});
