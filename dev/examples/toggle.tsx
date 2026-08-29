import { createSignal } from "solid-js";
import { Bold, Bookmark, Italic } from "lucide-solid";
import { Toggle } from "~/index";
import {
  LanguageSwitch,
  type Language,
  type Section,
} from "./shared";

function ToggleUsage() {
  return (
    <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
      <Bookmark class="group-aria-pressed/toggle:fill-foreground" />
      Bookmark
    </Toggle>
  );
}

function ToggleOutline() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle italic">
        <Italic />
        Italic
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle bold">
        <Bold />
        Bold
      </Toggle>
    </div>
  );
}

function ToggleText() {
  return (
    <Toggle aria-label="Toggle italic">
      <Italic />
      Italic
    </Toggle>
  );
}

function ToggleSizes() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle small" size="sm">
        Small
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle default" size="default">
        Default
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle large" size="lg">
        Large
      </Toggle>
    </div>
  );
}

function ToggleDisabled() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Toggle aria-label="Toggle disabled" disabled>
        Disabled
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle disabled outline" disabled>
        Disabled
      </Toggle>
    </div>
  );
}

const toggleTranslations: Record<
  Language,
  { dir: "ltr" | "rtl"; label: string }
> = {
  en: { dir: "ltr", label: "Bookmark" },
  ar: { dir: "rtl", label: "إشارة مرجعية" },
  he: { dir: "rtl", label: "סימנייה" },
};

function ToggleRtl() {
  const [language, setLanguage] = createSignal<Language>("ar");
  const t = () => toggleTranslations[language()];

  return (
    <div class="flex flex-col items-center gap-4">
      <LanguageSwitch language={language} onChange={setLanguage} />
      <Toggle
        aria-label="Toggle bookmark"
        size="sm"
        variant="outline"
        dir={t().dir}
      >
        <Bookmark class="group-aria-pressed/toggle:fill-foreground" />
        {t().label}
      </Toggle>
    </div>
  );
}

export const toggleSections: Section[] = [
  {
    id: "toggle-usage",
    title: "Usage",
    description: "A two-state button that can be either on or off.",
    component: ToggleUsage,
  },
  {
    id: "toggle-outline",
    title: "Outline",
    description: "Use variant=\"outline\" for an outline style.",
    component: ToggleOutline,
  },
  {
    id: "toggle-text",
    title: "With Text",
    description: "Toggle with icon and text.",
    component: ToggleText,
  },
  {
    id: "toggle-size",
    title: "Size",
    description: "Use the size prop to change the size of the toggle.",
    component: ToggleSizes,
  },
  {
    id: "toggle-disabled",
    title: "Disabled",
    description: "Disabled toggle buttons.",
    component: ToggleDisabled,
  },
  {
    id: "toggle-rtl",
    title: "RTL",
    description: "Toggle with RTL support for Arabic and Hebrew.",
    component: ToggleRtl,
  },
];
