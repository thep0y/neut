import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemSeparator } from "~/components/item/ItemSeparator/ItemSeparator";

/** ItemSeparator：复用 Separator 的水平分隔线，额外带 item 的 slot 标记。 */
describe("ItemSeparator", () => {
  it("渲染带 data-slot=item-separator 的水平分隔线", () => {
    const { container } = render(() => <ItemSeparator />);
    const element = container.querySelector('[data-slot="item-separator"]');

    expect(element).not.toBeNull();
    expect(element?.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("合并 class / classList 并透传其余属性", () => {
    const { container } = render(() => (
      <ItemSeparator class="my-sep" classList={{ "is-thin": true }} />
    ));
    const element = container.querySelector('[data-slot="item-separator"]')!;

    expect(element.className).toContain("my-sep");
    expect(element.className).toContain("is-thin");
  });
});
