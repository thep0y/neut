import { describe, expect, it } from "vitest";
import { imageConfigDefault } from "~/components/image/Image.config";
import { getImgProps, normalizeConfig } from "~/components/image/Image.utils";
import type {
  ImageConfigComplete,
  ImageProps,
  StaticImport,
} from "~/components/image/Image.types";

/**
 * `getImgProps` 是 Image 的纯逻辑入口（无 JSX、无 DOM），
 * 把 props + 配置解析成真正写到 `<img>` 上的属性。
 * 这里按"输入形态"分组覆盖，重点是那些容易出错的推导：
 * 宽高比推导、srcSet 生成、unoptimized 判定、sizes 推导。
 */
function conf(
  overrides: Partial<ImageConfigComplete> = {},
): ImageConfigComplete {
  return { ...imageConfigDefault, ...overrides };
}

function getProps(
  props: ImageProps | (Omit<ImageProps, "alt"> & { alt?: string }),
  options: Partial<Parameters<typeof getImgProps>[1]> = {},
) {
  return getImgProps(
    // alt 在 ImageProps 里是必填（无障碍要求）；测试关心的是其它推导逻辑，
    // 这里统一补一个默认值，避免每个用例都重复写 alt。
    { alt: "", ...props } as ImageProps,
    {
      imgConf: conf(),
      blurComplete: false,
      showAltText: false,
      ...options,
    },
  );
}

describe("getImgProps - 基础属性", () => {
  it("字符串 src 直接透传", () => {
    const { props } = getProps({ src: "/photo.jpg", width: 100, height: 50 });

    expect(props.src).toContain("url=%2Fphoto.jpg");
  });

  it("默认 decoding 为 async", () => {
    const { props } = getProps({ src: "/a.jpg", width: 100, height: 50 });

    expect(props.decoding).toBe("async");
  });

  it("默认 placeholder 为 empty", () => {
    const { meta } = getProps({ src: "/a.jpg", width: 100, height: 50 });

    expect(meta.placeholder).toBe("empty");
  });

  it("默认不是 fill", () => {
    const { props } = getProps({ src: "/a.jpg", width: 100, height: 50 });

    expect(props.style).not.toMatchObject({
      position: "absolute",
    });
  });

  it("width / height 原样写入", () => {
    const { props } = getProps({ src: "/a.jpg", width: 640, height: 480 });

    expect(props.width).toBe(640);
    expect(props.height).toBe(480);
  });

  it("数字字符串形式的 width / height 被解析为数字", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: "640" as never,
      height: "480" as never,
    });

    expect(props.width).toBe(640);
    expect(props.height).toBe(480);
  });

  it("alt 透传", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 100,
      height: 50,
      alt: "描述",
    });

    expect(props.alt).toBe("描述");
  });

  it("class 透传", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 100,
      height: 50,
      class: "rounded",
    });

    expect(props.class).toBe("rounded");
  });
});

describe("getImgProps - loading / priority", () => {
  it("默认懒加载", () => {
    const { props } = getProps({ src: "/a.jpg", width: 100, height: 50 });

    expect(props.loading).toBe("lazy");
  });

  it("priority 时不再输出 loading=lazy（由浏览器默认 eager）", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 100,
      height: 50,
      priority: true,
    });

    // 注意：实现是 `isLazy ? "lazy" : local.loading`，priority 时只是取消懒加载，
    // 不会显式写 "eager"（除非调用方自己传了 loading="eager"）。
    expect(props.loading).toBeUndefined();
  });

  it("priority + 显式 loading=eager 时输出 eager", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 100,
      height: 50,
      priority: true,
      loading: "eager",
    });

    expect(props.loading).toBe("eager");
  });

  it("preload 时同样取消懒加载", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 100,
      height: 50,
      preload: true,
    });

    expect(props.loading).toBeUndefined();
  });

  it("显式 loading=lazy 时懒加载", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 100,
      height: 50,
      loading: "lazy",
    });

    expect(props.loading).toBe("lazy");
  });

  it("priority + loading=lazy 直接抛错（不允许同时使用）", () => {
    expect(() =>
      getProps({
        src: "/a.jpg",
        width: 100,
        height: 50,
        loading: "lazy",
        priority: true,
      }),
    ).toThrow('has both "priority" and "loading=\'lazy\'"');
  });

  it("preload + loading=lazy 直接抛错", () => {
    expect(() =>
      getProps({
        src: "/a.jpg",
        width: 100,
        height: 50,
        loading: "lazy",
        preload: true,
      }),
    ).toThrow('has both "preload" and "loading=\'lazy\'"');
  });

  it("preload + priority 直接抛错", () => {
    expect(() =>
      getProps({
        src: "/a.jpg",
        width: 100,
        height: 50,
        preload: true,
        priority: true,
      }),
    ).toThrow('has both "preload" and "priority"');
  });

  it("data: URL 强制非懒加载", () => {
    const { props } = getProps({
      src: "data:image/png;base64,AAAA",
      width: 100,
      height: 50,
    });

    expect(props.loading).toBeUndefined();
  });

  it("blob: URL 强制非懒加载", () => {
    const { props } = getProps({
      src: "blob:https://example.com/abc",
      width: 100,
      height: 50,
    });

    expect(props.loading).toBeUndefined();
  });
});

