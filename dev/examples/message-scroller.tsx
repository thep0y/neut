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
  MessageHeader,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Slider,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
  clsx,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "~/index";
import type { MessageScrollerDefaultPosition } from "~/index";
import type { Section } from "./shared";

type Role = "user" | "assistant";
type BubbleVariant =
  | "default"
  | "muted"
  | "secondary"
  | "ghost"
  | "outline"
  | "tinted"
  | "destructive";

type Row =
  | { kind: "message"; id: string; role: Role; text: string; name?: string }
  | {
      kind: "marker";
      id: string;
      text: string;
      anchor?: boolean;
      variant?: "default" | "separator";
    }
  | { kind: "thinking"; id: string };

/** 把反引号包起来的内容渲染为行内 code（对齐 shadcn 示例里的内联代码） */
function RichText(props: { text: string }) {
  return (
    <>
      <For each={props.text.split("`")}>
        {(part, index) =>
          index() % 2 === 1 ? (
            <code class="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]">
              {part}
            </code>
          ) : (
            part
          )
        }
      </For>
    </>
  );
}

function MessageRowView(props: {
  row: Extract<Row, { kind: "message" }>;
  userVariant?: BubbleVariant;
  assistantVariant?: BubbleVariant;
}) {
  const isUser = () => props.row.role === "user";
  return (
    <Message align={isUser() ? "end" : "start"}>
      <MessageContent>
        <Show when={props.row.name}>
          {(name) => <MessageHeader>{name()}</MessageHeader>}
        </Show>
        <Bubble
          variant={
            isUser()
              ? (props.userVariant ?? "default")
              : (props.assistantVariant ?? "muted")
          }
        >
          <BubbleContent class="whitespace-pre-wrap">
            <RichText text={props.row.text} />
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function anchorFor(row: Row, anchorRole: Role | "none" | undefined): boolean {
  if (row.kind === "marker") return row.anchor === true;
  if (anchorRole === "none") return false;
  if (row.kind !== "message") return false;
  return row.role === (anchorRole ?? "user");
}

/**
 * 带边框的滚动框架。必须在 MessageScrollerProvider 内部渲染（消费 context）。
 */
function Frame(props: {
  rows: Row[];
  anchorRole?: Role | "none";
  userVariant?: BubbleVariant;
  assistantVariant?: BubbleVariant;
  animateId?: string;
  animateClass?: string;
  height?: string;
  contentClass?: string;
  emptyState?: { title: string; description: string };
}) {
  return (
    <div
      class={clsx(
        "flex w-full flex-col overflow-hidden rounded-3xl border",
        props.height ?? "h-80",
      )}
    >
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent class={clsx("p-4", props.contentClass)}>
            <For each={props.rows}>
              {(row) => (
                <MessageScrollerItem
                  messageId={row.id}
                  scrollAnchor={anchorFor(row, props.anchorRole)}
                  class={clsx(row.id === props.animateId && props.animateClass)}
                >
                  {row.kind === "marker" ? (
                    <Marker variant={row.variant ?? "default"}>
                      <MarkerContent>{row.text}</MarkerContent>
                    </Marker>
                  ) : row.kind === "thinking" ? (
                    <Marker role="status">
                      <MarkerIcon>
                        <Spinner />
                      </MarkerIcon>
                      <MarkerContent>Thinking...</MarkerContent>
                    </Marker>
                  ) : (
                    <MessageRowView
                      row={row}
                      userVariant={props.userVariant}
                      assistantVariant={props.assistantVariant}
                    />
                  )}
                </MessageScrollerItem>
              )}
            </For>
            <Show when={props.emptyState && props.rows.length === 0}>
              <div class="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-center">
                <p class="text-sm font-medium">{props.emptyState?.title}</p>
                <p class="text-xs text-muted-foreground">
                  {props.emptyState?.description}
                </p>
              </div>
            </Show>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </div>
  );
}

/** 使用 useMessageScroller 的框架外控件（必须在 Provider 内） */
function ScrollToEndControl() {
  const { scrollToEnd } = useMessageScroller();
  return (
    <Button
      variant="outline"
      size="sm"
      class="w-full"
      onClick={() => scrollToEnd({ behavior: "smooth" })}
    >
      Scroll to end
    </Button>
  );
}

/* ---------------------------- Chat（registry 示例） ---------------------------- */

const chatScript: { role: Role; text: string }[] = [
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
  const [messages, setMessages] = createSignal<
    Extract<Row, { kind: "message" }>[]
  >([{ kind: "message", id: "m0", role: "user", text: chatScript[0]!.text }]);
  const [status, setStatus] = createSignal<"ready" | "submitted" | "streaming">(
    "ready",
  );
  let pointer = 1;
  let streamTimer: number | undefined;
  let submitTimer: number | undefined;
  const isBusy = () => status() === "submitted" || status() === "streaming";
  const nextMessage = () => chatScript[pointer];

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
    setMessages((prev) => [
      ...prev,
      { kind: "message", id, role: next.role, text: next.text },
    ]);

    const reply = nextMessage();
    if (reply?.role !== "assistant") return;

    setStatus("submitted");
    submitTimer = window.setTimeout(() => {
      submitTimer = undefined;
      pointer += 1;
      const replyId = `m${pointer}`;
      setMessages((prev) => [
        ...prev,
        { kind: "message", id: replyId, role: "assistant", text: "" },
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

  const rows = (): Row[] => [
    ...messages(),
    ...(status() === "submitted"
      ? ([{ kind: "thinking", id: "thinking" }] as Row[])
      : []),
  ];

  return (
    <div class="w-full max-w-md">
      <Card class="h-140">
        <CardHeader>
          <CardTitle>How can I help you today?</CardTitle>
          <CardDescription>Status: {status()}</CardDescription>
        </CardHeader>
        <CardContent class="min-h-0 flex-1 overflow-hidden p-0">
          <MessageScrollerProvider defaultScrollPosition="end" autoScroll>
            <Frame
              rows={rows()}
              contentClass="p-(--card-spacing)"
              height="h-full"
            />
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

/* ------------------------------- Anchoring Turns ------------------------------ */

function MessageScrollerAnchoring() {
  const [anchorRole, setAnchorRole] = createSignal<Role>("user");
  const [rows, setRows] = createSignal<Row[]>([]);
  let counter = 0;

  const send = () => {
    counter += 1;
    const id = `a${counter}`;
    setRows((prev) => [
      ...prev,
      {
        kind: "message",
        id,
        role: "user",
        text: `Can you walk me through the onboarding flow for scenario ${counter}?`,
      },
      {
        kind: "message",
        id: `${id}-reply`,
        role: "assistant",
        text: "Start with workspace creation, then look at the invite step. The sharpest drop happens before the first teammate is added, so that is the turn worth anchoring: the prompt stays near the top while the reply streams in below it.",
      },
    ]);
  };

  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-muted-foreground">Anchor role</span>
        <ToggleGroup
          value={anchorRole()}
          onValueChange={(value) => {
            if (value) setAnchorRole(value as Role);
          }}
          spacing={0}
        >
          <ToggleGroupItem value="user">User</ToggleGroupItem>
          <ToggleGroupItem value="assistant">Assistant</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <MessageScrollerProvider defaultScrollPosition="end">
        <Frame
          rows={rows()}
          anchorRole={anchorRole()}
          emptyState={{
            title: "No anchored messages yet",
            description:
              "Send the first message to see the selected role anchor.",
          }}
        />
      </MessageScrollerProvider>
      <Button variant="outline" class="w-full" onClick={send}>
        Send Message
      </Button>
      <p class="text-xs text-muted-foreground">
        Toggle the anchor role, then send messages to compare where turns
        settle.
      </p>
    </div>
  );
}

/* --------------------------------- Group Chat --------------------------------- */

function MessageScrollerGroupChat() {
  const [rows, setRows] = createSignal<Row[]>([
    {
      kind: "message",
      id: "g1",
      role: "user",
      text: "@mary, the astrophage line keeps matching Venus energy output. Can you check my math?",
    },
    {
      kind: "message",
      id: "g2",
      role: "assistant",
      name: "Mary (Agent)",
      text: "Yes. Confirmed. The curve points to a microorganism harvesting stellar energy and breeding near carbon dioxide. If @rocky agrees, this is the clue we need.",
    },
    { kind: "message", id: "g3", role: "user", text: "ping @rocky" },
  ]);
  const [added, setAdded] = createSignal(false);

  const addRocky = () => {
    if (added()) return;
    setAdded(true);
    setRows((prev) => [
      ...prev,
      {
        kind: "marker",
        id: "marcus-joined",
        text: "Marcus joined the chat",
        anchor: true,
        variant: "separator",
      },
    ]);
  };

  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider defaultScrollPosition="end">
        <Frame rows={rows()} height="h-96" />
        <div class="flex gap-2">
          <div class="flex-1">
            <ScrollToEndControl />
          </div>
          <Button variant="outline" size="sm" class="flex-1" onClick={addRocky}>
            Add Rocky
          </Button>
        </div>
      </MessageScrollerProvider>
      <p class="text-xs text-muted-foreground">
        When a user joins, a marker is created. scrollAnchor on the marker marks
        it as the next turn.
      </p>
    </div>
  );
}

/* --------------------------- Keeping Context Visible -------------------------- */

function MessageScrollerPeek() {
  const [peek, setPeek] = createSignal(64);
  const [rows, setRows] = createSignal<Row[]>([
    {
      kind: "message",
      id: "k1",
      role: "user",
      text: "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
    },
    {
      kind: "message",
      id: "k2",
      role: "assistant",
      text: "That's the classic streaming scroll problem. Wrap your message list in `MessageScroller` and turn on `autoScroll` — the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved. You get smooth streaming without fighting the user's intent.",
    },
    {
      kind: "message",
      id: "k3",
      role: "user",
      text: "Okay, but when someone sends a new message the view still feels jarring — like the whole conversation reloads from the top.",
    },
  ]);
  let counter = 0;

  const send = () => {
    counter += 1;
    const id = `k${3 + counter}`;
    setRows((prev) => [
      ...prev,
      {
        kind: "message",
        id,
        role: "user",
        text: "So anchoring the new turn near the top should fix that?",
      },
      {
        kind: "message",
        id: `${id}-reply`,
        role: "assistant",
        text: "Exactly. The new turn settles near the top, the reply streams below it, and scrollPreviousItemPeek keeps the tail of the previous reply in view so the thread still feels connected.",
      },
    ]);
  };

  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider
        defaultScrollPosition="end"
        scrollPreviousItemPeek={peek()}
      >
        <Frame rows={rows()} height="h-96" />
        <div class="flex items-center gap-3">
          <span class="w-12 text-right text-xs text-muted-foreground tabular-nums">
            {peek()}px
          </span>
          <Slider
            value={peek()}
            min={0}
            max={120}
            step={8}
            onValueChange={setPeek}
            class="flex-1"
          />
        </div>
        <Button variant="outline" class="w-full" onClick={send}>
          Send
        </Button>
      </MessageScrollerProvider>
      <p class="text-xs text-muted-foreground">
        Adjust the slider and send. Observe the previous message peak.
      </p>
    </div>
  );
}

/* --------------------------- Following the Live Edge -------------------------- */

function MessageScrollerStreaming() {
  const [rows, setRows] = createSignal<Row[]>([
    {
      kind: "message",
      id: "l1",
      role: "user",
      text: "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
    },
  ]);
  const [status, setStatus] = createSignal<"ready" | "streaming">("ready");
  let streamTimer: number | undefined;

  const summary =
    "Here's the launch summary you asked for:\n\n- Scope: message scroller for the docs chat.\n- Behavior: follow the live edge only while the reader is already there.\n- Risk: long replies can push earlier context off screen, so anchoring keeps the turn connected.\n\nShip the primitive first, then layer composer and transport on top.";

  const send = () => {
    if (status() === "streaming") return;
    let index = 0;
    setRows((prev) => [
      ...prev,
      { kind: "message", id: "l2", role: "assistant", text: "" },
    ]);
    setStatus("streaming");
    streamTimer = window.setInterval(() => {
      index += 3;
      setRows((prev) =>
        prev.map((row) =>
          row.id === "l2" && row.kind === "message"
            ? { ...row, text: summary.slice(0, index) }
            : row,
        ),
      );
      if (index >= summary.length && streamTimer !== undefined) {
        window.clearInterval(streamTimer);
        streamTimer = undefined;
        setStatus("ready");
      }
    }, 20);
  };

  onCleanup(() => {
    if (streamTimer !== undefined) window.clearInterval(streamTimer);
  });

  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider defaultScrollPosition="end" autoScroll>
        <Frame rows={rows()} height="h-96" />
      </MessageScrollerProvider>
      <Button variant="outline" class="w-full" onClick={send}>
        Send
      </Button>
      <p class="text-xs text-muted-foreground">
        Streaming is simulated. `autoScroll` is enabled.
      </p>
    </div>
  );
}

/* ------------------------------ Opening Position ------------------------------ */

const openingRows: Row[] = [
  {
    kind: "message",
    id: "o1",
    role: "user",
    text: "This is the first message the user sent in the conversation.",
  },
  {
    kind: "message",
    id: "o2",
    role: "assistant",
    text: "Workspace creation rose 8%, but first invite completion only rose 2%.",
  },
  {
    kind: "message",
    id: "o3",
    role: "user",
    text: "This is the last message the user sent in the conversation.",
  },
  {
    kind: "message",
    id: "o4",
    role: "assistant",
    text: "Start with the invite step. Teams are creating workspaces but waiting to add collaborators.",
  },
  {
    kind: "message",
    id: "o5",
    role: "assistant",
    text: "Recommended follow-up:\n\n1. Compare invite drop-off by account size. 2. Check whether users who skip invites still return within 24 hours. 3. Review the empty-state copy on the first project screen. 4. Segment activation by template, since template users may not need invites right away.",
  },
  {
    kind: "message",
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
          <MessageScrollerProvider
            defaultScrollPosition={pos}
            scrollPreviousItemPeek={24}
          >
            <Frame
              rows={openingRows}
              userVariant="muted"
              assistantVariant="ghost"
              height="h-96"
            />
            <ScrollToEndControl />
          </MessageScrollerProvider>
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
      <p class="text-xs text-muted-foreground">
        Toggle the defaultScrollPosition to see where the transcript starts when
        you open the thread.
      </p>
    </div>
  );
}

/* ------------------------------ Loading History ------------------------------- */

const historySeed: Row[] = [
  {
    kind: "message",
    id: "p1",
    role: "assistant",
    text: "Only the export queue worker changed. The deploy moved large CSV jobs onto the shared retry policy, which made each failed attempt hold a worker slot longer than before.",
  },
  {
    kind: "message",
    id: "p2",
    role: "assistant",
    text: "The app deploy did not include checkout, pricing, or billing API changes.",
  },
  { kind: "message", id: "p3", role: "user", text: "Do we need to roll back?" },
  {
    kind: "message",
    id: "p4",
    role: "assistant",
    text: "Not yet. Queue depth is recovering after we reduced retry concurrency, and the oldest pending job is now under five minutes old.",
  },
  {
    kind: "message",
    id: "p5",
    role: "assistant",
    text: "Keep rollback ready if the queue starts climbing again, but the current trend points toward recovery.",
  },
  {
    kind: "message",
    id: "p6",
    role: "assistant",
    text: "Keep watching for customer-visible issues.",
  },
  {
    kind: "message",
    id: "p7",
    role: "assistant",
    text: "I will watch the queue and support tags for another 15 minutes. I am tracking export failures, delayed download requests, and any support thread that mentions missing reports.",
  },
  {
    kind: "message",
    id: "p8",
    role: "assistant",
    text: "If those stay quiet through the next batch window, we can close this as an internal degradation.",
  },
  { kind: "marker", id: "p-end", text: "End of Conversation" },
];

const historyOlder: Row[] = [
  {
    kind: "message",
    id: "h1",
    role: "user",
    text: "Export downloads are timing out for a few customers. Can you check what changed in the last deploy?",
  },
  {
    kind: "message",
    id: "h2",
    role: "assistant",
    text: "The deploy touched two areas: the export queue worker and the billing API client. I'm diffing both against the previous release.",
  },
  {
    kind: "message",
    id: "h3",
    role: "user",
    text: "Start with the queue, since that is where the timeouts show up.",
  },
  {
    kind: "message",
    id: "h4",
    role: "assistant",
    text: "Queue latency rose at the same timestamp as the deploy. Retry concurrency doubled, so failed jobs held worker slots longer.",
  },
];

function MessageScrollerPrepend() {
  const [rows, setRows] = createSignal<Row[]>(historySeed);

  const loadHistory = () => setRows((prev) => [...historyOlder, ...prev]);

  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider defaultScrollPosition="end">
        <Frame rows={rows()} height="h-96" />
        <ScrollToEndControl />
      </MessageScrollerProvider>
      <Button variant="outline" class="w-full" onClick={loadHistory}>
        Load History
      </Button>
      <p class="text-xs text-muted-foreground">
        Click Load History to load the entire conversation while keeping your
        place.
      </p>
    </div>
  );
}

/* ----------------------------- Animating Messages ----------------------------- */

const animations = [
  { value: "fade", label: "Fade", className: "animate-in fade-in-0" },
  {
    value: "slide",
    label: "Slide",
    className: "animate-in fade-in-0 slide-in-from-bottom-2",
  },
];

function MessageScrollerAnimate() {
  const [animation, setAnimation] = createSignal("fade");
  const [rows, setRows] = createSignal<Row[]>([]);
  const [animateId, setAnimateId] = createSignal<string>();
  let counter = 0;

  const send = () => {
    counter += 1;
    const id = `n${counter}`;
    setAnimateId(id);
    setRows((prev) => [
      ...prev,
      {
        kind: "message",
        id,
        role: "user",
        text: `Message ${counter}: can you animate this in from the live edge?`,
      },
      {
        kind: "message",
        id: `${id}-reply`,
        role: "assistant",
        text: "Animation runs on the user turn only. The reply streams into a regular row below it, so the scroll behavior stays unchanged.",
      },
    ]);
  };

  const animateClass = () =>
    animations.find((item) => item.value === animation())?.className;

  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-muted-foreground">Animation</span>
        <ToggleGroup
          value={animation()}
          onValueChange={(value) => {
            if (value) setAnimation(value);
          }}
          spacing={0}
        >
          <For each={animations}>
            {(item) => (
              <ToggleGroupItem value={item.value}>{item.label}</ToggleGroupItem>
            )}
          </For>
        </ToggleGroup>
      </div>
      <MessageScrollerProvider defaultScrollPosition="end">
        <Frame
          rows={rows()}
          animateId={animateId()}
          animateClass={animateClass()}
          emptyState={{
            title: "No Messages Yet",
            description: "Click the button below to send the first message.",
          }}
        />
      </MessageScrollerProvider>
      <Button variant="outline" class="w-full" onClick={send}>
        Send Message
      </Button>
      <p class="text-xs text-muted-foreground">
        Select an animation then click send to see it in action.
      </p>
    </div>
  );
}

/* ----------------------------- Jumping to Messages ---------------------------- */

const jumpingRows: Row[] = [
  {
    kind: "message",
    id: "j1",
    role: "user",
    text: "We're seeing activation dip after workspace creation. Can you help me find the likely step?",
  },
  {
    kind: "message",
    id: "j2",
    role: "assistant",
    text: "The sharpest drop is between creating the workspace and inviting the first teammate.",
  },
  {
    kind: "message",
    id: "j3",
    role: "assistant",
    text: "Workspace creation is still healthy, but the invite step is where users pause. That suggests the product is asking for collaboration before the user has enough confidence in the workspace.",
  },
  {
    kind: "message",
    id: "j4",
    role: "user",
    text: "What should I compare before we change the onboarding flow?",
  },
  {
    kind: "message",
    id: "j5",
    role: "assistant",
    text: "Compare three cohorts:\n\n1. Users who choose a template before inviting teammates. 2. Users who start from a blank workspace. 3. Users who skip invites and return within 24 hours.\n\nIf template users invite faster, the fix is probably better first-run guidance rather than a louder invite prompt.",
  },
  {
    kind: "message",
    id: "j6",
    role: "user",
    text: "Can you turn that into an experiment?",
  },
  {
    kind: "message",
    id: "j7",
    role: "assistant",
    text: "Yes. Create a variant that shows a short checklist after workspace creation:\n\n- Pick a template. - Add one project detail. - Invite a teammate when the workspace has context.\n\nMeasure first invite completion, 24-hour return rate, and whether teams create a second project.",
  },
  {
    kind: "message",
    id: "j8",
    role: "user",
    text: "What's the risk if we delay the invite prompt?",
  },
  {
    kind: "message",
    id: "j9",
    role: "assistant",
    text: "The main risk is reducing team creation for accounts that already know who they want to invite.\n\nTo protect that path, keep the invite action visible in the header and only change the primary empty-state guidance. That gives confident teams a direct route without forcing uncertain users through the invite step too early.",
  },
];

function JumpControls() {
  const { scrollToMessage, scrollToEnd } = useMessageScroller();
  const anchors = jumpingRows.filter(
    (row): row is Extract<Row, { kind: "message" }> =>
      row.kind === "message" && row.role === "user",
  );
  return (
    <div class="flex flex-wrap gap-2">
      <For each={anchors}>
        {(row, index) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToMessage(row.id, { behavior: "smooth" })}
          >
            Turn {index() + 1}
          </Button>
        )}
      </For>
      <Button
        variant="outline"
        size="sm"
        onClick={() => scrollToEnd({ behavior: "smooth" })}
      >
        Jump to latest
      </Button>
    </div>
  );
}

