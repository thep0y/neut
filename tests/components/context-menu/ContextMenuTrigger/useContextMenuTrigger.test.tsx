import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenuContext } from "~/components/context-menu/ContextMenu/ContextMenu.context";
import { useContextMenuTrigger } from "~/components/context-menu/ContextMenuTrigger/useContextMenuTrigger";
import type { ContextMenuContextValue } from "~/components/context-menu/context-menu.types";

/**
 * `useContextMenuTrigger` 的事件接线测试。
 *
 * 这里给它一个假的根 context，只验证"哪个原生事件被翻译成哪次 openAt"、
 * 长按手势的计时/容差/清理，以及 disabled 与卸载时的行为。
 * 组件的渲染与多态由 `ContextMenuTrigger.test.tsx` 覆盖。
 */
function fakeRoot(
  overrides: Partial<ContextMenuContextValue> = {},
): ContextMenuContextValue {
  return {
    open: () => false,
    disabled: () => false,
    loopFocus: () => true,
    orientation: () => "vertical",
    highlightItemOnHover: () => true,
    trigger: () => undefined,
    setTrigger: vi.fn(),
    anchor: () => undefined,
    contentId: "context-menu-content-test",
    finalFocus: () => true,
    setFinalFocus: vi.fn(),
    openAt: vi.fn(),
    closeAll: vi.fn(),
    registerMenuElement: () => () => {},
    isInsideMenu: () => false,
    ...overrides,
  };
}

function Trigger() {
  const { attachListeners } = useContextMenuTrigger();
  return <div data-slot="trigger" ref={attachListeners} />;
}

function setup(overrides: Partial<ContextMenuContextValue> = {}): {
  root: ContextMenuContextValue;
  openAt: ReturnType<typeof vi.fn>;
  element: HTMLDivElement;
  cleanupRoot: () => void;
} {
  const openAt = vi.fn();
  const root = fakeRoot({ openAt, ...overrides });

  // attachListeners 通过 ref 在 owner 内调用，这样 onCleanup 才会真正登记
  const rendered = render(() => (
    <ContextMenuContext.Provider value={root}>
      <Trigger />
    </ContextMenuContext.Provider>
  ));

  const element = rendered.container.querySelector(
    '[data-slot="trigger"]',
  ) as HTMLDivElement;

  return {
    root,
    openAt,
    element,
    cleanupRoot: rendered.unmount,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useContextMenuTrigger - 右键", () => {
  it("contextmenu 以鼠标坐标唤起菜单，并阻止浏览器默认菜单", () => {
    const { element, openAt } = setup();

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 33,
      clientY: 44,
    });
    element.dispatchEvent(event);

    expect(openAt).toHaveBeenCalledTimes(1);
    expect(openAt).toHaveBeenCalledWith(
      33,
      44,
      element,
      event,
      "trigger-press",
    );
    expect(event.defaultPrevented).toBe(true);
  });

  it("disabled 时右键不唤起", () => {
    const { element, openAt } = setup({ disabled: () => true });

    fireEvent.contextMenu(element, { clientX: 1, clientY: 2 });

    expect(openAt).not.toHaveBeenCalled();
  });
});

describe("useContextMenuTrigger - 触摸长按", () => {
  it("触摸按下满 500ms 后以按下坐标唤起", () => {
    const { element, openAt } = setup();
    const event = new PointerEvent("pointerdown", {
      bubbles: true,
      pointerType: "touch",
      clientX: 11,
      clientY: 22,
    });

    element.dispatchEvent(event);
    vi.advanceTimersByTime(499);
    expect(openAt).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(openAt).toHaveBeenCalledWith(
      11,
      22,
      element,
      event,
      "trigger-press",
    );
  });

  it("手写笔同样触发长按", () => {
    const { element, openAt } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "pen",
      clientX: 5,
      clientY: 6,
    });
    vi.advanceTimersByTime(500);

    expect(openAt).toHaveBeenCalledWith(
      5,
      6,
      element,
      expect.anything(),
      "trigger-press",
    );
  });

  it("鼠标按下不进入长按（交给原生 contextmenu）", () => {
    const { element, openAt } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "mouse",
      clientX: 5,
      clientY: 6,
    });
    vi.advanceTimersByTime(1000);

    expect(openAt).not.toHaveBeenCalled();
  });

  it("disabled 时触摸长按不唤起", () => {
    const { element, openAt } = setup({ disabled: () => true });

    fireEvent.pointerDown(element, {
      pointerType: "touch",
      clientX: 5,
      clientY: 6,
    });
    vi.advanceTimersByTime(500);

    expect(openAt).not.toHaveBeenCalled();
  });

  it("移动超出容差后取消长按", () => {
    const { element, openAt } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(element, {
      pointerType: "touch",
      clientX: 200,
      clientY: 100,
    });
    vi.advanceTimersByTime(1000);

    expect(openAt).not.toHaveBeenCalled();
  });

  it("容差内移动仍会触发", () => {
    const { element, openAt } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(element, {
      pointerType: "touch",
      clientX: 105,
      clientY: 107,
    });
    vi.advanceTimersByTime(500);

    expect(openAt).toHaveBeenCalledTimes(1);
  });

  it("pointerup 取消长按", () => {
    const { element, openAt } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerUp(element, { pointerType: "touch" });
    vi.advanceTimersByTime(1000);

    expect(openAt).not.toHaveBeenCalled();
  });

  it("pointercancel 取消长按", () => {
    const { element, openAt } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerCancel(element, { pointerType: "touch" });
    vi.advanceTimersByTime(1000);

    expect(openAt).not.toHaveBeenCalled();
  });

  it("长按触发后抬起不会再次唤起", () => {
    const { element, openAt } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    });
    vi.advanceTimersByTime(500);
    fireEvent.pointerUp(element, { pointerType: "touch" });
    vi.advanceTimersByTime(1000);

    expect(openAt).toHaveBeenCalledTimes(1);
  });
});

describe("useContextMenuTrigger - 键盘", () => {
  it("菜单键以触发器矩形中心为锚点唤起", () => {
    const { element, openAt } = setup();
    element.getBoundingClientRect = () =>
      ({ left: 100, top: 50, width: 40, height: 20 }) as DOMRect;

    fireEvent.keyDown(element, { key: "ContextMenu" });

    expect(openAt).toHaveBeenCalledWith(
      120,
      60,
      element,
      expect.anything(),
      "trigger-press",
    );
  });

  it("Shift+F10 唤起并阻止默认行为", () => {
    const { element, openAt } = setup();
    const event = new KeyboardEvent("keydown", {
      key: "F10",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    element.dispatchEvent(event);

    expect(openAt).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("单独的 F10 与普通按键都不唤起", () => {
    const { element, openAt } = setup();

    fireEvent.keyDown(element, { key: "F10" });
    fireEvent.keyDown(element, { key: "Enter" });

    expect(openAt).not.toHaveBeenCalled();
  });

  it("disabled 时键盘不唤起", () => {
    const { element, openAt } = setup({ disabled: () => true });

    fireEvent.keyDown(element, { key: "ContextMenu" });

    expect(openAt).not.toHaveBeenCalled();
  });
});

describe("useContextMenuTrigger - 卸载", () => {
  it("卸载后所有原生事件都不再唤起，长按计时也被清理", () => {
    const { element, openAt, cleanupRoot } = setup();

    fireEvent.pointerDown(element, {
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    });

    cleanupRoot();
    vi.advanceTimersByTime(1000);

    fireEvent.contextMenu(element);
    fireEvent.keyDown(element, { key: "ContextMenu" });

    expect(openAt).not.toHaveBeenCalled();
  });
});
