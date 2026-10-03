import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AvatarGroupCount } from "~/components/avatar/AvatarGroupCount/AvatarGroupCount";

/** AvatarGroupCount：`data-slot="avatar-group-count"` 的 div 部件。 */
describe("AvatarGroupCount", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => <AvatarGroupCount />);
    const element = container.querySelector('[data-slot="avatar-group-count"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <AvatarGroupCount class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="avatar-group-count"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <AvatarGroupCount id="x" aria-label="标签" />
    ));
    const element = container.querySelector('[data-slot="avatar-group-count"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
  });
});
