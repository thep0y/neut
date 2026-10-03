import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "~/components/context-menu/ContextMenu/ContextMenu";
import { useContextMenuContext } from "~/components/context-menu/ContextMenu/ContextMenu.context";
import type { ContextMenuContextValue } from "~/components/context-menu/context-menu.types";

/**
 * ContextMenu 根组件不渲染自己的 DOM，只做状态管理。
 * 因此这里用一个探针子组件把 context 取出来，断言"对外暴露的状态与动作"。
 */
function Probe(props: { capture: (ctx: ContextMenuContextValue) => void }) {
  props.capture(useContextMenuContext("Probe"));
  return <div data-slot="probe" />;
}

function setup(props: Record<string, unknown> = {}): ContextMenuContextValue {
  let ctx!: ContextMenuContextValue;
  render(() => (
    <ContextMenu {...props}>
      <Probe
        capture={(value) => {
          ctx = value;
        }}
      />
    </ContextMenu>
  ));
  return ctx;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContextMenu - 打开状态", () => {
  it("默认关闭", () => {
    const ctx = setup();

    expect(ctx.open()).toBe(false);
  });

  it("defaultOpen 时初始打开", () => {
    const ctx = setup({ defaultOpen: true });

    expect(ctx.open()).toBe(true);
  });

  it("非受控下 openAt 写入内部状态并回调 onOpenChange", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });

    ctx.openAt(10, 20, undefined, undefined, "trigger-press");

    expect(ctx.open()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("受控模式下 openAt 只回调，内部状态由外部 open 决定", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ open: false, onOpenChange });

    ctx.openAt(10, 20, undefined, undefined, "trigger-press");

    expect(ctx.open()).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("disabled 时 openAt 被忽略且不回调", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ disabled: true, onOpenChange });

    ctx.openAt(10, 20, undefined, undefined, "trigger-press");

    expect(ctx.open()).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("已打开时再次 openAt 只更新锚点，不重复回调", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });

    ctx.openAt(10, 20, undefined, undefined, "trigger-press");
    const firstAnchor = ctx.anchor();
    ctx.openAt(80, 90, undefined, undefined, "trigger-press");

    expect(ctx.open()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(ctx.anchor()).not.toBe(firstAnchor);
    expect(ctx.anchor()?.getBoundingClientRect().x).toBe(80);
    expect(ctx.anchor()?.getBoundingClientRect().y).toBe(90);
  });

  it("onOpenChange 里 cancel() 会阻止关闭（回归）", () => {
    // 此前 commit 先写状态再回调、且从不检查 isCanceled，
    // 于是类型文档承诺的 details.cancel() 拦不住关闭
    const onOpenChange = vi.fn(
      (_next: boolean, details: { cancel: () => void }) => details.cancel(),
    );
    const ctx = setup({ defaultOpen: true, onOpenChange });

    ctx.closeAll("escape-key");

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(ctx.open()).toBe(true);
  });

  it("cancel() 后不归还焦点（菜单并没有真的关闭）", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, "focus");
    const onOpenChange = vi.fn(
      (_next: boolean, details: { cancel: () => void }) => details.cancel(),
    );
    const ctx = setup({ defaultOpen: true, onOpenChange });
    ctx.setTrigger(trigger);

    ctx.closeAll("escape-key");

    expect(focusSpy).not.toHaveBeenCalled();
    expect(ctx.open()).toBe(true);
  });

  it("受控模式下 cancel() 同样阻止回调后的默认行为", () => {
    const onOpenChange = vi.fn(
      (_next: boolean, details: { cancel: () => void }) => details.cancel(),
    );
    const ctx = setup({ open: true, onOpenChange });

    ctx.closeAll("escape-key");

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(ctx.open()).toBe(true);
  });

  it("已关闭时 closeAll 直接返回，不回调", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });

    ctx.closeAll("escape-key");

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("事件详情携带 reason 与原始事件", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    const event = new MouseEvent("contextmenu");

    ctx.openAt(1, 2, undefined, event, "trigger-press");

    const details = onOpenChange.mock.calls[0]![1] as {
      reason: string;
      event: Event;
    };
    expect(details.reason).toBe("trigger-press");
    expect(details.event).toBe(event);
  });

  it("受控模式下外部把 open 回写为 true 时 UI 跟随", () => {
    const [open, setOpen] = createSignal(false);
    let ctx!: ContextMenuContextValue;
    render(() => (
      <ContextMenu open={open()}>
        <Probe
          capture={(value) => {
            ctx = value;
          }}
        />
      </ContextMenu>
    ));

    expect(ctx.open()).toBe(false);

    setOpen(true);

    expect(ctx.open()).toBe(true);
  });
});

describe("ContextMenu - 默认值", () => {
  it("loopFocus / orientation / highlightItemOnHover / modal 默认值对齐 Base UI", () => {
    const ctx = setup();

    expect(ctx.loopFocus()).toBe(true);
    expect(ctx.orientation()).toBe("vertical");
    expect(ctx.highlightItemOnHover()).toBe(true);
  });

  it("显式传入时覆盖默认值", () => {
    const ctx = setup({
      loopFocus: false,
      orientation: "horizontal",
      highlightItemOnHover: false,
    });

    expect(ctx.loopFocus()).toBe(false);
    expect(ctx.orientation()).toBe("horizontal");
    expect(ctx.highlightItemOnHover()).toBe(false);
  });
});

