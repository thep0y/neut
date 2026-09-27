import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import {
  ArrowUp,
  Globe,
  Image,
  MessageCircleDashed,
  Paperclip,
  Plus,
  RotateCw,
  Telescope,
} from "lucide-solid";
import {
  Bubble,
  BubbleContent,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  Marker,
  MarkerContent,
  Message,
  MessageContent,
  MessageHeader,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Tabs,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  clsx,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "~/index";
import {
  MESSAGE_ANIMATIONS,
  MessageAnimated,
  MessageRow,
  createChat,
  getMessageText,
  useScriptedChat,
} from "./message-scroller-support";
import type {
  ChatMessage,
  ChatRole,
  MessageAnimationId,
} from "./message-scroller-support";
import type { Section } from "./shared";

function EmptyState(props: { title: string; description: string }) {
  return (
    <Empty class="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleDashed />
        </EmptyMedia>
        <EmptyTitle>{props.title}</EmptyTitle>
        <EmptyDescription>{props.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function ResetButton(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        variant="outline"
        size="sm"
        icon={<RotateCw />}
        aria-label={props.label}
        disabled={props.disabled}
        onClick={props.onClick}
      />
      <TooltipContent>
        <p>Reset</p>
      </TooltipContent>
    </Tooltip>
  );
}

function AttachMenu(props: { label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        variant="outline"
        size="sm"
        icon={<Plus />}
        aria-label={props.label ?? "Add files"}
      />
      <DropdownMenuContent side="top" align="start" class="w-44">
        <DropdownMenuItem>
          <Paperclip />
          Add Photos & Files
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Image />
          Create Image
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Telescope />
          Deep Research
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Globe />
          Web Search
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ScriptedComposer(props: {
  nextMessage: ChatMessage | undefined;
  isBusy: boolean;
  onSend: () => void;
  emptyHint: string;
}) {
  return (
    <form
      class="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        if (!props.nextMessage || props.isBusy) return;
        props.onSend();
      }}
    >
      <InputGroup>
        <div class="h-14 w-full px-3 py-2.5">
          <span
            class="line-clamp-2 opacity-60 data-[status=ready]:opacity-100"
            data-status={props.isBusy ? "streaming" : "ready"}
          >
            {props.nextMessage ? (
              getMessageText(props.nextMessage)
            ) : (
              <span class="text-muted-foreground">{props.emptyHint}</span>
            )}
          </span>
        </div>
        <InputGroupAddon align="block-end" class="pt-1">
          <AttachMenu />
          <InputGroupButton
            type="submit"
            variant="primary"
            size="sm"
            icon={<ArrowUp />}
            aria-label="Send"
            disabled={!props.nextMessage || props.isBusy}
            class="ml-auto"
          />
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

/* ---------------------------------- Chat ---------------------------------- */

const demoChat = createChat()
  .user(
    "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
  )
  .sleep(1000)
  .assistant(
    "That's the classic streaming scroll problem. Wrap your message list in `MessageScroller` and turn on `autoScroll` — the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved. You get smooth streaming without fighting the user's intent.",
  )
  .user(
    "Okay, but when someone sends a new message the view still feels jarring — like the whole conversation reloads from the top.",
  )
  .sleep(1000)
  .assistant(
    "MessageScrollerItem fixes that with turn anchoring. Set `scrollAnchor` on the turn that should settle near the top instead of blindly snapping to the document bottom.\n\nIt also leaves a small peek of the previous exchange visible above the anchor, so context isn't lost. The reply starts in view without that disorienting jump you get from a plain overflow container.",
  )
  .user(
    "And if they've scrolled up to re-read an older answer? I don't want to yank them back down.",
  )
  .sleep(1000)
  .assistant(
    "You won't. Auto-scroll only runs when the viewport is already pinned to the bottom, so scrolling up is a deliberate opt-out — their place in the thread stays put even as new tokens keep arriving below.\n\nWhen there is content they haven't seen yet, `MessageScrollerButton` appears at the bottom of the viewport. One tap jumps them back to the newest message and re-engages auto-scroll. Same pattern as Slack or iMessage: quiet when you're caught up, helpful when you're not.",
  )
  .user("Last one — does this work with assistive tech?")
  .sleep(1000)
  .assistant(
    '`MessageScrollerContent` sets `role="log"` and `aria-relevant="additions"` by default, so screen readers announce new messages as they stream in.\n\nThe scroll button is a real `<button>` with an sr-only label, and it\'s removed from the tab order when you\'re already at the bottom — no ghost focus stops.',
  );

const demoInitialMessages = demoChat.get(0);

function MessageScrollerDemo() {
  const { messages, status, isBusy, nextMessage, sendMessage, reset } =
    useScriptedChat(demoChat, { initialMessages: demoInitialMessages, delayMs: 20 });

  return (
    <MessageScrollerProvider>
      <div class="relative flex flex-col gap-4">
        <Card class="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader class="gap-1 border-b">
            <CardTitle>New Chat</CardTitle>
            <CardDescription>How can I help you today?</CardDescription>
            <CardAction>
              <ResetButton
                label="Reset conversation"
                disabled={isBusy()}
                onClick={reset}
              />
            </CardAction>
          </CardHeader>
          <CardContent class="flex-1 overflow-hidden p-0">
            <Show
              when={messages().length > 0}
              fallback={
                <EmptyState
                  title="Morning, shadcn!"
                  description="What are we working on today? Press send to start a new conversation"
                />
              }
            >
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent
                    aria-busy={isBusy()}
                    class="p-(--card-spacing)"
                  >
                    <For each={messages()}>
                      {(message) => (
                        <MessageAnimated
                          message={message}
                          scrollAnchor={message.role === "user"}
                        />
                      )}
                    </For>
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </Show>
          </CardContent>
          <CardFooter class="flex-col gap-2">
            <ScriptedComposer
              nextMessage={nextMessage()}
              isBusy={isBusy()}
              onSend={() => {
                const message = nextMessage();
                if (message) sendMessage(message);
              }}
              emptyHint="No messages queued. Reset the conversation."
            />
          </CardFooter>
        </Card>
        <div class="px-0.5 text-center text-xs text-muted-foreground">
          Demo is read only. Press send to send messages.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

/* ------------------------------ Anchoring Turns ----------------------------- */

const anchoringMessages: ChatMessage[] = [
  {
    id: "anchor-1-user",
    role: "user",
    text: "Can you show me how anchoring behaves when a new prompt starts the turn?",
  },
  {
    id: "anchor-1-assistant",
    role: "assistant",
    text: "Append the user prompt first, then append the assistant response. With User selected, the prompt settles near the top and the assistant response fills in below it.",
  },
  {
    id: "anchor-2-user",
    role: "user",
    text: "What changes when assistant messages are the anchor?",
  },
  {
    id: "anchor-2-assistant",
    role: "assistant",
    text: "Now each assistant response is the item `MessageScroller` keeps in view. This is useful when the reply is the moment you want readers to land on after each turn.",
  },
  {
    id: "anchor-3-user",
    role: "user",
    text: "Can I switch roles and keep adding turns?",
  },
  {
    id: "anchor-3-assistant",
    role: "assistant",
    text: "Yes. The next appended message with the selected role becomes the anchor, so you can compare user and assistant anchoring without resetting the demo.",
  },
];

function MessageScrollerAnchoring() {
  const [anchorRole, setAnchorRole] = createSignal<ChatRole>("user");
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [messageIndex, setMessageIndex] = createSignal(0);
  const nextMessage = () => anchoringMessages[messageIndex()];

  return (
    <div class="relative flex flex-col gap-4">
      <Card class="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader class="border-b">
          <CardTitle>Anchoring Turns</CardTitle>
          <CardDescription>
            Choose which role settles near the top edge.
          </CardDescription>
          <CardAction>
            <ResetButton
              label="Reset anchored turns"
              disabled={messages().length === 0}
              onClick={() => {
                setMessages([]);
                setMessageIndex(0);
              }}
            />
          </CardAction>
        </CardHeader>
        <CardContent class="min-h-0 flex-1 overflow-hidden p-0">
          <Show
            when={messages().length > 0}
            fallback={
              <EmptyState
                title="No anchored messages yet"
                description="Send the first message to see the selected role anchor."
              />
            }
          >
            <MessageScrollerProvider>
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent class="p-(--card-spacing)">
                    <For each={messages()}>
                      {(message) => (
                        <MessageAnimated
                          message={message}
                          scrollAnchor={message.role === anchorRole()}
                          userVariant="muted"
                          assistantVariant="ghost"
                        />
                      )}
                    </For>
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </Show>
        </CardContent>
        <CardFooter>
          <ToggleGroup
            aria-label="Select scroll anchor role"
            value={anchorRole()}
            onValueChange={(value) => {
              if (value === "user" || value === "assistant") {
                setAnchorRole(value);
                setMessages([]);
                setMessageIndex(0);
              }
            }}
          >
            <ToggleGroupItem value="user" aria-label="Anchor user messages">
              User
            </ToggleGroupItem>
            <ToggleGroupItem
              value="assistant"
              aria-label="Anchor assistant messages"
            >
              Assistant
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            type="button"
            size="sm"
            icon={<ArrowUp />}
            aria-label="Send Message"
            class="ml-auto"
            disabled={!nextMessage()}
            onClick={() => {
              const message = nextMessage();
              if (!message) return;
              setMessages((prev) => [...prev, message]);
              setMessageIndex((index) => index + 1);
            }}
          />
        </CardFooter>
      </Card>
      <div class="mx-auto max-w-xs px-0.5 text-center text-xs text-muted-foreground">
        Toggle the anchor role, then send messages to compare where turns
        settle.
      </div>
    </div>
  );
}

/* -------------------------------- Group Chat -------------------------------- */

const groupChatCurrentUser = "Grace";

type GroupChatItem =
  | { id: string; type: "event"; text: string; scrollAnchor?: boolean }
  | {
      id: string;
      type: "message";
      sender: string;
      role: "assistant" | "participant";
      text: string;
      scrollAnchor?: boolean;
    };

const groupInitialItems: GroupChatItem[] = [
  {
    id: "group-1",
    type: "message",
    sender: "Grace",
    role: "participant",
    text: "@mary, the astrophage line keeps matching Venus energy output. Can you check my math?",
  },
  {
    id: "group-2",
    type: "message",
    sender: "Mary (Agent)",
    role: "assistant",
    text: "Yes. Confirmed. The curve points to a microorganism harvesting stellar energy and breeding near carbon dioxide. If @rocky agrees, this is the clue we need.",
  },
  {
    id: "group-3",
    type: "message",
    sender: "Grace",
    role: "participant",
    text: "ping @rocky",
    scrollAnchor: true,
  },
];

const rockyMarker: GroupChatItem = {
  id: "group-4",
  type: "event",
  text: "Rocky has joined the chat",
  scrollAnchor: true,
};

const rockyMessage: GroupChatItem = {
  id: "group-5",
  type: "message",
  sender: "Rocky",
  role: "participant",
  text: "Amaze. Astrophage eats light, makes heat, goes to carbon dioxide. Rocky has fuel model. Grace is smart.",
};

function GroupChatMessage(props: {
  item: Extract<GroupChatItem, { type: "message" }>;
}) {
  const isCurrentUser = () => props.item.sender === groupChatCurrentUser;
  const variant = () =>
    isCurrentUser()
      ? "muted"
      : props.item.role === "assistant"
        ? "ghost"
        : "tinted";
  return (
    <MessageScrollerItem
      messageId={props.item.id}
      scrollAnchor={props.item.scrollAnchor}
    >
      <Message align={isCurrentUser() ? "end" : "start"}>
        <MessageContent>
          <Show when={!isCurrentUser()}>
            <MessageHeader>{props.item.sender}</MessageHeader>
          </Show>
          <Bubble variant={variant()}>
            <BubbleContent>{props.item.text}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

function GroupChatMarker(props: {
  item: Extract<GroupChatItem, { type: "event" }>;
}) {
  return (
    <MessageScrollerItem scrollAnchor={props.item.scrollAnchor ?? false}>
      <Marker variant="separator">
        <MarkerContent>{props.item.text}</MarkerContent>
      </Marker>
    </MessageScrollerItem>
  );
}

function MessageScrollerGroupChat() {
  const [demoKey, setDemoKey] = createSignal(1);
  const [rockyTurn, setRockyTurn] = createSignal<"idle" | "marker" | "message">(
    "idle",
  );
  const items = () =>
    rockyTurn() === "message"
      ? [...groupInitialItems, rockyMarker, rockyMessage]
      : rockyTurn() === "marker"
        ? [...groupInitialItems, rockyMarker]
        : groupInitialItems;
  const buttonLabel = () =>
    rockyTurn() === "idle" ? "Add Rocky" : "Send Message as Rocky";

  return (
    <MessageScrollerProvider>
      <div class="relative flex flex-col gap-4">
        <Card class="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader class="gap-1 border-b">
            <CardTitle>Group Chat</CardTitle>
            <CardDescription>
              A group chat with several participants and an assistant. The
              Marker is marked as a turn.
            </CardDescription>
            <CardAction>
              <ResetButton
                label="Reset conversation"
                disabled={rockyTurn() === "idle"}
                onClick={() => {
                  setRockyTurn("idle");
                  setDemoKey((key) => key + 1);
                }}
              />
            </CardAction>
          </CardHeader>
          <CardContent class="min-h-0 flex-1 p-0">
            <MessageScrollerProvider>
              <Show when={demoKey()} keyed>
                {(_key) => (
                  <MessageScroller>
                    <MessageScrollerViewport>
                      <MessageScrollerContent class="p-(--card-spacing)">
                        <For each={items()}>
                          {(item) =>
                            item.type === "message" ? (
                              <GroupChatMessage item={item} />
                            ) : (
                              <GroupChatMarker item={item} />
                            )
                          }
                        </For>
                      </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                  </MessageScroller>
                )}
              </Show>
            </MessageScrollerProvider>
          </CardContent>
          <CardFooter class="flex flex-col items-center gap-2 border-t">
            <Button
              type="button"
              disabled={rockyTurn() === "message"}
              onClick={() =>
                setRockyTurn((turn) => (turn === "idle" ? "marker" : "message"))
              }
              class="w-full"
              variant="secondary"
            >
              {buttonLabel()}
            </Button>
            <p class="text-xs text-muted-foreground">
              {rockyTurn() === "idle"
                ? "This will create a marker and make it the anchor"
                : "Now send Rocky's reply into the conversation"}
            </p>
          </CardFooter>
        </Card>
        <div class="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-muted-foreground">
          When a user joins, a marker is created. scrollAnchor on the marker
          marks it as the next turn
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

/* --------------------------- Keeping Context Visible ------------------------- */

const contextChat = createChat()
  .user(
    "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
  )
  .sleep(1000)
  .assistant(
    "That's the classic streaming scroll problem. Wrap your message list in `MessageScroller` and turn on `autoScroll` — the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved. You get smooth streaming without fighting the user's intent.",
  )
  .user(
    "Okay, but when someone sends a new message the view still feels jarring — like the whole conversation reloads from the top.",
  )
  .sleep(1000)
  .assistant(
    "MessageScrollerItem fixes that with turn anchoring. Set `scrollAnchor` on the turn that should settle near the top instead of blindly snapping to the document bottom.\n\nIt also leaves a small peek of the previous exchange visible above the anchor, so context isn't lost. The reply starts in view without that disorienting jump you get from a plain overflow container.",
  )
  .user(
    "And if they've scrolled up to re-read an older answer? I don't want to yank them back down.",
  )
  .sleep(1000)
  .assistant(
    "You won't. Auto-scroll only runs when the viewport is already pinned to the bottom, so scrolling up is a deliberate opt-out — their place in the thread stays put even as new tokens keep arriving below.\n\nWhen there is content they haven't seen yet, `MessageScrollerButton` appears at the bottom of the viewport. One tap jumps them back to the newest message and re-engages auto-scroll. Same pattern as Slack or iMessage: quiet when you're caught up, helpful when you're not.",
  )
  .user("Last one — does this work with assistive tech?")
  .sleep(1000)
  .assistant(
    '`MessageScrollerContent` sets `role="log"` and `aria-relevant="additions"` by default, so screen readers announce new messages as they stream in.\n\nThe scroll button is a real `<button>` with an sr-only label, and it\'s removed from the tab order when you\'re already at the bottom — no ghost focus stops.',
  );

const contextInitialMessages = contextChat.get(2);
const DEFAULT_PEEK = 64;

function MessageScrollerPreviousContext() {
  const [demoKey, setDemoKey] = createSignal(1);
  const [peek, setPeek] = createSignal(DEFAULT_PEEK);
  const { messages, status, isBusy, nextMessage, sendMessage, reset } =
    useScriptedChat(contextChat, {
      initialMessages: contextInitialMessages,
      delayMs: 35,
    });

  return (
    <Show when={demoKey()} keyed>
      {(_key) => (
        <MessageScrollerProvider scrollMargin={24} scrollPreviousItemPeek={peek()}>
          <div class="relative flex flex-col gap-4">
            <Card class="mx-auto h-140 w-full max-w-sm gap-0">
              <CardHeader class="gap-1 border-b">
                <CardTitle>Keeping Context Visible</CardTitle>
                <CardDescription>
                  New turns keep part of the previous reply in view.
                </CardDescription>
                <CardAction>
                  <ResetButton
                    label="Reset context example"
                    disabled={isBusy()}
                    onClick={() => {
                      reset();
                      setPeek(DEFAULT_PEEK);
                      setDemoKey((key) => key + 1);
                    }}
                  />
                </CardAction>
              </CardHeader>
              <CardContent class="flex-1 overflow-hidden p-0">
                <MessageScroller>
                  <MessageScrollerViewport>
                    <MessageScrollerContent
                      aria-busy={isBusy()}
                      class="p-(--card-spacing)"
                    >
                      <For each={messages()}>
                        {(message) => (
                          <MessageAnimated
                            message={message}
                            scrollAnchor={message.role === "user"}
                          />
                        )}
                      </For>
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton />
                </MessageScroller>
              </CardContent>
              <CardFooter class="flex-col gap-2">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const message = nextMessage();
                    if (!message || isBusy()) return;
                    sendMessage(message);
                  }}
                  class="w-full"
                >
                  <InputGroup>
                    <div class="h-14 w-full px-3 py-2.5">
                      <span
                        class="line-clamp-2 opacity-60 data-[status=ready]:opacity-100"
                        data-status={status()}
                      >
                        {nextMessage() ? (
                          getMessageText(nextMessage()!)
                        ) : (
                          <span class="text-muted-foreground">
                            No messages queued. Reset the context.
                          </span>
                        )}
                      </span>
                    </div>
                    <InputGroupAddon align="block-end" class="pt-1">
                      <AttachMenu />
                      <div class="flex w-28 items-center gap-2">
                        <span class="text-xs text-muted-foreground tabular-nums">
                          {peek()}px
                        </span>
                        <Slider
                          aria-label="Previous context peek"
                          value={peek()}
                          min={64}
                          max={128}
                          step={1}
                          disabled={isBusy()}
                          onValueChange={setPeek}
                        />
                      </div>
                      <InputGroupButton
                        type="submit"
                        variant="primary"
                        size="sm"
                        icon={<ArrowUp />}
                        aria-label="Send"
                        disabled={!nextMessage() || isBusy()}
                        class="ml-auto"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </form>
              </CardFooter>
            </Card>
            <div class="px-0.5 text-center text-xs text-muted-foreground">
              Adjust the slider and send. Observe the previous message peak
            </div>
          </div>
        </MessageScrollerProvider>
      )}
    </Show>
  );
}

/* --------------------------- Following the Live Edge ------------------------- */

function MessageScrollerStreaming() {
  const { messages, status, isBusy, nextMessage, sendMessage, reset } =
    useScriptedChat(demoChat, { initialMessages: demoInitialMessages, delayMs: 20 });

  return (
    <MessageScrollerProvider autoScroll>
      <div class="relative flex flex-col gap-4">
        <Card class="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader class="gap-1 border-b">
            <CardTitle>Streaming Messages</CardTitle>
            <CardDescription>
              Auto-scroll follows the live edge of the conversation.
            </CardDescription>
            <CardAction>
              <ResetButton
                label="Reset stream"
                disabled={messages().length === 0 || isBusy()}
                onClick={reset}
              />
            </CardAction>
          </CardHeader>
          <CardContent class="flex-1 overflow-hidden p-0">
            <Show
              when={messages().length > 0}
              fallback={
                <EmptyState
                  title="Ready to Stream"
                  description="Press send to stream a scripted launch summary."
                />
              }
            >
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent
                    aria-busy={isBusy()}
                    class="p-(--card-spacing)"
                  >
                    <For each={messages()}>
                      {(message) => (
                        <MessageAnimated
                          message={message}
                          scrollAnchor={message.role === "user"}
                        />
                      )}
                    </For>
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </Show>
          </CardContent>
          <CardFooter class="flex-col gap-2">
            <ScriptedComposer
              nextMessage={nextMessage()}
              isBusy={isBusy()}
              onSend={() => {
                const message = nextMessage();
                if (message) sendMessage(message);
              }}
              emptyHint="No messages queued. Reset the stream."
            />
          </CardFooter>
        </Card>
        <div class="px-0.5 text-center text-xs text-muted-foreground">
          Streaming is simulated. `autoScroll` is enabled.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

/* ------------------------------ Opening Position ----------------------------- */

const openingMessages: ChatMessage[] = [
  {
    id: "open-1",
    role: "user",
    text: "This is the first message the user sent in the conversation.",
  },
  {
    id: "open-2",
    role: "assistant",
    text: "Workspace creation rose 8%, but first invite completion only rose 2%.",
  },
  {
    id: "open-3",
    role: "user",
    text: "This is the last message the user sent in the conversation.",
  },
  {
    id: "open-4",
    role: "assistant",
    text: "Start with the invite step. Teams are creating workspaces but waiting to add collaborators.\n\nRecommended follow-up:\n\n1. Compare invite drop-off by account size.\n2. Check whether users who skip invites still return within 24 hours.\n3. Review the empty-state copy on the first project screen.\n4. Segment activation by template, since template users may not need invites right away.\n\nIf that pattern holds, the next experiment should make collaboration useful earlier instead of prompting for invites harder.",
  },
];

const openingPositions: {
  value: "start" | "end" | "last-anchor";
  label: string;
}[] = [
  { value: "start", label: "start" },
  { value: "end", label: "end" },
  { value: "last-anchor", label: "last-anchor" },
];

function OpeningPositionScroller(props: {
  position: "start" | "end" | "last-anchor";
}) {
  const { scrollToStart, scrollToEnd, scrollToMessage } = useMessageScroller();

  onMount(() => {
    const frame = requestAnimationFrame(() => {
      if (props.position === "start") {
        scrollToStart({ behavior: "auto" });
        return;
      }
      if (props.position === "end") {
        scrollToEnd({ behavior: "auto" });
        return;
      }
      scrollToMessage("open-3", {
        align: "start",
        behavior: "auto",
        scrollMargin: 64,
      });
    });
    onCleanup(() => cancelAnimationFrame(frame));
  });

  return (
    <MessageScroller>
      <MessageScrollerViewport>
        <MessageScrollerContent class="p-(--card-spacing)">
          <For each={openingMessages}>
            {(message) => (
              <MessageRow
                message={message}
                scrollAnchor={message.role === "user"}
              />
            )}
          </For>
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  );
}

function MessageScrollerOpeningPosition() {
  const [positionKey, setPositionKey] = createSignal(1);
  const [position, setPosition] = createSignal<"start" | "end" | "last-anchor">(
    "last-anchor",
  );

  return (
    <div class="relative flex flex-col gap-4">
      <Card class="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader class="gap-1 border-b">
          <CardTitle>Opening Position</CardTitle>
          <CardDescription>
            Choose where a saved transcript opens.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex-1 overflow-hidden p-0">
          <MessageScrollerProvider>
            <Show when={positionKey()} keyed>
              {(_key) => <OpeningPositionScroller position={position()} />}
            </Show>
          </MessageScrollerProvider>
        </CardContent>
        <CardFooter class="flex items-center justify-center border-t">
          <Tabs
            value={position()}
            onValueChange={(value) => {
              if (
                value === "start" ||
                value === "end" ||
                value === "last-anchor"
              ) {
                setPosition(value);
                setPositionKey((key) => key + 1);
              }
            }}
            class="w-full"
          >
            <TabsList class="w-full">
              <For each={openingPositions}>
                {(option) => (
                  <TabsTrigger value={option.value}>{option.label}</TabsTrigger>
                )}
              </For>
            </TabsList>
          </Tabs>
        </CardFooter>
      </Card>
      <div class="mx-auto max-w-sm px-0.5 text-center text-xs text-muted-foreground">
        Toggle the defaultScrollPosition to see where the transcript starts when
        you open the thread
      </div>
    </div>
  );
}

/* ------------------------------ Loading History ------------------------------ */

const historyChat = createChat()
  .user("Can you summarize the incident channel?")
  .assistant(
    "The first alert was a delayed export job. It started backing up around 09:42 UTC and triggered the warning once the retry queue crossed the threshold.\n\nNo customer-facing checkout paths were affected, but exports for larger workspaces were running about 12 minutes behind.",
  )
  .user("Was checkout affected?")
  .assistant(
    "No checkout errors were reported. Payment authorization, order creation, and confirmation emails stayed inside their normal latency bands.\n\nThe only elevated metric was export queue depth, which maps to analytics downloads instead of checkout.",
  )
  .user("What changed in the last deploy?")
  .assistant(
    "Only the export queue worker changed. The deploy moved large CSV jobs onto the shared retry policy, which made each failed attempt hold a worker slot longer than before.\n\nThe app deploy did not include checkout, pricing, or billing API changes.",
  )
  .user("Do we need to roll back?")
  .assistant(
    "Not yet. Queue depth is recovering after we reduced retry concurrency, and the oldest pending job is now under five minutes old.\n\nKeep rollback ready if the queue starts climbing again, but the current trend points toward recovery.",
  )
  .user("Keep watching for customer-visible issues.")
  .assistant(
    "I will watch the queue and support tags for another 15 minutes. I am tracking export failures, delayed download requests, and any support thread that mentions missing reports.\n\nIf those stay quiet through the next batch window, we can close this as an internal degradation.",
  );

const historyAll = historyChat.get();
const INITIAL_VISIBLE_COUNT = 5;

function MessageScrollerLoadHistory() {
  const [demoKey, setDemoKey] = createSignal(1);
  const [visibleCount, setVisibleCount] = createSignal(INITIAL_VISIBLE_COUNT);
  const visibleMessages = () => historyAll.slice(-visibleCount());
  const canLoadHistory = () => visibleCount() < historyAll.length;

  return (
    <MessageScrollerProvider>
      <div class="relative flex flex-col gap-4">
        <Card class="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader class="gap-1 border-b">
            <CardTitle>Load History</CardTitle>
            <CardDescription>
              Prepended messages keep your place.
            </CardDescription>
            <CardAction>
              <ResetButton
                label="Reset loaded messages"
                disabled={visibleCount() === INITIAL_VISIBLE_COUNT}
                onClick={() => {
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                  setDemoKey((key) => key + 1);
                }}
              />
            </CardAction>
          </CardHeader>
          <CardContent class="flex-1 overflow-hidden p-0">
            <Show when={demoKey()} keyed>
              {(_key) => (
                <MessageScroller>
                  <MessageScrollerViewport>
                    <MessageScrollerContent class="p-(--card-spacing)">
                      <For each={visibleMessages()}>
                        {(message) => <MessageRow message={message} />}
                      </For>
                      <MessageScrollerItem scrollAnchor={false}>
                        <Marker variant="separator">
                          <MarkerContent>End of Conversation</MarkerContent>
                        </Marker>
                      </MessageScrollerItem>
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton />
                </MessageScroller>
              )}
            </Show>
          </CardContent>
          <CardFooter class="flex flex-col items-center gap-2 border-t">
            <Button
              type="button"
              disabled={!canLoadHistory()}
              onClick={() => setVisibleCount(historyAll.length)}
              class="w-full"
              variant="secondary"
            >
              {canLoadHistory() ? "Load History" : "History Loaded"}
            </Button>
            <p class="text-xs text-muted-foreground">
              Restore earlier messages while keeping your place.
            </p>
          </CardFooter>
        </Card>
        <div class="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-muted-foreground">
          Click Load History to load the entire conversation
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

/* ----------------------------- Animating Messages ---------------------------- */

const animationChat = createChat()
  .user("Can user messages pop in like iMessage without breaking anchoring?")
  .sleep(1000)
  .assistant(
    "Yes. Animate the user row with transform and opacity, and let the assistant response stream normally below it.\n\nThat keeps the row measurement predictable while still giving the newly sent bubble a more tactile entrance.",
  )
  .user("What makes the animation feel more like iMessage?")
  .sleep(1000)
  .assistant(
    "Use a quick spring from the trailing edge: a little scale, a small upward move, and no layout animation.\n\nThe bubble feels tactile, but the measured row stays predictable, so anchoring and auto-scroll do not have to fight a changing layout.",
  )
  .user("Can I switch between presets while testing the same thread?")
  .sleep(1000)
  .assistant(
    "Yes. Keep the conversation in place while you change the preset, then send the next message to compare the new entrance against the same context.\n\nThat makes it easier to judge the difference between a subtle fade, a snappy pop, and a more dramatic 3D tilt without rebuilding the scenario each time.",
  );

const animationInitialMessages = animationChat.get(0);

function MessageScrollerAnimation() {
  const [presetId, setPresetId] = createSignal<MessageAnimationId>("fade");
  const { messages, setMessages, isBusy, nextMessage, sendMessage } =
    useScriptedChat(animationChat, {
      initialMessages: animationInitialMessages,
      delayMs: 15,
    });
  const preset = () => MESSAGE_ANIMATIONS[presetId()];

  return (
    <div class="relative flex flex-col gap-4">
      <Card class="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader class="border-b">
          <CardTitle>Animation</CardTitle>
          <CardDescription>
            Choose how user messages are animated when they are added to the
            conversation.
          </CardDescription>
          <CardAction class="flex items-center gap-2">
            <ResetButton
              label="Reset animated messages"
              disabled={messages().length === 0 || isBusy()}
              onClick={() => setMessages(animationInitialMessages)}
            />
          </CardAction>
        </CardHeader>
        <CardContent class="min-h-0 flex-1 overflow-hidden p-0">
          <Show
            when={messages().length > 0}
            fallback={
              <EmptyState
                title="No Messages Yet"
                description="Click the button below to send the first message."
              />
            }
          >
            <MessageScrollerProvider>
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent
                    aria-busy={isBusy()}
                    class="p-(--card-spacing)"
                  >
                    <For each={messages()}>
                      {(message) => (
                        <MessageAnimated
                          message={message}
                          animationPreset={preset()}
                          userVariant="muted"
                          assistantVariant="ghost"
                        />
                      )}
                    </For>
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </Show>
        </CardContent>
        <CardFooter class="border-t">
          <Select
            value={presetId()}
            onValueChange={(value) => setPresetId(value as MessageAnimationId)}
          >
            <SelectTrigger aria-label="Animation preset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent placement="top-start">
              <SelectGroup>
                <For each={Object.values(MESSAGE_ANIMATIONS)}>
                  {(animation) => (
                    <SelectItem value={animation.id}>
                      {animation.name}
                    </SelectItem>
                  )}
                </For>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            icon={<ArrowUp />}
            aria-label="Send Message"
            class="ml-auto"
            disabled={!nextMessage() || isBusy()}
            onClick={() => {
              const message = nextMessage();
              if (message && !isBusy()) sendMessage(message);
            }}
          />
        </CardFooter>
      </Card>
      <div class="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-muted-foreground">
        Select an animation then click send to see it in action.
      </div>
    </div>
  );
}

/* ----------------------------- Jumping to Messages --------------------------- */

const commandsChat = createChat()
  .user(
    "We're seeing activation dip after workspace creation. Can you help me find the likely step?",
    { id: "command-activation" },
  )
  .assistant(
    "The sharpest drop is between creating the workspace and inviting the first teammate.\n\nWorkspace creation is still healthy, but the invite step is where users pause. That suggests the product is asking for collaboration before the user has enough confidence in the workspace.",
  )
  .user("What should I compare before we change the onboarding flow?", {
    id: "command-compare",
  })
  .assistant(
    "Compare three cohorts:\n\n1. Users who choose a template before inviting teammates.\n2. Users who start from a blank workspace.\n3. Users who skip invites and return within 24 hours.\n\nIf template users invite faster, the fix is probably better first-run guidance rather than a louder invite prompt.",
  )
  .user("Can you turn that into an experiment?", { id: "command-experiment" })
  .assistant(
    "Yes. Create a variant that shows a short checklist after workspace creation:\n\n- Pick a template.\n- Add one project detail.\n- Invite a teammate when the workspace has context.\n\nMeasure first invite completion, 24-hour return rate, and whether teams create a second project.",
  )
  .user("What's the risk if we delay the invite prompt?", {
    id: "command-risk",
  })
  .assistant(
    "The main risk is reducing team creation for accounts that already know who they want to invite.\n\nTo protect that path, keep the invite action visible in the header and only change the primary empty-state guidance. That gives confident teams a direct route without forcing uncertain users through the invite step too early.",
  );

const commandMessages = commandsChat.get();
const commandUserMessages = commandMessages.filter(
  (message) => message.role === "user",
);

function trimmedText(message: ChatMessage) {
  const text = getMessageText(message);
  return text.length > 42 ? `${text.slice(0, 39)}...` : text;
}

function CommandMenu() {
  const { scrollToMessage } = useMessageScroller();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="secondary">Jump to...</DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" class="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Conversations</DropdownMenuLabel>
          <For each={commandUserMessages}>
            {(message) => (
              <DropdownMenuItem
                onClick={() =>
                  scrollToMessage(message.id, {
                    align: "start",
                    behavior: "smooth",
                  })
                }
              >
                <span class="line-clamp-1 min-w-0">{trimmedText(message)}</span>
              </DropdownMenuItem>
            )}
          </For>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MessageScrollerCommands() {
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <div class="relative flex flex-col gap-4">
        <Card class="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader class="gap-1 border-b">
            <CardTitle>Commands</CardTitle>
            <CardDescription>Drive the transcript from outside.</CardDescription>
            <CardAction>
              <CommandMenu />
            </CardAction>
          </CardHeader>
          <CardContent class="flex-1 overflow-hidden p-0">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent class="p-(--card-spacing)">
                  <For each={commandMessages}>
                    {(message) => (
                      <MessageRow
                        message={message}
                        scrollAnchor={message.role === "user"}
                      />
                    )}
                  </For>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </CardContent>
        </Card>
        <div class="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-muted-foreground">
          Use the controls to jump to any message in the conversation.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

/* -------------------------- Tracking Reader's Position ------------------------ */

const visibilityChat = createChat()
  .user("Review the incident handoff and tell me what to read first.", {
    id: "vis-brief",
  })
  .assistant(
    "Start with the summary and the impact section. The regression affected the upload queue, but the recovery path completed for every queued job.",
  )
  .user("What was the customer impact?", { id: "vis-impact" })
  .assistant(
    "Impact was limited to delayed processing.\n\nNo records were dropped, and the reconciliation worker confirmed each retry batch. Support saw confusion from two customers, but there were no checkout or billing errors.",
  )
  .user("What actions are open?", { id: "vis-actions" })
  .assistant(
    "Keep the retry window enabled until the next deploy, then add a queue-depth alert as the long-term fix.\n\nThe alert should fire on sustained queue growth, not a single short spike.",
  )
  .user("Give me the follow-up checklist.", { id: "vis-checklist" })
  .assistant(
    "After that, compare the queue recovery graph with the deploy timeline so the handoff shows exactly when processing returned to baseline. That makes it easier for support and engineering to answer the same customer questions without re-reading the whole incident thread.\n\nI would also add a short owner note beside each follow-up item. The checklist is small, but ownership keeps the retry-window decision, alert tuning, and support macro from drifting into separate follow-up conversations.\n\nKeep the retry window enabled until the next deploy, then add a queue-depth alert as the long-term fix.\n\nThe alert should fire on sustained queue growth, not a single short spike.",
  );

const visibilityMessages = visibilityChat.get();
const visibilityUserMessages = visibilityMessages.filter(
  (message) => message.role === "user",
);

function TranscriptOutline() {
  const { scrollToMessage } = useMessageScroller();
  const { currentAnchorId } = useMessageScrollerVisibility();
  return (
    <div class="flex flex-col items-center gap-1.5 rounded-md">
      <For each={visibilityUserMessages}>
        {(message) => (
          <button
            type="button"
            aria-label={`Jump to ${trimmedText(message)}`}
            aria-current={
              currentAnchorId() === message.id ? "location" : undefined
            }
            data-current={currentAnchorId() === message.id}
            class="h-0.5 w-4 rounded-full bg-muted-foreground/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[current=true]:bg-foreground"
            onClick={() =>
              scrollToMessage(message.id, {
                align: "start",
                behavior: "smooth",
              })
            }
          />
        )}
      </For>
    </div>
  );
}

function MessageScrollerVisibility() {
  return (
    <MessageScrollerProvider scrollMargin={12}>
      <div class="relative flex flex-col gap-4">
        <div class="relative mx-auto w-full max-w-sm">
          <Card class="h-140 w-full gap-0">
            <CardHeader class="gap-1 border-b">
              <CardTitle>Transcript Outline</CardTitle>
              <CardDescription>
                Track the current anchored turn.
              </CardDescription>
            </CardHeader>
            <CardContent class="flex-1 overflow-hidden p-0">
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent class="p-(--card-spacing)">
                    <For each={visibilityMessages}>
                      {(message) => (
                        <MessageRow
                          message={message}
                          scrollAnchor={message.role === "user"}
                        />
                      )}
                    </For>
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </CardContent>
          </Card>
          <div class="absolute top-1/2 -right-8 -translate-y-1/2">
            <TranscriptOutline />
          </div>
        </div>
        <div class="mx-auto max-w-sm px-0.5 text-center text-xs text-muted-foreground">
          Open the outline to jump between anchored turns as you read.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

/* ---------------------------- Reading Scroll State --------------------------- */

const scrollableMessages: ChatMessage[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `scrollable-${index + 1}`,
    role: index % 2 === 0 ? "user" : "assistant",
    text:
      index % 2 === 0
        ? `Review scroll checkpoint ${index + 1}.`
        : `Checkpoint ${index + 1} is synced. The scrollable hook updates as the viewport moves.\n\nWhen the reader is at the first message, the footer should only point them down. Once they move into the middle of the transcript, it should explain that both directions are available.\n\nAt the latest message, the footer should switch again and only point them back up.`,
  }),
);

function getScrollStatus(state: { start: boolean; end: boolean }) {
  if (state.start && state.end) return "You can scroll both ways.";
  if (state.end) return "You are at the top. You can only scroll down.";
  if (state.start) return "You are at the bottom. You can only scroll up.";
  return "All messages fit in the viewport.";
}

function ScrollStateFooter() {
  const { start, end } = useMessageScrollerScrollable();
  return (
    <CardFooter class="justify-center border-t text-center text-sm text-muted-foreground">
      {getScrollStatus({ start: start(), end: end() })}
    </CardFooter>
  );
}

function MessageScrollerScrollable() {
  return (
    <div class="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Card class="h-140 w-full gap-0 overflow-hidden">
        <CardHeader class="gap-1 border-b">
          <CardTitle>Scroll Status</CardTitle>
          <CardDescription>
            Where the reader can go scroll to based on current scroll position.
          </CardDescription>
        </CardHeader>
        <MessageScrollerProvider defaultScrollPosition="start">
          <CardContent class="flex-1 overflow-hidden p-0">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent class="gap-4 p-(--card-spacing)">
                  <For each={scrollableMessages}>
                    {(message) => (
                      <MessageAnimated
                        message={message}
                        scrollAnchor={message.role === "user"}
                        userVariant="muted"
                        assistantVariant="ghost"
                      />
                    )}
                  </For>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </CardContent>
          <ScrollStateFooter />
        </MessageScrollerProvider>
      </Card>
      <div class="px-0.5 text-center text-xs text-muted-foreground">
        Scroll the transcript to see the footer update.
      </div>
    </div>
  );
}

/* -------------------------------- Scroll State ------------------------------- */

const stateMessages: ChatMessage[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `state-${index + 1}`,
    role: index % 2 === 0 ? "user" : "assistant",
    text:
      index % 2 === 0
        ? `Check section ${index + 1} of the transcript.`
        : `Section ${index + 1} is ready. Scroll state updates without rerendering the rows.`,
  }),
);

function StatusBar() {
  const { start, end } = useMessageScrollerScrollable();
  const states = () => [
    { label: "At top", on: !start() },
    { label: "At bottom", on: !end() },
    { label: "Older above", on: start() },
    { label: "Newer below", on: end() },
  ];
  return (
    <div class="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap gap-1.5">
      <For each={states()}>
        {(state) => (
          <span
            data-on={state.on}
            class="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground data-[on=true]:border-transparent data-[on=true]:bg-primary data-[on=true]:text-primary-foreground"
          >
            {state.label}
          </span>
        )}
      </For>
    </div>
  );
}

function MessageScrollerState() {
  return (
    <Card class="mx-auto h-112 w-full max-w-md gap-0">
      <CardHeader class="border-b">
        <CardTitle>Scroll State</CardTitle>
        <CardDescription>
          Read scroll state in JavaScript with the state hook.
        </CardDescription>
      </CardHeader>
      <CardContent class="min-h-0 flex-1 p-0">
        <MessageScrollerProvider defaultScrollPosition="start">
          <MessageScroller>
            <StatusBar />
            <MessageScrollerViewport>
              <MessageScrollerContent class="gap-4 p-4 pt-12">
                <For each={stateMessages}>
                  {(message) => (
                    <MessageScrollerItem
                      messageId={message.id}
                      scrollAnchor={message.role === "user"}
                    >
                      <Message
                        align={message.role === "user" ? "end" : "start"}
                      >
                        <MessageContent>
                          <Bubble
                            variant={
                              message.role === "user" ? "default" : "muted"
                            }
                          >
                            <BubbleContent>{message.text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )}
                </For>
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Virtualization ------------------------------ */

const VIRTUAL_ITEM_HEIGHT = 96;
const VIRTUAL_OVERSCAN = 4;

const virtualMessages: ChatMessage[] = Array.from(
  { length: 300 },
  (_, index) => ({
    id: `v${index}`,
    role: index % 2 === 0 ? "user" : "assistant",
    text:
      index % 2 === 0
        ? `Virtual message ${index + 1}: how does windowing interact with the scroller?`
        : `Virtual message ${index + 1}: virtualization stays outside the primitive. MessageScrollerViewport is just the scroll element, and the virtualizer owns the rows.`,
  }),
);

function VirtualizedTranscript() {
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(0);
  let element: HTMLElement | undefined;

  const measure = () => {
    if (!element) return;
    setScrollTop(element.scrollTop);
    setViewportHeight(element.clientHeight);
  };

  const attachRef = (node: Element) => {
    element = node as HTMLElement;
    measure();
    const onScroll = () => element && setScrollTop(element.scrollTop);
    element.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    onCleanup(() => {
      element?.removeEventListener("scroll", onScroll);
      resize.disconnect();
    });
  };

  const total = virtualMessages.length;
  const startIndex = () =>
    Math.max(0, Math.floor(scrollTop() / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_OVERSCAN);
  const endIndex = () =>
    Math.min(
      total,
      Math.ceil((scrollTop() + viewportHeight()) / VIRTUAL_ITEM_HEIGHT) +
        VIRTUAL_OVERSCAN,
    );
  const windowMessages = () => {
    const from = startIndex();
    return virtualMessages
      .slice(from, endIndex())
      .map((message, offset) => ({ message, index: from + offset }));
  };

  return (
    <div class="flex h-96 w-full flex-col overflow-hidden rounded-3xl border">
      <MessageScrollerProvider defaultScrollPosition="start">
        <MessageScroller>
          <MessageScrollerViewport ref={attachRef}>
            <MessageScrollerContent class="block min-h-full">
              <div
                class="relative w-full"
                style={{ height: `${total * VIRTUAL_ITEM_HEIGHT}px` }}
              >
                <For each={windowMessages()}>
                  {(entry) => (
                    <div
                      class="absolute left-0 top-0 w-full"
                      style={{
                        transform: `translateY(${entry.index * VIRTUAL_ITEM_HEIGHT}px)`,
                        height: `${VIRTUAL_ITEM_HEIGHT}px`,
                      }}
                    >
                      <MessageScrollerItem messageId={entry.message.id}>
                        <Message
                          align={
                            entry.message.role === "user" ? "end" : "start"
                          }
                        >
                          <MessageContent>
                            <Bubble
                              variant={
                                entry.message.role === "user"
                                  ? "muted"
                                  : "ghost"
                              }
                            >
                              <BubbleContent>
                                {entry.message.text}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    </div>
                  )}
                </For>
              </div>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}

export const messageScrollerSections: Section[] = [
  {
    id: "message-scroller-demo",
    title: "Chat",
    description:
      "A chat transcript that anchors turns, follows streamed responses and loads history without jumping.",
    component: MessageScrollerDemo,
  },
  {
    id: "message-scroller-anchoring",
    title: "Anchoring Turns",
    description: "Choose which role settles near the top edge.",
    component: MessageScrollerAnchoring,
  },
  {
    id: "message-scroller-group-chat",
    title: "Group Chat",
    description:
      "A group chat with several participants and an assistant. The Marker is marked as a turn.",
    component: MessageScrollerGroupChat,
  },
  {
    id: "message-scroller-previous-context",
    title: "Keeping Context Visible",
    description: "New turns keep part of the previous reply in view.",
    component: MessageScrollerPreviousContext,
  },
  {
    id: "message-scroller-streaming",
    title: "Following the Live Edge",
    description: "Auto-scroll follows the live edge of the conversation.",
    component: MessageScrollerStreaming,
  },
  {
    id: "message-scroller-opening-position",
    title: "Opening Position",
    description: "Choose where a saved transcript opens.",
    component: MessageScrollerOpeningPosition,
  },
  {
    id: "message-scroller-load-history",
    title: "Loading Earlier Messages",
    description: "Prepended messages keep your place.",
    component: MessageScrollerLoadHistory,
  },
  {
    id: "message-scroller-animation",
    title: "Animating New Messages",
    description:
      "Choose how user messages are animated when they are added to the conversation.",
    component: MessageScrollerAnimation,
  },
  {
    id: "message-scroller-commands",
    title: "Jumping to Messages",
    description: "Drive the transcript from outside.",
    component: MessageScrollerCommands,
  },
  {
    id: "message-scroller-visibility",
    title: "Tracking the Reader's Position",
    description: "Track the current anchored turn.",
    component: MessageScrollerVisibility,
  },
  {
    id: "message-scroller-scrollable",
    title: "Reading Scroll State",
    description:
      "Where the reader can go scroll to based on current scroll position.",
    component: MessageScrollerScrollable,
  },
  {
    id: "message-scroller-state",
    title: "Scroll State",
    description: "Read scroll state in JavaScript with the state hook.",
    component: MessageScrollerState,
  },
  {
    id: "message-scroller-virtualization",
    title: "Virtualization",
    description:
      "Let a virtualizer own the rows while MessageScrollerViewport is the scroll element.",
    component: VirtualizedTranscript,
  },
];
