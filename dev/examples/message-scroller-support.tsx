import { For, createSignal, onCleanup } from "solid-js";
import {
  Bubble,
  BubbleContent,
  Message,
  MessageContent,
  MessageScrollerItem,
  clsx,
} from "~/index";
import "./message-scroller.css";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export type MessageAnimationId =
  | "fade"
  | "slide-up"
  | "slide-side"
  | "pop"
  | "spring-bounce"
  | "blur-fade"
  | "scale-fade";

export type MessageAnimationPreset = {
  id: MessageAnimationId;
  name: string;
  className: string;
};

/** 与上游 `@/lib/message-animations` 的 id/name 对齐，实现改为 CSS 动画 */
export const MESSAGE_ANIMATIONS: Record<MessageAnimationId, MessageAnimationPreset> = {
  fade: { id: "fade", name: "Fade", className: "ms-anim-fade" },
  "slide-up": {
    id: "slide-up",
    name: "Slide Up",
    className: "ms-anim-slide-up",
  },
  "slide-side": {
    id: "slide-side",
    name: "Slide Side",
    className: "ms-anim-slide-side",
  },
  pop: { id: "pop", name: "Pop", className: "ms-anim-pop" },
  "spring-bounce": {
    id: "spring-bounce",
    name: "Spring Bounce",
    className: "ms-anim-spring-bounce",
  },
  "blur-fade": {
    id: "blur-fade",
    name: "Blur Fade",
    className: "ms-anim-blur-fade",
  },
  "scale-fade": {
    id: "scale-fade",
    name: "Scale Fade",
    className: "ms-anim-scale-fade",
  },
};

type ScriptedTurn = { role: ChatRole; text: string; id?: string };

/**
 * 上游示例用 `@shadcn/helpers/ai-sdk` 的 `createChat()` 脚本化对话；
 * 本仓库不引入 AI SDK，这里实现同样的链式 API 与 `useScriptedChat` 驱动，
 * 用定时器模拟「提交 → 流式输出」。
 */
export function createChat() {
  const turns: ScriptedTurn[] = [];
  const api = {
    user(text: string, options?: { id?: string }) {
      turns.push({ role: "user", text, id: options?.id });
      return api;
    },
    assistant(text: string) {
      turns.push({ role: "assistant", text });
      return api;
    },
    sleep(_ms: number) {
      return api;
    },
    get(count = turns.length): ChatMessage[] {
      return turns.slice(0, count).map((turn, index) => ({
        id: turn.id ?? `chat-${index}`,
        role: turn.role,
        text: turn.text,
      }));
    },
    next(messages: ChatMessage[]): ChatMessage | undefined {
      const turn = turns[messages.length];
      if (!turn) return undefined;
      return {
        id: turn.id ?? `chat-${messages.length}`,
        role: turn.role,
        text: turn.text,
      };
    },
    transport(options?: { delayMs?: number }) {
      return { delayMs: options?.delayMs ?? 20 };
    },
    turns,
  };
  return api;
}

export function getMessageText(message: ChatMessage) {
  return message.text;
}

export function useScriptedChat(
  chat: ReturnType<typeof createChat>,
  options: { initialMessages: ChatMessage[]; delayMs?: number },
) {
  const [messages, setMessages] =
    createSignal<ChatMessage[]>(options.initialMessages);
  const [status, setStatus] = createSignal<
    "ready" | "submitted" | "streaming"
  >("ready");
  const isBusy = () => status() === "submitted" || status() === "streaming";

  let streamTimer: number | undefined;
  let submitTimer: number | undefined;

  const stopTimers = () => {
    if (streamTimer !== undefined) {
      window.clearInterval(streamTimer);
      streamTimer = undefined;
    }
    if (submitTimer !== undefined) {
      window.clearTimeout(submitTimer);
      submitTimer = undefined;
    }
  };

  onCleanup(stopTimers);

  const nextMessage = () => chat.next(messages());

  const sendMessage = (message: ChatMessage) => {
    if (isBusy()) return;
    const index = messages().length;
    const reply = chat.turns[index + 1];
    const replyId = `${message.id}-reply`;
    setMessages((prev) => [...prev, { ...message }]);
    if (!reply || reply.role !== "assistant") {
      setStatus("ready");
      return;
    }
    setStatus("submitted");
    submitTimer = window.setTimeout(() => {
      submitTimer = undefined;
      setMessages((prev) => [
        ...prev,
        { id: replyId, role: "assistant", text: "" },
      ]);
      setStatus("streaming");
      const chunk = Math.max(1, Math.round(reply.text.length / 90));
      let cursor = 0;
      streamTimer = window.setInterval(() => {
        cursor += chunk;
        setMessages((prev) =>
          prev.map((item) =>
            item.id === replyId
              ? { ...item, text: reply.text.slice(0, cursor) }
              : item,
          ),
        );
        if (cursor >= reply.text.length && streamTimer !== undefined) {
          window.clearInterval(streamTimer);
          streamTimer = undefined;
          setStatus("ready");
        }
      }, options.delayMs ?? 20);
    }, 600);
  };

  const reset = () => {
    stopTimers();
    setMessages(options.initialMessages);
    setStatus("ready");
  };

  return {
    messages,
    setMessages,
    status,
    isBusy,
    nextMessage,
    sendMessage,
    reset,
  };
}

function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

const DEFAULT_PRESET = MESSAGE_ANIMATIONS["slide-up"];

/** 对齐上游 `components/message-animated.tsx`：整行渲染 + 用户消息入场动画 */
type BubbleVariant =
  | "default"
  | "outline"
  | "muted"
  | "destructive"
  | "secondary"
  | "ghost"
  | "tinted";

export function MessageAnimated(props: {
  message: ChatMessage;
  scrollAnchor?: boolean;
  animationPreset?: MessageAnimationPreset;
  userVariant?: BubbleVariant;
  assistantVariant?: BubbleVariant;
  class?: string;
}) {
  const isUser = () => props.message.role === "user";
  // 只在挂载时捕获预设：切换预设不应重放已在屏幕上的行的入场动画
  const [preset] = createSignal(props.animationPreset ?? DEFAULT_PRESET);

  return (
    <MessageScrollerItem
      messageId={props.message.id}
      scrollAnchor={props.scrollAnchor ?? isUser()}
      class={clsx(isUser() && preset().className, props.class)}
    >
      <Message align={isUser() ? "end" : "start"}>
        <MessageContent>
          <Bubble
            variant={isUser() ? (props.userVariant ?? "muted") : (props.assistantVariant ?? "ghost")}
          >
            <BubbleContent class="space-y-2">
              <For each={paragraphs(props.message.text)}>
                {(paragraph) => (
                  <p class="whitespace-pre-wrap">{paragraph}</p>
                )}
              </For>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

/** 非动画的静态行（load-history / commands / visibility / opening-position 用） */
export function MessageRow(props: { message: ChatMessage; scrollAnchor?: boolean }) {
  const isUser = () => props.message.role === "user";
  return (
    <MessageScrollerItem
      messageId={props.message.id}
      scrollAnchor={props.scrollAnchor ?? false}
    >
      <Message align={isUser() ? "end" : "start"}>
        <MessageContent>
          <Bubble variant={isUser() ? "muted" : "ghost"}>
            <BubbleContent class="space-y-2">
              <For each={paragraphs(props.message.text)}>
                {(paragraph) => (
                  <p class="whitespace-pre-wrap">{paragraph}</p>
                )}
              </For>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}
