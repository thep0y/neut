import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Bubble } from "~/components/bubble/Bubble/Bubble";
import { BubbleContent } from "~/components/bubble/BubbleContent/BubbleContent";
import { BubbleGroup } from "~/components/bubble/BubbleGroup/BubbleGroup";
import { BubbleReactions } from "~/components/bubble/BubbleReactions/BubbleReactions";

/**
 * Bubble 集成测试：用真实组合（分组 → 气泡 → 内容 / 反应行）验证部件接线。
 * 各部件自身的类名与属性透传已在单测覆盖，这里只看跨部件行为：
 * 直接子级关系（变体样式依赖 `*:data-[slot=bubble-content]`）、事件互不串扰、
 * 以及 class 钩子能否一路落到对应部件上。
 */
describe("Bubble 集成 - 组合结构", () => {
  it("分组内每个气泡都渲染出 content 与 reactions，且 content 是气泡的直接子级", () => {
    const { container } = render(() => (
      <BubbleGroup role="log" aria-label="对话">
        <Bubble>
          <BubbleContent>构建失败了</BubbleContent>
          <BubbleReactions role="img" aria-label="1 个回应：👍">
            <span aria-hidden="true">👍</span>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="secondary" align="end">
          <BubbleContent>我看下日志</BubbleContent>
        </Bubble>
      </BubbleGroup>
    ));

    const group = container.querySelector('[data-slot="bubble-group"]')!;
    expect(group.children).toHaveLength(2);

    const bubbles = group.querySelectorAll('[data-slot="bubble"]');
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0].getAttribute("data-variant")).toBe("default");
    expect(bubbles[0].getAttribute("data-align")).toBe("start");
    expect(bubbles[1].getAttribute("data-variant")).toBe("secondary");
    expect(bubbles[1].getAttribute("data-align")).toBe("end");

    // 变体样式走直接子选择器，content 不能多包一层
    expect(bubbles[0].children[0].getAttribute("data-slot")).toBe(
      "bubble-content",
    );
    expect(bubbles[0].children[1].getAttribute("data-slot")).toBe(
      "bubble-reactions",
    );
    expect(bubbles[0].children[0].textContent).toBe("构建失败了");
    expect(bubbles[0].children[1].textContent).toBe("👍");
    expect(bubbles[1].children).toHaveLength(1);
  });

  it("class 钩子分别落在分组 / 气泡 / 内容 / 反应行上", () => {
    const { container } = render(() => (
      <BubbleGroup class="my-thread" classList={{ "is-tight": true }}>
        <Bubble class="my-bubble" classList={{ "is-mine": true }}>
          <BubbleContent class="my-content" />
          <BubbleReactions class="my-reactions" />
        </Bubble>
      </BubbleGroup>
    ));

    expect(
      container
        .querySelector('[data-slot="bubble-group"]')!
        .classList.contains("my-thread"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="bubble-group"]')!
        .classList.contains("is-tight"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="bubble"]')!
        .classList.contains("is-mine"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="bubble-content"]')!
        .classList.contains("my-content"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="bubble-reactions"]')!
        .classList.contains("my-reactions"),
    ).toBe(true);
  });
});

describe("Bubble 集成 - 交互元素", () => {
  it("可点击气泡用 button 内容时能触发自己的回调，且不连带反应行", async () => {
    const user = userEvent.setup();
    const onContentClick = vi.fn();
    const onReactionClick = vi.fn();
    const { getByRole } = render(() => (
      <Bubble>
        <BubbleContent
          component="button"
          type="button"
          aria-label="重试构建"
          onClick={onContentClick}
        >
          重试
        </BubbleContent>
        <BubbleReactions>
          <button type="button" aria-label="点赞" onClick={onReactionClick}>
            👍
          </button>
        </BubbleReactions>
      </Bubble>
    ));

    await user.click(getByRole("button", { name: "重试构建" }));
    expect(onContentClick).toHaveBeenCalledTimes(1);
    expect(onReactionClick).not.toHaveBeenCalled();

    await user.click(getByRole("button", { name: "点赞" }));
    expect(onReactionClick).toHaveBeenCalledTimes(1);
    expect(onContentClick).toHaveBeenCalledTimes(1);
  });

  it("链接型气泡内容是真正的链接触达键盘，reactions 独立", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { getByRole } = render(() => (
      <Bubble>
        <BubbleContent
          component="a"
          href="/runs/42"
          aria-label="查看第 42 次运行"
          onClick={onClick}
        >
          查看运行
        </BubbleContent>
        <BubbleReactions aria-label="回应" role="group">
          <button type="button" aria-label="复制" />
        </BubbleReactions>
      </Bubble>
    ));

    const link = getByRole("link", { name: "查看第 42 次运行" });
    expect(link.getAttribute("href")).toBe("/runs/42");

    await user.tab();
    expect(document.activeElement).toBe(link);
    expect(getByRole("group", { name: "回应" })).toBeInTheDocument();
  });
});
