import { For, Show, createSignal } from "solid-js";
import { ChevronDown, ThumbsDown, ThumbsUp } from "lucide-solid";
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  Button,
  Collapsible,
  CollapsibleTrigger,
} from "~/index";
import type { Section } from "./shared";

/** shadcn 示例里用 sonner 的 toast,这里退化为 console */
const notify = (message: string) => console.log(message);

function BubbleSizes() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Bubble>
        <BubbleContent>This is a one line bubble.</BubbleContent>
      </Bubble>
      <Bubble>
        <BubbleContent>
          This bubble has multiple lines. It should wrap to the next line and
          you should see a different radius on the corners.
        </BubbleContent>
      </Bubble>
      <Bubble>
        <BubbleContent>
          <p>This bubble has multiple lines.</p>
          <p>
            It should wrap to the next line and you should see a different
            radius on the corners.
          </p>
          <p>Here is some more text to see how it wraps.</p>
        </BubbleContent>
      </Bubble>
    </div>
  );
}

function BubbleVariants() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Bubble>
        <BubbleContent>
          Default bubbles use the primary color for the active user side of a
          chat.
        </BubbleContent>
      </Bubble>
      <Bubble variant="secondary">
        <BubbleContent>
          Secondary bubbles are the standard neutral surface for assistant and
          conversation content.
        </BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>
          Muted bubbles lower the emphasis for quiet system notes or for
          displaying supporting content.
        </BubbleContent>
      </Bubble>
      <Bubble variant="tinted" align="end">
        <BubbleContent>
          Tinted bubbles use a softer primary tint when primary fill is too
          strong.
        </BubbleContent>
      </Bubble>
      <Bubble variant="outline">
        <BubbleContent>
          Outline bubbles can be used to frame message content and give it a
          border.
        </BubbleContent>
      </Bubble>
      <Bubble variant="destructive">
        <BubbleContent>
          Destructive bubbles flag errors or failed actions in a conversation.
        </BubbleContent>
      </Bubble>
      <Bubble variant="ghost">
        <BubbleContent>
          <span class="whitespace-pre-wrap">
            {`Ghost bubbles work for assistant text and other content that should not be framed.

This is perfect for assistant messages that should not have a frame and can take the full width of the container.

Ghost bubbles are full width and can take the full width of the container.
`}
          </span>
        </BubbleContent>
      </Bubble>
    </div>
  );
}

function BubbleAlignment() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Bubble variant="muted">
        <BubbleContent>This bubble is aligned to the start.</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>This bubble is aligned to the end.</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>
          This multiline bubble is aligned to the start. The corners should
          adjust when the text wraps to show the grouped side of the
          conversation.
        </BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>
          This multiline bubble is aligned to the end. It should sit on the
          opposite side with the matching corner radius for wrapped text.
        </BubbleContent>
      </Bubble>
    </div>
  );
}

function BubbleGrouped() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <BubbleGroup>
        <Bubble variant="secondary">
          <BubbleContent>I finished the audit pass.</BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent>
            The registry output looks clean, but I found one stale route.
          </BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent>Want me to remove it now?</BubbleContent>
        </Bubble>
      </BubbleGroup>
      <BubbleGroup>
        <Bubble variant="tinted" align="end">
          <BubbleContent>Yes, clean that up.</BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent>Then rerun the registry build.</BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  );
}

const collapsibleText = `The accessibility review found two focus states that were visually too subtle in dark mode.

I checked the dialog, menu, and drawer paths because each one renders focusable controls inside a layered surface.

The dialog and drawer are fine. The menu needs the hover and focus tokens split so keyboard focus stays visible when the pointer is not involved.

I also recommend keeping the change in the style file instead of the primitive so the other themes can choose their own focus treatment later.`;

const previewLength = 180;

function BubbleCollapsible() {
  const [open, setOpen] = createSignal(false);
  const isLong = collapsibleText.length > previewLength;
  const preview = `${collapsibleText.slice(0, previewLength)}...`;

  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Collapsible open={open()} onOpenChange={setOpen}>
        <Bubble variant="muted" align="end">
          <BubbleContent class="whitespace-pre-line">
            <div>{open() || !isLong ? collapsibleText : preview}</div>
            <Show when={isLong}>
              <CollapsibleTrigger
                variant="link"
                class="gap-1 p-0 text-muted-foreground"
              >
                {open() ? "Show less" : "Show more"}
                <ChevronDown
                  data-icon="inline-end"
                  class={
                    open()
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </CollapsibleTrigger>
            </Show>
          </BubbleContent>
        </Bubble>
      </Collapsible>
      <Bubble variant="ghost">
        <BubbleContent>
          <span class="whitespace-pre-wrap">
            {`Ghost bubbles work for assistant text and other content that should not be framed.

This is perfect for assistant messages that should not have a frame and can take the full width of the container.

Use this for content that needs the whole row.`}
          </span>
        </BubbleContent>
      </Bubble>
    </div>
  );
}

const quickReplies = [
  {
    label: "I need help with my account.",
    message: "I need help with my account.",
  },
  {
    label: "I forgot my password.",
    message: "I forgot my password.",
  },
  {
    label:
      "I have another question. I'd like to talk to a human. Can you help me?",
    message: "I have another question.",
  },
];