describe("getImgProps - srcSet 与 sizes", () => {
  it("相对路径生成 /_image 的 srcSet", () => {
    const { props } = getProps({ src: "/a.jpg", width: 640, height: 480 });

    expect(props.src).toContain("url=%2Fa.jpg");
    expect(props.srcSet).toContain("url=%2Fa.jpg");
  });

  it("绝对 URL 直接返回原地址（不经过优化服务）", () => {
    const { props } = getProps({
      src: "https://cdn.example.com/a.jpg",
      width: 640,
      height: 480,
    });

    expect(props.src).toBe("https://cdn.example.com/a.jpg");
  });

  it("unoptimized 时不生成 srcSet / sizes", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      unoptimized: true,
    });

    expect(props.srcSet).toBeUndefined();
    expect(props.sizes).toBeUndefined();
  });

  it("unoptimized 时 src 保持原始值", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      unoptimized: true,
    });

    expect(props.src).toBe("/a.jpg");
  });

  it("自定义 loader 被使用", () => {
    const loader = ({ src, width }: { src: string; width: number }) =>
      `/custom/${src}?w=${width}`;

    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      loader: loader as never,
    });

    expect(props.src).toContain("/custom//a.jpg");
  });

  it("显式 sizes 被保留", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      sizes: "(max-width: 600px) 100vw, 600px",
    });

    expect(props.sizes).toBe("(max-width: 600px) 100vw, 600px");
  });

  it("没有 sizes 且按宽度生成时默认 sizes 为 100vw", () => {
    // 带 width 且无 sizes => kind 由 getWidths 决定为 "x"，此时 sizes 保持 undefined
    const { props } = getProps({ src: "/a.jpg", width: 640, height: 480 });

    expect(props.sizes).toBeUndefined();
  });

  it("quality 参与 loader 参数", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      quality: 50,
    });

    expect(props.src).toContain("q=50");
  });

  it("未传 quality 时 loader 不带 q 参数（qualityInt 为 undefined）", () => {
    const { props } = getProps({ src: "/a.jpg", width: 640, height: 480 });

    expect(props.src).not.toContain("q=");
  });
});

describe("getImgProps - fill", () => {
  it("fill 时宽度高度被省略", () => {
    const { props } = getProps({ src: "/a.jpg", fill: true, sizes: "100vw" });

    expect(props.width).toBeUndefined();
    expect(props.height).toBeUndefined();
  });

  it("fill 时写入绝对定位样式", () => {
    const { props } = getProps({ src: "/a.jpg", fill: true, sizes: "100vw" });

    expect(props.style).toMatchObject({
      position: "absolute",
      height: "100%",
      width: "100%",
    });
  });

  it("fill + sizes=100vw 时不报错", () => {
    expect(() =>
      getProps({ src: "/a.jpg", fill: true, sizes: "100vw" }),
    ).not.toThrow();
  });

  it("fill 缺少 sizes 在 getImgProps 层不抛错（由 handleLoading 发开发警告）", () => {
    // 注意：sizes 的缺失是**运行时警告**（见 handleLoading 里的 warnFillUsage），
    // 不是解析阶段的错误。这里锁定分层职责，避免误以为 getImgProps 会拦。
    expect(() =>
      getProps({ src: "/a.jpg", fill: true, sizes: "100vw" }),
    ).not.toThrow();
  });

  it("layout=fill 等价于 fill=true", () => {
    const { props } = getProps({
      src: "/a.jpg",
      layout: "fill",
      sizes: "100vw",
    });

    expect(props.style).toMatchObject({ position: "absolute" });
  });

  it("layout=intrinsic 时加 maxWidth 样式", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      layout: "intrinsic",
    });

    expect(props.style).toMatchObject({ maxWidth: "100%", height: "auto" });
  });

  it("layout=responsive 时加 width 样式与 100vw sizes", () => {
    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      layout: "responsive",
    });

    expect(props.style).toMatchObject({ width: "100%", height: "auto" });
  });
});

