import { describe, expect, it, vi } from "vitest";
import type { ContextMenuSubmenuContextValue } from "~/components/context-menu/context-menu.types";
import {
  cancelSubmenuCloseChain,
  createChangeEventDetails,
  getContextMenuTransformOrigin,
  resolveContextMenuDataSide,
  toContextMenuPlacement,
} from "~/components/context-menu/context-menu.utils";

describe("toContextMenuPlacement", () => {
  it("物理方向 + 对齐后缀组成 placement", () => {
    expect(toContextMenuPlacement("right", "start", undefined)).toBe(
      "right-start",
    );
    expect(toContextMenuPlacement("top", "end", undefined)).toBe("top-end");
  });

  it("align=center 时不带后缀", () => {
    expect(toContextMenuPlacement("bottom", "center", undefined)).toBe(
      "bottom",
    );
  });

  it("逻辑方向按 dir 解析：LTR 下 inline-start 是左侧", () => {
    expect(toContextMenuPlacement("inline-start", "start", "ltr")).toBe(
      "left-start",
    );
  });

  it("RTL 下 inline-start 翻到右侧", () => {
    expect(toContextMenuPlacement("inline-end", "center", "rtl")).toBe("left");
  });

  it("dir 为 auto 时按 LTR 处理", () => {
    expect(toContextMenuPlacement("inline-end", "start", "auto")).toBe(
      "right-start",
    );
  });
});

describe("getContextMenuTransformOrigin", () => {
  it("贴在锚点上的角随 side/align 变化", () => {
    expect(getContextMenuTransformOrigin("right-start")).toBe("0% 0%");
    expect(getContextMenuTransformOrigin("bottom-end")).toBe("100% 0%");
    expect(getContextMenuTransformOrigin("top")).toBe("50% 100%");
    expect(getContextMenuTransformOrigin("left-end")).toBe("100% 100%");
  });
});

describe("resolveContextMenuDataSide", () => {
  it("物理方向直接回写实际 side", () => {
    expect(resolveContextMenuDataSide("right", "right-start", undefined)).toBe(
      "right",
    );
  });

  it("翻转到另一侧时回写实际物理方向", () => {
    expect(resolveContextMenuDataSide("right", "left-start", undefined)).toBe(
      "left",
    );
  });

  it("逻辑方向未被翻转时保留逻辑值，供 data-[side=inline-*] 命中", () => {
    expect(resolveContextMenuDataSide("inline-end", "right-start", "ltr")).toBe(
      "inline-end",
    );
    expect(
      resolveContextMenuDataSide("inline-start", "right-start", "rtl"),
    ).toBe("inline-start");
  });

  it("逻辑方向被翻转时不再保留逻辑值", () => {
    expect(resolveContextMenuDataSide("inline-end", "left-start", "ltr")).toBe(
      "left",
    );
  });
});

describe("createChangeEventDetails", () => {
  it("携带 reason / event / trigger，且初始未取消", () => {
    const event = new MouseEvent("contextmenu");
    const trigger = document.createElement("div");
    const details = createChangeEventDetails("trigger-press", event, trigger);

    expect(details.reason).toBe("trigger-press");
    expect(details.event).toBe(event);
    expect(details.trigger).toBe(trigger);
    expect(details.isCanceled).toBe(false);
  });

  it("cancel() 之后 isCanceled 为 true", () => {
    const details = createChangeEventDetails("escape-key");
    details.cancel();

    expect(details.isCanceled).toBe(true);
  });

  it("缺省 event / trigger 时为 undefined", () => {
    const details = createChangeEventDetails("item-press");

    expect(details.event).toBeUndefined();
    expect(details.trigger).toBeUndefined();
  });
});

describe("cancelSubmenuCloseChain", () => {
  function submenu(
    parent: ContextMenuSubmenuContextValue | undefined,
    cancelClose = vi.fn(),
  ): { value: ContextMenuSubmenuContextValue; cancelClose: () => void } {
    return {
      value: {
        cancelClose,
        parentPopup: { submenu: parent },
      } as unknown as ContextMenuSubmenuContextValue,
      cancelClose,
    };
  }

  it("没有子菜单时什么都不做", () => {
    expect(() => cancelSubmenuCloseChain(undefined)).not.toThrow();
  });

  it("单层子菜单取消自己的待关闭定时器", () => {
    const child = submenu(undefined);

    cancelSubmenuCloseChain(child.value);

    expect(child.cancelClose).toHaveBeenCalledTimes(1);
  });

  it("多级菜单沿父链一路取消，避免父级 grace 后连坐关闭", () => {
    const root = submenu(undefined);
    const middle = submenu(root.value);
    const leaf = submenu(middle.value);

    cancelSubmenuCloseChain(leaf.value);

    expect(leaf.cancelClose).toHaveBeenCalledTimes(1);
    expect(middle.cancelClose).toHaveBeenCalledTimes(1);
    expect(root.cancelClose).toHaveBeenCalledTimes(1);
  });
});
