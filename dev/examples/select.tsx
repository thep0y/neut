import { For, Show, createSignal } from "solid-js";
import {
  Field,
  FieldDescription,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/index";
import type { Section } from "./shared";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "grapes", label: "Grapes" },
  { value: "pineapple", label: "Pineapple" },
];

function SelectBasic() {
  return (
    <Select>
      <SelectTrigger class="w-45">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <For each={fruits}>
          {(fruit) => (
            <SelectItem value={fruit.value}>{fruit.label}</SelectItem>
          )}
        </For>
      </SelectContent>
    </Select>
  );
}

const timezones = [
  {
    label: "North America",
    items: [
      { value: "est", label: "Eastern Standard Time (EST)" },
      { value: "cst", label: "Central Standard Time (CST)" },
      { value: "mst", label: "Mountain Standard Time (MST)" },
      { value: "pst", label: "Pacific Standard Time (PST)" },
    ],
  },
  {
    label: "Europe",
    items: [
      { value: "gmt", label: "Greenwich Mean Time (GMT)" },
      { value: "cet", label: "Central European Time (CET)" },
      { value: "eet", label: "Eastern European Time (EET)" },
    ],
  },
  {
    label: "Asia",
    items: [
      { value: "jst", label: "Japan Standard Time (JST)" },
      { value: "kst", label: "Korea Standard Time (KST)" },
      { value: "ist", label: "India Standard Time (IST)" },
    ],
  },
];

function SelectGroups() {
  return (
    <Select>
      <SelectTrigger class="w-64">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <For each={timezones}>
          {(group, index) => (
            <>
              <SelectGroup>
                <SelectLabel>{group.label}</SelectLabel>
                <For each={group.items}>
                  {(timezone) => (
                    <SelectItem value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  )}
                </For>
              </SelectGroup>
              <Show when={index() < timezones.length - 1}>
                <SelectSeparator />
              </Show>
            </>
          )}
        </For>
      </SelectContent>
    </Select>
  );
}

function SelectDisabledItems() {
  return (
    <Select>
      <SelectTrigger class="w-45">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <For each={fruits}>
          {(fruit) => (
            <SelectItem value={fruit.value} disabled={fruit.value === "banana"}>
              {fruit.label}
            </SelectItem>
          )}
        </For>
      </SelectContent>
    </Select>
  );
}

function SelectDisabled() {
  return (
    <Select disabled defaultValue="apple">
      <SelectTrigger class="w-45">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <For each={fruits}>
          {(fruit) => (
            <SelectItem value={fruit.value}>{fruit.label}</SelectItem>
          )}
        </For>
      </SelectContent>
    </Select>
  );
}

