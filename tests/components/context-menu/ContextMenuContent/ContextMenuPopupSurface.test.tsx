import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenuPopupSurface } from "~/components/context-menu/ContextMenuContent/ContextMenuPopupSurface";
import type { ContextMenuPopupRuntime } from "~/components/context-menu/ContextMenuContent/useContextMenuContent";
import type {
  ContextMenuPopupContextValue,
  ContextMenuSide,
} from "~/components/context-menu/context-menu.types";

interface RuntimeHarness {
  runtime: ContextMenuPopupRuntime;
  setPopupEl: (el: HTMLElement | undefined) => void;
  setPositionerEl: (el: HTMLElement | undefined) => void;
  setAvailableHeight: (value: number | undefined) => void;
  setPositioned: (value: boolean) => void;
  setActiveId: (id: string | undefined) => void;
  setupOnOpen: ReturnType<typeof vi.fn>;
  setPopup: ReturnType<typeof vi.fn>;
  onKeyDown: ReturnType<typeof vi.fn>;
}

function fakeRuntime(): RuntimeHarness {
  const [popupEl, setPopupEl] = createSignal<HTMLElement>();
  const [positionerEl, setPositionerEl] = createSignal<HTMLElement>();
  const [availableHeight, setAvailableHeight] = createSignal<number>();
  const [positioned, setPositioned] = createSignal(false);
  const [activeId, setActiveId] = createSignal<string | undefined>();

  const setupOnOpen = vi.fn();
  const setPopup = vi.fn();
  const onKeyDown = vi.fn();

  const popupCtx = { activeId } as unknown as ContextMenuPopupContextValue;

  const runtime = {
    popupCtx,
    pos: {
      floatingStyles: () => ({
        position: "fixed",
        top: "0px",
        left: "0px",
        transform: "translate(0px, 0px)",
      }),
      isPositioned: positioned,
    },
    popupEl,
    setPopupEl,
    positionerEl,
    setPositionerEl,
    availableHeight,
    placement: () => "right-start",
    onKeyDown,
    setupOnOpen,
    setPopup,
  } as unknown as ContextMenuPopupRuntime;

  return {
    runtime,
    setPopupEl,
    setPositionerEl,
    setAvailableHeight,
    setPositioned,
    setActiveId,
    setupOnOpen,
    setPopup,
    onKeyDown,
  };
}

function renderSurface(
  options: {
    open?: boolean;
    side?: ContextMenuSide;
    dir?: "ltr" | "rtl" | undefined;
    positionerSlot?: string;
    class?: string;
    style?: Record<string, string>;
    onKeyDown?: (e: KeyboardEvent) => void;
    onPointerEnter?: () => void;
    onPointerLeave?: () => void;
    rest?: Record<string, unknown>;
    children?: unknown;
  } = {},
  harness = fakeRuntime(),
) {
  const [open] = createSignal(options.open ?? true);
  const [side] = createSignal<ContextMenuSide>(options.side ?? "right");
  const [dir] = createSignal<"ltr" | "rtl" | undefined>(options.dir);

  const result = render(() => (
    <ContextMenuPopupSurface
      runtime={harness.runtime}
      dataSlot="context-menu-content"
      positionerSlot={options.positionerSlot}
      contentId="content-1"
      open={open}
      side={side}
      dir={dir}
      registerMenuElement={() => vi.fn()}
      class={options.class}
      style={options.style as never}
      onKeyDown={options.onKeyDown}
      onPointerEnter={options.onPointerEnter}
      onPointerLeave={options.onPointerLeave}
      rest={options.rest ?? {}}
    >
      <span>菜单内容</span>
    </ContextMenuPopupSurface>
  ));

  return { ...result, harness };
}

function popup(): HTMLElement {
  return document.querySelector(
    '[data-slot="context-menu-content"]',
  ) as HTMLElement;
}

