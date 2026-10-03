import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  imageConfigDefault,
  resolveConfig,
} from "~/components/image/Image.config";
import type * as DevChecks from "~/components/image/lib/dev-checks";

/**
 * `warnOnce` 的缓存是模块级 Set（见 `~/utils/warn-once`），因此每个用例前必须
 * `vi.resetModules()` 并重新 `import` 被测模块，否则前一个用例发过的警告会把
 * 后一个用例的断言"吃掉"（TESTING.md §5.6）。
 */
let runDevChecks: typeof DevChecks.runDevChecks;
let isValidLoading: typeof DevChecks.isValidLoading;
let trackImageForLcp: typeof DevChecks.trackImageForLcp;
let resetLcpTracking: typeof DevChecks.resetLcpTracking;
let VALID_LOADING_VALUES: typeof DevChecks.VALID_LOADING_VALUES;

beforeEach(async () => {
  vi.resetModules();
  ({
    runDevChecks,
    isValidLoading,
    trackImageForLcp,
    resetLcpTracking,
    VALID_LOADING_VALUES,
  } = await import("~/components/image/lib/dev-checks"));
});

/* eslint-disable @typescript-eslint/no-explicit-any */
/** 构造一个「合法的默认上下文」，用例只覆盖自己关心的字段 */
function ctx(overrides: Record<string, unknown> = {}): any {
  return {
    src: "/a.jpg",
    config: resolveConfig(imageConfigDefault),
    // 默认用「体现了 width」的 loader，避免无关的 missing-width 警告干扰断言
    loader: ({ src, width }: { src: string; width: number }) =>
      `/_image?url=${src}&w=${width}`,
    fill: false,
    widthInt: 640,
    heightInt: 480,
    qualityInt: undefined,
    unoptimized: false,
    style: undefined,
    props: {
      width: 640,
      height: 480,
      loading: undefined,
      priority: false,
      preload: false,
      placeholder: "empty",
      blurDataURL: undefined,
    },
    otherKeys: [],
    legacyProps: {},
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VALID_LOADING_VALUES / isValidLoading", () => {
  it("合法值包含 lazy / eager / undefined", () => {
    expect(VALID_LOADING_VALUES).toEqual(["lazy", "eager", undefined]);
  });

  it("合法值判定为 true", () => {
    expect(isValidLoading("lazy")).toBe(true);
    expect(isValidLoading("eager")).toBe(true);
    expect(isValidLoading(undefined)).toBe(true);
  });

  it("非法值判定为 false", () => {
    expect(isValidLoading("never")).toBe(false);
    expect(isValidLoading(null)).toBe(false);
    expect(isValidLoading(1)).toBe(false);
  });
});

describe("runDevChecks - unoptimized 推导", () => {
  it("src 为空时强制 unoptimized", () => {
    expect(runDevChecks(ctx({ src: "" }))).toBe(true);
  });

  it("一切正常时保持传入的 unoptimized=false", () => {
    expect(runDevChecks(ctx())).toBe(false);
  });

  it("unoptimized 不影响尺寸校验（仍会抛错）", () => {
    expect(() =>
      runDevChecks(ctx({ unoptimized: true, widthInt: undefined })),
    ).toThrow('is missing required "width" property');
  });
});

describe("runDevChecks - output=export", () => {
  it("output=export 且未 unoptimized 时抛错", () => {
    expect(() =>
      runDevChecks(
        ctx({
          config: { ...resolveConfig(imageConfigDefault), output: "export" },
        }),
      ),
    ).toThrow("not compatible with");
  });

  it("output=export 但已 unoptimized 时不抛错", () => {
    expect(
      runDevChecks(
        ctx({
          unoptimized: true,
          config: { ...resolveConfig(imageConfigDefault), output: "export" },
        }),
      ),
    ).toBe(true);
  });
});

