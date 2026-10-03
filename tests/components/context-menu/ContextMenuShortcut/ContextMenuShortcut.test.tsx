import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ContextMenuShortcut } from "~/components/context-menu/ContextMenuShortcut/ContextMenuShortcut";
import { slot } from "../test-utils";

describe("ContextMenuShortcut", () => {
  it("渲染快捷键提示文本与 data-slot", () => {
    render(() => <ContextMenuShortcut>⌘K</ContextMenuShortcut>);

    const shortcut = slot("context-menu-shortcut")!;
    expect(shortcut.tagName).toBe("SPAN");
    expect(shortcut).toHaveAttribute("data-slot", "context-menu-shortcut");
    expect(shortcut).toHaveTextContent("⌘K");
  });

  it("class 合并、原生属性透传", () => {
    render(() => (
      <ContextMenuShortcut class="my-shortcut" data-x="1">
        ⌘K
      </ContextMenuShortcut>
    ));

    const shortcut = slot("context-menu-shortcut")!;
    expect(shortcut.className).toContain("my-shortcut");
    expect(shortcut).toHaveAttribute("data-x", "1");
  });
});
