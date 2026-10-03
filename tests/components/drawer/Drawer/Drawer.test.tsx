import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Drawer } from "~/components/drawer/Drawer/Drawer";
import { useDrawerContext } from "~/components/drawer/Drawer/Drawer.context";
import type { DrawerProps } from "~/components/drawer/Drawer/Drawer.types";

/**
 * Drawer 根组件。它不渲染 DOM，契约是「开关状态机 + context」，
 * 因此这里用一个消费 context 的探针（Probe）把状态与命令暴露成 DOM。
 */
function Probe(props: { registerTrigger?: boolean }) {
  const ctx = useDrawerContext("Probe");
  return (
    <>
      <button
        type="button"
        data-testid="open"
        onClick={() => ctx.setOpen(true, "none")}
      >
        打开
      </button>
      <button
        type="button"
        data-testid="close"
        onClick={() => ctx.setOpen(false, "none")}
      >
        关闭
      </button>
      <button
        type="button"
        data-testid="restore"
        onClick={() => ctx.restoreFocus()}
      >
        还原焦点
      </button>
      <button
        type="button"
        data-testid="unfocusable-trigger"
        onClick={() => ctx.setTrigger({} as HTMLElement)}
      >
        注册无焦点 trigger
      </button>
      <button
        type="button"
        data-testid="trigger"
        ref={(el) => {
          if (props.registerTrigger !== false) ctx.setTrigger(el);
        }}
      >
        触发器
      </button>
      <div data-testid="popup" ref={(el) => ctx.setPopup(el)} />
      <span data-testid="open-state">{String(ctx.open())}</span>
      <span data-testid="show-state">{String(ctx.show())}</span>
      <span data-testid="modal-state">{String(ctx.modal())}</span>
      <span data-testid="direction">{ctx.swipeDirection()}</span>
      <span data-testid="handle-state">{String(ctx.showSwipeHandle())}</span>
      <span data-testid="dismissal-state">
        {String(ctx.disablePointerDismissal())}
      </span>
      <span data-testid="content-id">{ctx.contentId}</span>
    </>
  );
}

function renderDrawer(props: Partial<DrawerProps> = {}) {
  return render(() => (
    <Drawer {...props}>
      <Probe />
    </Drawer>
  ));
}

function testId(name: string): HTMLElement {
  return document.querySelector(`[data-testid="${name}"]`) as HTMLElement;
}

function stateOf(name: string): string {
  return testId(name).textContent ?? "";
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Drawer - 基础状态", () => {
  it("默认关闭：open 与 show 都为 false", () => {
    renderDrawer();

    expect(stateOf("open-state")).toBe("false");
    expect(stateOf("show-state")).toBe("false");
  });

  it("defaultOpen 时初始 open 与 show 都为 true", () => {
    renderDrawer({ defaultOpen: true });

    expect(stateOf("open-state")).toBe("true");
    expect(stateOf("show-state")).toBe("true");
  });

  it("contentId 带固定前缀，供 Trigger 的 aria-controls 引用", () => {
    renderDrawer();

    expect(stateOf("content-id")).toMatch(/^drawer-content-/);
  });
});

describe("Drawer - 非受控交互", () => {
  it("请求打开后 open=true，并回调 onOpenChange(true) 与 reason", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });

    fireEvent.click(testId("open"));

    expect(stateOf("open-state")).toBe("true");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "none" }),
    );
  });

  it("已经打开时再次请求打开是空操作，不重复回调", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });

    fireEvent.click(testId("open"));
    fireEvent.click(testId("open"));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange.mock.calls[0][0]).toBe(true);
  });

  it("关闭后仍保留 show=true，等退场动画结束才收起", () => {
    renderDrawer({ defaultOpen: true });

    fireEvent.click(testId("close"));

    expect(stateOf("open-state")).toBe("false");
    expect(stateOf("show-state")).toBe("true");
  });

  it("未传 onOpenChange 时开关不报错", () => {
    renderDrawer();

    expect(() => {
      fireEvent.click(testId("open"));
      fireEvent.click(testId("close"));
    }).not.toThrow();
    expect(stateOf("open-state")).toBe("false");
  });
});

describe("Drawer - 选项透出", () => {
  it("modal 默认 true，传 false 时透出 false", () => {
    renderDrawer();
    expect(stateOf("modal-state")).toBe("true");
  });

  it("modal=false 透出 false", () => {
    renderDrawer({ modal: false });
    expect(stateOf("modal-state")).toBe("false");
  });

  it("swipeDirection 默认 down", () => {
    renderDrawer();
    expect(stateOf("direction")).toBe("down");
  });

  it.each(["up", "left", "right"] as const)(
    "swipeDirection=%s 时透出该方向",
    (direction) => {
      renderDrawer({ swipeDirection: direction });
      expect(stateOf("direction")).toBe(direction);
    },
  );

  it("showSwipeHandle 默认 false，传 true 时透出 true", () => {
    renderDrawer();
    expect(stateOf("handle-state")).toBe("false");
  });

  it("showSwipeHandle=true 透出 true", () => {
    renderDrawer({ showSwipeHandle: true });
    expect(stateOf("handle-state")).toBe("true");
  });

  it("disablePointerDismissal 默认 false，传 true 时透出 true", () => {
    renderDrawer();
    expect(stateOf("dismissal-state")).toBe("false");
  });

  it("disablePointerDismissal=true 透出 true", () => {
    renderDrawer({ disablePointerDismissal: true });
    expect(stateOf("dismissal-state")).toBe("true");
  });
});

