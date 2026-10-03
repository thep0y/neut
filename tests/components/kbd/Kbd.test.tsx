import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Kbd, KbdGroup } from "~/components/kbd/Kbd";

/** Kbd / KbdGroup：键位提示，`<kbd>` 语义 + data-slot。 */
describe("Kbd", () => {
  it("渲染 kbd 并带 data-slot", () => {
    const { container } = render(() => <Kbd>Ctrl</Kbd>);
    const kbd = container.querySelector('[data-slot="kbd"]') as HTMLElement;

    expect(kbd.tagName).toBe("KBD");
    expect(kbd.textContent).toBe("Ctrl");
  });

  it("合并 class 与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Kbd class="my-kbd" classList={{ "is-kbd": true }} id="k">
        K
      </Kbd>
    ));
    const kbd = container.querySelector('[data-slot="kbd"]') as HTMLElement;

    expect(kbd.className).toContain("my-kbd");
    expect(kbd.className).toContain("is-kbd");
    expect(kbd.id).toBe("k");
  });
});

describe("KbdGroup", () => {
  it("渲染 kbd 容器并带 data-slot", () => {
    const { container } = render(() => (
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    ));
    const group = container.querySelector(
      '[data-slot="kbd-group"]',
    ) as HTMLElement;

    expect(group.tagName).toBe("KBD");
    expect(group.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
  });

  it("合并 class 与 classList（回归：曾漏传 classList）", () => {
    const { container } = render(() => (
      <KbdGroup class="my-group" classList={{ "is-group": true }} />
    ));
    const group = container.querySelector(
      '[data-slot="kbd-group"]',
    ) as HTMLElement;

    expect(group.className).toContain("my-group");
    expect(group.className).toContain("is-group");
  });

  it("透传其余属性", () => {
    const { container } = render(() => <KbdGroup aria-label="快捷键" />);

    expect(
      container
        .querySelector('[data-slot="kbd-group"]')
        ?.getAttribute("aria-label"),
    ).toBe("快捷键");
  });
});
