/**
 * 图片加载完成后的副作用。
 *
 * 单一职责：decode 完成后触发回调、清除 blur 占位、在开发环境输出
 * fill / sizes 与宽高比相关的使用警告。纯 TypeScript，无 JSX。
 */

import type {
  OnLoad,
  OnLoadingComplete,
  PlaceholderValue,
} from "../Image.types";

/** 用于追踪每个 img 节点已处理的 src，避免重复触发 */
type ImgWithDataProp = HTMLImageElement & { "data-loaded-src"?: string };

/**
 * 在图片加载/hydrate 后调用。
 * - 使用 img.decode() 确保像素已解码再触发回调
 * - 清除 blur placeholder
 * - 开发环境下输出 fill / sizes 相关警告
 */
export function handleLoading(
  img: ImgWithDataProp,
  placeholder: PlaceholderValue,
  onLoad: OnLoad | undefined,
  onLoadingComplete: OnLoadingComplete | undefined,
  setBlurComplete: (v: boolean) => void,
  unoptimized: boolean,
  sizesInput: string | undefined,
): void {
  const src = img?.src;
  // 同一张图只处理一次
  if (!img || img["data-loaded-src"] === src) return;
  img["data-loaded-src"] = src;

  const p: Promise<void> = "decode" in img ? img.decode() : Promise.resolve();

  p.catch(() => {}).then(() => {
    // 若组件已卸载则提前退出
    if (!img.parentElement || !img.isConnected) return;

    if (placeholder !== "empty") {
      setBlurComplete(true);
    }

    if (onLoad) {
      const event = new Event("load");
      Object.defineProperty(event, "target", { writable: false, value: img });
      onLoad(
        event as Event & { currentTarget: HTMLImageElement; target: Element },
      );
    }

    if (onLoadingComplete) {
      onLoadingComplete(img);
    }

    if (import.meta.env.DEV) {
      warnFillUsage(img, unoptimized, sizesInput);
      warnAspectRatioMismatch(img);
    }
  });
}

// ─── 开发警告辅助 ──────────────────────────────────────────────────────────────

function warnFillUsage(
  img: HTMLImageElement,
  unoptimized: boolean,
  sizesInput: string | undefined,
): void {
  if (img.getAttribute("data-nimg") !== "fill") return;

  const origSrc =
    new URL(img.src, "http://n").searchParams.get("url") || img.src;

  if (!unoptimized) {
    const widthViewportRatio =
      img.getBoundingClientRect().width / window.innerWidth;
    if (widthViewportRatio < 0.6) {
      if (sizesInput === "100vw") {
        console.warn(
          `[Image] src="${origSrc}" 设置了 fill 和 sizes="100vw"，但实际渲染宽度不足视口宽度，请调整 sizes 以提升性能。`,
        );
      } else if (!sizesInput) {
        console.warn(
          `[Image] src="${origSrc}" 设置了 fill 但缺少 sizes 属性，请添加以提升性能。`,
        );
      }
    }
  }

  // 走到这里说明 img.parentElement 一定存在（函数开头的 `!img.parentElement ||`
  // 已经把脱离 DOM 的情况挡掉了），因此不需要再判空
  const { position } = window.getComputedStyle(
    img.parentElement as HTMLElement,
  );
  const valid = ["absolute", "fixed", "relative"];
  if (!valid.includes(position)) {
    console.warn(
      `[Image] src="${origSrc}" 设置了 fill，但父元素 position="${position}"，应为 ${valid.join(" | ")} 之一。`,
    );
  }

  if (img.height === 0) {
    console.warn(
      `[Image] src="${origSrc}" 设置了 fill 且高度为 0，请为父元素设置明确高度。`,
    );
  }
}

function warnAspectRatioMismatch(img: HTMLImageElement): void {
  const heightModified = img.height.toString() !== img.getAttribute("height");
  const widthModified = img.width.toString() !== img.getAttribute("width");
  if (
    (heightModified && !widthModified) ||
    (!heightModified && widthModified)
  ) {
    const origSrc =
      new URL(img.src, "http://n").searchParams.get("url") || img.src;
    console.warn(
      `[Image] src="${origSrc}" 仅修改了 width 或 height 其中之一，请同时添加 width: "auto" 或 height: "auto" 样式以保持宽高比。`,
    );
  }
}
