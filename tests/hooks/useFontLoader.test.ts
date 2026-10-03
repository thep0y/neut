import { renderHook } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `useFontLoader` 有**模块级** `loaded` 集合（避免重复插入 <link>），
 * 且 DEV/PROD 影响未知语言的告警。因此每个用例都 resetModules 后重新 import。
 */
async function freshModule(dev = true) {
  vi.resetModules();
  vi.stubEnv("DEV", dev);
  vi.stubEnv("PROD", !dev);
  return import("~/hooks/useFontLoader");
}

/** 取 `document.head` 里所有 Google Fonts <link> */
function fontLinks(): HTMLLinkElement[] {
  return Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  );
}

describe("useFontLoader", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-lang");
    for (const link of fontLinks()) link.remove();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    for (const link of fontLinks()) link.remove();
    document.documentElement.removeAttribute("data-lang");
  });

  it("默认语言是 en：加载 Inter 并写入 data-lang", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load());

    expect(document.documentElement.getAttribute("data-lang")).toBe("en");
    expect(fontLinks()).toHaveLength(1);
    expect(fontLinks()[0].href).toContain("family=Inter:wght@400;500;700");

    cleanup();
  });

  it("加载的 link 指向 Google Fonts 并带 display=swap", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load({ langs: "ja" }));

    const link = fontLinks()[0];
    expect(link.href).toContain("https://fonts.googleapis.com/css2?");
    expect(link.href).toContain("display=swap");

    cleanup();
  });

  it("指定语言时写入对应的 data-lang", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load({ langs: "zh-hans" }));

    expect(document.documentElement.getAttribute("data-lang")).toBe("zh-hans");

    cleanup();
  });

  it("多语言时 data-lang 取第一个（用于字体族选择）", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load({ langs: ["ja", "ko"] }));

    expect(document.documentElement.getAttribute("data-lang")).toBe("ja");

    cleanup();
  });

  it("多语言时所有字体家族都写进同一个 link", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load({ langs: ["ja", "ko"] }));

    const href = fontLinks()[0].href;
    expect(href).toContain("Noto+Sans+JP");
    expect(href).toContain("Noto+Sans+KR");

    cleanup();
  });

  it("同一字体家族被多个语言共用时只请求一次", async () => {
    const { useFontLoader: load } = await freshModule();
    // en / fr / de 都用 Inter
    const { cleanup } = renderHook(() => load({ langs: ["en", "fr", "de"] }));

    const href = fontLinks()[0].href;
    expect(href.split("family=Inter").length - 1).toBe(1);

    cleanup();
  });

  it("apply=false 时只预加载字体，不写 data-lang", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load({ langs: "ko", apply: false }));

    expect(document.documentElement.hasAttribute("data-lang")).toBe(false);
    expect(fontLinks()).toHaveLength(1);

    cleanup();
  });

  it("targetRef 指定时 data-lang 写在目标元素上", async () => {
    const { useFontLoader: load } = await freshModule();
    const target = document.createElement("div");
    document.body.appendChild(target);

    const { cleanup } = renderHook(() =>
      load({ langs: "ar", targetRef: target }),
    );

    expect(target.getAttribute("data-lang")).toBe("ar");
    expect(document.documentElement.hasAttribute("data-lang")).toBe(false);

    cleanup();
    target.remove();
  });

  it("卸载时移除原本不存在的 data-lang", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load({ langs: "ko" }));

    expect(document.documentElement.hasAttribute("data-lang")).toBe(true);

    cleanup();

    expect(document.documentElement.hasAttribute("data-lang")).toBe(false);
  });

  it("卸载时恢复目标元素原有的 data-lang", async () => {
    const { useFontLoader: load } = await freshModule();
    const target = document.createElement("div");
    target.setAttribute("data-lang", "en");
    document.body.appendChild(target);

    const { cleanup } = renderHook(() =>
      load({ langs: "ja", targetRef: target }),
    );

    expect(target.getAttribute("data-lang")).toBe("ja");

    cleanup();

    expect(target.getAttribute("data-lang")).toBe("en");
    target.remove();
  });

  it("DEV 下未知语言发出警告并从有效列表中剔除", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { useFontLoader: load } = await freshModule(true);
    // @ts-expect-error 故意传未支持的语言
    const { cleanup } = renderHook(() => load({ langs: ["xx"] }));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("unsupported lang");
    expect(String(warn.mock.calls[0][0])).toContain("xx");
    // 没有有效语言 => 不加载、不写 data-lang
    expect(fontLinks()).toHaveLength(0);
    expect(document.documentElement.hasAttribute("data-lang")).toBe(false);

    cleanup();
  });

  it("PROD 下未知语言静默忽略", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { useFontLoader: load } = await freshModule(false);
    // @ts-expect-error 故意传未支持的语言
    const { cleanup } = renderHook(() => load({ langs: "xx" }));

    expect(warn).not.toHaveBeenCalled();

    cleanup();
  });

  it("未知语言被剔除但有效语言仍然生效", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { useFontLoader: load } = await freshModule(true);
    // @ts-expect-error 故意混入未支持的语言
    const { cleanup } = renderHook(() => load({ langs: ["xx", "ko"] }));

    expect(document.documentElement.getAttribute("data-lang")).toBe("ko");

    cleanup();
  });

  it("同一字体不重复插入 link（模块级缓存）", async () => {
    const { useFontLoader: load } = await freshModule();
    const first = renderHook(() => load({ langs: "ko" }));
    const second = renderHook(() => load({ langs: "ko" }));

    expect(fontLinks()).toHaveLength(1);

    first.cleanup();
    second.cleanup();
  });

  it("不同字体各插入一个 link", async () => {
    const { useFontLoader: load } = await freshModule();
    const first = renderHook(() => load({ langs: "ko" }));
    const second = renderHook(() => load({ langs: "ja" }));

    expect(fontLinks()).toHaveLength(2);

    first.cleanup();
    second.cleanup();
  });

  it("语言为空数组时不加载也不写 data-lang", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() => load({ langs: [] }));

    expect(fontLinks()).toHaveLength(0);
    expect(document.documentElement.hasAttribute("data-lang")).toBe(false);

    cleanup();
  });

  it("显式传 targetRef: undefined 时回退到 documentElement", async () => {
    const { useFontLoader: load } = await freshModule();
    const { cleanup } = renderHook(() =>
      load({ langs: "ko", targetRef: undefined }),
    );

    expect(document.documentElement.getAttribute("data-lang")).toBe("ko");

    cleanup();
  });

  it("已加载过的字体再次调用不重复插入 link", async () => {
    const { useFontLoader: load } = await freshModule();
    const first = renderHook(() => load({ langs: "ko" }));
    expect(fontLinks()).toHaveLength(1);

    // 新实例请求同一字体：模块级缓存命中，不再插入
    const second = renderHook(() => load({ langs: "ko" }));
    expect(fontLinks()).toHaveLength(1);

    first.cleanup();
    second.cleanup();
  });
});
