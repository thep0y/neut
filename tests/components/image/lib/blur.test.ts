import { describe, expect, it } from "vitest";
import {
  getImageBlurSvg,
  getPlaceholderStyle,
} from "~/components/image/lib/blur";

describe("getImageBlurSvg", () => {
  it("有宽高时写入 viewBox，且 preserveAspectRatio 为 none", () => {
    const svg = getImageBlurSvg({
      widthInt: 640,
      heightInt: 480,
      blurDataURL: "data:image/png;base64,AAA",
    });

    expect(svg).toContain("viewBox='0 0 640 480'");
    expect(svg).toContain("preserveAspectRatio='none'");
  });

  it("blurWidth / blurHeight 优先于渲染宽高，并放大 40 倍", () => {
    const svg = getImageBlurSvg({
      widthInt: 640,
      heightInt: 480,
      blurWidth: 8,
      blurHeight: 6,
      blurDataURL: "data:image/png;base64,AAA",
    });

    expect(svg).toContain("viewBox='0 0 320 240'");
  });

  it("没有尺寸时不写 viewBox，且 preserveAspectRatio 依 objectFit 决定", () => {
    const contain = getImageBlurSvg({
      blurDataURL: "data:image/png;base64,AAA",
      objectFit: "contain",
    });
    const cover = getImageBlurSvg({
      blurDataURL: "data:image/png;base64,AAA",
      objectFit: "cover",
    });
    const other = getImageBlurSvg({
      blurDataURL: "data:image/png;base64,AAA",
      objectFit: "fill",
    });

    expect(contain).not.toContain("viewBox=");
    expect(contain).toContain("preserveAspectRatio='xMidYMid'");
    expect(cover).toContain("preserveAspectRatio='xMidYMid slice'");
    expect(other).toContain("preserveAspectRatio='none'");
  });

  it("只有宽度（缺高度）时同样不写 viewBox", () => {
    const svg = getImageBlurSvg({
      widthInt: 640,
      blurDataURL: "data:image/png;base64,AAA",
    });

    expect(svg).not.toContain("viewBox=");
  });

  it("blurDataURL 被写入 image 的 href", () => {
    const svg = getImageBlurSvg({
      widthInt: 1,
      heightInt: 1,
      blurDataURL: "data:image/webp;base64,ZZZ",
    });

    expect(svg).toContain("href='data:image/webp;base64,ZZZ'");
  });

  it("输出是 URL 编码的 svg 片段（不含原始尖括号）", () => {
    const svg = getImageBlurSvg({
      widthInt: 1,
      heightInt: 1,
      blurDataURL: "data:image/png;base64,AAA",
    });

    expect(svg.startsWith("%3Csvg")).toBe(true);
    expect(svg).not.toContain("<svg");
  });
});

describe("getPlaceholderStyle", () => {
  const base = {
    blurComplete: false,
    placeholder: "blur",
    objectFit: undefined,
    objectPosition: undefined,
  };

  it("没有背景图时返回空对象", () => {
    expect(getPlaceholderStyle({ ...base, backgroundImage: null })).toEqual({});
  });

  it("objectFit 可直接作为 background-size 时原样使用", () => {
    const style = getPlaceholderStyle({
      ...base,
      objectFit: "contain",
      backgroundImage: 'url("x")',
    });

    expect(style["background-size"]).toBe("contain");
  });

  it("objectFit=fill 转成 100% 100%", () => {
    const style = getPlaceholderStyle({
      ...base,
      objectFit: "fill",
      backgroundImage: 'url("x")',
    });

    expect(style["background-size"]).toBe("100% 100%");
  });

  it("无意义的 objectFit 回退为 cover", () => {
    const style = getPlaceholderStyle({
      ...base,
      objectFit: "none",
      backgroundImage: 'url("x")',
    });

    expect(style["background-size"]).toBe("cover");
  });

  it("未传 objectFit 时回退为 cover", () => {
    const style = getPlaceholderStyle({ ...base, backgroundImage: 'url("x")' });

    expect(style["background-size"]).toBe("cover");
  });

  it("objectPosition 缺省为 50% 50%", () => {
    const style = getPlaceholderStyle({ ...base, backgroundImage: 'url("x")' });

    expect(style["background-position"]).toBe("50% 50%");
  });

  it("objectPosition 有值时透传", () => {
    const style = getPlaceholderStyle({
      ...base,
      objectPosition: "top left",
      backgroundImage: 'url("x")',
    });

    expect(style["background-position"]).toBe("top left");
  });

  it("背景图与 repeat 固定写入", () => {
    const style = getPlaceholderStyle({
      ...base,
      backgroundImage: 'url("y")',
    });

    expect(style["background-image"]).toBe('url("y")');
    expect(style["background-repeat"]).toBe("no-repeat");
  });
});
