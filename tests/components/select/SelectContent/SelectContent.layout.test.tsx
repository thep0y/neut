import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";
import { SelectTrigger } from "~/components/select/SelectTrigger/SelectTrigger";
import { SelectValue } from "~/components/select/SelectValue/SelectValue";

/**
 * `SelectContent` 里两个**依赖真实布局**的分支：
 * - `isVisible() && pos.isPositioned() ? 1 : 0`（外层 opacity）
 * - `pos.middlewareData().matchWidth?.width ? …px : undefined`（内层 width）
 *
 * jsdom 不做布局，因此需要喂两样东西（都属于"系统边界"，见 TESTING.md §4.5）：
 * 1. 元素的 `getBoundingClientRect`（否则恒为零矩形）；
 * 2. **视口的 clientWidth/clientHeight**——`hide` 中间件拿它算边界，
 *    而 jsdom 里 documentElement 的尺寸是 0×0，任何 reference 都会被判为"已隐藏"。
 */
function rect(width: number, top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: width,
    width,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

const originalRect = HTMLElement.prototype.getBoundingClientRect;
const originalWidth = Object.getOwnPropertyDescriptor(
  document.documentElement,
  "clientWidth",
);
const originalHeight = Object.getOwnPropertyDescriptor(
  document.documentElement,
  "clientHeight",
);

function stubLayout(width: number) {
  HTMLElement.prototype.getBoundingClientRect = () => rect(width, 100, 40);
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: 768,
  });
}

function restoreLayout() {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  if (originalWidth) {
    Object.defineProperty(
      document.documentElement,
      "clientWidth",
      originalWidth,
    );
  }
  if (originalHeight) {
    Object.defineProperty(
      document.documentElement,
      "clientHeight",
      originalHeight,
    );
  }
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function renderSelect() {
  return render(() => (
    <Select defaultOpen>
      <SelectTrigger>
        <SelectValue placeholder="请选择" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">苹果</SelectItem>
      </SelectContent>
    </Select>
  ));
}

afterEach(() => {
  restoreLayout();
});

describe("SelectContent - 布局相关分支（回归）", () => {
  it("reference 可见且已定位时 opacity=1，并按 trigger 宽度对齐", async () => {
    stubLayout(240);
    renderSelect();
    await flush();

    const outer = document.querySelector(
      '[data-slot="select-content"]',
    ) as HTMLElement;
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;

    expect(outer.style.opacity).toBe("1");
    expect(outer.style.visibility).toBe("visible");
    expect(listbox.style.width).toBe("240px");
  });

  it("对照：没有布局信息时 opacity=0、隐藏，且不写宽度", async () => {
    renderSelect();
    await flush();

    const outer = document.querySelector(
      '[data-slot="select-content"]',
    ) as HTMLElement;
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;

    expect(outer.style.opacity).toBe("0");
    expect(outer.style.visibility).toBe("hidden");
    expect(listbox.style.width).toBe("");
  });
});