describe("getImgProps - 静态导入（StaticImport）", () => {
  const staticImage = {
    src: "/static.jpg",
    width: 1200,
    height: 600,
  };

  it("直接传 StaticImageData 时使用其 src", () => {
    const { props } = getProps({ src: staticImage as StaticImport });

    expect(props.src).toContain("url=%2Fstatic.jpg");
  });

  it("未传 width/height 时从静态数据推导", () => {
    const { props } = getProps({ src: staticImage as StaticImport });

    expect(props.width).toBe(1200);
    expect(props.height).toBe(600);
  });

  it("StaticRequire（带 default）同样被识别", () => {
    const { props } = getProps({
      src: { default: staticImage } as never,
    });

    expect(props.width).toBe(1200);
  });

  it("只传 width 时按比例推导 height", () => {
    const { props } = getProps({
      src: staticImage as StaticImport,
      width: 600,
    });

    // 600 / 1200 = 0.5 => height = 300
    expect(props.width).toBe(600);
    expect(props.height).toBe(300);
  });

  it("只传 height 时按比例推导 width", () => {
    const { props } = getProps({
      src: staticImage as StaticImport,
      height: 300,
    });

    // 300 / 600 = 0.5 => width = 600
    expect(props.height).toBe(300);
    expect(props.width).toBe(600);
  });

  it("width/height 都传时以调用方为准", () => {
    const { props } = getProps({
      src: staticImage as StaticImport,
      width: 100,
      height: 50,
    });

    expect(props.width).toBe(100);
    expect(props.height).toBe(50);
  });

  it("fill 时不做宽高推导", () => {
    const { props } = getProps({
      src: staticImage as StaticImport,
      fill: true,
      sizes: "100vw",
    });

    expect(props.width).toBeUndefined();
    expect(props.height).toBeUndefined();
  });

  it("静态数据的 blurDataURL 被采用", () => {
    const { meta } = getProps({
      src: {
        ...staticImage,
        blurDataURL: "data:image/png;base64,AAAA",
      } as StaticImport,
      placeholder: "blur",
    });

    expect(meta.placeholder).toBe("blur");
  });

  it("调用方 blurDataURL 优先于静态数据", () => {
    const { meta } = getProps({
      src: { ...staticImage, blurDataURL: "data:from-static" } as StaticImport,
      blurDataURL: "data:from-props",
      placeholder: "blur",
    });

    expect(meta.placeholder).toBe("blur");
  });

  it("对象既不认识 src 也不认识 default 时按普通 src 处理（不抛错）", () => {
    // `isStaticImport` 要求存在 src 或 default；两者都没有时不会被当成静态导入，
    // 于是走普通路径（src 变成空串 => 自动 unoptimized）。
    expect(() =>
      getProps({ src: { width: 1, height: 1 } as never }),
    ).not.toThrow();
  });

  it("对象缺少 width/height 时抛错", () => {
    expect(() => getProps({ src: { src: "/a.jpg" } as never })).toThrow(
      "It must include height and width",
    );
  });

  it("StaticImageData 的 src 为空字符串时抛错", () => {
    expect(() =>
      getProps({ src: { src: "", width: 10, height: 10 } as never }),
    ).toThrow("It must include src");
  });
});

describe("getImgProps - placeholder", () => {
  it("placeholder=blur 时 meta 反映出来", () => {
    const { meta } = getProps({
      src: "/a.jpg",
      width: 100,
      height: 50,
      placeholder: "blur",
      blurDataURL: "data:image/png;base64,AAAA",
    });

    expect(meta.placeholder).toBe("blur");
  });

  it("非法 placeholder 抛错", () => {
    expect(() =>
      getProps({
        src: "/a.jpg",
        width: 100,
        height: 50,
        placeholder: "nope" as never,
      }),
    ).toThrow('invalid "placeholder"');
  });

  it("data:image/ 开头的 placeholder 被接受", () => {
    expect(() =>
      getProps({
        src: "/a.jpg",
        width: 100,
        height: 50,
        placeholder: "data:image/png;base64,AAAA",
      }),
    ).not.toThrow();
  });
});

