import { ChevronRight, Inbox } from "lucide-solid";
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "~/index";
import type { Section } from "./shared";

function ItemBasic() {
  return (
    <ItemGroup class="w-full max-w-sm">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Inbox />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Inbox</ItemTitle>
          <ItemDescription>You have 3 unread messages.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="sm">
            Open
            <ChevronRight />
          </Button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>Drafts</ItemTitle>
          <ItemDescription>2 drafts waiting for review.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function ItemVariants() {
  return (
    <ItemGroup class="w-full max-w-sm">
      <Item variant="ghost">
        <ItemContent>
          <ItemTitle>Ghost</ItemTitle>
          <ItemDescription>Transparent background.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Outline</ItemTitle>
          <ItemDescription>Bordered item.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted</ItemTitle>
          <ItemDescription>Subtle background.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

export const itemSections: Section[] = [
  {
    id: "item-basic",
    title: "Basic",
    description: "A list item with media, content and actions.",
    component: ItemBasic,
  },
  {
    id: "item-variants",
    title: "Variants",
    description: "Ghost, outline and muted item variants.",
    component: ItemVariants,
  },
];