function MessageScrollerJumping() {
  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider defaultScrollPosition="start">
        <Frame rows={jumpingRows} height="h-96" />
        <JumpControls />
      </MessageScrollerProvider>
      <p class="text-xs text-muted-foreground">
        Use the controls to jump to any message in the conversation.
      </p>
    </div>
  );
}

/* -------------------------- Tracking Reader's Position ------------------------ */

const trackingRows: Row[] = [
  {
    kind: "message",
    id: "t1",
    role: "user",
    text: "Review the incident handoff and tell me what to read first.",
  },
  {
    kind: "message",
    id: "t2",
    role: "assistant",
    text: "Start with the summary and the impact section. The regression affected the upload queue, but the recovery path completed for every queued job.",
  },
  {
    kind: "message",
    id: "t3",
    role: "user",
    text: "What was the customer impact?",
  },
  {
    kind: "message",
    id: "t4",
    role: "assistant",
    text: "Impact was limited to delayed processing.",
  },
  {
    kind: "message",
    id: "t5",
    role: "assistant",
    text: "No records were dropped, and the reconciliation worker confirmed each retry batch. Support saw confusion from two customers, but there were no checkout or billing errors.",
  },
  {
    kind: "message",
    id: "t6",
    role: "user",
    text: "What actions are open?",
  },
  {
    kind: "message",
    id: "t7",
    role: "assistant",
    text: "Keep the retry window enabled until the next deploy, then add a queue-depth alert as the long-term fix.",
  },
  {
    kind: "message",
    id: "t8",
    role: "assistant",
    text: "The alert should fire on sustained queue growth, not a single short spike.",
  },
  {
    kind: "message",
    id: "t9",
    role: "user",
    text: "Give me the follow-up checklist.",
  },
  {
    kind: "message",
    id: "t10",
    role: "assistant",
    text: "After that, compare the queue recovery graph with the deploy timeline so the handoff shows exactly when processing returned to baseline. That makes it easier for support and engineering to answer the same customer questions without re-reading the whole incident thread.",
  },
  {
    kind: "message",
    id: "t11",
    role: "assistant",
    text: "I would also add a short owner note beside each follow-up item. The checklist is small, but ownership keeps the retry-window decision, alert tuning, and support macro from drifting into separate follow-up conversations.",
  },
  {
    kind: "message",
    id: "t12",
    role: "assistant",
    text: "Keep the retry window enabled until the next deploy, then add a queue-depth alert as the long-term fix.",
  },
  {
    kind: "message",
    id: "t13",
    role: "assistant",
    text: "The alert should fire on sustained queue growth, not a single short spike.",
  },
];

