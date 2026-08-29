import { For, createSignal } from "solid-js";
import { Save } from "lucide-solid";
import {
  Button,
  Kbd,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipGroup,
  TooltipTrigger,
} from "~/index";
import {
  LanguageSwitch,
  type Language,
  type Section,
} from "./shared";

function TooltipUsage() {
  return (
    <Tooltip>
      <TooltipTrigger variant="outline">Hover</TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipWithArrow() {
  return (
    <Tooltip>
      <TooltipTrigger variant="outline">With Arrow</TooltipTrigger>
      <TooltipContent>
        Tooltip with arrow
        <TooltipArrow />
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipSides() {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={["left", "top", "bottom", "right"] as const}>
        {(side) => (
          <Tooltip>
            <TooltipTrigger variant="outline" class="w-fit capitalize">
              {side}
            </TooltipTrigger>
            <TooltipContent side={side}>
              <p>Add to library</p>
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
        )}
      </For>
    </div>
  );
}

function TooltipKeyboard() {
  return (
    <Tooltip>
      <TooltipTrigger variant="outline" size="sm">
        <Save />
        Save
      </TooltipTrigger>
      <TooltipContent>
        Save Changes <Kbd>S</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipDisabled() {
  return (
    <Tooltip>
      <TooltipTrigger component="span" class="inline-block w-fit">
        <Button variant="outline" disabled>
          Disabled
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This feature is currently unavailable</p>
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipGroupDemo() {
  return (
    <TooltipGroup>
      <div class="flex flex-wrap gap-2">
        <For each={["one", "two", "three", "four"]}>
          {(label) => (
            <Tooltip>
              <TooltipTrigger variant="outline" class="w-fit capitalize">
                {label}
              </TooltipTrigger>
              <TooltipContent>
                {label} tooltip
                <TooltipArrow />
              </TooltipContent>
            </Tooltip>
          )}
        </For>
      </div>
    </TooltipGroup>
  );
}

function TooltipDelays() {
  return (
    <div class="flex flex-wrap gap-2">
      <Tooltip openDelay={800} closeDelay={300}>
        <TooltipTrigger variant="outline">Open 800ms</TooltipTrigger>
        <TooltipContent>This tooltip opens slowly.</TooltipContent>
      </Tooltip>
      <Tooltip openDelay={0}>
        <TooltipTrigger variant="outline">Open immediately</TooltipTrigger>
        <TooltipContent>This tooltip opens immediately.</TooltipContent>
      </Tooltip>
    </div>
  );
}

const tooltipTranslations: Record<
  Language,
  { dir: "ltr" | "rtl"; content: string; values: Record<string, string> }
> = {
  en: {
    dir: "ltr",
    content: "Add to library",
    values: {
      "inline-start": "Inline Start",
      left: "Left",
      top: "Top",
      bottom: "Bottom",
      right: "Right",
      "inline-end": "Inline End",
    },
  },
  ar: {
    dir: "rtl",
    content: "إضافة إلى المكتبة",
    values: {
      "inline-start": "بداية السطر",
      left: "يسار",
      top: "أعلى",
      bottom: "أسفل",
      right: "يمين",
      "inline-end": "نهاية السطر",
    },
  },
  he: {
    dir: "rtl",
    content: "הוסף לספרייה",
    values: {
      "inline-start": "תחילת השורה",
      left: "שמאל",
      top: "למעלה",
      bottom: "למטה",
      right: "ימין",
      "inline-end": "סוף השורה",
    },
  },
};

function TooltipRtl() {
  const [language, setLanguage] = createSignal<Language>("ar");
  const t = () => tooltipTranslations[language()];

  return (
    <div class="mx-auto flex w-full max-w-sm flex-col gap-4">
      <LanguageSwitch language={language} onChange={setLanguage} />
      <div class="grid gap-4">
        <div class="flex flex-wrap justify-center gap-2">
          <For each={["left", "top", "bottom", "right"] as const}>
            {(side) => (
              <Tooltip>
                <TooltipTrigger variant="outline" class="w-fit capitalize">
                  {t().values[side]}
                </TooltipTrigger>
                <TooltipContent side={side} dir={t().dir}>
                  {t().content}
                  <TooltipArrow />
                </TooltipContent>
              </Tooltip>
            )}
          </For>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <For each={["inline-start", "inline-end"] as const}>
            {(side) => (
              <Tooltip>
                <TooltipTrigger variant="outline" class="w-fit capitalize">
                  {t().values[side]}
                </TooltipTrigger>
                <TooltipContent side={side} dir={t().dir}>
                  {t().content}
                  <TooltipArrow />
                </TooltipContent>
              </Tooltip>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

export const tooltipSections: Section[] = [
  {
    id: "tooltip-usage",
    title: "Usage",
    description: "Basic tooltip with hover trigger.",
    component: TooltipUsage,
  },
  {
    id: "tooltip-arrow",
    title: "Arrow",
    description: "Tooltip with the arrow indicator.",
    component: TooltipWithArrow,
  },
  {
    id: "tooltip-sides",
    title: "Side",
    description: "Use the side prop to change the position of the tooltip.",
    component: TooltipSides,
  },
  {
    id: "tooltip-keyboard",
    title: "With Keyboard Shortcut",
    description: "Tooltip content can include a Kbd shortcut.",
    component: TooltipKeyboard,
  },
  {
    id: "tooltip-disabled",
    title: "Disabled Button",
    description: "Show a tooltip on a disabled button by wrapping it with a span.",
    component: TooltipDisabled,
  },
  {
    id: "tooltip-group",
    title: "Group",
    description: "Hover between grouped tooltips to see the smooth movement extension.",
    component: TooltipGroupDemo,
  },
  {
    id: "tooltip-delays",
    title: "Delays",
    description: "Open and close delay behavior.",
    component: TooltipDelays,
  },
  {
    id: "tooltip-rtl",
    title: "RTL",
    description: "Tooltip with RTL support and logical sides.",
    component: TooltipRtl,
  },
];