function SelectControlled() {
  const [value, setValue] = createSignal<string | null>(null);

  return (
    <div class="flex flex-col items-center gap-3">
      <Select value={value()} onValueChange={(next) => setValue(next)}>
        <SelectTrigger class="w-45">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <For each={fruits}>
            {(fruit) => (
              <SelectItem value={fruit.value}>{fruit.label}</SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
      <p class="text-sm text-muted-foreground">
        Selected: <span class="font-medium">{value() ?? "none"}</span>
      </p>
    </div>
  );
}

function SelectInField() {
  return (
    <Field class="mx-auto w-full max-w-xs">
      <FieldLabel for="select-favorite-fruit">Favorite fruit</FieldLabel>
      <Select defaultValue="apple">
        <SelectTrigger id="select-favorite-fruit" class="w-full">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <For each={fruits}>
            {(fruit) => (
              <SelectItem value={fruit.value}>{fruit.label}</SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
      <FieldDescription>Pick the fruit you like the most.</FieldDescription>
    </Field>
  );
}

function SelectInvalid() {
  return (
    <Select>
      <SelectTrigger aria-invalid="true" class="w-45">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <For each={fruits}>
          {(fruit) => (
            <SelectItem value={fruit.value}>{fruit.label}</SelectItem>
          )}
        </For>
      </SelectContent>
    </Select>
  );
}

const statuses = [
  { value: "online", label: "Online", dot: "bg-emerald-500" },
  { value: "away", label: "Away", dot: "bg-amber-500" },
  { value: "busy", label: "Busy", dot: "bg-red-500" },
  { value: "offline", label: "Offline", dot: "bg-neutral-400" },
];

function SelectCustomItems() {
  return (
    <Select defaultValue="online">
      <SelectTrigger class="w-45">
        <SelectValue placeholder="Select a status" />
      </SelectTrigger>
      <SelectContent>
        <For each={statuses}>
          {(status) => (
            <SelectItem value={status.value} label={status.label} class="gap-2">
              <span class={`size-2 rounded-full ${status.dot}`} />
              {status.label}
            </SelectItem>
          )}
        </For>
      </SelectContent>
    </Select>
  );
}

function SelectTriggerVariants() {
  return (
    <div class="flex flex-wrap items-center justify-center gap-3">
      <For each={["outline", "secondary", "ghost"] as const}>
        {(variant) => (
          <Select defaultValue="apple">
            <SelectTrigger variant={variant} class="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <For each={fruits}>
                {(fruit) => (
                  <SelectItem value={fruit.value}>{fruit.label}</SelectItem>
                )}
              </For>
            </SelectContent>
          </Select>
        )}
      </For>
    </div>
  );
}

const manyItems = Array.from({ length: 40 }, (_, i) => `Item ${i + 1}`);

function SelectScrollable() {
  return (
    <Select>
      <SelectTrigger class="w-45">
        <SelectValue placeholder="Select an item" />
      </SelectTrigger>
      <SelectContent>
        <For each={manyItems}>
          {(item) => <SelectItem value={item}>{item}</SelectItem>}
        </For>
      </SelectContent>
    </Select>
  );
}

function SelectPlacement() {
  return (
    <div class="flex h-40 items-start justify-center">
      <Select>
        <SelectTrigger class="w-45">
          <SelectValue placeholder="Opens upward" />
        </SelectTrigger>
        <SelectContent placement="top-start">
          <For each={fruits}>
            {(fruit) => (
              <SelectItem value={fruit.value}>{fruit.label}</SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
    </div>
  );
}

export const selectSections: Section[] = [
  {
    id: "select-basic",
    title: "Basic",
    description: "A simple select with a placeholder and a list of options.",
    component: SelectBasic,
  },
  {
    id: "select-groups",
    title: "Groups",
    description: "Group options with labels and separators.",
    component: SelectGroups,
  },
  {
    id: "select-disabled-items",
    title: "Disabled Items",
    description: "Disable individual items while keeping the rest selectable.",
    component: SelectDisabledItems,
  },
  {
    id: "select-disabled",
    title: "Disabled",
    description: "A disabled select ignores pointer and keyboard interaction.",
    component: SelectDisabled,
  },
  {
    id: "select-controlled",
    title: "Controlled",
    description:
      "Drive the value from a signal and render the current selection.",
    component: SelectControlled,
  },
  {
    id: "select-field",
    title: "With Field",
    description:
      "Compose with Field so the label and description are associated.",
    component: SelectInField,
  },
  {
    id: "select-invalid",
    title: "Invalid",
    description: "Use aria-invalid to surface the invalid state.",
    component: SelectInvalid,
  },
  {
    id: "select-custom-items",
    title: "Custom Items",
    description: "Render rich content inside options with an explicit label.",
    component: SelectCustomItems,
  },
  {
    id: "select-trigger-variants",
    title: "Trigger Variants",
    description: "Reuse Button variants and sizes on the trigger.",
    component: SelectTriggerVariants,
  },
  {
    id: "select-scrollable",
    title: "Scrollable",
    description: "A long list scrolls within the available viewport space.",
    component: SelectScrollable,
  },
  {
    id: "select-placement",
    title: "Placement",
    description: "Prefer opening upward with the placement prop.",
    component: SelectPlacement,
  },
];
