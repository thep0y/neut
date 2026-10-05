import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Popover } from "~/components/popover/Popover/Popover";
import { PopoverContent } from "~/components/popover/PopoverContent/PopoverContent";
import { PopoverTrigger } from "~/components/popover/PopoverTrigger/PopoverTrigger";
import { PopoverDescription } from "~/components/popover/PopoverDescription/PopoverDescription";
import { PopoverHeader } from "~/components/popover/PopoverHeader/PopoverHeader";
import { PopoverTitle } from "~/components/popover/PopoverTitle/PopoverTitle";

/**
 * Popover 集成测试。
 *
 * Root 只管状态（受控/非受控、disabled、modal、lockScroll），
 * Trigger 用 addEventListener 挂事件（不占用 onClick prop），
 * Content 负责定位 + 点击外部/Escape 关闭。
 *
 * jsdom 不做布局，`getBoundingClientRect` 全为 0，定位本身已被 positioner
 * 的单测覆盖；这里聚焦状态流转、ARIA 与事件语义。
 */
function renderPopover(
  props: {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    modal?: boolean;
    lockScroll?: boolean;
    triggerProps?: Record<string, unknown>;
  } = {},
) {
  return render(() => (
    <Popover
      defaultOpen={props.defaultOpen}
      open={props.open}
      onOpenChange={props.onOpenChange}
      disabled={props.disabled}
      modal={props.modal}
      lockScroll={props.lockScroll}
    >
      <PopoverTrigger {...props.triggerProps}>打开</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>标题</PopoverTitle>
          <PopoverDescription>描述</PopoverDescription>
        </PopoverHeader>
        <p>内容</p>
      </PopoverContent>
    </Popover>
  ));
}