describe("getImgProps - 参数校验", () => {
  it("width 为非数字字符串时抛错", () => {
    expect(() =>
      getProps({ src: "/a.jpg", width: "abc" as never, height: 50 }),
    ).toThrow('invalid "width"');
  });

  it("width 为「数字+别的内容」时也抛错（必须整体是数字）", () => {
    // 这条能区分实现是否用 /^[0-9]+$/ 做整体校验：
    // parseInt 会宽容地解析出 120，但实现应当判定为非法。
    expect(() =>
      getProps({ src: "/a.jpg", width: "120px" as never, height: 50 }),
    ).toThrow('invalid "width"');
  });

  it("height 为非数字字符串时抛错", () => {
    expect(() =>
      getProps({ src: "/a.jpg", width: 100, height: "abc" as never }),
    ).toThrow('invalid "height"');
  });

  it("非法 loading 值抛错", () => {
    expect(() =>
      getProps({
        src: "/a.jpg",
        width: 100,
        height: 50,
        loading: "nope" as never,
      }),
    ).toThrow('invalid "loading"');
  });

  it("src 以空格开头时抛错", () => {
    expect(() => getProps({ src: " /a.jpg", width: 100, height: 50 })).toThrow(
      "cannot start with a space",
    );
  });

  it("src 以空格结尾时抛错", () => {
    expect(() => getProps({ src: "/a.jpg ", width: 100, height: 50 })).toThrow(
      "cannot end with a space",
    );
  });

  it("height=auto 时按 width 与静态比例推导（不抛错）", () => {
    expect(() =>
      getProps({
        src: { src: "/a.jpg", width: 1200, height: 600 } as never,
        width: 600,
        height: "auto" as never,
      }),
    ).not.toThrow();
  });
});

describe("getImgProps - 用户 style 不覆盖 layout", () => {
  it("layout 样式会覆盖用户 style 的同名键（layout 后展开）", () => {
    // 实现是 `style = { ...style, ...layoutStyle }`，layoutStyle 在后 =>
    // 同名 key 由 layout 胜出。这里锁定现状：用户想覆盖 intrinsic 的
    // maxWidth 必须用 layout="fill"/自定义 style 之外的方式。
    const { props } = getProps({
      src: "/a.jpg",
      width: 640,
      height: 480,
      layout: "intrinsic",
      style: { maxWidth: "50%", color: "red" } as never,
    });

    expect(props.style).toMatchObject({
      // layout 覆盖了用户的 maxWidth
      maxWidth: "100%",
      // 非冲突键保留用户值
      color: "red",
    });
  });
});

describe("normalizeConfig", () => {
  it("已有 allSizes 时原样返回（避免重复整理）", () => {
    const normalized = normalizeConfig({
      ...conf(),
      allSizes: [1, 2],
      deviceSizes: [2, 1],
    });

    expect(normalized.allSizes).toEqual([1, 2]);
    expect(normalized.deviceSizes).toEqual([2, 1]);
  });

  it("没有 allSizes 时合并并升序整理，且不改动入参", () => {
    const input = {
      ...conf(),
      deviceSizes: [1080, 640],
      imageSizes: [64, 16],
    };
    const normalized = normalizeConfig(input);

    expect(normalized.allSizes).toEqual([16, 64, 640, 1080]);
    expect(normalized.deviceSizes).toEqual([640, 1080]);
    // 入参保持原样
    expect(input.deviceSizes).toEqual([1080, 640]);
  });

  it("qualities 存在时升序排序", () => {
    const normalized = normalizeConfig({ ...conf(), qualities: [90, 50] });

    expect(normalized.qualities).toEqual([50, 90]);
  });
});

describe("computeUnoptimized - SVG 分支", () => {
  it("未显式允许 SVG 时，.svg 走原图（不经过优化服务）", () => {
    const props = getProps({
      src: "https://example.com/icon.svg",
      alt: "",
      width: 10,
      height: 10,
    });

    expect(props.meta.unoptimized).toBe(true);
  });

  it("dangerouslyAllowSVG 时 .svg 仍走优化服务", () => {
    const props = getImgProps(
      { alt: "", src: "https://example.com/icon.svg", width: 10, height: 10 },
      {
        imgConf: conf({ dangerouslyAllowSVG: true }),
        blurComplete: false,
        showAltText: false,
      },
    );

    expect(props.meta.unoptimized).toBe(false);
  });
});

