import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import type { CarouselOptions } from "~/components/carousel/Carousel/Carousel.types";
import { useCarousel } from "~/components/carousel/Carousel/useCarousel";

/**
 * `useCarousel` 是 carousel 的唯一状态源：索引算术、可见数派生与 item 注册表。
 * 这里直接驱动它，不经过 DOM（组件层的行为另见 integration 用例）。
 */

function createCarousel(options: CarouselOptions = {}) {
  return createRoot((dispose) => ({ api: useCarousel(options), dispose }));
}

describe("useCarousel - 初始状态", () => {
  it("默认非循环、水平方向、索引 0、无 item", () => {
    const { api } = createCarousel();

    expect(api.currentIndex()).toBe(0);
    expect(api.itemCount()).toBe(0);
    expect(api.itemSize()).toBe(0);
    expect(api.viewportSize()).toBe(0);
    expect(api.loop()).toBe(false);
    expect(api.orientation()).toBe("horizontal");
  });

  it("显式传入 loop 与 vertical 时按其取值", () => {
    const { api } = createCarousel({ loop: true, orientation: "vertical" });

    expect(api.loop()).toBe(true);
    expect(api.orientation()).toBe("vertical");
  });
});

describe("useCarousel - 可见数影响 canScrollNext", () => {
  it("item 尺寸未知（0）时按可见 1 个计算", () => {
    const { api } = createCarousel();
    api.setViewportSize(900);
    api.registerItem();
    api.registerItem();
    api.registerItem();

    // itemSize 仍为 0：3 个 item、可见 1 个 -> 还能往后
    expect(api.canScrollNext()).toBe(true);
  });

  it("按四舍五入而不是向下取整计算可见数", () => {
    const { api } = createCarousel();
    api.setItemSize(340);
    api.setViewportSize(1000);
    api.registerItem();
    api.registerItem();
    api.registerItem();

    // 1000 / 340 = 2.94…：round -> 3（3 个 item 刚好占满，不能往后）
    // 若实现用 floor -> 2，则这里会误判为 true
    expect(api.canScrollNext()).toBe(false);

    api.registerItem();
    expect(api.canScrollNext()).toBe(true);
  });
});

describe("useCarousel - canScrollPrev / canScrollNext", () => {
  it("非循环时首项不能上一张、末项不能下一张", () => {
    const { api } = createCarousel();
    api.registerItem();
    api.registerItem();
    api.registerItem();

    expect(api.canScrollPrev()).toBe(false);
    expect(api.canScrollNext()).toBe(true);

    api.scrollTo(2);
    expect(api.currentIndex()).toBe(2);
    expect(api.canScrollPrev()).toBe(true);
    expect(api.canScrollNext()).toBe(false);
  });

  it("循环时首项仍可上一张、末项仍可下一张", () => {
    const { api } = createCarousel({ loop: true });
    api.registerItem();
    api.registerItem();
    api.registerItem();

    expect(api.canScrollPrev()).toBe(true);
    api.scrollTo(2);
    expect(api.canScrollNext()).toBe(true);
  });
});

describe("useCarousel - scrollTo", () => {
  it("非循环时把越界索引夹取到 [0, count - 1]", () => {
    const { api } = createCarousel();
    api.registerItem();
    api.registerItem();
    api.registerItem();

    api.scrollTo(-5);
    expect(api.currentIndex()).toBe(0);

    api.scrollTo(99);
    expect(api.currentIndex()).toBe(2);

    api.scrollTo(1);
    expect(api.currentIndex()).toBe(1);
  });

  it("循环时负数与越界都环绕到另一端", () => {
    const { api } = createCarousel({ loop: true });
    api.registerItem();
    api.registerItem();
    api.registerItem();

    api.scrollTo(3);
    expect(api.currentIndex()).toBe(0);

    api.scrollTo(-1);
    expect(api.currentIndex()).toBe(2);

    api.scrollTo(4);
    expect(api.currentIndex()).toBe(1);
  });

  it("没有任何 item 时忽略跳转请求", () => {
    const { api } = createCarousel();

    api.scrollTo(2);

    expect(api.currentIndex()).toBe(0);
  });
});

describe("useCarousel - scrollPrev / scrollNext", () => {
  it("每调用一次只移动一位", () => {
    const { api } = createCarousel();
    api.registerItem();
    api.registerItem();
    api.registerItem();

    api.scrollNext();
    expect(api.currentIndex()).toBe(1);

    api.scrollNext();
    expect(api.currentIndex()).toBe(2);

    api.scrollPrev();
    expect(api.currentIndex()).toBe(1);
  });
});

describe("useCarousel - registerItem", () => {
  it("注册增加 itemCount，注销减少 itemCount", () => {
    const { api } = createCarousel();

    const unregisterA = api.registerItem();
    const unregisterB = api.registerItem();
    expect(api.itemCount()).toBe(2);

    unregisterA();
    expect(api.itemCount()).toBe(1);

    unregisterB();
    expect(api.itemCount()).toBe(0);
  });
});
