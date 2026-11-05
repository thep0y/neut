import { ChevronsUpDown } from "lucide-solid";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/index";
import type { Section } from "./shared";

function CollapsibleBasic() {
  return (
    <Collapsible class="w-full max-w-sm">
      <CollapsibleTrigger variant="outline" class="flex w-full justify-between">
        Show details
        <ChevronsUpDown />
      </CollapsibleTrigger>
      <CollapsibleContent class="mt-2 rounded-lg border p-4 text-sm">
        Here are the details you were looking for.
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleDefaultOpen() {
  return (
    <Collapsible defaultOpen class="w-full max-w-sm">
      <CollapsibleTrigger variant="outline" class="flex w-full justify-between">
        Advanced settings
        <ChevronsUpDown />
      </CollapsibleTrigger>
      <CollapsibleContent class="mt-2 space-y-2 rounded-lg border p-4 text-sm">
        <p>Option A is enabled.</p>
        <p>Option B is disabled.</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const collapsibleSections: Section[] = [
  {
    id: "collapsible-basic",
    title: "Basic",
    description: "A single collapsible panel.",
    component: CollapsibleBasic,
  },
  {
    id: "collapsible-default-open",
    title: "Default Open",
    description: "Start expanded with defaultOpen.",
    component: CollapsibleDefaultOpen,
  },
];
