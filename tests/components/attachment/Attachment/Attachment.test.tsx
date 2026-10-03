import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Attachment } from "~/components/attachment/Attachment/Attachment";
import type { AttachmentState } from "~/components/attachment/Attachment/Attachment.types";

function attachmentOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="attachment"]') as HTMLElement;
}

/**
 * Attachment 根容器：把 state / size / orientation 写到 data-* 上，
 * 子部件全靠 `group-data-[...]/attachment:` 选择器响应，因此这三个属性
 * 是使用者唯一能观察到的状态出口。
 */
describe("Attachment - 默认值", () => {
  it("渲染 div，默认 state=done、size=default、orientation=horizontal", () => {
    const { container } = render(() => <Attachment />);
    const element = attachmentOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-state")).toBe("done");
    expect(element.getAttribute("data-size")).toBe("default");
    expect(element.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("根上带 group/attachment，子部件的 group-data-* 样式才有作用域", () => {
    const { container } = render(() => <Attachment />);

    expect(attachmentOf(container).classList.contains("group/attachment")).toBe(
      true,
    );
  });

  it("默认是横向行布局（items-center），纵向时不生效", () => {
    const horizontal = render(() => <Attachment />);
    expect(
      attachmentOf(horizontal.container).classList.contains("items-center"),
    ).toBe(true);

    const vertical = render(() => <Attachment orientation="vertical" />);
    expect(
      attachmentOf(vertical.container).classList.contains("items-center"),
    ).toBe(false);
  });
});

describe("Attachment - state", () => {
  const states: AttachmentState[] = [
    "idle",
    "uploading",
    "processing",
    "error",
    "done",
  ];

  it.each(states)("state=%s 原样写到 data-state", (state) => {
    const { container } = render(() => <Attachment state={state} />);

    expect(attachmentOf(container).getAttribute("data-state")).toBe(state);
  });

  it("state 由外部回写时 data-state 跟随变化（error → done）", () => {
    const [state, setState] = createSignal<AttachmentState>("error");
    const { container } = render(() => <Attachment state={state()} />);

    expect(attachmentOf(container).getAttribute("data-state")).toBe("error");

    setState("done");
    expect(attachmentOf(container).getAttribute("data-state")).toBe("done");

    setState("uploading");
    expect(attachmentOf(container).getAttribute("data-state")).toBe(
      "uploading",
    );
  });
});

describe("Attachment - size 与 orientation", () => {
  it("size 写到 data-size，并切换尺寸相关类", () => {
    const xs = render(() => <Attachment size="xs" />);
    expect(attachmentOf(xs.container).getAttribute("data-size")).toBe("xs");
    expect(attachmentOf(xs.container).classList.contains("rounded-lg")).toBe(
      true,
    );

    const sm = render(() => <Attachment size="sm" />);
    expect(attachmentOf(sm.container).getAttribute("data-size")).toBe("sm");
    expect(attachmentOf(sm.container).classList.contains("rounded-xl")).toBe(
      true,
    );
  });

  it("orientation=vertical 写到 data-orientation 并改为纵向排列", () => {
    const { container } = render(() => <Attachment orientation="vertical" />);
    const element = attachmentOf(container);

    expect(element.getAttribute("data-orientation")).toBe("vertical");
    expect(element.classList.contains("flex-col")).toBe(true);
  });
});

describe("Attachment - 类名与属性透传", () => {
  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <Attachment class="my-attachment" classList={{ "is-error": true }} />
    ));
    const element = attachmentOf(container);

    expect(element.classList.contains("my-attachment")).toBe(true);
    expect(element.classList.contains("is-error")).toBe(true);
  });

  it("透传其余属性、事件与 children", () => {
    const onClick = vi.fn();
    const { container } = render(() => (
      <Attachment id="a1" aria-label="附件" onClick={onClick}>
        <span data-testid="child">内容</span>
      </Attachment>
    ));
    const element = attachmentOf(container);

    expect(element.id).toBe("a1");
    expect(element.getAttribute("aria-label")).toBe("附件");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();

    element.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