describe("runDevChecks - fill 冲突", () => {
  it("fill + 非 absolute 定位抛错", () => {
    expect(() =>
      runDevChecks(ctx({ fill: true, style: { position: "static" } })),
    ).toThrow('has both "fill" and "style.position"');
  });

  it("fill + style.width 非 100% 抛错", () => {
    expect(() =>
      runDevChecks(ctx({ fill: true, style: { width: "50%" } })),
    ).toThrow('has both "fill" and "style.width"');
  });

  it("fill + style.height 非 100% 抛错", () => {
    expect(() =>
      runDevChecks(ctx({ fill: true, style: { height: "50%" } })),
    ).toThrow('has both "fill" and "style.height"');
  });

  it("fill 与合法的 style（absolute + 100%）不抛错", () => {
    expect(
      runDevChecks(
        ctx({
          fill: true,
          style: { position: "absolute", width: "100%", height: "100%" },
        }),
      ),
    ).toBe(false);
  });

  it("非 fill 时 style 定位不受限制", () => {
    expect(
      runDevChecks(ctx({ fill: false, style: { position: "static" } })),
    ).toBe(false);
  });
});

describe("runDevChecks - 尺寸校验", () => {
  it("非 fill 缺 width 抛错", () => {
    expect(() => runDevChecks(ctx({ widthInt: undefined }))).toThrow(
      'is missing required "width" property',
    );
  });

  it("非 fill 缺 height 抛错", () => {
    expect(() => runDevChecks(ctx({ heightInt: undefined }))).toThrow(
      'is missing required "height" property',
    );
  });

  it("width 为 NaN 时抛错并回显原始输入", () => {
    expect(() =>
      runDevChecks(
        ctx({ widthInt: Number.NaN, props: { ...ctx().props, width: "abc" } }),
      ),
    ).toThrow(
      'has invalid "width" property. Expected a numeric value in pixels but received "abc"',
    );
  });

  it("height 为 NaN 时抛错并回显原始输入", () => {
    expect(() =>
      runDevChecks(
        ctx({ heightInt: Number.NaN, props: { ...ctx().props, height: "x" } }),
      ),
    ).toThrow('has invalid "height" property');
  });

  it("fill 时跳过宽高校验（缺宽度也不报错）", () => {
    expect(
      runDevChecks(
        ctx({ fill: true, widthInt: undefined, heightInt: undefined }),
      ),
    ).toBe(false);
  });
});

describe("runDevChecks - src 首尾控制字符", () => {
  it("以空格开头抛错", () => {
    expect(() => runDevChecks(ctx({ src: " /a.jpg" }))).toThrow(
      "cannot start with a space or control character",
    );
  });

  it("以空格结尾抛错", () => {
    expect(() => runDevChecks(ctx({ src: "/a.jpg " }))).toThrow(
      "cannot end with a space or control character",
    );
  });

  it("以制表符开头同样抛错", () => {
    expect(() => runDevChecks(ctx({ src: "\t/a.jpg" }))).toThrow(
      "cannot start with a space or control character",
    );
  });

  it("首尾无控制字符时不抛错", () => {
    expect(runDevChecks(ctx({ src: "/a b.jpg" }))).toBe(false);
  });
});

describe("runDevChecks - loading 标记", () => {
  const withLoading = (loading: unknown, extra: Record<string, unknown> = {}) =>
    ctx({ props: { ...ctx().props, loading, ...extra } });

  it("非法 loading 抛错并列出合法值", () => {
    expect(() => runDevChecks(withLoading("never"))).toThrow(
      'has invalid "loading" property. Provided "never" should be one of lazy,eager,',
    );
  });

  it("priority + loading=lazy 抛错", () => {
    expect(() => runDevChecks(withLoading("lazy", { priority: true }))).toThrow(
      `has both "priority" and "loading='lazy'"`,
    );
  });

  it("preload + loading=lazy 抛错", () => {
    expect(() => runDevChecks(withLoading("lazy", { preload: true }))).toThrow(
      `has both "preload" and "loading='lazy'"`,
    );
  });

  it("preload + priority 抛错", () => {
    expect(() =>
      runDevChecks(withLoading("eager", { preload: true, priority: true })),
    ).toThrow(`has both "preload" and "priority"`);
  });

  it("loading=eager 且无冲突时通过", () => {
    expect(runDevChecks(withLoading("eager"))).toBe(false);
  });

  it("priority + loading=eager 不冲突", () => {
    expect(runDevChecks(withLoading("eager", { priority: true }))).toBe(false);
  });
});

