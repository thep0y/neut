import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Message } from "~/components/message/Message/Message";
import { MessageAvatar } from "~/components/message/MessageAvatar/MessageAvatar";
import { MessageContent } from "~/components/message/MessageContent/MessageContent";
import { MessageFooter } from "~/components/message/MessageFooter/MessageFooter";
import { MessageGroup } from "~/components/message/MessageGroup/MessageGroup";
import { MessageHeader } from "~/components/message/MessageHeader/MessageHeader";

/**
 * Message 集成测试：真实组合「会话 → 消息行 → 头像 / 内容 / header / footer」，
 * 验证排布顺序与各部件在整行里的接线（自身类名与透传见各自单测）。
 */
function thread() {
  return render(() => (
    <MessageGroup role="log" aria-label="对话">
      <Message>
        <MessageAvatar aria-hidden="true">
          <span data-testid="avatar-r">R</span>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Remy</MessageHeader>
          <div data-testid="body">构建失败了</div>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar aria-hidden="true">
          <span data-testid="avatar-me">ME</span>
        </MessageAvatar>
        <MessageContent>
          <div data-testid="body">我看下日志</div>
          <MessageFooter>
            <button type="button" data-testid="copy">
              复制
            </button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  ));
}

describe("Message 集成 - 会话结构", () => {
  it("MessageGroup 里渲染两条消息，align 各自独立", () => {
    const { container, getByRole } = thread();

    expect(getByRole("log")).toHaveAttribute("aria-label", "对话");
    const messages = container.querySelectorAll('[data-slot="message"]');
    expect(messages).toHaveLength(2);
    expect(messages[0].getAttribute("data-align")).toBe("start");
    expect(messages[1].getAttribute("data-align")).toBe("end");
  });

  it("每条消息内部顺序是「头像 → 内容」，内容内部是「header → 正文 → footer」", () => {
    const { container } = thread();
    const messages = container.querySelectorAll('[data-slot="message"]');

    const first = messages[0];
    expect(first.children[0].getAttribute("data-slot")).toBe("message-avatar");
    expect(first.children[1].getAttribute("data-slot")).toBe("message-content");

    const second = messages[1];
    const content = second.children[1];
    expect(
      Array.from(content.children).map(
        (child) =>
          child.getAttribute("data-slot") ?? child.getAttribute("data-testid"),
      ),
    ).toEqual(["body", "message-footer"]);
    expect(
      first.querySelector('[data-slot="message-header"]')?.textContent,
    ).toBe("Remy");
  });

  it("footer 里的操作按钮可以正常点击（布局容器不吞事件）", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(() => (
      <Message align="end">
        <MessageAvatar aria-hidden="true" />
        <MessageContent>
          <MessageFooter>
            <button type="button" onClick={onClick}>
              复制
            </button>
          </MessageFooter>
        </MessageContent>
      </Message>
    ));

    await user.click(
      container.querySelector('[data-slot="message-footer"] button')!,
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("样式钩子（class / classList / 属性）能一路透传到各部件", () => {
    const { container } = render(() => (
      <Message
        align="end"
        class="my-message"
        classList={{ "is-first": true }}
        data-message-id="m-1"
      >
        <MessageAvatar class="my-avatar" />
        <MessageContent class="my-content">
          <MessageHeader class="my-header">Remy</MessageHeader>
          <MessageFooter class="my-footer">已送达</MessageFooter>
        </MessageContent>
      </Message>
    ));

    const message = container.querySelector('[data-slot="message"]')!;
    expect(message.classList.contains("my-message")).toBe(true);
    expect(message.classList.contains("is-first")).toBe(true);
    expect(message.getAttribute("data-message-id")).toBe("m-1");
    expect(
      container
        .querySelector('[data-slot="message-avatar"]')!
        .classList.contains("my-avatar"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="message-content"]')!
        .classList.contains("my-content"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="message-header"]')!
        .classList.contains("my-header"),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-slot="message-footer"]')!
        .classList.contains("my-footer"),
    ).toBe(true);
  });
});