function TranscriptOutline() {
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();
  const { scrollToMessage } = useMessageScroller();
  const anchors = trackingRows.filter(
    (row): row is Extract<Row, { kind: "message" }> =>
      row.kind === "message" && row.role === "user",
  );
  return (
    <div class="flex w-full flex-col gap-2">
      <p class="text-xs text-muted-foreground">
        Current anchor:{" "}
        <span class="font-medium">{currentAnchorId() ?? "none"}</span> ·
        visible: {visibleMessageIds().length}
      </p>
      <div class="flex flex-wrap gap-2">
        <For each={anchors}>
          {(row, index) => (
            <Button
              variant={currentAnchorId() === row.id ? "secondary" : "outline"}
              size="sm"
              onClick={() => scrollToMessage(row.id, { behavior: "smooth" })}
            >
              Turn {index() + 1}
            </Button>
          )}
        </For>
      </div>
    </div>
  );
}

function MessageScrollerTracking() {
  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider defaultScrollPosition="start">
        <Frame rows={trackingRows} height="h-96" />
        <TranscriptOutline />
      </MessageScrollerProvider>
      <p class="text-xs text-muted-foreground">
        Open the outline to jump between anchored turns as you read.
      </p>
    </div>
  );
}

/* ------------------------------ Reading Scroll State -------------------------- */