function positioner(): HTMLElement {
  return document.querySelector(
    '[data-slot="context-menu-positioner"]',
  ) as HTMLElement;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ContextMenuPopupSurface - 渲染", () => {
  it("open=false 时不渲染任何东西", () => {
    renderSurface({ open: false });

    expect(popup()).toBeNull();
  });

  it("渲染 role=menu 的 popup 与 contentId", () => {
    renderSurface();

    expect(popup()).toHaveAttribute("role", "menu");
    expect(popup()).toHaveAttribute("id", "content-1");
    expect(popup()).toHaveTextContent("菜单内容");
  });

  it("positionerSlot 可覆盖默认 data-slot", () => {
    renderSurface({ positionerSlot: "custom-positioner" });

    expect(
      document.querySelector('[data-slot="custom-positioner"]'),
    ).toBeInTheDocument();
  });

  it("class 与 style 合并到 popup 上", () => {
    renderSurface({ class: "extra", style: { color: "red" } });

    expect(popup().className).toContain("extra");
    expect(popup().style.color).toBe("red");
  });

  it("rest 属性透传到 popup", () => {
    renderSurface({ rest: { "data-x": "1", "aria-label": "菜单" } });

    expect(popup()).toHaveAttribute("data-x", "1");
    expect(popup()).toHaveAttribute("aria-label", "菜单");
  });

  it("aria-activedescendant 跟随 activeId", () => {
    const harness = fakeRuntime();
    renderSurface({}, harness);
    expect(popup()).not.toHaveAttribute("aria-activedescendant");

    harness.setActiveId("item-1");

    expect(popup()).toHaveAttribute("aria-activedescendant", "item-1");
  });
});

describe("ContextMenuPopupSurface - 定位状态", () => {
  it("未定位时 opacity 为 0", () => {
    const harness = fakeRuntime();
    renderSurface({}, harness);

    expect(positioner().style.opacity).toBe("0");
  });

  it("定位完成后 opacity 为 1", () => {
    const harness = fakeRuntime();
    renderSurface({}, harness);

    harness.setPositioned(true);

    expect(positioner().style.opacity).toBe("1");
  });

  it("有可用高度时写 max-height 与 --available-height", () => {
    const harness = fakeRuntime();
    renderSurface({}, harness);

    harness.setAvailableHeight(240);

    expect(popup().style.getPropertyValue("--available-height")).toBe("240px");
  });

  it("没有可用高度时不写这两个样式", () => {
    renderSurface();

    expect(popup().style.getPropertyValue("--available-height")).toBe("");
  });
});

describe("ContextMenuPopupSurface - 动画", () => {
  it("打开后延迟一帧才置 data-open", async () => {
    vi.useFakeTimers();
    renderSurface();
    await vi.advanceTimersByTimeAsync(0);

    expect(popup()).not.toHaveAttribute("data-open");

    await vi.advanceTimersByTimeAsync(16);

    expect(popup()).toHaveAttribute("data-open", "");
  });
});

describe("ContextMenuPopupSurface - 事件", () => {
  it("popup 挂载后就绪时调用 setupOnOpen", () => {
    const harness = fakeRuntime();
    renderSurface({}, harness);
    harness.setPopupEl(document.createElement("div"));
    harness.setPositioned(true);

    // runtime.setupOnOpen 由 effect 在 open && popupEl 时调用
    expect(harness.setupOnOpen).toHaveBeenCalled();
  });

  it("onKeyDown 先调用外部回调再交给运行时", () => {
    const harness = fakeRuntime();
    const onKeyDown = vi.fn();
    renderSurface({ onKeyDown }, harness);

    fireEvent.keyDown(popup(), { key: "ArrowDown" });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(harness.onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("未提供 onKeyDown 时仍调用运行时处理", () => {
    const harness = fakeRuntime();
    renderSurface({}, harness);

    fireEvent.keyDown(popup(), { key: "ArrowDown" });

    expect(harness.onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("指针进出回调可选透传", () => {
    const harness = fakeRuntime();
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    renderSurface({ onPointerEnter, onPointerLeave }, harness);

    popup().dispatchEvent(new PointerEvent("pointerenter"));
    popup().dispatchEvent(new PointerEvent("pointerleave"));

    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
  });

  it("未提供指针回调时不报错", () => {
    renderSurface();

    popup().dispatchEvent(new PointerEvent("pointerenter"));
    popup().dispatchEvent(new PointerEvent("pointerleave"));

    expect(popup()).toBeInTheDocument();
  });
});

describe("ContextMenuPopupSurface - 卸载", () => {
  it("卸载时注销浮层元素并清空访问器", () => {
    const harness = fakeRuntime();
    const unregister = vi.fn();
    const { unmount } = render(() => {
      const [open] = createSignal(true);
      const [side] = createSignal<ContextMenuSide>("right");
      const [dir] = createSignal<"ltr" | "rtl" | undefined>(undefined);
      return (
        <ContextMenuPopupSurface
          runtime={harness.runtime}
          dataSlot="context-menu-content"
          contentId="content-1"
          open={open}
          side={side}
          dir={dir}
          registerMenuElement={() => unregister}
          rest={{}}
        >
          内容
        </ContextMenuPopupSurface>
      );
    });

    unmount();

    expect(unregister).toHaveBeenCalledTimes(1);
  });
});
