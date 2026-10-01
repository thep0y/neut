import { describe, expect, it, vi } from "vitest";
import { imageConfigDefault } from "~/components/image/Image.config";
import { resolveConfig } from "~/components/image/Image.config";
import {
  defaultLoader,
  generateImgAttrs,
  getWidths,
} from "~/components/image/lib/loader";

describe("defaultLoader", () => {
  it("本地图片追加 url / w / q 参数", () => {
    expect(defaultLoader({ src: "/a.jpg", width: 640, quality: 75 })).toBe(
      "/_image?url=%2Fa.jpg&w=640&q=75",
    );
  });

  it("未传 quality 时省略 q 参数", () => {
    expect(defaultLoader({ src: "/a.jpg", width: 640 })).toBe(
      "/_image?url=%2Fa.jpg&w=640",
    );
  });

  it("quality 为 0 时同样省略（falsy）", () => {
    expect(defaultLoader({ src: "/a.jpg", width: 640, quality: 0 })).toBe(
      "/_image?url=%2Fa.jpg&w=640",
    );
  });

  it("http / https 外部地址原样返回", () => {
    expect(defaultLoader({ src: "http://example.com/a.jpg", width: 640 })).toBe(
      "http://example.com/a.jpg",
    );
    expect(
      defaultLoader({ src: "https://example.com/a.jpg", width: 640 }),
    ).toBe("https://example.com/a.jpg");
  });

  it("相对路径中的特殊字符被正确编码", () => {
    expect(defaultLoader({ src: "/a b.jpg", width: 100 })).toBe(
      "/_image?url=%2Fa+b.jpg&w=100",
    );
  });

  it("开发环境缺少 src 时抛错并列出缺失项", () => {
    vi.stubEnv("DEV", true);

    expect(() => defaultLoader({ src: "", width: 640 })).toThrow(
      "[defaultLoader] 缺少必要属性：src。",
    );
  });

  it("开发环境同时缺少 src 与 width 时一并列出", () => {
    vi.stubEnv("DEV", true);

    expect(() => defaultLoader({ src: "", width: 0 })).toThrow(
      "[defaultLoader] 缺少必要属性：src, width。",
    );
  });

  it("开发环境 width 为 0 视为缺失", () => {
    vi.stubEnv("DEV", true);

    expect(() => defaultLoader({ src: "/a.jpg", width: 0 })).toThrow(
      "[defaultLoader] 缺少必要属性：width。",
    );
  });

  it("生产环境不抛错，照常拼参数", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);

    expect(defaultLoader({ src: "", width: 0 })).toBe("/_image?url=&w=0");
  });

  it("空 src 且生产环境下不抛错，仍返回可用的优化 URL", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);

    expect(defaultLoader({ src: "", width: 100 })).toBe("/_image?url=&w=100");
  });
});

describe("getWidths", () => {
  const cfg = resolveConfig(imageConfigDefault) as never;

  it("无 sizes 且给了 width 时用 width / 2x，描述符为 x", () => {
    const { widths, kind } = getWidths(cfg, 640, undefined);

    expect(kind).toBe("x");
    // 640 命中 allSizes 的 640；1280 命中 1920（第一个 >= 1280 的值）
    expect(widths).toEqual([640, 1920]);
  });

  it("width 超过最大档位时落在最大档位（去重后只有一个）", () => {
    const { widths, kind } = getWidths(cfg, 5000, undefined);

    expect(kind).toBe("x");
    expect(widths).toEqual([3840]);
  });

  it("既无 sizes 也无 width 时直接用 deviceSizes，描述符为 w", () => {
    const { widths, kind } = getWidths(cfg, undefined, undefined);

    expect(kind).toBe("w");
    expect(widths).toEqual(imageConfigDefault.deviceSizes);
  });

  it("sizes 含 vw 百分比时按最小比例过滤 allSizes，描述符为 w", () => {
    const { widths, kind } = getWidths(cfg, 100, "50vw");

    expect(kind).toBe("w");
    // 最小比例 0.5 → 过滤掉小于 deviceSizes[0] * 0.5 = 320 的档位
    expect(widths.every((w) => w >= 320)).toBe(true);
    expect(widths).not.toContain(256);
    expect(widths).toContain(384);
  });

  it("sizes 不含 vw 时返回全部 allSizes", () => {
    const { widths, kind } = getWidths(cfg, 100, "640px");

    expect(kind).toBe("w");
    expect(widths).toEqual(
      [
        ...imageConfigDefault.deviceSizes,
        ...imageConfigDefault.imageSizes,
      ].sort((a, b) => a - b),
    );
  });

  it("sizes 里多个 vw 取最小比例", () => {
    const { widths } = getWidths(
      cfg,
      undefined,
      "(max-width: 600px) 25vw, 100vw",
    );

    // 25vw → deviceSizes[0] * 0.25 = 160
    expect(widths.every((w) => w >= 160)).toBe(true);
  });
});

describe("generateImgAttrs", () => {
  const cfg = resolveConfig(imageConfigDefault) as never;
  const loader = ({ width }: { width: number }) => `/img?w=${width}`;

  it("unoptimized 时不生成 srcSet / sizes，src 原样", () => {
    expect(
      generateImgAttrs({
        config: cfg,
        src: "/a.jpg",
        unoptimized: true,
        loader: loader as never,
        width: 640,
      }),
    ).toEqual({ src: "/a.jpg", srcSet: undefined, sizes: undefined });
  });

  it("按宽度生成时默认 sizes 为 100vw（kind=w）", () => {
    const result = generateImgAttrs({
      config: cfg,
      src: "/a.jpg",
      unoptimized: false,
      loader: loader as never,
      quality: 75,
    });

    expect(result.sizes).toBe("100vw");
    expect(result.srcSet).toContain("640w");
    // src 取最大档位
    expect(result.src).toBe(`/img?w=${imageConfigDefault.deviceSizes.at(-1)}`);
  });

  it("传入 sizes 时原样保留（不补 100vw）", () => {
    const result = generateImgAttrs({
      config: cfg,
      src: "/a.jpg",
      unoptimized: false,
      loader: loader as never,
      sizes: "50vw",
    });

    expect(result.sizes).toBe("50vw");
  });

  it("kind=x 时 srcSet 描述符用序号（1x / 2x）", () => {
    const result = generateImgAttrs({
      config: cfg,
      src: "/a.jpg",
      unoptimized: false,
      loader: loader as never,
      width: 640,
    });

    expect(result.srcSet).toBe("/img?w=640 1x, /img?w=1920 2x");
    expect(result.sizes).toBeUndefined();
    expect(result.src).toBe("/img?w=1920");
  });

  it("quality 透传给 loader", () => {
    const seen: Array<number | undefined> = [];
    generateImgAttrs({
      config: cfg,
      src: "/a.jpg",
      unoptimized: false,
      quality: 60,
      width: 640,
      loader: (({ quality }: { quality?: number }) => {
        seen.push(quality);
        return "/x";
      }) as never,
    });

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((q) => q === 60)).toBe(true);
  });
});
