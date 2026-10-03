import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import ImagePreload from "~/components/image/ImagePreload";

/**
 * ImagePreload 只做一件事：把 `<link rel="preload" as="image">` 通过 Portal
 * 注入 document.head，并用 `data-img-key` 去重。
 */
function links() {
  return document.head.querySelectorAll("link[rel='preload'][as='image']");
}

afterEach(() => {
  for (const link of Array.from(links())) link.remove();
});

describe("ImagePreload", () => {
  it("注入 preload link，带 imagesrcset 时不设置 href（遵从 spec）", () => {
    render(() => (
      <ImagePreload
        imgAttributes={{
          src: "https://example.com/a.png",
          srcSet: "https://example.com/a-100.png 100w",
          sizes: "100vw",
          crossOrigin: "anonymous",
          referrerPolicy: "no-referrer",
          fetchpriority: "high",
        }}
      />
    ));
    const link = links()[links().length - 1]!;

    expect(link.getAttribute("as")).toBe("image");
    expect(link.hasAttribute("href")).toBe(false);
    expect(link.getAttribute("imagesrcset")).toBe(
      "https://example.com/a-100.png 100w",
    );
    expect(link.getAttribute("imagesizes")).toBe("100vw");
    expect(link.getAttribute("crossorigin")).toBe("anonymous");
    expect(link.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(link.getAttribute("fetchpriority")).toBe("high");
  });

  it("没有 srcSet 时把 href 指向 src", () => {
    render(() => (
      <ImagePreload
        imgAttributes={{
          src: "https://example.com/b.png",
          srcSet: undefined,
          sizes: undefined,
          crossOrigin: undefined,
          referrerPolicy: undefined,
          fetchpriority: undefined,
        }}
      />
    ));
    const link = links()[links().length - 1]!;

    expect(link.getAttribute("href")).toBe("https://example.com/b.png");
    expect(link.hasAttribute("imagesrcset")).toBe(false);
  });

  it("相同 key 已存在时跳过注入（SSR hydrate 场景）", () => {
    const attributes = {
      src: "https://example.com/dup.png",
      srcSet: undefined,
      sizes: undefined,
      crossOrigin: undefined,
      referrerPolicy: undefined,
      fetchpriority: undefined,
    };
    render(() => <ImagePreload imgAttributes={attributes} />);
    const count = links().length;

    render(() => <ImagePreload imgAttributes={attributes} />);

    expect(links().length).toBe(count);
  });
});
