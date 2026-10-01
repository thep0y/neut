import { afterEach, describe, expect, it } from "vitest";
import {
  createToast,
  dismissToast,
  getHistory,
  getToasts,
  removeToast,
  useSonner,
} from "~/components/toast/state/store";

function ids() {
  return getToasts().map((item) => item.id);
}

afterEach(() => {
  for (const item of [...getToasts()]) removeToast(item.id);
});

describe("store 读取入口", () => {
  it("useSonner / getToasts / getHistory 暴露同一个 store", () => {
    expect(useSonner().toasts).toBe(getToasts());
    expect(getHistory()).toBe(getToasts());
  });
});

describe("createToast", () => {
  it("未指定 id 时自动生成，并把 message 落成 title", () => {
    const id = createToast({ message: "已保存" });

    expect(id).not.toBe("");
    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0]).toMatchObject({
      id,
      title: "已保存",
      dismissible: true,
    });
  });

  it("指定 id 时沿用该 id", () => {
    createToast({ id: "fixed", message: "已保存" });

    expect(ids()).toEqual(["fixed"]);
  });

  it("新 toast 插到队首（新的在前）", () => {
    createToast({ id: "a", message: "一" });
    createToast({ id: "b", message: "二" });

    expect(ids()).toEqual(["b", "a"]);
  });

  it("透传外部数据字段", () => {
    createToast({
      id: "a",
      message: "已保存",
      type: "success",
      description: "草稿已同步",
      duration: 1500,
    });

    expect(getToasts()[0]).toMatchObject({
      type: "success",
      description: "草稿已同步",
      duration: 1500,
    });
  });

  it("dismissible 显式传 false 时保留 false", () => {
    createToast({ id: "a", message: "一", dismissible: false });

    expect(getToasts()[0].dismissible).toBe(false);
  });

  it("同 id 再次创建时原地更新，不新增条目", () => {
    createToast({ id: "a", message: "一" });
    createToast({ id: "a", message: "二" });

    expect(ids()).toEqual(["a"]);
    expect(getToasts()[0].title).toBe("二");
    expect(getToasts().length).toBe(1);
  });

  it("同 id 更新时 message 缺省则保留原标题", () => {
    createToast({ id: "a", message: "一", type: "info" });
    createToast({ id: "a", description: "补充说明" });

    expect(getToasts()[0].title).toBe("一");
    expect(getToasts()[0].description).toBe("补充说明");
  });
});

describe("dismissToast", () => {
  it("指定 id 时只标记该条为待删除", () => {
    createToast({ id: "a", message: "一" });
    createToast({ id: "b", message: "二" });

    const returned = dismissToast("a");

    expect(returned).toBe("a");
    expect(getToasts()[1]).toMatchObject({ id: "a", delete: true });
    expect(getToasts()[0].delete).toBeUndefined();
  });

  it("不传 id 时标记全部", () => {
    createToast({ id: "a", message: "一" });
    createToast({ id: "b", message: "二" });

    dismissToast();

    expect(getToasts().every((item) => item.delete)).toBe(true);
  });

  it("id 不存在时不做任何改动", () => {
    createToast({ id: "a", message: "一" });

    dismissToast("missing");

    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0].delete).toBeUndefined();
  });
});

describe("removeToast", () => {
  it("按 id 真正移除", () => {
    createToast({ id: "a", message: "一" });
    createToast({ id: "b", message: "二" });

    removeToast("a");

    expect(ids()).toEqual(["b"]);
  });

  it("id 不存在时是空操作", () => {
    createToast({ id: "a", message: "一" });

    removeToast("missing");

    expect(ids()).toEqual(["a"]);
  });
});
