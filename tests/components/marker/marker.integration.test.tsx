import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Marker } from "~/components/marker/Marker/Marker";
import { MarkerContent } from "~/components/marker/MarkerContent/MarkerContent";
import { MarkerIcon } from "~/components/marker/MarkerIcon/MarkerIcon";

/**
 * Marker 集成测试：真实组合「标记 → 图标 + 内容」，验证顺序、无障碍分工
 * （图标对 AT 隐藏、文本由 content 承载）与多态根的行为。
 * 各部件自身的类名/透传见各自单测。
 */
describe("Marker 集成 - 结构", () => {
  it("status 标记按「图标 → 文本」渲染，图标不进入无障碍树", () => {
    const { container, getByRole } = render(() => (
      <Marker role="status" aria-live="polite">
        <MarkerIcon>
          <span data-testid="spinner">◌</span>
        </MarkerIcon>
        <MarkerContent>正在压缩会话</MarkerContent>
      </Marker>
    ));
    const marker = getByRole("status");

    expect(marker.children).toHaveLength(2);
    expect(marker.children[0].getAttribute("data-slot")).toBe("marker-icon");
    expect(marker.children[1].getAttribute("data-slot")).toBe("marker-content");
    expect(
      container
        .querySelector('[data-slot="marker-icon"]')!
        .getAttribute("aria-hidden"),
    ).toBe("true");
    expect(marker.textContent).toBe("◌正在压缩会话");
    expect(
      container.querySelector('[data-slot="marker-content"]')?.textContent,
    ).toBe("正在压缩会话");
  });

  it("separator 变体的文本仍按普通内容播报（无 role=separator）", () => {
    const { container } = render(() => (
      <Marker variant="separator">
        <MarkerContent>今天</MarkerContent>
      </Marker>
    ));
    const marker = container.querySelector('[data-slot="marker"]')!;

    expect(marker.getAttribute("data-variant")).toBe("separator");
    expect(marker.hasAttribute("role")).toBe(false);
    expect(marker.textContent).toBe("今天");
  });
});

describe("Marker 集成 - 多态与样式钩子", () => {
  it("可点击标记用 a 时是真正的链接，icon 与 content 都在链接内", async () => {
    const user = userEvent.setup();
    // SPA 里链接点击通常由用户回调 preventDefault 接管，避免 jsdom 真的导航
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    const { getByRole } = render(() => (
      <Marker
        component="a"
        href="/sessions/7"
        variant="border"
        onClick={onClick}
      >
        <MarkerIcon>
          <span aria-hidden="true">→</span>
        </MarkerIcon>
        <MarkerContent>打开会话 7</MarkerContent>
      </Marker>
    ));
    const link = getByRole("link", { name: "打开会话 7" });

    expect(link.getAttribute("href")).toBe("/sessions/7");
    expect(link.getAttribute("data-variant")).toBe("border");
    expect(link.querySelector('[data-slot="marker-icon"]')).not.toBeNull();
    expect(
      link.querySelector('[data-slot="marker-content"]')?.textContent,
    ).toBe("打开会话 7");

    await user.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("class 钩子分别落在 marker / icon / content 上", () => {
    const { container } = render(() => (
      <Marker class="my-marker" classList={{ "is-muted": true }}>
        <MarkerIcon class="my-icon" classList={{ "is-spinning": true }} />
        <MarkerContent class="my-text" classList={{ "is-long": true }} />
      </Marker>
    ));

    const marker = container.querySelector('[data-slot="marker"]')!;
    expect(marker.classList.contains("my-marker")).toBe(true);
    expect(marker.classList.contains("is-muted")).toBe(true);
    expect(
      container
        .querySelector('[data-slot="marker-icon"]')!
        .classList.contains("is-spinning"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="marker-icon"]')!
        .classList.contains("my-icon"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="marker-content"]')!
        .classList.contains("my-text"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="marker-content"]')!
        .classList.contains("is-long"),
    ).toBe(true);
  });
});
