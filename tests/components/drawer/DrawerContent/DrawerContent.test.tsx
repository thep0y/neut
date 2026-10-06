import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { DrawerContent } from "~/components/drawer/DrawerContent/DrawerContent";
import {
  drawerContextWrapper,
  fakeDrawerContext,
  stubAnimationFrame,
} from "~tests/components/drawer/test-utils";

const OPEN = { open: () => true, show: () => true };

function renderContent(
  props: Parameters<typeof DrawerContent>[0] = {},
  overrides: Parameters<typeof fakeDrawerContext>[0] = {},
) {
  return render(() => <DrawerContent {...props} />, {
    wrapper: drawerContextWrapper(fakeDrawerContext({ ...OPEN, ...overrides })),
  });
}

function popup(): HTMLElement {
  return document.querySelector('[data-slot="drawer-popup"]') as HTMLElement;
}

function overlay(): HTMLElement | null {
  return document.querySelector('[data-slot="drawer-overlay"]');
}

function viewport(): HTMLElement {
  return document.querySelector('[data-slot="drawer-viewport"]') as HTMLElement;
}

describe("DrawerContent - 挂载与结构", () => {
  it("show=false 时整体不渲染", () => {
    renderContent(undefined, { show: () => false });

    expect(popup()).toBeNull();
    expect(viewport()).toBeNull();
  });

  it("show=true 时 Portal 出 viewport / popup / content 三层", () => {
    renderContent({ children: <p>正文</p> });

    expect(viewport()).toHaveAttribute("data-slot", "drawer-viewport");
    expect(popup()).toHaveAttribute("data-slot", "drawer-popup");
    expect(
      popup().querySelector('[data-slot="drawer-content"]'),
    ).toHaveTextContent("正文");
  });

  it("modal=true 时渲染遮罩，viewport 标记 data-modal=true", () => {
    renderContent();

    expect(overlay()).not.toBeNull();
    expect(viewport()).toHaveAttribute("data-modal", "true");
  });

  it("modal=false 时不渲染遮罩，aria-modal 与 data-modal 均为关闭态", () => {
    renderContent(undefined, { modal: () => false });

    expect(overlay()).toBeNull();
    expect(viewport()).toHaveAttribute("data-modal", "false");
    expect(popup()).not.toHaveAttribute("aria-modal");
  });

  it("showSwipeHandle=true 时在面板内渲染拖拽把手", () => {
    renderContent(undefined, { showSwipeHandle: () => true });

    expect(
      popup().querySelector('[data-slot="drawer-swipe-handle"]'),
    ).not.toBeNull();
  });

  it("showSwipeHandle=false 时不渲染把手", () => {
    renderContent();

    expect(
      popup().querySelector('[data-slot="drawer-swipe-handle"]'),
    ).toBeNull();
  });

  it("合并外部 class 与 classList，并透传其余属性", () => {
    renderContent({
      class: "my-popup",
      classList: { "is-wide": true },
      "data-testid": "popup-extra",
    } as never);

    expect(popup()).toHaveClass("my-popup");
    expect(popup()).toHaveClass("is-wide");
    expect(popup()).toHaveAttribute("data-testid", "popup-extra");
  });
});

describe("DrawerContent - ARIA 与状态属性", () => {
  it("面板是 role=dialog、aria-modal=true、tabindex=-1", () => {
    renderContent();

    expect(popup()).toHaveAttribute("role", "dialog");
    expect(popup()).toHaveAttribute("aria-modal", "true");
    expect(popup()).toHaveAttribute("tabindex", "-1");
  });

  it("id 固定为 context 的 contentId", () => {
    renderContent(undefined, { contentId: "drawer-content-7" });

    expect(popup()).toHaveAttribute("id", "drawer-content-7");
  });

  it("Title/Description 注册后输出 aria-labelledby / aria-describedby", () => {
    renderContent(undefined, {
      titleId: () => "drawer-title-1",
      descriptionId: () => "drawer-description-2",
    });

    expect(popup()).toHaveAttribute("aria-labelledby", "drawer-title-1");
    expect(popup()).toHaveAttribute("aria-describedby", "drawer-description-2");
  });

  it("没有注册 Title/Description 时不输出这两个关联", () => {
    renderContent();

    expect(popup()).not.toHaveAttribute("aria-labelledby");
    expect(popup()).not.toHaveAttribute("aria-describedby");
  });

  it("data-state 跟随开关", () => {
    renderContent(undefined, { open: () => false, show: () => true });

    expect(popup()).toHaveAttribute("data-state", "closed");
  });

  it("data-swipe-direction 与 data-swipe-axis 跟随方向", () => {
    renderContent(undefined, { swipeDirection: () => "left" });

    expect(popup()).toHaveAttribute("data-swipe-direction", "left");
    expect(popup()).toHaveAttribute("data-swipe-axis", "x");
  });

  it("纵向方向下 data-swipe-axis=y", () => {
    renderContent();

    expect(popup()).toHaveAttribute("data-swipe-axis", "y");
  });
});

