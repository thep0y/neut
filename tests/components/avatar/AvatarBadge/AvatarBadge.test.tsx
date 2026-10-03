import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AvatarBadge } from "~/components/avatar/AvatarBadge/AvatarBadge";

/** AvatarBadge：`data-slot="avatar-badge"` 的 span 部件。 */
describe("AvatarBadge", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => <AvatarBadge />);
    const element = container.querySelector('[data-slot="avatar-badge"]');

    expect(element?.tagName).toBe("SPAN");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <AvatarBadge class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="avatar-badge"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <AvatarBadge id="x" aria-label="标签" />
    ));
    const element = container.querySelector('[data-slot="avatar-badge"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
  });
});
