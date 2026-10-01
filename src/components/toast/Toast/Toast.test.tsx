import { fireEvent, render } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";
import type { ToastProps, ToastT } from "./Toast.types";

/**
 * `requestAnimationFrame` 在 jsdom 里依赖真实帧时钟，用例无法等到"确定的某一帧"。
 * 默认替换为同步实现，让"挂载后置 data-state=open"这条分支可断言；
 * 需要观察初始 closed 的用例再单独换成"手动触发"的实现（见 TESTING.md §4.5）。
 */
function stubSyncRaf() {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
}

function renderToast(
  props: Partial<ToastProps> = {},
  toast: Partial<ToastT> = {},
) {
  const onRemove = vi.fn();
  const result = render(() => (
    <Toast
      toast={{ id: "t1", title: "已保存", ...toast }}
      closeButton={false}
      onRemove={onRemove}
      index={0}
      total={1}
      expanded={false}
      position="bottom-right"
      gap={14}
      {...props}
    />
  ));

  const element = () =>
    result.container.querySelector('[data-slot="toast"]') as HTMLElement;

  return { ...result, onRemove, element };
}

beforeEach(() => {
  vi.useFakeTimers();
  stubSyncRaf();
});

describe("Toast 渲染", () => {
  it("渲染 data-slot / data-type / data-state 契约属性", () => {
    const { element } = renderToast({}, { type: "success" });

    expect(element()).toHaveAttribute("data-slot", "toast");
    expect(element()).toHaveAttribute("data-type", "success");
    expect(element()).toHaveAttribute("data-state", "open");
  });

  it("未指定 type 时回退到 default", () => {
    const { element } = renderToast();

    expect(element()).toHaveAttribute("data-type", "default");
  });

  it("挂载后下一帧才从 closed 进入 open（进出场动画的起始态）", () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return 1;
    });

    const { element } = renderToast();
    expect(element()).toHaveAttribute("data-state", "closed");

    for (const callback of callbacks) callback(0);
    expect(element()).toHaveAttribute("data-state", "open");
  });

  it("richColors 默认为 false，toast 级设置优先于 Toaster 默认值", () => {
    expect(renderToast().element()).toHaveAttribute(
      "data-rich-colors",
      "false",
    );
    expect(renderToast({ defaultRichColors: true }).element()).toHaveAttribute(
      "data-rich-colors",
      "true",
    );
    expect(
      renderToast({ defaultRichColors: true }, { richColors: false }).element(),
    ).toHaveAttribute("data-rich-colors", "false");
  });

  it("透传 testId 到 data-testid", () => {
    const { element } = renderToast({}, { testId: "save-toast" });

    expect(element()).toHaveAttribute("data-testid", "save-toast");
  });

  it("class 与 classes 合并进 li 的 class", () => {
    // 注意：clsx 内部用 tailwind-merge，形如 from-* 的名字会被判为冲突而只留最后一个
    const { element } = renderToast(
      { class: "toaster-custom" },
      { class: "toast-custom", classes: { toast: "classes-custom" } },
    );

    expect(element()).toHaveClass("toaster-custom");
    expect(element()).toHaveClass("toast-custom");
    expect(element()).toHaveClass("classes-custom");
  });

  it("closeButton 开启时给标题区留出右侧内边距", () => {
    expect(renderToast({ closeButton: true }).element()).toHaveClass("pr-8");
    expect(renderToast({ closeButton: false }).element()).not.toHaveClass(
      "pr-8",
    );
  });
});

describe("Toast 内容", () => {
  it("渲染 title 与 description", () => {
    const { container } = renderToast({}, { description: "草稿已同步" });

    expect(
      container.querySelector('[data-slot="toast-title"]'),
    ).toHaveTextContent("已保存");
    expect(
      container.querySelector('[data-slot="toast-description"]'),
    ).toHaveTextContent("草稿已同步");
  });

  it("title / description 支持惰性函数", () => {
    const { container } = renderToast(
      {},
      { title: () => "函数标题", description: () => "函数描述" },
    );

    expect(
      container.querySelector('[data-slot="toast-title"]'),
    ).toHaveTextContent("函数标题");
    expect(
      container.querySelector('[data-slot="toast-description"]'),
    ).toHaveTextContent("函数描述");
  });

  it("没有 description 时不渲染描述节点", () => {
    const { container } = renderToast();

    expect(
      container.querySelector('[data-slot="toast-description"]'),
    ).toBeNull();
  });

  it("提供 jsx 时走自定义渲染，不渲染标题/图标结构", () => {
    const { container } = renderToast({}, { jsx: <p>完全自定义</p> });

    expect(container.querySelector("p")).toHaveTextContent("完全自定义");
    expect(container.querySelector('[data-slot="toast-content"]')).toBeNull();
    expect(container.querySelector('[data-slot="toast-icon"]')).toBeNull();
  });
});