describe("Drawer - onOpenChange 事件详情", () => {
  it("details 暴露 reason、trigger 与 cancel()/allowPropagation() 语义", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });

    fireEvent.click(testId("open"));
    const details = onOpenChange.mock.calls[0][1];

    expect(details.reason).toBe("none");
    expect(details.trigger).toBe(testId("trigger"));
    expect(details.isCanceled).toBe(false);
    expect(details.isPropagationAllowed).toBe(false);

    details.allowPropagation();
    details.cancel();

    expect(details.isPropagationAllowed).toBe(true);
    expect(details.isCanceled).toBe(true);
  });

  it("在 onOpenChange 里调用 cancel() 会阻止关闭（回归）", () => {
    // 此前 setOpen 先写内部状态、再回调，且从不检查 isCanceled，
    // 于是按文档写 details.cancel() 根本拦不住关闭
    const onOpenChange = vi.fn(
      (_next: boolean, details: { cancel: () => void }) => details.cancel(),
    );
    renderDrawer({ defaultOpen: true, onOpenChange });

    fireEvent(document, new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(testId("open-state")).toHaveTextContent("true");
  });

  it("受控模式下 cancel() 同样能阻止回调后的默认行为", () => {
    const onOpenChange = vi.fn(
      (_next: boolean, details: { cancel: () => void }) => details.cancel(),
    );
    renderDrawer({ open: true, onOpenChange });

    fireEvent(document, new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(testId("open-state")).toHaveTextContent("true");
  });

  it("由键盘触发的关闭把原始 KeyboardEvent 透传给 details.event", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, onOpenChange });

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(document, event);

    const details = onOpenChange.mock.calls[0][1];
    expect(details.reason).toBe("escape-key");
    expect(details.event).toBe(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("Drawer - 受控模式", () => {
  it("受控打开值被外部固定时，交互只回调、不改变内部状态", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer open={false} onOpenChange={onOpenChange}>
        <Probe />
      </Drawer>
    ));

    fireEvent.click(testId("open"));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(stateOf("open-state")).toBe("false");
  });

  it("受控值由外部回写后 UI 跟随", async () => {
    const [open, setOpen] = createSignal(false);
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer open={open()} onOpenChange={onOpenChange}>
        <Probe />
      </Drawer>
    ));

    fireEvent.click(testId("open"));
    expect(stateOf("open-state")).toBe("false");

    setOpen(true);
    await Promise.resolve();

    expect(stateOf("open-state")).toBe("true");
    expect(stateOf("show-state")).toBe("true");
  });

  it("受控 open=true 时请求关闭只回调、不改变状态", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Drawer open={true} onOpenChange={onOpenChange}>
        <Probe />
      </Drawer>
    ));

    fireEvent.click(testId("close"));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(stateOf("open-state")).toBe("true");
  });
});

describe("Drawer - Escape 键", () => {
  it("打开后按 Escape 关闭", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(stateOf("open-state")).toBe("false");
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
  });

  it("已被 preventDefault 的 keydown 不再关闭", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, onOpenChange });

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    fireEvent(document, event);

    expect(stateOf("open-state")).toBe("true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("非 Escape 按键不关闭", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, onOpenChange });

    fireEvent.keyDown(document, { key: "Enter" });

    expect(stateOf("open-state")).toBe("true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("未打开时按 Escape 不回调", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Drawer - 点击外部关闭", () => {
  it("pointerdown 落在 popup 之外时关闭，reason=outside-press", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(document.body);

    expect(stateOf("open-state")).toBe("false");
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" }),
    );
  });

  it("pointerdown 落在 popup 内时不关闭", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(testId("popup"));

    expect(stateOf("open-state")).toBe("true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("pointerdown 落在 trigger 上时不关闭", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, onOpenChange });

    fireEvent.pointerDown(testId("trigger"));

    expect(stateOf("open-state")).toBe("true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disablePointerDismissal=true 时外部 pointerdown 不关闭", () => {
    const onOpenChange = vi.fn();
    renderDrawer({
      defaultOpen: true,
      disablePointerDismissal: true,
      onOpenChange,
    });

    fireEvent.pointerDown(document.body);

    expect(stateOf("open-state")).toBe("true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("未打开时外部 pointerdown 不回调", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });

    fireEvent.pointerDown(document.body);

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Drawer - 焦点还原", () => {
  it("restoreFocus 把焦点还给已注册的 trigger", () => {
    renderDrawer();
    const trigger = testId("trigger");
    const focus = vi.spyOn(trigger, "focus");

    fireEvent.click(testId("restore"));

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("尚未注册 trigger 时 restoreFocus 安全返回", () => {
    render(() => (
      <Drawer>
        <Probe registerTrigger={false} />
      </Drawer>
    ));

    expect(() => fireEvent.click(testId("restore"))).not.toThrow();
  });

  it("trigger 不是可聚焦元素时 restoreFocus 安全返回", () => {
    renderDrawer();

    fireEvent.click(testId("unfocusable-trigger"));

    expect(() => fireEvent.click(testId("restore"))).not.toThrow();
  });
});

describe("Drawer - modal 锁滚动", () => {
  it("modal 打开时锁定页面滚动", () => {
    renderDrawer({ defaultOpen: true });

    expect(document.body.style.overflowY).toBe("hidden");
  });

  it("modal=false 时不锁定页面滚动", () => {
    renderDrawer({ defaultOpen: true, modal: false });

    expect(document.body.style.overflowY).not.toBe("hidden");
  });
});