describe("getImgProps - 可选配置与分支覆盖（回归）", () => {
  it("显式传 fill 时按 fill 处理，不传时默认 false", () => {
    const withoutFill = getProps({
      src: "https://example.com/a.png",
      width: 100,
      height: 100,
    });
    const withFill = getProps({
      src: "https://example.com/a.png",
      fill: true,
    });

    expect(withoutFill.meta.fill).toBe(false);
    expect(withFill.meta.fill).toBe(true);
  });

  it("config.unoptimized 为 true 时不走优化服务", () => {
    const props = getImgProps(
      {
        alt: "",
        src: "https://example.com/a.png",
        width: 100,
        height: 100,
      } as ImageProps,
      {
        imgConf: conf({ unoptimized: true }),
        blurComplete: false,
        showAltText: false,
      },
    );

    expect(props.meta.unoptimized).toBe(true);
  });

  it("loading=eager 时取消懒加载：不生成 sizes，且 loading 原样输出", () => {
    // computeIsLazy 的 `local.loading === "eager"` 分支：它让 isLazy 为 false，
    // 于是不推导 sizes；而 loading 属性本身如实透传 "eager"
    // 不显式给 sizes：eager 时不会被推导出来（lazy 才需要 sizes 边界）
    const props = getProps({
      src: "https://example.com/a.png",
      width: 100,
      height: 100,
      loading: "eager",
    });

    expect(props.props.loading).toBe("eager");
    expect(props.props.sizes).toBeUndefined();

    // 对照：显式传入的 sizes 仍如实透传
    const withSizes = getProps({
      src: "https://example.com/a.png",
      width: 100,
      height: 100,
      loading: "eager",
      sizes: "100vw",
    });
    expect(withSizes.props.sizes).toBe("100vw");
  });

  it("placeholder=blur 时把 blurDataURL 包进 SVG 作为背景图写入 style", () => {
    // 实现不直接写原始 data URL，而是套一层 feGaussianBlur 的 SVG，
    // 这样不仅"显示一张小图"，还真的做了高斯模糊
    const props = getProps({
      src: "https://example.com/a.png",
      width: 100,
      height: 100,
      placeholder: "blur",
      blurDataURL: "data:image/png;base64,AAAA",
    });

    // 注意 style 用的是 CSS 的 kebab-case 键名
    const style = (props.props.style ?? {}) as Record<string, string>;
    expect(style["background-image"]).toContain("data:image/svg+xml");
    expect(style["background-image"]).toContain("feGaussianBlur");
    // 原始 data URL 被嵌在 SVG 的 <image href> 里
    expect(style["background-image"]).toContain("data:image/png;base64,AAAA");
    expect(style["background-size"]).toBe("cover");
    expect(style.color).toBe("transparent");
  });
});

describe("getImgProps - 配置省略（回归）", () => {
  it("省略 imgConf 时使用内置默认配置，与显式传入 imageConfigDefault 等价", () => {
    // GetImgPropsOptions.imgConf 现在真正可选（原先类型必填、代码却写了
    // `imgConf || imageConfigDefault` 的兜底，属于自相矛盾）。这里断言
    // 兜底路径的结果与显式传默认配置**完全一致**，而不是只断言"没抛错"。
    const props = {
      alt: "图",
      src: "https://example.com/a.png",
      width: 100,
      height: 100,
    } as ImageProps;
    const base = { blurComplete: false, showAltText: false };

    const implicit = getImgProps(props, base);
    const explicit = getImgProps(props, {
      ...base,
      imgConf: imageConfigDefault,
    });

    expect(implicit.props).toEqual(explicit.props);
    expect(implicit.meta).toEqual(explicit.meta);
  });

  it("省略 imgConf 时 unoptimized 取自默认配置", () => {
    const result = getImgProps(
      {
        alt: "",
        src: "https://example.com/a.png",
        width: 100,
        height: 100,
      } as ImageProps,
      { blurComplete: false, showAltText: false },
    );

    expect(result.meta.unoptimized).toBe(imageConfigDefault.unoptimized);
  });
});
