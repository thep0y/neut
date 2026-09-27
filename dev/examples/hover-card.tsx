import { For } from "solid-js";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/index";
import type { HoverCardSide } from "~/index";
import type { Section } from "./shared";

function HoverCardBasic() {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={10}
        closeDelay={100}
        component={Button}
        variant="link"
      >
        Hover Here
      </HoverCardTrigger>
      <HoverCardContent class="flex w-64 flex-col gap-0.5">
        <div class="font-semibold">@nextjs</div>
        <div>The React Framework – created and maintained by @vercel.</div>
        <div class="mt-1 text-xs text-muted-foreground">
          Joined December 2021
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

const HOVER_CARD_SIDES: HoverCardSide[] = ["left", "top", "bottom", "right"];

function HoverCardSides() {
  return (
    <div class="flex flex-wrap justify-center gap-2">
      <For each={HOVER_CARD_SIDES}>
        {(side) => (
          <HoverCard>
            <HoverCardTrigger
              delay={100}
              closeDelay={100}
              component={Button}
              variant="outline"
              class="capitalize"
            >
              {side}
            </HoverCardTrigger>
            <HoverCardContent side={side}>
              <div class="flex flex-col gap-1">
                <h4 class="font-medium">Hover Card</h4>
                <p>This hover card appears on the {side} side of the trigger.</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </For>
    </div>
  );
}

function HoverCardDelays() {
  return (
    <div class="flex flex-wrap items-center justify-center gap-4">
      <HoverCard>
        <HoverCardTrigger
          delay={0}
          closeDelay={0}
          component={Button}
          variant="outline"
        >
          No delay
        </HoverCardTrigger>
        <HoverCardContent>
          <div class="text-sm">Opens and closes immediately.</div>
        </HoverCardContent>
      </HoverCard>
      <HoverCard delay={700} closeDelay={300}>
        <HoverCardTrigger component={Button} variant="outline">
          Default delay
        </HoverCardTrigger>
        <HoverCardContent>
          <div class="text-sm">
            Uses the root delay (700ms) and closeDelay (300ms).
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

const ALIGNMENTS = [
  { side: "top", align: "start" },
  { side: "right", align: "center" },
  { side: "bottom", align: "end" },
] as const;

function HoverCardPositioning() {
  return (
    <div class="flex flex-wrap items-center justify-center gap-4">
      <For each={ALIGNMENTS}>
        {(option) => (
          <HoverCard>
            <HoverCardTrigger
              delay={100}
              closeDelay={100}
              component={Button}
              variant="outline"
            >
              {option.side} / {option.align}
            </HoverCardTrigger>
            <HoverCardContent side={option.side} align={option.align}>
              <div class="text-sm">
                side="{option.side}" align="{option.align}"
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </For>
    </div>
  );
}

export const hoverCardSections: Section[] = [
  {
    id: "hover-card-basic",
    title: "Basic",
    description: "Preview content available behind a link.",
    component: HoverCardBasic,
  },
  {
    id: "hover-card-sides",
    title: "Sides",
    description: "Use side to place the card on any edge of the trigger.",
    component: HoverCardSides,
  },
  {
    id: "hover-card-delays",
    title: "Trigger Delays",
    description: "Control the open and close delay per trigger or per root.",
    component: HoverCardDelays,
  },
  {
    id: "hover-card-positioning",
    title: "Positioning",
    description: "Fine-tune placement with side and align.",
    component: HoverCardPositioning,
  },
];