const checkpointRows: Row[] = Array.from({ length: 6 }).flatMap((_, i) => {
  const n = i * 2 + 1;
  return [
    {
      kind: "message",
      id: `s${n}`,
      role: "user",
      text: `Review scroll checkpoint ${n}.`,
    },
    {
      kind: "message",
      id: `s${n + 1}`,
      role: "assistant",
      text: `Checkpoint ${n + 1} is synced. The scrollable hook updates as the viewport moves.\n\nWhen the reader is at the first message, the footer should only point them down. Once they move into the middle of the transcript, it should explain that both directions are available.\n\nAt the latest message, the footer should switch again and only point them back up.`,
    },
  ] satisfies Row[];
});

function ScrollStatus() {
  const { start, end } = useMessageScrollerScrollable();
  const message = () => {
    if (!start() && !end()) return "All messages fit in the viewport.";
    if (end() && !start())
      return "At the first message — only down is available.";
    if (start() && !end())
      return "At the latest message — only up is available.";
    return "In the middle — both directions are available.";
  };
  return (
    <p class="text-xs text-muted-foreground">
      {message()} (start: {String(start())}, end: {String(end())})
    </p>
  );
}

function MessageScrollerScrollState() {
  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider
        defaultScrollPosition="end"
        scrollPreviousItemPeek={24}
      >
        <Frame rows={checkpointRows} height="h-96" />
        <ScrollStatus />
      </MessageScrollerProvider>
      <p class="text-xs text-muted-foreground">
        Scroll the transcript to see the footer update.
      </p>
    </div>
  );
}

