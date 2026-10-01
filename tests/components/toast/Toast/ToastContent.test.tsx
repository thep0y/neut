import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ToastContent } from "~/components/toast/Toast/ToastContent";
import type { ToastT } from "~/components/toast/Toast/Toast.types";

function toast(extra: Partial<ToastT> = {}): ToastT {
  return { id: "t1", title: "已保存", ...extra };
}

describe("ToastContent", () => {
  it("渲染标题", () => {
    const { container } = render(() => <ToastContent toast={toast()} />);

    expect(
      container.querySelector('[data-slot="toast-title"]'),
    ).toHaveTextContent("已保存");
  });

  it("标题支持惰性函数", () => {
    const { container } = render(() => (
      <ToastContent toast={toast({ title: () => "函数标题" })} />
    ));

    expect(
      container.querySelector('[data-slot="toast-title"]'),
    ).toHaveTextContent("函数标题");
  });

  it("渲染描述（含惰性函数）", () => {
    const { container } = render(() => (
      <ToastContent toast={toast({ description: () => "草稿已同步" })} />
    ));

    expect(
      container.querySelector('[data-slot="toast-description"]'),
    ).toHaveTextContent("草稿已同步");
  });

  it("没有描述时不渲染描述节点", () => {
    const { container } = render(() => <ToastContent toast={toast()} />);

    expect(
      container.querySelector('[data-slot="toast-description"]'),
    ).toBeNull();
  });

  it("内容/标题/描述的类名分别追加", () => {
    const { container } = render(() => (
      <ToastContent
        toast={toast({
          description: "说明",
          descriptionClass: "desc-extra",
          classes: {
            content: "content-extra",
            title: "title-extra",
            description: "desc-class",
          },
        })}
      />
    ));

    expect(container.querySelector('[data-slot="toast-content"]')).toHaveClass(
      "content-extra",
    );
    expect(container.querySelector('[data-slot="toast-title"]')).toHaveClass(
      "title-extra",
    );
    const description = container.querySelector(
      '[data-slot="toast-description"]',
    );
    expect(description).toHaveClass("desc-extra");
    expect(description).toHaveClass("desc-class");
  });
});
