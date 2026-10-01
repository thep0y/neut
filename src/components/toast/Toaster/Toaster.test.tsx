import { render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "./Toaster";
import { removeToast, toast as toastApi } from "../state/toast";
import type { ExternalToast } from "../Toast/Toast.types";

function addToast(message: string, options: ExternalToast = {}) {
  return toastApi(message, options);
}

function viewports() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="toaster-viewport"]'),
  );
}

function renderedToasts() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="toast"]'),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  // 同步 rAF：让 Toast 的 data-state 在断言前就稳定为 open（见 Toast.test.tsx 的说明）
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  document.documentElement.removeAttribute("dir");
});

afterEach(() => {
  for (const item of [...toastApi.getToasts()]) removeToast(item.id);
});

describe("Toaster 容器", () => {
  it("挂到 body 上并渲染带 live region 语义的视口", () => {
    addToast("已保存");

    render(() => <Toaster />);

    const toaster = document.querySelector('[data-slot="toaster"]');
    expect(toaster).not.toBeNull();

    const [viewport] = viewports();
    expect(viewport.tagName).toBe("OL");
    expect(viewport).toHaveAttribute("aria-live", "polite");
    expect(viewport).toHaveAttribute("aria-relevant", "additions text");
    expect(viewport).toHaveAttribute("aria-atomic", "false");
    expect(viewport).toHaveAttribute("aria-label", "Notifications");
    expect(viewport).toHaveAttribute("tabindex", "-1");
    expect(viewport).toHaveAttribute("data-position", "bottom-right");
  });

  it("没有 toast 时不渲染视口", () => {
    render(() => <Toaster />);

    expect(viewports()).toHaveLength(0);
  });

  it("containerAriaLabel 可自定义，customAriaLabel 优先", () => {
    addToast("已保存");

    const { unmount } = render(() => <Toaster containerAriaLabel="通知中心" />);
    expect(viewports()[0]).toHaveAttribute("aria-label", "通知中心");
    unmount();

    render(() => (
      <Toaster containerAriaLabel="通知中心" customAriaLabel="自定义通知" />
    ));
    expect(viewports()[0]).toHaveAttribute("aria-label", "自定义通知");
  });

  it("dir 为具体值时直接使用", () => {
    addToast("已保存");

    render(() => <Toaster dir="rtl" />);

    expect(document.querySelector('[data-slot="toaster"]')).toHaveAttribute(
      "dir",
      "rtl",
    );
  });

  it("dir=auto 时回退到文档方向", () => {
    addToast("已保存");

    render(() => <Toaster dir="auto" />);

    expect(document.querySelector('[data-slot="toaster"]')).toHaveAttribute(
      "dir",
      "ltr",
    );
  });
});

describe("Toaster 选择与展开", () => {
  it("默认只渲染最近的三条", () => {
    for (const message of ["一", "二", "三", "四"]) addToast(message);

    render(() => <Toaster />);

    expect(renderedToasts()).toHaveLength(3);
  });

  it("visibleToasts 可调整上限", () => {
    for (const message of ["一", "二", "三", "四"]) addToast(message);

    render(() => <Toaster visibleToasts={2} />);

    expect(renderedToasts()).toHaveLength(2);
  });

  it("expand 置位时渲染全部", () => {
    for (const message of ["一", "二", "三", "四"]) addToast(message);

    render(() => <Toaster expand />);

    expect(renderedToasts()).toHaveLength(4);
  });

  it("鼠标移入展开、移出收起（只改变叠放布局，不改变渲染条数）", () => {
    for (const message of ["一", "二", "三", "四"]) addToast(message);

    render(() => <Toaster />);
    const [viewport] = viewports();
    expect(renderedToasts()).toHaveLength(3);

    // 当前实现里 visibleToasts 是"渲染上限"，悬停只切换 grid ↔ flex 布局，
    // 被截断的 toast 仍然不进入 DOM（根级 expand 才会全部渲染）
    viewport.dispatchEvent(new MouseEvent("mouseenter"));
    expect(viewport).toHaveClass("flex-col-reverse");
    expect(renderedToasts()).toHaveLength(3);

    viewport.dispatchEvent(new MouseEvent("mouseleave"));
    expect(viewport).toHaveClass("grid");
  });

  it("收起时用 grid 叠放，展开时按位置改成正向/反向 flex 排列", () => {
    addToast("一");
    render(() => <Toaster />);
    const [bottomViewport] = viewports();

    expect(bottomViewport).toHaveClass("grid");

    bottomViewport.dispatchEvent(new MouseEvent("mouseenter"));
    expect(bottomViewport).toHaveClass("flex-col-reverse");
  });

  it("顶部位置展开时用正向 flex 排列", () => {
    addToast("一");
    render(() => <Toaster position="top-center" />);
    const [viewport] = viewports();

    viewport.dispatchEvent(new MouseEvent("mouseenter"));

    expect(viewport).toHaveClass("flex-col");
    expect(viewport).not.toHaveClass("flex-col-reverse");
  });

  it("alt+T 热键展开、Escape 收起", () => {
    addToast("一");

    render(() => <Toaster />);
    const [viewport] = viewports();
    expect(viewport).toHaveClass("grid");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }),
    );
    expect(viewport).toHaveClass("flex-col-reverse");

    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
    expect(viewport).toHaveClass("grid");
  });
});