describe("Toast 图标", () => {
  it.each(["success", "info", "warning", "error"] as const)(
    "%s 类型渲染内置图标",
    (type) => {
      const { container } = renderToast({}, { type });

      const icon = container.querySelector('[data-slot="toast-icon"]');
      expect(icon).not.toBeNull();
      expect(icon?.querySelector("svg")).not.toBeNull();
    },
  );

  it("loading 类型的内置图标是旋转的 loader", () => {
    const { container } = renderToast({}, { type: "loading" });

    const svg = container.querySelector('[data-slot="toast-icon"] svg');
    expect(svg).toHaveClass("animate-spin");
  });

  it("default 类型没有内置图标", () => {
    const { container } = renderToast();

    expect(container.querySelector('[data-slot="toast-icon"]')).toBeNull();
  });

  it("icons 映射覆盖内置图标", () => {
    const { container } = renderToast(
      { icons: { success: <span data-icon="mapped" /> } },
      { type: "success" },
    );

    expect(container.querySelector('[data-icon="mapped"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="toast-icon"] svg')).toBeNull();
  });

  it("icons 未提供对应类型时回退到内置图标", () => {
    const { container } = renderToast(
      { icons: { error: <span data-icon="error" /> } },
      { type: "success" },
    );

    expect(
      container.querySelector('[data-slot="toast-icon"] svg'),
    ).not.toBeNull();
  });

  it("toast.icon 优先于 icons 映射与内置图标", () => {
    const { container } = renderToast(
      { icons: { success: <span data-icon="mapped" /> } },
      { type: "success", icon: <span data-icon="explicit" /> },
    );

    expect(
      container.querySelector('[data-icon="explicit"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-icon="mapped"]')).toBeNull();
  });
});

describe("Toast 操作按钮", () => {
  it("Action 形式的 action 渲染按钮并展示 label", () => {
    const { container } = renderToast(
      {},
      { action: { label: "撤销", onClick: vi.fn() } },
    );

    expect(
      container.querySelector('[data-slot="toast-action"]'),
    ).toHaveTextContent("撤销");
  });

  it("点击 action 先回调 onClick 再关闭", () => {
    const onClick = vi.fn();
    const onDismiss = vi.fn();
    const { container, element, onRemove } = renderToast(
      {},
      { action: { label: "撤销", onClick }, onDismiss },
    );

    fireEvent.click(
      container.querySelector('[data-slot="toast-action"]') as HTMLElement,
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(element()).toHaveAttribute("data-state", "closed");
    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
    );

    vi.advanceTimersByTime(199);
    expect(onRemove).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onRemove).toHaveBeenCalledWith("t1");
  });

  it("action 的 onClick 调用 preventDefault 时保持打开", () => {
    const { container, element } = renderToast(
      {},
      {
        action: {
          label: "撤销",
          onClick: (event) => event.preventDefault(),
        },
      },
    );

    fireEvent.click(
      container.querySelector('[data-slot="toast-action"]') as HTMLElement,
    );

    expect(element()).toHaveAttribute("data-state", "open");
  });

  it("非 Action 的 action 作为自定义元素直接渲染", () => {
    const { container } = renderToast({}, { action: <a href="/undo">撤销</a> });

    expect(container.querySelector("a")).toHaveAttribute("href", "/undo");
    expect(container.querySelector('[data-slot="toast-action"]')).toBeNull();
  });

  it("cancel 与 action 走同一套关闭语义", () => {
    const onClick = vi.fn();
    const { container, element } = renderToast(
      {},
      { cancel: { label: "不再提示", onClick } },
    );

    fireEvent.click(
      container.querySelector('[data-slot="toast-cancel"]') as HTMLElement,
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(element()).toHaveAttribute("data-state", "closed");
  });

  it("非 Action 的 cancel 作为自定义元素直接渲染", () => {
    const { container } = renderToast({}, { cancel: <em>取消</em> });

    expect(container.querySelector("em")).toHaveTextContent("取消");
    expect(container.querySelector('[data-slot="toast-cancel"]')).toBeNull();
  });
});

