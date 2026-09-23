import { createSignal } from "solid-js";
import {
  Bookmark,
  Copy,
  CreditCard,
  MessageSquare,
  Share,
  Star,
  Trash,
  User,
  Users,
} from "lucide-solid";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/index";
import type { Section } from "./shared";

/** 右键交互区域,统一成虚线框,方便在示例里找到"右键点这里" */
function TriggerArea(props: { children?: any; class?: string }) {
  return (
    <ContextMenuTrigger
      class={`flex h-36 w-full max-w-72 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground ${props.class ?? ""}`}
    >
      {props.children ?? "Right click here"}
    </ContextMenuTrigger>
  );
}

function ContextMenuBasic() {
  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuItem>Back</ContextMenuItem>
        <ContextMenuItem disabled>Forward</ContextMenuItem>
        <ContextMenuItem>Reload</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuSubmenu() {
  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuItem>Back</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent class="w-48">
            <ContextMenuItem>Save Page As...</ContextMenuItem>
            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Developer Tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>Reload</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuShortcuts() {
  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuItem>
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuGroups() {
  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>People</ContextMenuLabel>
          <ContextMenuItem>
            <User />
            Profile
          </ContextMenuItem>
          <ContextMenuItem>
            <CreditCard />
            Billing
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Team</ContextMenuLabel>
          <ContextMenuItem>
            <Users />
            Team
          </ContextMenuItem>
          <ContextMenuItem>
            <MessageSquare />
            Subscription
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuIcons() {
  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuItem>
          <Copy />
          Copy
        </ContextMenuItem>
        <ContextMenuItem>
          <Share />
          Share
        </ContextMenuItem>
        <ContextMenuItem>
          <Star />
          Add to Favorites
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuCheckboxes() {
  const [showBookmarks, setShowBookmarks] = createSignal(true);
  const [showUrls, setShowUrls] = createSignal(false);

  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuCheckboxItem
          checked={showBookmarks()}
          onCheckedChange={setShowBookmarks}
        >
          Show Bookmarks
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={showUrls()}
          onCheckedChange={setShowUrls}
        >
          Show Full URLs
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuRadio() {
  const [user, setUser] = createSignal("pedro");
  const [theme, setTheme] = createSignal("light");

  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>People</ContextMenuLabel>
          <ContextMenuRadioGroup value={user()} onValueChange={setUser}>
            <ContextMenuRadioItem value="pedro">
              Pedro Duarte
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Theme</ContextMenuLabel>
          <ContextMenuRadioGroup value={theme()} onValueChange={setTheme}>
            <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
            <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
            <ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuDestructive() {
  return (
    <ContextMenu>
      <TriggerArea />
      <ContextMenuContent>
        <ContextMenuItem variant="destructive">
          <Trash />
          Delete
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Bookmark />
          Save
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuCustomTrigger() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        component="button"
        type="button"
        class="rounded-xl border bg-background px-4 py-2 text-sm hover:bg-accent"
      >
        Button trigger（component="button"）
      </ContextMenuTrigger>
      <ContextMenuContent class="w-48">
        <ContextMenuItem>Profile</ContextMenuItem>
        <ContextMenuItem>Billing</ContextMenuItem>
        <ContextMenuItem>Team</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuSides() {
  return (
    <div class="grid gap-6 sm:grid-cols-2">
      <ContextMenu>
        <TriggerArea>side="inline-end"</TriggerArea>
        <ContextMenuContent side="inline-end" class="w-48">
          <ContextMenuItem>Profile</ContextMenuItem>
          <ContextMenuItem>Billing</ContextMenuItem>
          <ContextMenuItem>Team</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ContextMenu>
        <TriggerArea>side="bottom" align="center"</TriggerArea>
        <ContextMenuContent side="bottom" align="center" class="w-48">
          <ContextMenuItem>Profile</ContextMenuItem>
          <ContextMenuItem>Billing</ContextMenuItem>
          <ContextMenuItem>Team</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export const contextMenuSections: Section[] = [
  {
    id: "context-menu-basic",
    title: "Basic",
    description: "A simple context menu with a few actions.",
    component: ContextMenuBasic,
  },
  {
    id: "context-menu-submenu",
    title: "Submenu",
    description: "Use ContextMenuSub to nest secondary actions.",
    component: ContextMenuSubmenu,
  },
  {
    id: "context-menu-shortcuts",
    title: "Shortcuts",
    description: "Add ContextMenuShortcut to show keyboard hints.",
    component: ContextMenuShortcuts,
  },
  {
    id: "context-menu-groups",
    title: "Groups",
    description: "Group related actions and separate them with dividers.",
    component: ContextMenuGroups,
  },
  {
    id: "context-menu-icons",
    title: "Icons",
    description: "Combine icons with labels for quick scanning.",
    component: ContextMenuIcons,
  },
  {
    id: "context-menu-checkboxes",
    title: "Checkboxes",
    description: "Use ContextMenuCheckboxItem for toggles.",
    component: ContextMenuCheckboxes,
  },
  {
    id: "context-menu-radio",
    title: "Radio",
    description: "Use ContextMenuRadioItem for exclusive choices.",
    component: ContextMenuRadio,
  },
  {
    id: "context-menu-destructive",
    title: "Destructive",
    description: 'Use variant="destructive" to style an item as destructive.',
    component: ContextMenuDestructive,
  },
  {
    id: "context-menu-custom-trigger",
    title: "Custom trigger",
    description:
      "Render the trigger as any element or component with the component prop.",
    component: ContextMenuCustomTrigger,
  },
  {
    id: "context-menu-sides",
    title: "Sides",
    description: "Control menu placement with side and align props.",
    component: ContextMenuSides,
  },
];
