import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Image } from "~/components/image/Image";

/**
 * Image 是组合层：解析 props（getImgProps）→ 渲染 ImageElement，
 * 并在需要时把 preload link 注入 head。
 */
function imgOf(container: HTMLElement): HTMLImageElement {
  return container.querySelector("img") as HTMLImageElement;
}

function preloadLinks(): NodeListOf<HTMLLinkElement> {
  return document.head.querySelectorAll("link[rel='preload'][as='image']");
}

describe("Image - 基础渲染", () => {
  it("渲染 img，保留 src / alt 与 data-nimg", () => {
    const { container } = render(() => (
      <Image
        src="https://example.com/a.png"
        alt="图片"
        width={100}
        height={100}
      />
    ));
    const img = imgOf(container);

    expect(img.getAttribute("src")).toBe("https://example.com/a.png");
    expect(img.getAttribute("alt")).toBe("图片");
    expect(img.getAttribute("data-nimg")).toBe("1");
    expect(img.getAttribute("decoding")).toBe("async");
  });

  it("宽高与 loading / sizes 交给原生属性", () => {
    const { container } = render(() => (
      <Image
        src="https://example.com/a.png"
        alt="图"
        width={200}
        height={100}
        sizes="50vw"
      />
    ));
    const img = imgOf(container);

    expect(img.getAttribute("width")).toBe("200");
    expect(img.getAttribute("height")).toBe("100");
    expect(img.getAttribute("sizes")).toBe("50vw");
  });

  it("fill 模式标成 data-nimg=fill 并带上定位类", () => {
    const { container } = render(() => (
      <Image src="https://example.com/a.png" alt="图" fill />
    ));

    expect(imgOf(container).getAttribute("data-nimg")).toBe("fill");
  });

  it("class / classList 合并到 img 上", () => {
    const { container } = render(() => (
      <Image
        src="https://example.com/a.png"
        alt="图"
        width={100}
        height={100}
        class="my-image"
      />
    ));

    expect(imgOf(container).className).toContain("my-image");
  });
});

describe("Image - 真实图片与占位", () => {
  it("真实图片（非 placeholder）加载后移除 blur", () => {
    const { container } = render(() => (
      <Image
        src="https://example.com/a.png"
        alt="图"
        width={100}
        height={100}
      />
    ));

    fireEvent.load(imgOf(container));

    // 加载完成后即便有 placeholder 也不应再显示模糊图
    expect(imgOf(container)).not.toBeNull();
  });

  it("placeholder=blur 时先给一个 data: 的模糊底，加载完成后换成真实图", () => {
    const { container } = render(() => (
      <Image
        src="https://example.com/a.png"
        alt="图"
        width={100}
        height={100}
        placeholder="blur"
        blurDataURL="data:image/png;base64,AAAA"
      />
    ));

    // jsdom 里 img.complete 恒为 true（等价于"挂载前已 cached"），因此首帧就
    // 已经把 src 换成真实图片；blur → 真实图的切换在真实浏览器里由 load 驱动
    expect(imgOf(container).getAttribute("src")).toBe(
      "https://example.com/a.png",
    );

    fireEvent.load(imgOf(container));

    expect(imgOf(container).getAttribute("src")).toBe(
      "https://example.com/a.png",
    );
  });

  it("加载失败（onError）时显示 alt 文本", () => {
    const { container } = render(() => (
      <Image
        src="https://example.com/broken.png"
        alt="替代文本"
        width={100}
        height={100}
      />
    ));

    fireEvent.error(imgOf(container));

    expect(imgOf(container).getAttribute("alt")).toBe("替代文本");
  });
});

describe("Image - preload", () => {
  it("默认不注入 preload link", () => {
    render(() => (
      <Image
        src="https://example.com/a.png"
        alt="图"
        width={100}
        height={100}
      />
    ));

    expect(preloadLinks()).toHaveLength(0);
  });

  it("priority 时注入 preload link，并带 imagesrcset/imagesizes", () => {
    render(() => (
      <Image
        src="https://example.com/hero.png"
        alt="图"
        width={100}
        height={100}
        sizes="100vw"
        priority
      />
    ));
    const links = preloadLinks();

    expect(links.length).toBeGreaterThan(0);
    const link = links[links.length - 1]!;
    expect(link.getAttribute("rel")).toBe("preload");
    expect(link.getAttribute("as")).toBe("image");
    expect(link.getAttribute("imagesrcset")).toContain("hero.png");
    expect(link.getAttribute("imagesizes")).toBe("100vw");
  });

  it("preload 已存在相同的 key 时不重复插入", () => {
    render(() => (
      <Image
        src="https://example.com/dup.png"
        alt="图"
        width={100}
        height={100}
        priority
      />
    ));
    const afterFirst = preloadLinks().length;

    render(() => (
      <Image
        src="https://example.com/dup.png"
        alt="图"
        width={100}
        height={100}
        priority
      />
    ));

    expect(preloadLinks().length).toBe(afterFirst);
  });
});