function BubbleButtonLinks() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Bubble>
        <BubbleContent component="a" href="#">
          This bubble is a link.
        </BubbleContent>
      </Bubble>
      <Bubble variant="secondary">
        <BubbleContent component="button" type="button">
          This one is a button you can click.
        </BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent component="button" type="button">
          You can also do tinted buttons. Even ones that are multilines.
        </BubbleContent>
      </Bubble>
      <p class="text-xs font-medium text-muted-foreground">Chat Suggestions</p>
      <Bubble>
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <For each={quickReplies}>
          {(reply) => (
            <Bubble variant="outline" align="end">
              <BubbleContent
                class="border-dashed border-primary"
                component="button"
                type="button"
                onClick={() => notify(reply.message)}
              >
                {reply.label}
              </BubbleContent>
            </Bubble>
          )}
        </For>
      </BubbleGroup>
    </div>
  );
}

function BubbleReactionPlacement() {
  return (
    <div class="flex w-full max-w-md flex-col gap-12">
      <p class="text-xs font-medium text-muted-foreground">
        side=bottom align=end
      </p>
      <Bubble>
        <BubbleContent>This is a one line message.</BubbleContent>
        <BubbleReactions
          side="bottom"
          align="end"
          role="img"
          aria-label="Reaction: thumbs up"
        >
          <span>👍</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="secondary" align="end">
        <BubbleContent>
          A longer message that wraps across lines so the reaction offset is
          easier to inspect.
        </BubbleContent>
        <BubbleReactions
          side="bottom"
          align="start"
          role="img"
          aria-label="Reactions: thumbs up, surprised"
        >
          <span>👍</span>
          <span>😮</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="tinted">
        <BubbleContent>
          A longer message that wraps across lines so the reaction offset is
          easier to inspect.
        </BubbleContent>
        <BubbleReactions
          side="bottom"
          align="end"
          role="img"
          aria-label="Reactions: thumbs up, surprised, fire, eyes, and 8 more"
        >
          <span>👍</span>
          <span>😮</span>
          <span>🔥</span>
          <span>👀</span>
          <span>+8</span>
        </BubbleReactions>
      </Bubble>
      <p class="text-xs font-medium text-muted-foreground">
        side=top align=end
      </p>
      <Bubble variant="muted">
        <BubbleContent>This is a one line message.</BubbleContent>
        <BubbleReactions
          side="top"
          align="end"
          role="img"
          aria-label="Reaction: thumbs up"
        >
          <span>👍</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>
          A longer message that wraps across lines so the reaction offset.
        </BubbleContent>
        <BubbleReactions
          side="top"
          align="end"
          role="img"
          aria-label="Reactions: thumbs up, surprised, fire, eyes"
        >
          <span>👍</span>
          <span>😮</span>
          <span>🔥</span>
          <span>👀</span>
        </BubbleReactions>
      </Bubble>
    </div>
  );
}

function BubbleReactionsButtons() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Bubble>
        <BubbleContent>This is a one line message.</BubbleContent>
        <BubbleReactions>
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              notify("You clicked the button in the bubble reaction")
            }
          >
            Button
          </Button>
        </BubbleReactions>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>This is a one line message.</BubbleContent>
        <BubbleReactions align="start">
          <Button
            variant="ghost"
            size="xs"
            aria-label="Confetti"
            onClick={() => notify("Confetti!")}
          >
            🎉
          </Button>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="tinted">
        <BubbleContent>
          We are going to the movies first then dinner. Are you in?
        </BubbleContent>
        <BubbleReactions class="gap-1 bg-background">
          <Button
            variant="secondary"
            size="xs"
            aria-label="Thumbs up"
            icon={<ThumbsUp />}
            onClick={() => notify("You agree!")}
          />
          <Button
            variant="secondary"
            size="xs"
            aria-label="Thumbs down"
            icon={<ThumbsDown />}
            onClick={() => notify("You disagree!")}
          />
        </BubbleReactions>
      </Bubble>
    </div>
  );
}

export const bubbleSections: Section[] = [
  {
    id: "bubble-sizes",
    title: "Sizes",
    description: "Bubbles size to their content, up to 80% of the width.",
    component: BubbleSizes,
  },
  {
    id: "bubble-variants",
    title: "Variants",
    description: "Seven visual variants from primary to unframed ghost.",
    component: BubbleVariants,
  },
  {
    id: "bubble-alignment",
    title: "Alignment",
    description: "Align bubbles to the start or end of the conversation.",
    component: BubbleAlignment,
  },
  {
    id: "bubble-grouped",
    title: "Grouped",
    description: "Group consecutive bubbles from the same sender.",
    component: BubbleGrouped,
  },
  {
    id: "bubble-collapsible",
    title: "Collapsible",
    description: "Compose with Collapsible for a show more interaction.",
    component: BubbleCollapsible,
  },
  {
    id: "bubble-button-links",
    title: "Button & Links",
    description: "Use a polymorphic BubbleContent for links and buttons.",
    component: BubbleButtonLinks,
  },
  {
    id: "bubble-reactions",
    title: "Reaction Placement",
    description: "Anchor a reaction row to the bubble edge.",
    component: BubbleReactionPlacement,
  },
  {
    id: "bubble-reactions-buttons",
    title: "Reactions Buttons",
    description: "Interactive reaction buttons.",
    component: BubbleReactionsButtons,
  },
];
