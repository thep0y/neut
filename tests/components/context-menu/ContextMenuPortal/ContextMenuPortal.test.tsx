import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ContextMenuPortal } from "~/components/context-menu/ContextMenuPortal/ContextMenuPortal";

describe("ContextMenuPortal", () => {
  it("默认把子节点挂到 body", () => {
    const { container } = render(() => (
      <ContextMenuPortal>
        <span data-x="portaled">浮层内容</span>
      </ContextMenuPortal>
    ));

    const portaled = document.querySelector('[data-x="portaled"]')!;
    expect(portaled).toBeInTheDocument();
    expect(portaled).toHaveTextContent("浮层内容");
    expect(container.contains(portaled)).toBe(false);
  });

  it("container 指定挂载目标", () => {
    const target = document.createElement("section");
    document.body.appendChild(target);

    render(() => (
      <ContextMenuPortal container={target}>
        <span data-x="portaled">浮层内容</span>
      </ContextMenuPortal>
    ));

    const portaled = document.querySelector('[data-x="portaled"]')!;
    expect(target.contains(portaled)).toBe(true);
  });
});
