import { For, Show, createSignal, onCleanup } from "solid-js";
import { ArrowUp, CircleStop } from "lucide-solid";
import {
  Bubble,
  BubbleContent,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  Marker,
  MarkerContent,
  MarkerIcon,
  Message,
  MessageContent,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
} from "~/index";
import type { MessageScrollerDefaultPosition } from "~/index";
import type { Section } from "./shared";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function ChatRow(props: {
  message: ChatMessage;
  userVariant?: "default" | "muted";
  assistantVariant?: "muted" | "ghost";
}) {
  const isUser = props.message.role === "user";
  return (
    <MessageScrollerItem messageId={props.message.id} scrollAnchor={isUser}>
      <Message align={isUser ? "end" : "start"}>
        <MessageContent>
          <Bubble
            variant={
              isUser
                ? (props.userVariant ?? "default")
                : (props.assistantVariant ?? "muted")
            }
          >
            <BubbleContent class="whitespace-pre-wrap">
              {props.message.text}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

function Transcript(props: {
  messages: ChatMessage[];
  defaultScrollPosition?: MessageScrollerDefaultPosition;
  autoScroll?: boolean;
  userVariant?: "default" | "muted";
  assistantVariant?: "muted" | "ghost";
  thinking?: boolean;
}) {
  return (
    <div class="flex h-80 flex-col overflow-hidden rounded-3xl border">
      <MessageScrollerProvider
        defaultScrollPosition={props.defaultScrollPosition ?? "end"}
        autoScroll={props.autoScroll}
        scrollPreviousItemPeek={24}
      >
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent class="p-4">
              <For each={props.messages}>
                {(message) => (
                  <ChatRow
                    message={message}
                    userVariant={props.userVariant}
                    assistantVariant={props.assistantVariant}
                  />
                )}
              </For>
              <Show when={props.thinking}>
                <MessageScrollerItem scrollAnchor={false}>
                  <Marker role="status">
                    <MarkerIcon>
                      <Spinner />
                    </MarkerIcon>
                    <MarkerContent>Thinking...</MarkerContent>
                  </Marker>
                </MessageScrollerItem>
              </Show>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}

const script: { role: "user" | "assistant"; text: string }[] = [
  { role: "user", text: "Hello there!" },
  { role: "assistant", text: "Hey, how's it going?" },
  {
    role: "user",
    text: "I'm prototyping an AI chat surface for our product docs.\n\nCan you sketch a sensible component breakdown and call out anything I'd regret baking into v1?",
  },
  {
    role: "assistant",
    text: "## Recommended layout\n\nTreat the chat as three layers so scrolling and the composer never fight each other:\n\n- Shell: card or page frame, title, status indicator\n- Transcript: overflow-y-auto message list\n- Composer: input group, send, stop\n\n### Message rendering\n\n- User messages: right-aligned, muted background, max-w-[80%].\n- Assistant messages: full width within the column.\n\n### v1 pitfalls to avoid\n\n1. Inlining transport logic in the UI.\n2. Fixed transcript height without overflow-hidden.\n3. Not giving the scroller an auto-scroll flag.",
  },
  {
    role: "user",
    text: "What about message spacing when one reply is short and the next is really long?",
  },
  {
    role: "assistant",
    text: "Good question. The scroll container should own vertical rhythm, not individual bubbles. Use a consistent gap on the message list so short and long messages sit on the same grid. When a long reply streams in, pin the viewport to the bottom with MessageScroller autoScroll until the user scrolls up.",
  },
  { role: "user", text: "Thanks, that helps." },
  {
    role: "assistant",
    text: "Happy to help — send another message when you're ready to keep stepping through the demo.",
  },
];

function MessageScrollerChat() {
  const [messages, setMessages] = createSignal<ChatMessage[]>([
    { id: "m0", role: "user", text: script[0]!.text },
  ]);
  const [status, setStatus] = createSignal<"ready" | "submitted" | "streaming">(
    "ready",
  );
  let pointer = 1;
  let streamTimer: number | undefined;
  let submitTimer: number | undefined;
  const isBusy = () => status() === "submitted" || status() === "streaming";
  const nextMessage = () => script[pointer];

  const stop = () => {
    if (streamTimer !== undefined) {
      window.clearInterval(streamTimer);
      streamTimer = undefined;
    }
    if (submitTimer !== undefined) {
      window.clearTimeout(submitTimer);
      submitTimer = undefined;
    }
    setStatus("ready");
  };

  const send = () => {
    if (isBusy()) return;
    const next = nextMessage();
    if (!next) return;
    pointer += 1;
    const id = `m${pointer}`;
    setMessages((prev) => [...prev, { id, role: next.role, text: next.text }]);

    const reply = nextMessage();
    if (reply?.role !== "assistant") return;

    setStatus("submitted");
    submitTimer = window.setTimeout(() => {
      submitTimer = undefined;
      pointer += 1;
      const replyId = `m${pointer}`;
      setMessages((prev) => [
        ...prev,
        { id: replyId, role: "assistant", text: "" },
      ]);
      setStatus("streaming");
      let index = 0;
      streamTimer = window.setInterval(() => {
        index += 3;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, text: reply.text.slice(0, index) } : m,
          ),
        );
        if (index >= reply.text.length && streamTimer !== undefined) {
          window.clearInterval(streamTimer);
          streamTimer = undefined;
          setStatus("ready");
        }
      }, 20);
    }, 700);
  };

  onCleanup(() => {
    if (streamTimer !== undefined) window.clearInterval(streamTimer);
    if (submitTimer !== undefined) window.clearTimeout(submitTimer);
  });

  return (
    <div class="w-full max-w-md">
      <Card class="h-140">
        <CardHeader>
          <CardTitle>How can I help you today?</CardTitle>
          <CardDescription>Status: {status()}</CardDescription>
        </CardHeader>
        <CardContent class="min-h-0 flex-1 overflow-hidden p-0">
          <MessageScrollerProvider
            defaultScrollPosition="end"
            autoScroll
            scrollPreviousItemPeek={24}
          >
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent class="p-(--card-spacing)">
                  <For each={messages()}>
                    {(message) => <ChatRow message={message} />}
                  </For>
                  <Show when={status() === "submitted"}>
                    <MessageScrollerItem scrollAnchor={false}>
                      <Marker role="status">
                        <MarkerIcon>
                          <Spinner />
                        </MarkerIcon>
                        <MarkerContent>Thinking...</MarkerContent>
                      </Marker>
                    </MessageScrollerItem>
                  </Show>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </CardContent>
        <CardFooter>
          <form
            class="w-full"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <InputGroup>
              <InputGroupTextarea
                placeholder="Ask me anything..."
                class="h-10 min-h-10 overflow-y-auto"
                value={isBusy() ? "" : (nextMessage()?.text ?? "")}
                readOnly
              />
              <InputGroupAddon align="block-end" class="p-2">
                <Show when={!isBusy()}>
                  <InputGroupButton
                    variant="primary"
                    size="xs"
                    type="submit"
                    class="ml-auto"
                    aria-label="Send"
                    icon={<ArrowUp />}
                  />
                </Show>
                <Show when={isBusy()}>
                  <InputGroupButton
                    variant="secondary"
                    size="xs"
                    type="button"
                    class="ml-auto"
                    aria-label="Stop"
                    icon={<CircleStop />}
                    onClick={stop}
                  />
                </Show>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

const openingMessages: ChatMessage[] = [
  {
    id: "o1",
    role: "user",
    text: "This is the first message the user sent in the conversation.",
  },
  {
    id: "o2",
    role: "assistant",
    text: "Workspace creation rose 8%, but first invite completion only rose 2%.",
  },
  {
    id: "o3",
    role: "user",
    text: "This is the last message the user sent in the conversation.",
  },
  {
    id: "o4",
    role: "assistant",
    text: "Start with the invite step. Teams are creating workspaces but waiting to add collaborators.",
  },
  {
    id: "o5",
    role: "assistant",
    text: "Recommended follow-up:\n\n1. Compare invite drop-off by account size. 2. Check whether users who skip invites still return within 24 hours. 3. Review the empty-state copy on the first project screen. 4. Segment activation by template, since template users may not need invites right away.",
  },
  {
    id: "o6",
    role: "assistant",
    text: "If that pattern holds, the next experiment should make collaboration useful earlier instead of prompting for invites harder.",
  },
];

const positions: MessageScrollerDefaultPosition[] = [
  "start",
  "end",
  "last-anchor",
];

function MessageScrollerOpeningPosition() {
  const [position, setPosition] =
    createSignal<MessageScrollerDefaultPosition>("last-anchor");

  return (
    <div class="flex w-full max-w-md flex-col items-center gap-4">
      <Show when={position()} keyed>
        {(pos) => (
          <Transcript
            messages={openingMessages}
            defaultScrollPosition={pos}
            userVariant="muted"
            assistantVariant="ghost"
          />
        )}
      </Show>
      <ToggleGroup
        value={position()}
        onValueChange={(value) => {
          if (value) setPosition(value as MessageScrollerDefaultPosition);
        }}
        spacing={0}
        class="w-full"
      >
        <For each={positions}>
          {(value) => (
            <ToggleGroupItem value={value} class="flex-1 capitalize">
              {value}
            </ToggleGroupItem>
          )}
        </For>
      </ToggleGroup>
    </div>
  );
}

const seed: ChatMessage[] = [
  { id: "1", role: "user", text: "How can I help you today?" },
  {
    id: "2",
    role: "assistant",
    text: "I'm building a chat for our app and the scroll behavior is driving me nuts.",
  },
  {
    id: "3",
    role: "user",
    text: "Every time the AI streams a reply, the whole thread jumps around.",
  },
  {
    id: "4",
    role: "assistant",
    text: "That's the classic streaming scroll problem. Wrap your message list in MessageScroller and turn on autoScroll.",
  },
  {
    id: "5",
    role: "user",
    text: "Okay, but when someone sends a new message the view still feels jarring.",
  },
];

function MessageScrollerPrepend() {
  const [messages, setMessages] = createSignal<ChatMessage[]>(seed.slice(-2));
  let counter = 0;

  const loadHistory = () => {
    const older: ChatMessage[] = [];
    for (let i = 0; i < 4; i += 1) {
      counter += 1;
      older.push({
        id: `old-${counter}`,
        role: i % 2 === 0 ? "assistant" : "user",
        text: `Earlier message #${counter}: load history should not move your place.`,
      });
    }
    setMessages((prev) => [...older, ...prev]);
  };

  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <Transcript messages={messages()} defaultScrollPosition="end" />
      <Button variant="outline" class="w-full" onClick={loadHistory}>
        Load History
      </Button>
      <p class="text-xs text-muted-foreground">
        Prepended messages keep your place.
      </p>
    </div>
  );
}

export const messageScrollerSections: Section[] = [
  {
    id: "message-scroller-chat",
    title: "Chat",
    description:
      "A scripted chat transcript with auto-scroll, anchoring and a composer.",
    component: MessageScrollerChat,
  },
  {
    id: "message-scroller-opening-position",
    title: "Opening Position",
    description: "Choose where a saved transcript opens.",
    component: MessageScrollerOpeningPosition,
  },
  {
    id: "message-scroller-prepend",
    title: "Loading Earlier Messages",
    description: "Prepended history preserves the visible message.",
    component: MessageScrollerPrepend,
  },
];
