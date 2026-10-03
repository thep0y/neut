import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as HandleLoading from "~/components/image/lib/handle-loading";

/**
 * `handleLoading` 的副作用集中在 decode 之后的微任务里，因此每个用例都要
 * 显式冲刷微任务再断言（TESTING.md §5.6）。
 *
 * `warnOnce` 的缓存是模块级 Set，`vi.resetModules()` + 重新 import 才能让
 * "发警告"的用例不被前一个用例污染。
 */
let handleLoading: typeof HandleLoading.handleLoading;

beforeEach(async () => {
  vi.resetModules();
  ({ handleLoading } = await import("~/components/image/lib/handle-loading"));
});

describe("handleLoading", () => {
  /**
   * `handleLoading` 内部是 `p.catch(() => {}).then(...)` —— 两级微任务，
   * 单次 `await Promise.resolve()` 不够。这里显式冲刷到回调执行完。
   */
  async function flushPromises(): Promise<void> {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  }

  /** 构造一个挂载在 body 里的 img（isConnected 为 true） */
  function mountedImg(src = "/a.jpg"): HTMLImageElement & {
    "data-loaded-src"?: string;
  } {
    const img = document.createElement("img") as HTMLImageElement & {
      "data-loaded-src"?: string;
    };
    Object.defineProperty(img, "src", {
      configurable: true,
      value: src,
    });
    document.body.appendChild(img);
    return img;
  }

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("调用 onLoad 并传入 load 事件", async () => {
    const img = mountedImg();
    const onLoad = vi.fn();

    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(1);
    const event = onLoad.mock.calls[0][0] as Event;
    expect(event.type).toBe("load");
    expect(event.target).toBe(img);
  });

  it("调用 onLoadingComplete 并传入 img", async () => {
    const img = mountedImg();
    const onLoadingComplete = vi.fn();

    handleLoading(
      img,
      "empty",
      undefined,
      onLoadingComplete,
      () => {},
      true,
      undefined,
    );
    await flushPromises();

    expect(onLoadingComplete).toHaveBeenCalledWith(img);
  });

  it("placeholder 非 empty 时把 blurComplete 置为 true", async () => {
    const img = mountedImg();
    const setBlurComplete = vi.fn();

    handleLoading(
      img,
      "blur",
      undefined,
      undefined,
      setBlurComplete,
      true,
      undefined,
    );
    await flushPromises();

    expect(setBlurComplete).toHaveBeenCalledWith(true);
  });

  it("placeholder 为 empty 时不置 blurComplete", async () => {
    const img = mountedImg();
    const setBlurComplete = vi.fn();

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      setBlurComplete,
      true,
      undefined,
    );
    await flushPromises();

    expect(setBlurComplete).not.toHaveBeenCalled();
  });

  it("同一 src 只处理一次（幂等）", async () => {
    const img = mountedImg();
    const onLoad = vi.fn();

    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("src 变化后会再次处理", async () => {
    const img = mountedImg("/a.jpg");
    const onLoad = vi.fn();

    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    await flushPromises();

    Object.defineProperty(img, "src", {
      configurable: true,
      value: "/b.jpg",
    });
    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  it("元素已从 DOM 移除时不触发回调", async () => {
    const img = mountedImg();
    const onLoad = vi.fn();

    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    img.remove();
    await flushPromises();

    expect(onLoad).not.toHaveBeenCalled();
  });

  it("img 缺失时不报错", () => {
    expect(() =>
      handleLoading(
        undefined as never,
        "empty",
        vi.fn(),
        undefined,
        () => {},
        true,
        undefined,
      ),
    ).not.toThrow();
  });

  it("decode 失败时仍继续触发回调（错误被吞掉）", async () => {
    const img = mountedImg();
    Object.defineProperty(img, "decode", {
      configurable: true,
      value: () => Promise.reject(new Error("decode failed")),
    });
    const onLoad = vi.fn();

    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("没有 decode 方法时回退到已解决的 Promise", async () => {
    const img = mountedImg();
    // jsdom 的 img 默认没有 decode
    Reflect.deleteProperty(img, "decode");
    const onLoad = vi.fn();

    handleLoading(img, "empty", onLoad, undefined, () => {}, true, undefined);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("onLoad / onLoadingComplete 都为空时不报错", async () => {
    const img = mountedImg();

    expect(() =>
      handleLoading(
        img,
        "empty",
        undefined,
        undefined,
        () => {},
        true,
        undefined,
      ),
    ).not.toThrow();
    await flushPromises();
  });
});

describe("handleLoading - 开发期 fill 警告", () => {
  async function flushPromises(): Promise<void> {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  }

  /** 让图片按指定尺寸/父元素定位呈现 */
  function measureImg(
    img: HTMLImageElement,
    {
      width,
      height,
      parentPosition,
      attrHeight,
    }: {
      width: number;
      height: number;
      parentPosition: string;
      attrHeight: number;
    },
  ) {
    img.getBoundingClientRect = () =>
      ({
        width,
        height,
        top: 0,
        bottom: height,
        left: 0,
        right: width,
      }) as DOMRect;
    Object.defineProperty(img, "height", { configurable: true, value: height });
    Object.defineProperty(img, "width", { configurable: true, value: width });
    img.setAttribute("height", String(attrHeight));
    img.setAttribute("width", String(width));

    const parent = document.createElement("div");
    parent.appendChild(img);
    document.body.appendChild(parent);
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      position: parentPosition,
    } as CSSStyleDeclaration);
  }

  /** 构造一张 fill 图片并把视口宽度固定为 1000 */
  function fillImg(overrides: Record<string, unknown> = {}) {
    const img = document.createElement("img");
    img.setAttribute("data-nimg", "fill");
    Object.defineProperty(img, "src", { configurable: true, value: "/a.jpg" });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1000,
    });
    measureImg(img, {
      width: 900,
      height: 50,
      parentPosition: "relative",
      attrHeight: 50,
      ...overrides,
    });
    return img;
  }

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("data-nimg=fill + sizes=100vw 但渲染宽度不足时提示调整 sizes", async () => {
    const img = fillImg({ width: 100 }); // 100/1000 = 0.1 < 0.6
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(img, "empty", undefined, undefined, () => {}, false, "100vw");
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('设置了 fill 和 sizes="100vw"'),
    );
  });

  it("data-nimg=fill 但缺 sizes 时提示补 sizes", async () => {
    const img = fillImg({ width: 100 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("设置了 fill 但缺少 sizes 属性"),
    );
  });

  it("unoptimized 时不做宽度相关的 sizes 检查", async () => {
    const img = fillImg({ width: 100 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      true,
      undefined,
    );
    await flushPromises();

    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining("缺少 sizes 属性"),
    );
  });

  it("渲染宽度足够时不做 sizes 提示", async () => {
    const img = fillImg({ width: 900 }); // 0.9 >= 0.6
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).not.toHaveBeenCalled();
  });

  it("fill 的父元素不是定位元素时提示", async () => {
    const img = fillImg({ parentPosition: "static" });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('父元素 position="static"'),
    );
  });

  it("fill 图高度为 0 时提示为父元素设置高度", async () => {
    const img = fillImg({ height: 0, attrHeight: 0 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("设置了 fill 且高度为 0"),
    );
  });

  it("data-nimg=fill + sizes 为其它值（非 100vw）时不做提示", async () => {
    const img = fillImg({ width: 100 }); // 渲染宽度不足
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(img, "empty", undefined, undefined, () => {}, false, "50vw");
    await flushPromises();

    expect(warn).not.toHaveBeenCalled();
  });

  it("生产环境（DEV=false）不发任何开发警告", async () => {
    const img = fillImg({ width: 100, parentPosition: "static", height: 0 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).not.toHaveBeenCalled();
  });

  it("data-nimg 不是 fill 时完全跳过 fill 警告", async () => {
    const img = document.createElement("img");
    Object.defineProperty(img, "src", { configurable: true, value: "/a.jpg" });
    measureImg(img, {
      width: 100,
      height: 0,
      parentPosition: "static",
      attrHeight: 50,
    });
    // 让宽高与属性一致，避免触发无关的宽高比警告
    Object.defineProperty(img, "height", { configurable: true, value: 50 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("handleLoading - 开发期宽高比警告", () => {
  async function flushPromises(): Promise<void> {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  }

  /** 构造一个「渲染尺寸与属性不一致」的 img */
  function mismatchedImg(
    rendered: { width: number; height: number },
    attrs: { width: number; height: number },
  ) {
    const img = document.createElement("img");
    Object.defineProperty(img, "src", { configurable: true, value: "/a.jpg" });
    Object.defineProperty(img, "width", {
      configurable: true,
      value: rendered.width,
    });
    Object.defineProperty(img, "height", {
      configurable: true,
      value: rendered.height,
    });
    img.setAttribute("width", String(attrs.width));
    img.setAttribute("height", String(attrs.height));
    document.body.appendChild(img);
    return img;
  }

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("只改了 width 时提示补 auto", async () => {
    const img = mismatchedImg(
      { width: 300, height: 200 },
      { width: 200, height: 200 },
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("仅修改了 width 或 height 其中之一"),
    );
  });

  it("只改了 height 时提示补 auto", async () => {
    const img = mismatchedImg(
      { width: 200, height: 300 },
      { width: 200, height: 200 },
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("仅修改了 width 或 height 其中之一"),
    );
  });

  it("宽高都改了（等比缩放）时不提示", async () => {
    const img = mismatchedImg(
      { width: 400, height: 400 },
      { width: 200, height: 200 },
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).not.toHaveBeenCalled();
  });

  it("宽高都没改时不提示", async () => {
    const img = mismatchedImg(
      { width: 200, height: 200 },
      { width: 200, height: 200 },
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    handleLoading(
      img,
      "empty",
      undefined,
      undefined,
      () => {},
      false,
      undefined,
    );
    await flushPromises();

    expect(warn).not.toHaveBeenCalled();
  });
});
