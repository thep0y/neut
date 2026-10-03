import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AvatarGroup } from "~/components/avatar/AvatarGroup/AvatarGroup";

/** AvatarGroup：`data-slot="avatar-group"` 的 div 部件。 */
describe("AvatarGroup", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => <AvatarGroup />);
    const element = container.querySelector('[data-slot="avatar-group"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <AvatarGroup class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="avatar-group"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <AvatarGroup id="x" aria-label="标签" />
    ));
    const element = container.querySelector('[data-slot="avatar-group"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
  });
});
