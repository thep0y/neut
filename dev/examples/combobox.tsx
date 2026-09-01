import { For, Show } from "solid-js";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "~/index";
import type { Section } from "./shared";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

function ComboboxBasic() {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput placeholder="Select a framework" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ComboboxWithClear() {
  return (
    <Combobox items={frameworks} defaultValue={frameworks[0]}>
      <div class="relative w-64">
        <ComboboxInput placeholder="Select a framework" showClear />
      </div>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ComboboxMultiple() {
  return (
    <Combobox multiple items={frameworks} defaultValue={[frameworks[0]]}>
      <ComboboxChips class="w-full max-w-xs">
        <ComboboxValue>
          {(values) => (
            <>
              <For each={values}>
                {(value) => <ComboboxChip value={value}>{value}</ComboboxChip>}
              </For>
              <ComboboxChipsInput placeholder="Add framework" />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const timezones = [
  {
    value: "Americas",
    items: [
      "(GMT-5) New York",
      "(GMT-8) Los Angeles",
      "(GMT-6) Chicago",
      "(GMT-5) Toronto",
      "(GMT-8) Vancouver",
      "(GMT-3) São Paulo",
    ],
  },
  {
    value: "Europe",
    items: [
      "(GMT+0) London",
      "(GMT+1) Paris",
      "(GMT+1) Berlin",
      "(GMT+1) Rome",
      "(GMT+1) Madrid",
      "(GMT+1) Amsterdam",
    ],
  },
  {
    value: "Asia/Pacific",
    items: [
      "(GMT+9) Tokyo",
      "(GMT+8) Shanghai",
      "(GMT+8) Singapore",
      "(GMT+4) Dubai",
      "(GMT+11) Sydney",
      "(GMT+9) Seoul",
    ],
  },
];

function ComboboxGroups() {
  return (
    <Combobox items={timezones}>
      <ComboboxInput placeholder="Select a timezone" />
      <ComboboxContent>
        <ComboboxEmpty>No timezones found.</ComboboxEmpty>
        <ComboboxList>
          {(group, index) => (
            <ComboboxGroup>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection items={group.items}>
                {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
              </ComboboxCollection>
              <Show when={index < timezones.length - 1}>
                <ComboboxSeparator />
              </Show>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const countries = [
  {
    code: "ar",
    value: "argentina",
    label: "Argentina",
    continent: "South America",
  },
  { code: "au", value: "australia", label: "Australia", continent: "Oceania" },
  { code: "br", value: "brazil", label: "Brazil", continent: "South America" },
  { code: "ca", value: "canada", label: "Canada", continent: "North America" },
  { code: "cn", value: "china", label: "China", continent: "Asia" },
  { code: "fr", value: "france", label: "France", continent: "Europe" },
  { code: "jp", value: "japan", label: "Japan", continent: "Asia" },
  {
    code: "us",
    value: "united-states",
    label: "United States",
    continent: "North America",
  },
];

function ComboboxCustomItems() {
  return (
    <Combobox items={countries} itemToStringValue={(country) => country.label}>
      <ComboboxInput placeholder="Search countries..." />
      <ComboboxContent>
        <ComboboxEmpty>No countries found.</ComboboxEmpty>
        <ComboboxList>
          {(country) => (
            <ComboboxItem value={country}>
              <Item size="xs" class="p-0">
                <ItemContent>
                  <ItemTitle class="whitespace-nowrap">
                    {country.label}
                  </ItemTitle>
                  <ItemDescription>
                    {country.continent} ({country.code})
                  </ItemDescription>
                </ItemContent>
              </Item>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ComboboxPopup() {
  return (
    <Combobox
      items={countries}
      defaultValue={countries[0]}
      itemToStringValue={(country) => country.label}
    >
      <ComboboxTrigger class="w-64 justify-between font-normal">
        <ComboboxValue />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search countries..." />
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item.label}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ComboboxInvalid() {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput placeholder="Select a framework" aria-invalid="true" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ComboboxDisabled() {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput placeholder="Select a framework" disabled />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export const comboboxSections: Section[] = [
  {
    id: "combobox-basic",
    title: "Basic",
    description: "A simple combobox with a list of frameworks.",
    component: ComboboxBasic,
  },
  {
    id: "combobox-clear",
    title: "Clear Button",
    description: "Use showClear to display a clear button.",
    component: ComboboxWithClear,
  },
  {
    id: "combobox-multiple",
    title: "Multiple",
    description: "Multiple selection with chips.",
    component: ComboboxMultiple,
  },
  {
    id: "combobox-groups",
    title: "Groups",
    description: "Group items with labels and separators.",
    component: ComboboxGroups,
  },
  {
    id: "combobox-custom-items",
    title: "Custom Items",
    description: "Render custom content inside ComboboxItem.",
    component: ComboboxCustomItems,
  },
  {
    id: "combobox-popup",
    title: "Popup",
    description: "Trigger the combobox from a button.",
    component: ComboboxPopup,
  },
  {
    id: "combobox-invalid",
    title: "Invalid",
    description: "Use aria-invalid to show invalid state.",
    component: ComboboxInvalid,
  },
  {
    id: "combobox-disabled",
    title: "Disabled",
    description: "Disabled combobox.",
    component: ComboboxDisabled,
  },
];
