import { describe, expect, it, vi } from "vitest";
import { handleResizableHandleKeyDown } from "~/components/resizable/ResizableHandle/resizable.handle-keys";

function key(keyName: string): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key: keyName,
    bubbles: true,
    cancelable: true,
  });
}

function setup(
  overrides: {
    stepPercent?: number;
    rtl?: boolean;
    total?: number | undefined;
  } = {},
) {
  const handle = document.createElement("div");
  const nudgeAdjacent = vi.fn();
  const setAdjacentSize = vi.fn();
  const commitLayout = vi.fn();
  const toggleHandleCollapse = vi.fn();
  const resolveAdjacent = vi.fn(() =>
    overrides.total === undefined ? undefined : { total: overrides.total },
  );

  const ctx = {
    stepPercent: overrides.stepPercent ?? 2.5,
    rtl: overrides.rtl ?? false,
    resolveAdjacent,
    nudgeAdjacent,
    setAdjacentSize,
    commitLayout,
    toggleHandleCollapse,
  };

  const dispatch = (event: KeyboardEvent) => {
    handleResizableHandleKeyDown(event, handle, ctx);
    return event;
  };

  return {
    handle,
    dispatch,
    nudgeAdjacent,
    setAdjacentSize,
    commitLayout,
    toggleHandleCollapse,
    resolveAdjacent,
  };
}

describe("handleResizableHandleKeyDown 方向键", () => {
  it("LTR 横向：ArrowRight 正向、ArrowLeft 反向微调", () => {
    const { dispatch, nudgeAdjacent, handle } = setup();

    const right = dispatch(key("ArrowRight"));
    expect(nudgeAdjacent).toHaveBeenLastCalledWith(handle, 2.5);
    expect(right.defaultPrevented).toBe(true);

    dispatch(key("ArrowLeft"));
    expect(nudgeAdjacent).toHaveBeenLastCalledWith(handle, -2.5);
  });

  it("RTL 横向：左右方向取反", () => {
    const { dispatch, nudgeAdjacent, handle } = setup({ rtl: true });

    dispatch(key("ArrowRight"));
    expect(nudgeAdjacent).toHaveBeenLastCalledWith(handle, -2.5);

    dispatch(key("ArrowLeft"));
    expect(nudgeAdjacent).toHaveBeenLastCalledWith(handle, 2.5);
  });

  it("纵向：ArrowDown 正向、ArrowUp 反向（RTL 不影响）", () => {
    const { dispatch, nudgeAdjacent, handle } = setup({ rtl: true });

    dispatch(key("ArrowDown"));
    expect(nudgeAdjacent).toHaveBeenLastCalledWith(handle, 2.5);

    dispatch(key("ArrowUp"));
    expect(nudgeAdjacent).toHaveBeenLastCalledWith(handle, -2.5);
  });

  it("步长按传入的百分比使用", () => {
    const { dispatch, nudgeAdjacent, handle } = setup({ stepPercent: 12.5 });

    dispatch(key("ArrowDown"));

    expect(nudgeAdjacent).toHaveBeenLastCalledWith(handle, 12.5);
  });
});

describe("handleResizableHandleKeyDown Home / End", () => {
  it("Home 把前一个面板收到 0 并提交布局", () => {
    const { dispatch, setAdjacentSize, commitLayout, handle } = setup({
      total: 100,
    });

    const event = dispatch(key("Home"));

    expect(setAdjacentSize).toHaveBeenCalledWith(handle, 0);
    expect(commitLayout).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("End 把前一个面板推到总和", () => {
    const { dispatch, setAdjacentSize, commitLayout, handle } = setup({
      total: 70,
    });

    dispatch(key("End"));

    expect(setAdjacentSize).toHaveBeenCalledWith(handle, 70);
    expect(commitLayout).toHaveBeenCalledTimes(1);
  });

  it("没有相邻面板时 Home/End 不动作（但仍阻止默认行为）", () => {
    const { dispatch, setAdjacentSize, commitLayout } = setup({
      total: undefined,
    });

    const home = dispatch(key("Home"));
    const end = dispatch(key("End"));

    expect(setAdjacentSize).not.toHaveBeenCalled();
    expect(commitLayout).not.toHaveBeenCalled();
    expect(home.defaultPrevented).toBe(true);
    expect(end.defaultPrevented).toBe(true);
  });
});

describe("handleResizableHandleKeyDown 折叠与放行", () => {
  it("Enter 与 Space 切换相邻可折叠面板", () => {
    const { dispatch, toggleHandleCollapse, handle } = setup();

    dispatch(key("Enter"));
    dispatch(key(" "));

    expect(toggleHandleCollapse).toHaveBeenCalledTimes(2);
    expect(toggleHandleCollapse).toHaveBeenLastCalledWith(handle);
  });

  it("未识别的按键不阻止默认行为也不触发任何动作", () => {
    const { dispatch, nudgeAdjacent, toggleHandleCollapse } = setup();

    const event = dispatch(key("a"));

    expect(event.defaultPrevented).toBe(false);
    expect(nudgeAdjacent).not.toHaveBeenCalled();
    expect(toggleHandleCollapse).not.toHaveBeenCalled();
  });
});