export const messageScrollerSections: Section[] = [
  {
    id: "message-scroller-chat",
    title: "Chat",
    description:
      "A chat transcript that anchors turns, follows streamed responses and loads history without jumping.",
    component: MessageScrollerChat,
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
    id: "message-scroller-peek",
    title: "Keeping Context Visible",
    description: "New turns keep part of the previous reply in view.",
    component: MessageScrollerPeek,
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
    id: "message-scroller-prepend",
    title: "Loading Earlier Messages",
    description: "Prepended messages keep your place.",
    component: MessageScrollerPrepend,
  },
  {
    id: "message-scroller-animate",
    title: "Animating New Messages",
    description:
      "Choose how user messages are animated when they are added to the conversation.",
    component: MessageScrollerAnimate,
  },
  {
    id: "message-scroller-jumping",
    title: "Jumping to Messages",
    description: "Drive the transcript from outside.",
    component: MessageScrollerJumping,
  },
  {
    id: "message-scroller-tracking",
    title: "Tracking the Reader's Position",
    description: "Track the current anchored turn.",
    component: MessageScrollerTracking,
  },
  {
    id: "message-scroller-scroll-state",
    title: "Reading Scroll State",
    description:
      "Where the reader can go scroll to based on current scroll position.",
    component: MessageScrollerScrollState,
  },
];