describe("Toaster 多视口与归属", () => {
  it("toast 自带位置时各自成组", () => {
    addToast("默认位置");
    addToast("左上", { position: "top-left" });

    render(() => <Toaster />);

    expect(viewports().map((node) => node.dataset.position)).toEqual([
      "bottom-right",
      "top-left",
    ]);
  });

  it("id 只渲染归属该 Toaster 的 toast", () => {
    addToast("无归属");
    addToast("面板", { toasterId: "panel" });

    render(() => <Toaster id="panel" />);

    expect(renderedToasts()).toHaveLength(1);
    expect(renderedToasts()[0]).toHaveTextContent("面板");
  });

  it("未指定 id 时不渲染有归属的 toast", () => {
    addToast("无归属");
    addToast("面板", { toasterId: "panel" });

    render(() => <Toaster />);

    expect(renderedToasts()).toHaveLength(1);
    expect(renderedToasts()[0]).toHaveTextContent("无归属");
  });
});

describe("Toaster 配置下发", () => {
  it("offset 与 gap 写进视口样式", () => {
    addToast("一");

    render(() => <Toaster offset={32} mobileOffset={8} gap={20} />);

    const [viewport] = viewports();
    expect(viewport.style.bottom).toBe("32px");
    expect(viewport.style.gap).toBe("20px");
    expect(viewport.style.getPropertyValue("--mobile-offset-bottom")).toBe(
      "8px",
    );
  });

  it("style 追加到视口样式", () => {
    addToast("一");

    render(() => <Toaster style={{ "max-width": "420px" }} />);

    expect(viewports()[0].style.maxWidth).toBe("420px");
  });

  it("toastOptions.closeButton 作为默认开启关闭按钮", () => {
    addToast("一");

    render(() => <Toaster toastOptions={{ closeButton: true }} />);

    expect(document.querySelector('[data-slot="toast-close"]')).not.toBeNull();
  });

  it("根级 closeButton 是更低优先级的兜底", () => {
    addToast("一");

    render(() => <Toaster closeButton />);

    expect(document.querySelector('[data-slot="toast-close"]')).not.toBeNull();
  });

  it("单条 toast 的 closeButton 优先于 Toaster 配置", () => {
    addToast("一", { closeButton: false });

    render(() => <Toaster closeButton />);

    expect(document.querySelector('[data-slot="toast-close"]')).toBeNull();
  });

  it("toastOptions.class 追加到每条 toast", () => {
    addToast("一");

    render(() => <Toaster toastOptions={{ class: "toaster-option-class" }} />);

    expect(renderedToasts()[0]).toHaveClass("toaster-option-class");
  });

  it("toastOptions.closeButtonAriaLabel 下发给关闭按钮", () => {
    addToast("一");

    render(() => (
      <Toaster
        closeButton
        toastOptions={{ closeButtonAriaLabel: "关闭这条通知" }}
      />
    ));

    expect(
      document.querySelector('[data-slot="toast-close"]'),
    ).toHaveAccessibleName("关闭这条通知");
  });

  it("toastOptions.duration 作为自动关闭兜底", () => {
    addToast("一");

    render(() => <Toaster toastOptions={{ duration: 1000 }} />);
    expect(renderedToasts()[0]).toHaveAttribute("data-state", "open");

    vi.advanceTimersByTime(1000);
    expect(renderedToasts()[0]).toHaveAttribute("data-state", "closed");
  });

  it("toastOptions.duration 优先于根级 duration", () => {
    addToast("一");

    render(() => <Toaster duration={500} toastOptions={{ duration: 1000 }} />);

    vi.advanceTimersByTime(500);
    expect(renderedToasts()[0]).toHaveAttribute("data-state", "open");

    vi.advanceTimersByTime(500);
    expect(renderedToasts()[0]).toHaveAttribute("data-state", "closed");
  });

  it("单条 toast 的 duration 优先于 Toaster 配置", () => {
    addToast("一", { duration: 200 });

    render(() => <Toaster duration={5000} />);

    vi.advanceTimersByTime(200);
    expect(renderedToasts()[0]).toHaveAttribute("data-state", "closed");
  });

  it("richColors 作为默认值下发给 toast", () => {
    addToast("一");

    render(() => <Toaster richColors />);

    expect(renderedToasts()[0]).toHaveAttribute("data-rich-colors", "true");
  });

  it("icons 按类型下发给 toast", () => {
    toastApi.success("一");

    render(() => <Toaster icons={{ success: <span data-icon="ok" /> }} />);

    expect(document.querySelector('[data-icon="ok"]')).not.toBeNull();
  });
});