describe("DrawerContent - 出入场过渡", () => {
  it("打开时先以关闭位置挂载，rAF 后切到打开位置", () => {
    const frames = stubAnimationFrame();
    renderContent();

    expect(popup().style.transform).toBe("translate3d(0, 100%, 0)");
    expect(frames.pending()).toBe(1);

    frames.flush();

    expect(popup().style.transform).toBe("translate3d(0, 0, 0)");
    expect(popup().style.transition).toBe(
      "transform 450ms cubic-bezier(0.32, 0.72, 0, 1)",
    );
  });

  it("横向方向的关闭位置沿 x 轴", () => {
    stubAnimationFrame();
    renderContent(undefined, { swipeDirection: () => "right" });

    expect(popup().style.transform).toBe("translate3d(100%, 0, 0)");
  });

  it("关闭（open=false）时回到关闭位置", () => {
    stubAnimationFrame();
    renderContent(undefined, { open: () => false, show: () => true });

    expect(popup().style.transform).toBe("translate3d(0, 100%, 0)");
  });

  it("show 收起时取消未落地的入场帧", () => {
    const frames = stubAnimationFrame();
    const [show, setShow] = createSignal(true);
    renderContent(undefined, { show });

    expect(frames.pending()).toBe(1);

    setShow(false);
    frames.flush();

    // show=false 后组件被 Show 卸载，这里只验证帧已被取消
    expect(frames.pending()).toBe(0);
  });

  it("拖拽期间用位移替代过渡，并输出 data-swiping", () => {
    stubAnimationFrame();
    renderContent();

    fireEvent.pointerDown(popup(), { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 40 });

    expect(popup()).toHaveAttribute("data-swiping", "");
    expect(popup().style.transform).toBe("translate3d(0px, 40px, 0)");
    expect(popup().style.transition).toBe("none");
  });
});

describe("DrawerContent - 退场收尾", () => {
  it("transitionend 来自子元素时不处理", () => {
    const setShow = vi.fn();
    renderContent({ children: <span>子元素</span> }, { setShow });

    fireEvent.transitionEnd(popup().querySelector("span")!);

    expect(setShow).not.toHaveBeenCalled();
  });

  it("仍处于打开状态时的 transitionend 不卸载", () => {
    const setShow = vi.fn();
    renderContent(undefined, { setShow });

    fireEvent.transitionEnd(popup());

    expect(setShow).not.toHaveBeenCalled();
  });

  it("关闭动画结束后还焦并卸载面板", () => {
    const setShow = vi.fn();
    const restoreFocus = vi.fn();
    renderContent(undefined, {
      open: () => false,
      show: () => true,
      setShow,
      restoreFocus,
    });

    fireEvent.transitionEnd(popup());

    expect(restoreFocus).toHaveBeenCalledTimes(1);
    expect(setShow).toHaveBeenCalledWith(false);
  });
});

describe("DrawerContent - 焦点", () => {
  it("入场帧落地后聚焦面板", () => {
    const frames = stubAnimationFrame();
    const [registered, setRegistered] = createSignal<HTMLElement>();
    renderContent(undefined, { popup: registered, setPopup: setRegistered });

    expect(document.activeElement).not.toBe(popup());

    frames.flush();

    expect(document.activeElement).toBe(popup());
  });

  it("popup 尚未注册时聚焦不报错", () => {
    const frames = stubAnimationFrame();
    renderContent(undefined, { popup: () => undefined });

    expect(() => frames.flush()).not.toThrow();
  });
});
