import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Bubble } from "~/components/bubble/Bubble/Bubble";

function bubbleOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="bubble"]') as HTMLElement;
}

/** Bubble：对话气泡根容器，data-variant / data-align 驱动内部样式。 */
describe("Bubble - 默认值与变体", () => {
  it("渲染 div 并带 data-slot，默认 variant=default、align=start", () => {
    const { container } = render(() => <Bubble />);
    const element = bubbleOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("bubble");
    expect(element.getAttribute("data-variant")).toBe("default");
    expect(element.getAttribute("data-align")).toBe("start");
  });

  it("variant 写入 data-variant，并换成对应变体的类名", () => {
    const plain = bubbleOf(render(() => <Bubble />).container);
    const ghost = bubbleOf(render(() => <Bubble variant="ghost" />).container);

    expect(ghost.getAttribute("data-variant")).toBe("ghost");
    expect(ghost.classList.contains("border-none")).toBe(true);
    expect(plain.classList.contains("border-none")).toBe(false);
    expect(
      plain.classList.contains("*:data-[slot=bubble-content]:bg-primary"),
    ).toBe(true);
    expect(
      ghost.classList.contains("*:data-[slot=bubble-content]:bg-primary"),
    ).toBe(false);
  });

  it("align=end 时 data-align 切换到 end", () => {
    const { container } = render(() => <Bubble align="end" />);
    const element = bubbleOf(container);

    expect(element.getAttribute("data-align")).toBe("end");
    // 默认值只在一侧生效：显式 align=start 与不传时一致
    const start = bubbleOf(render(() => <Bubble align="start" />).container);
    expect(start.getAttribute("data-align")).toBe("start");
  });
});

describe("Bubble - 透传", () => {
  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <Bubble class="my-bubble" classList={{ "is-top": true }} />
    ));
    const element = bubbleOf(container);

    expect(element.classList.contains("my-bubble")).toBe(true);
    expect(element.classList.contains("is-top")).toBe(true);
    expect(element.classList.contains("group/bubble")).toBe(true);
    expect(element.classList.contains("flex-col")).toBe(true);
  });

  it("透传其余属性、事件与 children", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(() => (
      <Bubble
        id="b1"
        data-message-id="m-1"
        aria-label="我的消息"
        onClick={onClick}
      >
        <span data-testid="child">你好</span>
      </Bubble>
    ));
    const element = bubbleOf(container);

    expect(element.id).toBe("b1");
    expect(element.getAttribute("data-message-id")).toBe("m-1");
    expect(element.getAttribute("aria-label")).toBe("我的消息");
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(
      "你好",
    );

    await user.click(element);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
