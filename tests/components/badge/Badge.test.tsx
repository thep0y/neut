import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Badge } from "~/components/badge/Badge";

/** Badge：状态标签，variant 决定配色。 */
function badgeOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="badge"]') as HTMLElement;
}

describe("Badge", () => {
  it("渲染 span 并带 data-slot（回归：此前没有 data-slot）", () => {
    const { container } = render(() => <Badge>新</Badge>);
    const badge = badgeOf(container);

    expect(badge.tagName).toBe("SPAN");
    expect(badge.textContent).toBe("新");
  });

  it("不同 variant 渲染出不同类名", () => {
    const outline = badgeOf(
      render(() => <Badge variant="outline" />).container,
    );
    const plain = badgeOf(render(() => <Badge />).container);

    expect(outline.className).not.toBe(plain.className);
    expect(outline.className).toContain("border");
  });

  it("合并 class 与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Badge class="my-badge" classList={{ "is-new": true }} id="b" />
    ));
    const badge = badgeOf(container);

    expect(badge.className).toContain("my-badge");
    expect(badge.className).toContain("is-new");
    expect(badge.id).toBe("b");
  });
});
