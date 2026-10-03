import { render } from "@solidjs/testing-library";
import { createSignal, Show } from "solid-js";
import { describe, expect, it } from "vitest";
import { ContextMenuGroup } from "~/components/context-menu/ContextMenuGroup/ContextMenuGroup";
import { ContextMenuLabel } from "~/components/context-menu/ContextMenuLabel/ContextMenuLabel";
import { slot } from "../test-utils";

describe("ContextMenuLabel", () => {
  it("渲染带 id 的标题，透传 class / inset / 原生属性", () => {
    render(() => (
      <ContextMenuLabel class="my-label" inset data-x="1">
        分组标题
      </ContextMenuLabel>
    ));

    const label = slot("context-menu-label")!;
    expect(label.id).toMatch(/^context-menu-label-/);
    expect(label).toHaveAttribute("data-slot", "context-menu-label");
    expect(label).toHaveAttribute("data-inset", "");
    expect(label).toHaveAttribute("data-x", "1");
    expect(label.className).toContain("my-label");
    expect(label).toHaveTextContent("分组标题");
  });

  it("不套 Group 也能独立渲染（可选关联）", () => {
    render(() => <ContextMenuLabel>独立标题</ContextMenuLabel>);

    expect(slot("context-menu-label")).toHaveTextContent("独立标题");
  });

  it("同一组内后挂载的 Label 接管 aria-labelledby", () => {
    render(() => (
      <ContextMenuGroup>
        <ContextMenuLabel>第一个</ContextMenuLabel>
        <ContextMenuLabel>第二个</ContextMenuLabel>
      </ContextMenuGroup>
    ));

    const labels = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-slot="context-menu-label"]',
      ),
    );
    expect(slot("context-menu-group")).toHaveAttribute(
      "aria-labelledby",
      labels[1]!.id,
    );
  });
});

describe("ContextMenuLabel - 卸载", () => {
  it("组内 Label 卸载后 Group 的 aria-labelledby 被清理", () => {
    const [show, setShow] = createSignal(true);
    render(() => (
      <ContextMenuGroup>
        <Show when={show()}>
          <ContextMenuLabel>标题</ContextMenuLabel>
        </Show>
      </ContextMenuGroup>
    ));
    expect(slot("context-menu-group")).toHaveAttribute("aria-labelledby");

    setShow(false);

    expect(slot("context-menu-label")).toBeNull();
    expect(slot("context-menu-group")).not.toHaveAttribute("aria-labelledby");
  });

  it("独立 Label（无 Group）卸载时可选链安全，节点被移除", () => {
    const { unmount } = render(() => <ContextMenuLabel>独立</ContextMenuLabel>);

    unmount();

    expect(slot("context-menu-label")).toBeNull();
  });
});