function trigger(): HTMLElement {
  return document.querySelector('[data-slot="popover-trigger"]') as HTMLElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[data-slot="popover-content"]');
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Popover - 基础状态", () => {
  it("默认关闭：不渲染 content", () => {
    renderPopover();

    expect(content()).toBeNull();
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("defaultOpen 时初始打开", () => {
    renderPopover({ defaultOpen: true });

    expect(content()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("data-state", "open");
  });

  it("点击 trigger 打开", async () => {
    const onOpenChange = vi.fn();
    renderPopover({ onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("再次点击 trigger 关闭（toggle）", async () => {
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disabled 时点击不打开", async () => {
    const onOpenChange = vi.fn();
    renderPopover({ disabled: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(content()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disabled 时 trigger 带原生 disabled 属性", () => {
    renderPopover({ disabled: true });

    expect(trigger()).toBeDisabled();
  });
});

describe("Popover - ARIA", () => {
  it("trigger 有 aria-haspopup=dialog", () => {
    renderPopover();

    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("关闭时 aria-expanded=false 且无 aria-controls", () => {
    renderPopover();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).not.toHaveAttribute("aria-controls");
  });

  it("打开时 aria-expanded=true 且 aria-controls 指向 content", () => {
    renderPopover({ defaultOpen: true });

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", content()!.id);
  });

  it("content 是 role=dialog", () => {
    renderPopover({ defaultOpen: true });

    expect(content()).toHaveAttribute("role", "dialog");
  });

  it("content 带 data-side / data-align（data-side 反映最终 placement）", () => {
    renderPopover({ defaultOpen: true });

    // jsdom 视口尺寸为 0，flip middleware 会把 bottom 翻成 top；
    // 因此这里断言的是"data-side 始终是合法的物理方向"这一契约，
    // 而不是"等于请求的 side"（后者需要真实布局，见 TESTING.md §8）。
    expect(["top", "right", "bottom", "left"]).toContain(
      content()!.getAttribute("data-side"),
    );
    expect(content()).toHaveAttribute("data-align", "center");
  });

  it("align=start 时 data-align 为 start", () => {
    render(() => (
      <Popover defaultOpen>
        <PopoverTrigger>打开</PopoverTrigger>
        <PopoverContent align="start">内容</PopoverContent>
      </Popover>
    ));

    expect(content()).toHaveAttribute("data-align", "start");
  });

  it("外层定位容器带 data-placement", () => {
    renderPopover({ defaultOpen: true });

    const outer = content()!.parentElement!;
    expect(["top", "right", "bottom", "left"]).toContain(
      outer.getAttribute("data-placement"),
    );
  });

  it("trigger 带 data-slot", () => {
    renderPopover();

    expect(trigger()).toHaveAttribute("data-slot", "popover-trigger");
  });

  it("content 带 data-slot", () => {
    renderPopover({ defaultOpen: true });

    expect(content()).toHaveAttribute("data-slot", "popover-content");
  });
});

describe("Popover - 关闭行为", () => {
  it("按 Escape 关闭", () => {
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("点击外部关闭", () => {
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.pointerDown(outside);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("点击 trigger 内部不触发外部关闭", () => {
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("点击 content 内部不关闭", () => {
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(content()!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("关闭状态下按 Escape 不触发回调", () => {
    const onOpenChange = vi.fn();
    renderPopover({ onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("关闭状态下点击外部不触发回调", () => {
    const onOpenChange = vi.fn();
    renderPopover({ onOpenChange });

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.pointerDown(outside);

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Popover - 受控模式", () => {
  it("受控 open=false 时点击只回调，UI 不变", async () => {
    const onOpenChange = vi.fn();
    renderPopover({ open: false, onOpenChange });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(content()).toBeNull();
  });

  it("受控 open=true 时 Escape 只回调，UI 不变", () => {
    const onOpenChange = vi.fn();
    renderPopover({ open: true, onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(content()).toBeInTheDocument();
  });

  it("外部回写受控值后 UI 跟随", async () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <Popover open={open()} onOpenChange={setOpen}>
        <PopoverTrigger>打开</PopoverTrigger>
        <PopoverContent>内容</PopoverContent>
      </Popover>
    ));

    expect(content()).toBeNull();

    setOpen(true);
    await Promise.resolve();

    expect(content()).toBeInTheDocument();

    setOpen(false);
    await Promise.resolve();

    expect(content()).toBeNull();
  });
});

describe("Popover - Trigger 键盘", () => {
  it.each(["ArrowDown", "ArrowUp", "Enter", " "])("关闭时按 %s 打开", (key) => {
    const onOpenChange = vi.fn();
    renderPopover({ onOpenChange });

    fireEvent.keyDown(trigger(), { key });

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("关闭时按字母不打开", () => {
    const onOpenChange = vi.fn();
    renderPopover({ onOpenChange });

    fireEvent.keyDown(trigger(), { key: "a" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("打开时按 Escape 关闭", () => {
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(trigger(), { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disabled 时键盘不打开", () => {
    const onOpenChange = vi.fn();
    renderPopover({ disabled: true, onOpenChange });

    fireEvent.keyDown(trigger(), { key: "Enter" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("用户的 onClick 与内部 toggle 不互相覆盖", async () => {
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    renderPopover({ onOpenChange, triggerProps: { onClick } });
    const user = userEvent.setup();

    await user.click(trigger());

    expect(onClick).toHaveBeenCalledTimes(1);
    // 内部 toggle 仍然生效（addEventListener 不占用 onClick prop）
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe("Popover - 内容子组件", () => {
  it("Title / Description / Header 渲染并可查询", () => {
    renderPopover({ defaultOpen: true });

    expect(
      document.querySelector('[data-slot="popover-title"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="popover-description"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="popover-header"]'),
    ).toBeInTheDocument();
  });

  it("内容区域渲染 children", () => {
    render(() => (
      <Popover defaultOpen>
        <PopoverTrigger>打开</PopoverTrigger>
        <PopoverContent>自定义内容</PopoverContent>
      </Popover>
    ));

    expect(content()).toHaveTextContent("自定义内容");
  });

  it("自定义 class 被合并到 content", () => {
    render(() => (
      <Popover defaultOpen>
        <PopoverTrigger>打开</PopoverTrigger>
        <PopoverContent class="my-popover">内容</PopoverContent>
      </Popover>
    ));

    expect(content()).toHaveClass("my-popover");
  });

  it("用户传入的 style 与 transform-origin 合并且不丢失", () => {
    render(() => (
      <Popover defaultOpen>
        <PopoverTrigger>打开</PopoverTrigger>
        <PopoverContent style={{ color: "red" }}>内容</PopoverContent>
      </Popover>
    ));

    const el = content() as HTMLElement;
    expect(el.style.color).toBe("red");
    expect(el.style.transformOrigin).not.toBe("");
  });
});

describe("Popover - 上下文约束", () => {
  it("PopoverTrigger 脱离 Popover 时抛出中文错误", () => {
    expect(() => render(() => <PopoverTrigger>打开</PopoverTrigger>)).toThrow(
      "<PopoverTrigger> 必须渲染在 <Popover> 内部",
    );
  });

  it("PopoverContent 脱离 Popover 时抛出中文错误", () => {
    expect(() => render(() => <PopoverContent>内容</PopoverContent>)).toThrow(
      "<PopoverContent> 必须渲染在 <Popover> 内部",
    );
  });
});

describe("popover - 事件目标不是元素时按外部处理（回归）", () => {
  it("在 document 上派发 pointerdown（target 不是 Element）也会关闭", () => {
    // `target instanceof Element ? target : target?.parentElement` 的 false 侧：
    // 事件 target 可能是 document / 文本节点，此时要回退到 parentElement
    // （document.parentElement 为 null，因此按"外部"处理并关闭）
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(document);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("target 是元素时走元素分支并同样按外部处理", () => {
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    fireEvent.pointerDown(outside);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("popover - disabled 守卫（回归）", () => {
  it("disabled 时点击 trigger 不打开（回调不被调用）", () => {
    // Trigger 用 addEventListener 挂的是**原生**监听（不经 Solid 委托），
    // 所以禁用按钮上的 click 依然会进入处理器，`if (disabled()) return` 这一侧可达。
    const onOpenChange = vi.fn();
    renderPopover({ disabled: true, onOpenChange });

    fireEvent.click(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
  });

  it("disabled 时 toggle 路径同样被守卫拦住", () => {
    const onOpenChange = vi.fn();
    renderPopover({ disabled: true, defaultOpen: true, onOpenChange });

    fireEvent.click(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("popover - 触发器上的 Escape（回归）", () => {
  it("打开状态下在 trigger 上按 Escape 会关闭，并阻止冒泡", () => {
    // onKeyDown 里 `if (!ctx.open()) { ...; return; }` 之后才是 Escape 分支——
    // 即"已打开且焦点还在 trigger 上"时才走这里。这是另一条关闭路径：
    // 焦点没进浮层时不会再触发 Content 上的 document 级 Escape 监听。
    const onOpenChange = vi.fn();
    renderPopover({ defaultOpen: true, onOpenChange });
    const el = trigger();
    el.focus();

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    const stopSpy = vi.spyOn(event, "stopPropagation");
    el.dispatchEvent(event);

    expect(stopSpy).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
