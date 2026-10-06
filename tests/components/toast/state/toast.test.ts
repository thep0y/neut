import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getToasts,
  removeToast,
  toast,
  useSonner,
} from "~/components/toast/state/toast";

function latest() {
  return getToasts()[0];
}

afterEach(() => {
  for (const item of [...getToasts()]) removeToast(item.id);
});

describe("toast 基础入口", () => {
  it("toast(message) 把消息落成 title 并默认可关闭", () => {
    const id = toast("已保存");

    expect(latest()).toMatchObject({ id, title: "已保存", dismissible: true });
  });

  it("透传外部配置", () => {
    toast("已保存", { description: "草稿已同步", duration: 2500 });

    expect(latest()).toMatchObject({
      description: "草稿已同步",
      duration: 2500,
    });
  });

  it.each([
    ["success", "success"],
    ["info", "info"],
    ["warning", "warning"],
    ["error", "error"],
    ["loading", "loading"],
  ] as const)("toast.%s 生成对应 type", (method, type) => {
    toast[method]("消息");

    expect(latest()).toMatchObject({ type, title: "消息" });
  });

  it("toast.message 与 toast() 等价", () => {
    toast.message("消息");

    expect(latest().type).toBeUndefined();
    expect(latest().title).toBe("消息");
  });
});

describe("toast.custom", () => {
  it("把生成的 id 传给 jsx 工厂", () => {
    const jsx = vi.fn((id: string) => `自定义 ${id}`);

    const id = toast.custom(jsx);

    expect(jsx).toHaveBeenCalledWith(id);
    expect(latest().jsx).toBe(`自定义 ${id}`);
  });

  it("指定 id 时使用指定的 id", () => {
    const jsx = vi.fn((id: string) => `自定义 ${id}`);

    const id = toast.custom(jsx, { id: "fixed" });

    expect(id).toBe("fixed");
    expect(jsx).toHaveBeenCalledWith("fixed");
  });
});

describe("toast 移除入口", () => {
  it("toast.dismiss(id) 只标记该条", () => {
    const a = toast("一");
    toast("二");

    toast.dismiss(a);

    expect(getToasts().find((item) => item.id === a)?.delete).toBe(true);
  });

  it("toast.dismiss() 标记全部", () => {
    toast("一");
    toast("二");

    toast.dismiss();

    expect(getToasts().every((item) => item.delete)).toBe(true);
  });

  it("toast.remove(id) 真正移除", () => {
    const a = toast("一");
    toast("二");

    toast.remove(a);

    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0].title).toBe("二");
  });

  it("toast.getToasts / getHistory 暴露同一个列表", () => {
    toast("一");

    expect(toast.getToasts()).toBe(getToasts());
    expect(toast.getHistory()).toBe(getToasts());
    expect(useSonner().toasts).toBe(getToasts());
  });
});

describe("toast.promise", () => {
  it("有 loading 配置时先创建 loading 并返回其 id", () => {
    const promise = toast.promise(Promise.resolve("ok"), {
      loading: "加载中",
      success: "成功",
    });

    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0]).toMatchObject({
      id: promise,
      type: "loading",
      title: "加载中",
    });
  });

  it("完全没有配置时返回 undefined（运行时行为，返回类型按历史约定是 string）", () => {
    expect(toast.promise(Promise.resolve("ok"))).toBeUndefined();
    expect(getToasts()).toHaveLength(0);
  });
});