describe("runDevChecks - placeholder", () => {
  const withPlaceholder = (props: Record<string, unknown>) =>
    ctx({ props: { ...ctx().props, ...props } });

  it("非法 placeholder 抛错", () => {
    expect(() =>
      runDevChecks(withPlaceholder({ placeholder: "spinner" })),
    ).toThrow('has invalid "placeholder" property "spinner"');
  });

  it("data:image/ 前缀的 placeholder 被接受", () => {
    expect(
      runDevChecks(
        withPlaceholder({ placeholder: "data:image/png;base64,AAA" }),
      ),
    ).toBe(false);
  });

  it("blur 缺少 blurDataURL 时抛错", () => {
    expect(() =>
      runDevChecks(withPlaceholder({ placeholder: "blur" })),
    ).toThrow('is missing the "blurDataURL" property');
  });

  it("blur 且提供了 blurDataURL 时通过", () => {
    expect(
      runDevChecks(
        withPlaceholder({ placeholder: "blur", blurDataURL: "data:,x" }),
      ),
    ).toBe(false);
  });

  it("小图（<1600 像素）+ 占位时发 warnOnce", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(
      ctx({
        widthInt: 20,
        heightInt: 20,
        props: { ...ctx().props, placeholder: "blur", blurDataURL: "data:,x" },
      }),
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("is smaller than 40x40"),
    );
  });

  it("quality 不在 config.qualities 里时发 warnOnce 并给出建议列表", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(
      ctx({
        qualityInt: 90,
        config: { ...resolveConfig(imageConfigDefault), qualities: [50, 75] },
      }),
    );

    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(
      messages.some(
        (m) => m.includes('is using quality "90"') && m.includes("50, 75, 90"),
      ),
    ).toBe(true);
  });

  it("quality 已配置时不发警告", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(
      ctx({
        qualityInt: 75,
        config: { ...resolveConfig(imageConfigDefault), qualities: [50, 75] },
      }),
    );

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("runDevChecks - 已废弃属性", () => {
  it("otherKeys 含 onLoadingComplete 时发 warnOnce", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(ctx({ otherKeys: ["onLoadingComplete"] }));

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('deprecated "onLoadingComplete"'),
    );
  });

  it("legacyProps 有值时逐个发 warnOnce", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(ctx({ legacyProps: { layout: "intrinsic", lazyRoot: "x" } }));

    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('legacy prop "layout"'))).toBe(true);
    expect(messages.some((m) => m.includes('legacy prop "lazyRoot"'))).toBe(
      true,
    );
  });

  it("legacyProps 全为假值时不发警告", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(ctx({ legacyProps: { layout: undefined, lazyRoot: "" } }));

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("runDevChecks - loader 未实现宽度", () => {
  it("loader 原样返回 src 时发 warnOnce", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(ctx({ loader: ({ src }: { src: string }) => src }));

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("does not implement width"),
    );
  });

  it("loader 体现了 width 时不发警告", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(
      ctx({
        loader: ({ src, width }: { src: string; width: number }) =>
          `/_i?u=${src}&w=${width}`,
      }),
    );

    expect(warn).not.toHaveBeenCalled();
  });

  it("loader 返回非法 URL 时记录错误但仍继续", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(ctx({ loader: () => "not a url" }));

    expect(error).toHaveBeenCalled();
  });

  it("loader 返回「pathname 相同且无查询串」时也视为未实现宽度", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // new URL("/a.jpg") 的 pathname 就是 "/a.jpg" 且没有 search
    runDevChecks(ctx({ loader: () => "http://localhost/a.jpg" }));

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("does not implement width"),
    );
  });

  it("loader 返回「pathname 相同但带查询串」时视为已实现宽度", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(ctx({ loader: () => "http://localhost/a.jpg?w=640" }));

    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining("does not implement width"),
    );
  });

  it("unoptimized 时跳过 loader 宽度检查", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    runDevChecks(
      ctx({ unoptimized: true, loader: ({ src }: { src: string }) => src }),
    );

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("trackImageForLcp", () => {
  /** 捕获 PerformanceObserver 回调，便于手动喂 entry */
  function installPerfObserver() {
    const callbacks: Array<(list: { getEntries: () => unknown[] }) => void> =
      [];
    const observe = vi.fn();
    const disconnect = vi.fn();
    class TestPerfObserver {
      constructor(cb: (list: { getEntries: () => unknown[] }) => void) {
        callbacks.push(cb);
      }
      observe = observe;
      disconnect = disconnect;
    }
    vi.stubGlobal("PerformanceObserver", TestPerfObserver);
    return { callbacks, observe, disconnect };
  }

  it("首次调用注册 largest-contentful-paint 观察器", () => {
    const { observe } = installPerfObserver();

    trackImageForLcp({
      src: "/a.jpg",
      loading: "lazy",
      placeholder: "empty",
    });

    expect(observe).toHaveBeenCalledWith({
      type: "largest-contentful-paint",
      buffered: true,
    });
  });

  it("第二次调用复用已有观察器（不再注册）", () => {
    const { observe } = installPerfObserver();

    trackImageForLcp({ src: "/a.jpg", loading: "lazy", placeholder: "empty" });
    trackImageForLcp({ src: "/b.jpg", loading: "lazy", placeholder: "empty" });

    expect(observe).toHaveBeenCalledTimes(1);
  });

  it("LCP 命中 lazy + empty 的图片时发 warnOnce", () => {
    const { callbacks } = installPerfObserver();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const href = new URL("/a.jpg", window.location.href).href;
    trackImageForLcp({ src: href, loading: "lazy", placeholder: "empty" });

    callbacks[0]({ getEntries: () => [{ element: { src: href } }] });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Largest Contentful Paint (LCP)"),
    );
  });

  it("eager 图片命中 LCP 时不发警告", () => {
    const { callbacks } = installPerfObserver();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const href = new URL("/a.jpg", window.location.href).href;
    trackImageForLcp({ src: href, loading: "eager", placeholder: "empty" });

    callbacks[0]({ getEntries: () => [{ element: { src: href } }] });

    expect(warn).not.toHaveBeenCalled();
  });

  it("占位非 empty 的图片命中 LCP 时不发警告", () => {
    const { callbacks } = installPerfObserver();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const href = new URL("/a.jpg", window.location.href).href;
    trackImageForLcp({ src: href, loading: "lazy", placeholder: "blur" });

    callbacks[0]({ getEntries: () => [{ element: { src: href } }] });

    expect(warn).not.toHaveBeenCalled();
  });

  it("未记录过的图片命中 LCP 时不查表命中", () => {
    const { callbacks } = installPerfObserver();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    trackImageForLcp({ src: "/a.jpg", loading: "lazy", placeholder: "empty" });

    callbacks[0]({
      getEntries: () => [{ element: { src: "/not-tracked.jpg" } }],
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it("entry 没有 element 时用空字符串查表（不抛错）", () => {
    const { callbacks } = installPerfObserver();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    trackImageForLcp({ src: "/a.jpg", loading: "lazy", placeholder: "empty" });

    expect(() => callbacks[0]({ getEntries: () => [{}] })).not.toThrow();
  });

  it("observe 抛错时记录错误但不向上抛", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    class ThrowingPerfObserver {
      observe() {
        throw new Error("unsupported entry type");
      }
      disconnect() {}
    }
    vi.stubGlobal("PerformanceObserver", ThrowingPerfObserver);

    expect(() =>
      trackImageForLcp({
        src: "/a.jpg",
        loading: "lazy",
        placeholder: "empty",
      }),
    ).not.toThrow();
    expect(error).toHaveBeenCalled();
  });

  it("src 不是合法 URL 时记录错误并回退到相对路径解析", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    installPerfObserver();

    trackImageForLcp({
      src: "not-a-url",
      loading: "lazy",
      placeholder: "empty",
    });

    expect(error).toHaveBeenCalled();
  });

  it("resetLcpTracking 断开观察器并清空记录", () => {
    const { disconnect, observe } = installPerfObserver();
    trackImageForLcp({ src: "/a.jpg", loading: "lazy", placeholder: "empty" });

    resetLcpTracking();

    expect(disconnect).toHaveBeenCalled();

    // 重置后再次记录应重新注册观察器
    trackImageForLcp({ src: "/b.jpg", loading: "lazy", placeholder: "empty" });
    expect(observe).toHaveBeenCalledTimes(2);
  });

  it("window 上没有 PerformanceObserver 时不注册", () => {
    vi.stubGlobal("PerformanceObserver", undefined);

    expect(() =>
      trackImageForLcp({
        src: "/a.jpg",
        loading: "lazy",
        placeholder: "empty",
      }),
    ).not.toThrow();
  });

  it("SSR（没有 window）时直接返回，不记录也不注册", () => {
    const { observe } = installPerfObserver();
    vi.stubGlobal("window", undefined);

    expect(() =>
      trackImageForLcp({
        src: "/a.jpg",
        loading: "lazy",
        placeholder: "empty",
      }),
    ).not.toThrow();
    expect(observe).not.toHaveBeenCalled();
  });
});
