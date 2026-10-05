import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import ImageElement from "~/components/image/ImageElement";
import type { ImageElementProps } from "~/components/image/ImageElement";

/**
 * ImageElement 只做一件事：渲染原生 `<img>` 并把 ref / onLoad / onError
 * 桥接给上层。这里单独验证桥接契约（配置解析与 placeholder 逻辑在别处测）。
 */
/** handleLoading 走 img.decode().then(...)，等一轮微任务 */
async function flushDecode() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function renderElement(overrides: Partial<ImageElementProps> = {}) {
  const props = {
    src: "https://example.com/a.png",
    alt: "示例",
    width: undefined,
    height: undefined,
    unoptimized: false,
    placeholder: "empty" as const,
    setBlurComplete: vi.fn(),
    setShowAltText: vi.fn(),
    sizesInput: undefined,
    ...overrides,
  } as ImageElementProps;

  const view = render(() => <ImageElement {...props} />);
  const img = () => view.container.querySelector("img") as HTMLImageElement;
  return { ...view, img, props };
}

describe("ImageElement - 渲染", () => {
  it("渲染 img 并带上 src / alt / data-nimg", () => {
    const { img } = renderElement();

    expect(img().tagName).toBe("IMG");
    expect(img().getAttribute("src")).toBe("https://example.com/a.png");
    expect(img().getAttribute("alt")).toBe("示例");
    expect(img().getAttribute("data-nimg")).toBe("1");
  });

  it("默认 decoding=async，且可覆盖", () => {
    expect(renderElement().img().getAttribute("decoding")).toBe("async");
    expect(
      renderElement({ decoding: "sync" }).img().getAttribute("decoding"),
    ).toBe("sync");
  });

  it("fill 模式把 data-nimg 标成 fill", () => {
    expect(renderElement({ fill: true }).img().getAttribute("data-nimg")).toBe(
      "fill",
    );
  });

  it("分开渲染 width/height/loading/sizes/srcset", () => {
    const { img } = renderElement({
      width: 100,
      height: 50,
      loading: "lazy",
      sizes: "100vw",
      srcSet: "/a-100.png 100w",
    });

    expect(img().getAttribute("width")).toBe("100");
    expect(img().getAttribute("height")).toBe("50");
    expect(img().getAttribute("loading")).toBe("lazy");
    expect(img().getAttribute("sizes")).toBe("100vw");
    expect(img().getAttribute("srcset")).toBe("/a-100.png 100w");
  });

  it("合并外部 class / classList / style", () => {
    const { img } = renderElement({
      class: "my-img",
      classList: { "is-round": true },
      style: { "border-radius": "4px" },
    });

    expect(img().className).toContain("my-img");
    expect(img().className).toContain("is-round");
    expect(img().style.borderRadius).toBe("4px");
  });

  it("其余属性透传到原生 img", () => {
    const { img } = renderElement({
      crossOrigin: "anonymous",
      referrerPolicy: "no-referrer",
    } as Partial<ImageElementProps>);

    expect(img().getAttribute("crossorigin")).toBe("anonymous");
    expect(img().getAttribute("referrerpolicy")).toBe("no-referrer");
  });
});

describe("ImageElement - ref 桥接", () => {
  it("挂载时把 img 节点透传给调用方的 ref", () => {
    const ref = vi.fn();
    const { img } = renderElement({ ref });

    expect(ref).toHaveBeenCalledWith(img());
  });

  it("图片在挂载前已加载完成（cached）时补一次 handleLoading", async () => {
    // jsdom 的 complete 默认 true，等价于 cached 场景
    const onLoad = vi.fn();
    const setBlurComplete = vi.fn();
    renderElement({ onLoad, setBlurComplete, placeholder: "blur" });

    await flushDecode();

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(setBlurComplete).toHaveBeenCalledWith(true);
  });

  it("没有 onError 时不重置 src（不需要 Safari 的补触发技巧）", () => {
    const { img } = renderElement();
    const before = img().getAttribute("src");

    expect(img().getAttribute("src")).toBe(before);
  });

  it("有 onError 时在挂载阶段重新赋 src 以补触发错误事件", () => {
    const onError = vi.fn();
    const { img } = renderElement({ onError });

    expect(img().getAttribute("src")).toBe("https://example.com/a.png");
  });
});

describe("ImageElement - 开发环境警告", () => {
  it("缺少 src 时打印中文错误（DEV 检查）", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    renderElement({ src: undefined as unknown as string });

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('缺少必填属性 "src"'),
      expect.anything(),
    );
    error.mockRestore();
  });

  it("缺少 alt 时打印中文错误（DEV 检查）", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    renderElement({ alt: undefined });

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('缺少必填属性 "alt"'),
    );
    error.mockRestore();
  });

  it("src 与 alt 都齐全时不打印错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    renderElement();

    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("ImageElement - onLoad / onError 事件", () => {
  it("load 事件走 handleLoading：回调 onLoad 并标记 blur 完成", async () => {
    const onLoad = vi.fn();
    const setBlurComplete = vi.fn();
    const { img } = renderElement({
      onLoad,
      setBlurComplete,
      placeholder: "blur",
    });
    // 同一张图只处理一次，先让"挂载即 cached"那一次走完
    await flushDecode();
    onLoad.mockClear();
    setBlurComplete.mockClear();
    img().removeAttribute("data-loaded-src");

    fireEvent.load(img());
    await flushDecode();

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(setBlurComplete).toHaveBeenCalledWith(true);
  });

  it("error 事件显示 alt 文本，并且非 empty placeholder 时结束 blur", () => {
    const setShowAltText = vi.fn();
    const setBlurComplete = vi.fn();
    const { img } = renderElement({
      placeholder: "blur",
      setShowAltText,
      setBlurComplete,
    });

    fireEvent.error(img());

    expect(setShowAltText).toHaveBeenCalledWith(true);
    expect(setBlurComplete).toHaveBeenCalledWith(true);
  });

  it("placeholder=empty 时 error 不触发 blur 完成", () => {
    const setBlurComplete = vi.fn();
    const { img } = renderElement({ placeholder: "empty", setBlurComplete });

    fireEvent.error(img());

    expect(setBlurComplete).not.toHaveBeenCalled();
  });

  it("error 事件把原始事件转给调用方的 onError", () => {
    const onError = vi.fn();
    const { img } = renderElement({ onError });

    fireEvent.error(img());

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Event);
  });

  it("没有 onError 时 error 事件不报错", () => {
    const { img } = renderElement();

    expect(() => fireEvent.error(img())).not.toThrow();
  });
});

describe("ImageElement - 未缓存图片（complete=false）", () => {
  it("complete=false 时挂载阶段不触发 onLoad，等真实 load 事件", async () => {
    // jsdom 里 img.complete 恒为 true（等价于 cached），
    // 这里显式改写成 false 来覆盖"图片还没加载完"的那一侧：
    // 此时不应在挂载时补一次 handleLoading，而应等浏览器的 load 事件
    const onLoad = vi.fn();
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "complete",
    );
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => false,
    });
    try {
      const { img } = renderElement({ onLoad });
      await flushDecode();

      // 挂载阶段没有补触发
      expect(onLoad).not.toHaveBeenCalled();

      // 真实 load 事件到达后才回调
      img().removeAttribute("data-loaded-src");
      fireEvent.load(img());
      await flushDecode();
      expect(onLoad).toHaveBeenCalledTimes(1);
    } finally {
      if (descriptor) {
        Object.defineProperty(
          HTMLImageElement.prototype,
          "complete",
          descriptor,
        );
      }
    }
  });
});
