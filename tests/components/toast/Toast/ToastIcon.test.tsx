import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  ToastIcon,
  getDefaultIcon,
  resolveToastIcon,
} from "~/components/toast/Toast/ToastIcon";
import type { ToastT } from "~/components/toast/Toast/Toast.types";

function toast(extra: Partial<ToastT> = {}): ToastT {
  return { id: "t1", title: "已保存", ...extra };
}

/**
 * 内置图标是 lucide 组件，必须在 render 根里创建（否则 Solid 会警告
 * "computations created outside a createRoot"），因此这里统一渲染后断言。
 */
function renderIcon(icon: () => unknown) {
  return render(() => <>{icon()}</>);
}

describe("getDefaultIcon", () => {
  it.each(["success", "info", "warning", "error", "loading"] as const)(
    "%s 有内置图标",
    (type) => {
      const { container } = renderIcon(() => getDefaultIcon(type));

      expect(container.querySelector("svg")).not.toBeNull();
    },
  );

  it("default 没有内置图标", () => {
    const { container } = renderIcon(() => getDefaultIcon("default"));

    expect(container.querySelector("svg")).toBeNull();
  });

  it("loading 的内置图标是旋转的 loader", () => {
    const { container } = renderIcon(() => getDefaultIcon("loading"));

    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });
});

describe("resolveToastIcon", () => {
  it("toast.icon 优先于 icons 映射", () => {
    const explicit = <span data-icon="explicit" />;

    const resolved = resolveToastIcon(
      toast({ type: "success", icon: explicit }),
      { success: <span data-icon="mapped" /> },
    );

    expect(resolved).toBe(explicit);
  });

  it("icons 映射优先于内置图标", () => {
    const mapped = <span data-icon="mapped" />;

    expect(
      resolveToastIcon(toast({ type: "success" }), { success: mapped }),
    ).toBe(mapped);
  });

  it("都没有时回退到内置图标", () => {
    const { container } = renderIcon(() =>
      resolveToastIcon(toast({ type: "error" })),
    );

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("type 缺省时按 default 处理（无图标）", () => {
    const { container } = renderIcon(() => resolveToastIcon(toast()));

    expect(container.querySelector("svg")).toBeNull();
  });
});

describe("ToastIcon", () => {
  it("有图标时渲染带类型类名的容器", () => {
    const { container } = render(() => (
      <ToastIcon toast={toast({ type: "success" })} />
    ));

    const icon = container.querySelector('[data-slot="toast-icon"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass("text-emerald-500");
  });

  it("classes.icon 追加到容器", () => {
    const { container } = render(() => (
      <ToastIcon
        toast={toast({ type: "info", classes: { icon: "custom-icon" } })}
      />
    ));

    expect(container.querySelector('[data-slot="toast-icon"]')).toHaveClass(
      "custom-icon",
    );
  });

  it("没有图标时整块不渲染", () => {
    const { container } = render(() => <ToastIcon toast={toast()} />);

    expect(container.querySelector('[data-slot="toast-icon"]')).toBeNull();
  });

  it("type 缺省但提供了 icon 时，容器按 default 配色", () => {
    const { container } = render(() => (
      <ToastIcon toast={toast({ icon: <span data-icon="explicit" /> })} />
    ));

    const icon = container.querySelector('[data-slot="toast-icon"]');
    expect(icon).toHaveClass("text-muted-foreground");
    expect(container.querySelector('[data-icon="explicit"]')).not.toBeNull();
  });

  it("icons 映射的元素被渲染出来", () => {
    const { container } = render(() => (
      <ToastIcon
        toast={toast({ type: "warning" })}
        icons={{ warning: <span data-icon="mapped" /> }}
      />
    ));

    expect(container.querySelector('[data-icon="mapped"]')).not.toBeNull();
  });
});
