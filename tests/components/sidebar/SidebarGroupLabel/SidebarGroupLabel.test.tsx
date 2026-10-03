import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarGroupLabel } from "~/components/sidebar/SidebarGroupLabel/SidebarGroupLabel";

function label(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-group-label"]',
  ) as HTMLElement;
}

describe("SidebarGroupLabel", () => {
  it("默认渲染为 div 并带 data-sidebar", () => {
    render(() => <SidebarGroupLabel>分组标题</SidebarGroupLabel>);

    expect(label().tagName).toBe("DIV");
    expect(label()).toHaveAttribute("data-sidebar", "group-label");
    expect(label()).toHaveTextContent("分组标题");
  });

  it("class 与 classList 参与合并", () => {
    render(() => (
      <SidebarGroupLabel
        class="text-sm"
        classList={{ "keep-me": true, "drop-me": false }}
      />
    ));

    expect(label()).toHaveClass(
      "flex",
      "h-8",
      "shrink-0",
      "items-center",
      "text-sm",
    );
    expect(label()).toHaveClass("keep-me");
    expect(label()).not.toHaveClass("drop-me");
  });

  it("component 可切换为自定义标签", () => {
    render(() => <SidebarGroupLabel component="span">标题</SidebarGroupLabel>);

    expect(label().tagName).toBe("SPAN");
  });

  it("透传未消费的原生属性", () => {
    render(() => <SidebarGroupLabel id="label-id" aria-label="分组" />);

    expect(label()).toHaveAttribute("id", "label-id");
    expect(label()).toHaveAttribute("aria-label", "分组");
  });
});
