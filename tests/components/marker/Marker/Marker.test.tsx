import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Marker } from "~/components/marker/Marker/Marker";

function markerOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="marker"]') as HTMLElement;
}

/** Marker：会话中的行内标记，variant 控制分隔线 / 下边框，默认多态渲染 div。 */
describe("Marker - 默认值与变体", () => {
  it("渲染 div，带 data-slot，默认 variant=default", () => {
    const { container } = render(() => <Marker />);
    const element = markerOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("marker");
    expect(element.getAttribute("data-variant")).toBe("default");
    expect(element.classList.contains("group/marker")).toBe(true);
  });

  it("variant 写入 data-variant，separator 用两侧伪元素画分隔线", () => {
    const plain = markerOf(render(() => <Marker />).container);
    const separator = markerOf(
      render(() => <Marker variant="separator" />).container,
    );

    expect(separator.getAttribute("data-variant")).toBe("separator");
    expect(separator.classList.contains("before:flex-1")).toBe(true);
    expect(separator.classList.contains("after:flex-1")).toBe(true);
    expect(plain.classList.contains("before:flex-1")).toBe(false);
  });

  it("variant=border 时 data-variant 跟着切换并带上边框类名", () => {
    const border = markerOf(
      render(() => <Marker variant="border" />).container,
    );

    expect(border.getAttribute("data-variant")).toBe("border");
    expect(border.classList.contains("border-b")).toBe(true);
    expect(
      markerOf(
        render(() => <Marker variant="default" />).container,
      ).classList.contains("border-b"),
    ).toBe(false);
  });
});

describe("Marker - 多态", () => {
  it("component=a 渲染链接，点击回调可触发且 ref 指向链接元素", async () => {
    const user = userEvent.setup();
    // SPA 里链接点击通常由用户回调 preventDefault 接管，避免 jsdom 真的导航
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    let element: HTMLElement | undefined;
    const { getByRole } = render(() => (
      <Marker
        component="a"
        href="/plans/9"
        aria-label="查看计划 9"
        onClick={onClick}
        ref={(node: HTMLElement) => {
          element = node;
        }}
      >
        计划 9 已生成
      </Marker>
    ));
    const link = getByRole("link", { name: "查看计划 9" });

    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/plans/9");
    expect(link.getAttribute("data-slot")).toBe("marker");
    expect(link.getAttribute("data-variant")).toBe("default");
    expect(element).toBe(link);

    await user.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("component=button 渲染按钮并保留 variant", () => {
    const { getByRole } = render(() => (
      <Marker component="button" type="button" variant="border">
        重新生成
      </Marker>
    ));
    const button = getByRole("button", { name: "重新生成" });

    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("data-variant")).toBe("border");
  });
});

describe("Marker - 透传", () => {
  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <Marker class="my-marker" classList={{ "is-streaming": true }} />
    ));
    const element = markerOf(container);

    expect(element.classList.contains("my-marker")).toBe(true);
    expect(element.classList.contains("is-streaming")).toBe(true);
    expect(element.classList.contains("min-h-4")).toBe(true);
    expect(element.classList.contains("text-muted-foreground")).toBe(true);
  });

  it("透传其余属性、role=status 与 children", () => {
    const { container, getByRole } = render(() => (
      <Marker role="status" aria-live="polite" data-marker-id="mk-1">
        正在压缩会话
      </Marker>
    ));
    const element = getByRole("status");

    expect(element).toBe(markerOf(container));
    expect(element.getAttribute("aria-live")).toBe("polite");
    expect(element.getAttribute("data-marker-id")).toBe("mk-1");
    expect(element.textContent).toBe("正在压缩会话");
  });
});