describe("ContextMenu - 浮层内部判定", () => {
  it("null 与文本节点都不算菜单内部", () => {
    const ctx = setup();

    expect(ctx.isInsideMenu(null)).toBe(false);
    expect(ctx.isInsideMenu(document.createTextNode("x"))).toBe(false);
  });

  it("注册后的浮层元素及其后代算内部，注销后不算", () => {
    const ctx = setup();
    const menu = document.createElement("div");
    const child = document.createElement("span");
    menu.appendChild(child);
    document.body.appendChild(menu);

    const unregister = ctx.registerMenuElement(menu);

    expect(ctx.isInsideMenu(menu)).toBe(true);
    expect(ctx.isInsideMenu(child)).toBe(true);

    unregister();

    expect(ctx.isInsideMenu(menu)).toBe(false);
  });
});

describe("ContextMenu - 关闭与焦点归还", () => {
  function attachTrigger(ctx: ContextMenuContextValue): {
    trigger: HTMLButtonElement;
    focus: ReturnType<typeof vi.fn>;
  } {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    const focus = vi.fn();
    trigger.focus = focus;
    ctx.setTrigger(trigger);
    return { trigger, focus };
  }

  it("非 outside-press 关闭时把焦点还给触发器", () => {
    const ctx = setup({ defaultOpen: true });
    const { focus } = attachTrigger(ctx);

    ctx.closeAll("escape-key");

    expect(ctx.open()).toBe(false);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("outside-press 关闭时焦点留在用户点击处，不抢回触发器", () => {
    const ctx = setup({ defaultOpen: true });
    const { focus } = attachTrigger(ctx);

    ctx.closeAll("outside-press");

    expect(ctx.open()).toBe(false);
    expect(focus).not.toHaveBeenCalled();
  });

  it("finalFocus=false 时不归还焦点", () => {
    const ctx = setup({ defaultOpen: true });
    const { focus } = attachTrigger(ctx);
    ctx.setFinalFocus(false);

    ctx.closeAll("escape-key");

    expect(focus).not.toHaveBeenCalled();
  });

  it("触发器缺失或没有 focus 方法时仍能正常关闭", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ defaultOpen: true, onOpenChange });

    ctx.closeAll("escape-key");
    expect(ctx.open()).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());

    // 再次打开并换上一个没有 focus 方法的"触发器"
    ctx.openAt(1, 2, undefined, undefined, "trigger-press");
    ctx.setTrigger({} as HTMLElement);
    ctx.closeAll("escape-key");

    expect(ctx.open()).toBe(false);
  });
});

describe("ContextMenu - 文档级监听", () => {
  function openAtBody(ctx: ContextMenuContextValue) {
    ctx.openAt(10, 20, undefined, undefined, "trigger-press");
    expect(ctx.open()).toBe(true);
  }

  it("左键点击菜单外部关闭（outside-press）", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    openAtBody(ctx);

    fireEvent.pointerDown(document.body, { button: 0 });

    expect(ctx.open()).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" }),
    );
  });

  it("右键的 pointerdown 交给 contextmenu 处理，不会先关一帧", () => {
    const ctx = setup();
    openAtBody(ctx);

    fireEvent.pointerDown(document.body, { button: 2 });

    expect(ctx.open()).toBe(true);
  });

  it("菜单内部按下不关闭", () => {
    const ctx = setup();
    openAtBody(ctx);
    const menu = document.createElement("div");
    document.body.appendChild(menu);
    ctx.registerMenuElement(menu);

    fireEvent.pointerDown(menu, { button: 0 });

    expect(ctx.open()).toBe(true);
  });

  it("菜单外再次右键关闭", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    openAtBody(ctx);

    fireEvent.contextMenu(document.body);

    expect(ctx.open()).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" }),
    );
  });

  it("Escape 兜底关闭菜单并标记 escape-key", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    openAtBody(ctx);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(ctx.open()).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
  });

  it("浮层已 preventDefault 的 Escape 不重复关闭", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    openAtBody(ctx);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    document.dispatchEvent(event);

    expect(ctx.open()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("Escape 之外的按键不关闭", () => {
    const ctx = setup();
    openAtBody(ctx);

    fireEvent.keyDown(document, { key: "a" });

    expect(ctx.open()).toBe(true);
  });

  it("关闭后卸载文档级监听，后续事件不再触发回调", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    openAtBody(ctx);

    ctx.closeAll("escape-key");
    onOpenChange.mockClear();

    fireEvent.pointerDown(document.body, { button: 0 });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("ContextMenuContext - 上下文约束", () => {
  it("脱离 <ContextMenu> 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(() => {
        useContextMenuContext("ContextMenuTrigger");
        return <div />;
      }),
    ).toThrow("<ContextMenuTrigger> 必须渲染在 <ContextMenu> 内部");

    spy.mockRestore();
  });
});

describe("ContextMenu - 非元素目标与菜单内右键", () => {
  it("在已注册的浮层内部再次右键不会关闭", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    ctx.openAt(10, 20, undefined, undefined, "trigger-press");
    const menu = document.createElement("div");
    document.body.appendChild(menu);
    ctx.registerMenuElement(menu);

    menu.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );

    expect(ctx.open()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("contextmenu 落在非元素节点（文本节点）上按外部处理", () => {
    const onOpenChange = vi.fn();
    const ctx = setup({ onOpenChange });
    ctx.openAt(10, 20, undefined, undefined, "trigger-press");
    const text = document.createTextNode("纯文本");
    document.body.appendChild(text);

    text.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );

    expect(ctx.open()).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" }),
    );
  });
});
