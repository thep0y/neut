import { createSignal } from "solid-js";
import { Bold, Italic, Underline } from "lucide-solid";
import {
  Field,
  FieldDescription,
  FieldLabel,
  ToggleGroup,
  ToggleGroupItem,
} from "~/index";
import {
  LanguageSwitch,
  type Language,
  type Section,
} from "./shared";

function ToggleGroupUsage() {
  return (
    <ToggleGroup variant="outline" multiple>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function ToggleGroupOutline() {
  return (
    <ToggleGroup variant="outline" defaultValue={["all"]}>
      <ToggleGroupItem value="all" aria-label="Toggle all">
        All
      </ToggleGroupItem>
      <ToggleGroupItem value="missed" aria-label="Toggle missed">
        Missed
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function ToggleGroupSizes() {
  return (
    <div class="flex flex-col gap-4">
      <ToggleGroup size="sm" defaultValue={["top"]} variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup defaultValue={["top"]} variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

function ToggleGroupSpacing() {
  return (
    <ToggleGroup size="sm" defaultValue={["top"]} variant="outline" spacing={2}>
      <ToggleGroupItem value="top" aria-label="Toggle top">
        Top
      </ToggleGroupItem>
      <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
        Bottom
      </ToggleGroupItem>
      <ToggleGroupItem value="left" aria-label="Toggle left">
        Left
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Toggle right">
        Right
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function ToggleGroupVertical() {
  return (
    <ToggleGroup
      multiple
      orientation="vertical"
      spacing={1}
      defaultValue={["bold", "italic"]}
    >
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function ToggleGroupDisabled() {
  return (
    <ToggleGroup disabled>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function ToggleGroupCustom() {
  const [fontWeight, setFontWeight] = createSignal("normal");

  return (
    <Field>
      <FieldLabel>Font Weight</FieldLabel>
      <ToggleGroup
        value={[fontWeight()]}
        onValueChange={(value) => setFontWeight(value[0] ?? "normal")}
        variant="outline"
        spacing={2}
        size="lg"
      >
        <ToggleGroupItem
          value="light"
          aria-label="Light"
          class="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span class="text-2xl leading-none font-light">Aa</span>
          <span class="text-xs text-muted-foreground">Light</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="normal"
          aria-label="Normal"
          class="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span class="text-2xl leading-none font-normal">Aa</span>
          <span class="text-xs text-muted-foreground">Normal</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="medium"
          aria-label="Medium"
          class="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span class="text-2xl leading-none font-medium">Aa</span>
          <span class="text-xs text-muted-foreground">Medium</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="bold"
          aria-label="Bold"
          class="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span class="text-2xl leading-none font-bold">Aa</span>
          <span class="text-xs text-muted-foreground">Bold</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <FieldDescription>
        Use <code class="rounded-md bg-muted px-1 py-0.5 font-mono">
          font-{fontWeight()}
        </code>{" "}
        to set the font weight.
      </FieldDescription>
    </Field>
  );
}

const toggleGroupTranslations: Record<
  Language,
  { dir: "ltr" | "rtl"; values: Record<string, string> }
> = {
  en: { dir: "ltr", values: { list: "List", grid: "Grid", cards: "Cards" } },
  ar: { dir: "rtl", values: { list: "قائمة", grid: "شبكة", cards: "بطاقات" } },
  he: { dir: "rtl", values: { list: "רשימה", grid: "רשת", cards: "כרטיסים" } },
};

function ToggleGroupRtl() {
  const [language, setLanguage] = createSignal<Language>("ar");
  const t = () => toggleGroupTranslations[language()];

  return (
    <div class="flex flex-col items-center gap-4">
      <LanguageSwitch language={language} onChange={setLanguage} />
      <ToggleGroup variant="outline" defaultValue={["list"]} dir={t().dir}>
        <ToggleGroupItem value="list" aria-label={t().values.list}>
          {t().values.list}
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label={t().values.grid}>
          {t().values.grid}
        </ToggleGroupItem>
        <ToggleGroupItem value="cards" aria-label={t().values.cards}>
          {t().values.cards}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export const toggleGroupSections: Section[] = [
  {
    id: "toggle-group-usage",
    title: "Usage",
    description: "A set of two-state buttons that can be toggled on or off.",
    component: ToggleGroupUsage,
  },
  {
    id: "toggle-group-outline",
    title: "Outline",
    description: "Use variant=\"outline\" for an outline style.",
    component: ToggleGroupOutline,
  },
  {
    id: "toggle-group-size",
    title: "Size",
    description: "Use the size prop to change the size of the toggle group.",
    component: ToggleGroupSizes,
  },
  {
    id: "toggle-group-spacing",
    title: "Spacing",
    description: "Use spacing to add spacing between toggle group items.",
    component: ToggleGroupSpacing,
  },
  {
    id: "toggle-group-vertical",
    title: "Vertical",
    description: "Use orientation=\"vertical\" for vertical toggle groups.",
    component: ToggleGroupVertical,
  },
  {
    id: "toggle-group-disabled",
    title: "Disabled",
    description: "Disabled toggle group buttons.",
    component: ToggleGroupDisabled,
  },
  {
    id: "toggle-group-custom",
    title: "Custom",
    description: "A custom toggle group example.",
    component: ToggleGroupCustom,
  },
  {
    id: "toggle-group-rtl",
    title: "RTL",
    description: "Toggle group with RTL support for Arabic and Hebrew.",
    component: ToggleGroupRtl,
  },
];