describe("Toast 关闭按钮", () => {
  it("closeButton 开启时渲染关闭按钮，默认无障碍名为 Close toast", () => {
    const { container } = renderToast({ closeButton: true });

    expect(
      container.querySelector('[data-slot="toast-close"]'),
    ).toHaveAccessibleName("Close toast");
  });

  it("支持自定义关闭按钮无障碍名", () => {
    const { container } = renderToast({
      closeButton: true,
      closeButtonAriaLabel: "关闭通知",
    });

    expect(
      container.querySelector('[data-slot="toast-close"]'),
    ).toHaveAccessibleName("关闭通知");
  });

  it("点击关闭按钮触发退场并在动画结束后移除", () => {
    const onDismiss = vi.fn();
    const { container, element, onRemove } = renderToast(
      { closeButton: true },
      { onDismiss },
    );

    fireEvent.click(
      container.querySelector('[data-slot="toast-close"]') as HTMLElement,
    );

    expect(element()).toHaveAttribute("data-state", "closed");
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(onRemove).toHaveBeenCalledWith("t1");
  });

  it("重复点击关闭按钮只触发一次 onDismiss", () => {
    const onDismiss = vi.fn();
    const { container } = renderToast({ closeButton: true }, { onDismiss });

    const button = container.querySelector(
      '[data-slot="toast-close"]',
    ) as HTMLElement;
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismissible=false 时不渲染关闭按钮", () => {
    const { container } = renderToast(
      { closeButton: true },
      { dismissible: false },
    );

    expect(container.querySelector('[data-slot="toast-close"]')).toBeNull();
  });

  it("loading 类型是常驻的，不渲染关闭按钮", () => {
    const { container } = renderToast(
      { closeButton: true },
      { type: "loading" },
    );

    expect(container.querySelector('[data-slot="toast-close"]')).toBeNull();
  });

  it("closeButton 关闭时不渲染关闭按钮", () => {
    const { container } = renderToast({ closeButton: false });

    expect(container.querySelector('[data-slot="toast-close"]')).toBeNull();
  });
});

describe("Toast 自动关闭", () => {
  it("默认 4000ms 后回调 onAutoClose 并退场", () => {
    const onAutoClose = vi.fn();
    const { element, onRemove } = renderToast({}, { onAutoClose });

    vi.advanceTimersByTime(3999);
    expect(element()).toHaveAttribute("data-state", "open");

    vi.advanceTimersByTime(1);
    expect(onAutoClose).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
    );
    expect(element()).toHaveAttribute("data-state", "closed");

    vi.advanceTimersByTime(200);
    expect(onRemove).toHaveBeenCalledWith("t1");
  });

  it("toast 级 duration 优先于 Toaster 的 duration", () => {
    const { element } = renderToast({ duration: 5000 }, { duration: 1000 });

    vi.advanceTimersByTime(1000);
    expect(element()).toHaveAttribute("data-state", "closed");
  });

  it("没有 toast 级 duration 时使用 Toaster 的 duration", () => {
    const { element } = renderToast({ duration: 1000 });

    vi.advanceTimersByTime(999);
    expect(element()).toHaveAttribute("data-state", "open");
    vi.advanceTimersByTime(1);
    expect(element()).toHaveAttribute("data-state", "closed");
  });

  it.each([
    ["duration 为 Infinity", { duration: Infinity }],
    ["duration 为 0", { duration: 0 }],
    ["loading 类型", { type: "loading" as const }],
  ])("%s 时不安排自动关闭", (_name, toast) => {
    const onAutoClose = vi.fn();
    const { element } = renderToast({}, { ...toast, onAutoClose });

    vi.advanceTimersByTime(10_000);

    expect(onAutoClose).not.toHaveBeenCalled();
    expect(element()).toHaveAttribute("data-state", "open");
  });
});

describe("Toast 外部 dismiss", () => {
  it("toast.delete 置位后退场并通知 onDismiss", () => {
    const onDismiss = vi.fn();
    const { element, onRemove } = renderToast({}, { delete: true, onDismiss });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(element()).toHaveAttribute("data-state", "closed");

    vi.advanceTimersByTime(200);
    expect(onRemove).toHaveBeenCalledWith("t1");
  });
});
