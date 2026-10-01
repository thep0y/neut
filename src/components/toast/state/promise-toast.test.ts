import { describe, expect, it, vi } from "vitest";
import { createPromiseToast, type PromiseToastPorts } from "./promise-toast";

function createPorts(): PromiseToastPorts {
  let counter = 0;
  return {
    // 默认用自增 id，模拟 store 的 createToast 返回值
    show: vi.fn(() => `generated-${++counter}`),
    dismiss: vi.fn(),
  };
}

/** 等到 `finally` 被调用，避免用 setTimeout 猜时序 */
function settled(finallySpy: ReturnType<typeof vi.fn>) {
  return new Promise<void>((resolve) => {
    finallySpy.mockImplementation(() => resolve());
  });
}

describe("createPromiseToast", () => {
  it("没有配置时直接返回 undefined，不产生任何 toast", () => {
    const ports = createPorts();

    expect(
      createPromiseToast(Promise.resolve(1), undefined, ports),
    ).toBeUndefined();
    expect(ports.show).not.toHaveBeenCalled();
  });

  it("配置了 loading 时先挂一条 loading，并在结束时替换为 success", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);

    const id = createPromiseToast(
      Promise.resolve("ok"),
      {
        loading: "加载中",
        success: "成功",
        finally: done,
      },
      ports,
    );

    // loading 那条会把 PromiseData 里的字段一并带进 toast 对象（既有语义）
    expect(ports.show).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "loading", message: "加载中" }),
    );
    expect(id).toBe("generated-1");

    await finished;

    expect(ports.show).toHaveBeenNthCalledWith(2, {
      id: "generated-1",
      type: "success",
      message: "成功",
      description: undefined,
    });
    expect(ports.dismiss).not.toHaveBeenCalled();
  });

  it("没有 loading 时不预建 toast，id 为 undefined", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);

    const id = createPromiseToast(
      Promise.resolve(1),
      {
        success: "成功",
        finally: done,
      },
      ports,
    );

    expect(id).toBeUndefined();

    await finished;

    expect(ports.show).toHaveBeenCalledExactlyOnceWith({
      id: undefined,
      type: "success",
      message: "成功",
      description: undefined,
    });
  });

  it("success 是函数时用 settle 结果求值（支持异步）", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);
    const success = vi.fn(async (value: number) => `拿到 ${value}`);

    createPromiseToast(Promise.resolve(7), { success, finally: done }, ports);
    await finished;

    expect(success).toHaveBeenCalledWith(7);
    expect(ports.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", message: "拿到 7" }),
    );
  });

  it("success 返回 undefined 时收起已有 loading，不生成 success", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);

    createPromiseToast(
      Promise.resolve(1),
      {
        loading: "加载中",
        success: undefined,
        finally: done,
      },
      ports,
    );
    await finished;

    expect(ports.show).toHaveBeenCalledTimes(1);
    expect(ports.dismiss).toHaveBeenCalledWith("generated-1");
  });

  it("success 返回 undefined 且没有 loading 时什么都不做", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);

    createPromiseToast(Promise.resolve(1), { finally: done }, ports);
    await finished;

    expect(ports.show).not.toHaveBeenCalled();
    expect(ports.dismiss).not.toHaveBeenCalled();
  });

  it("promise 拒绝时走 error 分支并拿到原始错误", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);
    const error = vi.fn((reason: Error) => `失败：${reason.message}`);

    createPromiseToast(
      Promise.reject(new Error("网络错误")),
      {
        loading: "加载中",
        success: "成功",
        error,
        finally: done,
      },
      ports,
    );
    await finished;

    expect(error).toHaveBeenCalledWith(expect.any(Error));
    expect(ports.show).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "generated-1",
        type: "error",
        message: "失败：网络错误",
      }),
    );
  });

  it("error 返回 undefined 时同样收起 loading", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);

    createPromiseToast(
      Promise.reject(new Error("x")),
      {
        loading: "加载中",
        error: undefined,
        finally: done,
      },
      ports,
    );
    await finished;

    expect(ports.dismiss).toHaveBeenCalledWith("generated-1");
  });

  it("description 支持静态值与函数（函数拿到 settle 结果）", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);
    const description = vi.fn((value: number) => `结果 ${value}`);

    createPromiseToast(
      Promise.resolve(3),
      {
        success: "成功",
        description,
        finally: done,
      },
      ports,
    );
    await finished;

    expect(description).toHaveBeenCalledWith(3);
    expect(ports.show).toHaveBeenCalledWith(
      expect.objectContaining({ description: "结果 3" }),
    );
  });

  it("description 为静态值时不求值", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);

    createPromiseToast(
      Promise.resolve(1),
      {
        success: "成功",
        description: "静态描述",
        finally: done,
      },
      ports,
    );
    await finished;

    expect(ports.show).toHaveBeenCalledWith(
      expect.objectContaining({ description: "静态描述" }),
    );
  });

  it("promise 传函数时先调用再等待", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);
    const factory = vi.fn(() => Promise.resolve("ok"));

    createPromiseToast(factory, { success: "成功", finally: done }, ports);
    await finished;

    expect(factory).toHaveBeenCalledTimes(1);
    expect(ports.show).toHaveBeenCalledWith(
      expect.objectContaining({ message: "成功" }),
    );
  });

  it("success resolver 自身抛错时转入 error 分支（既有语义）", async () => {
    const ports = createPorts();
    const done = vi.fn();
    const finished = settled(done);
    const error = vi.fn(() => "兜底错误");

    createPromiseToast(
      Promise.resolve(1),
      {
        loading: "加载中",
        success: () => {
          throw new Error("resolver 炸了");
        },
        error,
        finally: done,
      },
      ports,
    );
    await finished;

    expect(error).toHaveBeenCalledWith(expect.any(Error));
    expect(ports.show).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "error", message: "兜底错误" }),
    );
  });
});
