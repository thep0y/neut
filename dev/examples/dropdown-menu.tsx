import { createSignal } from "solid-js";
import {
  Activity,
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Bell,
  Building2,
  ChevronsUpDown,
  CircleHelp,
  CirclePlus,
  ClipboardPaste,
  Copy,
  CreditCard,
  Layout,
  LogOut,
  Mail,
  MessageSquare,
  PanelLeft,
  Pencil,
  Scissors,
  Settings,
  Share,
  Trash2,
  User,
  Users,
  Wallet,
} from "lucide-solid";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/index";
import type { Section } from "./shared";

function DropdownMenuBasic() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Open
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuItem disabled>API</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const sides = [
  "inline-start",
  "left",
  "top",
  "bottom",
  "right",
  "inline-end",
] as const;

function DropdownMenuSides() {
  return (
    <div class="flex flex-wrap justify-center gap-2">
      {sides.map((side) => (
        <DropdownMenu>
          <DropdownMenuTrigger variant="outline" class="w-fit capitalize">
            {side.replace("-", " ")}
          </DropdownMenuTrigger>
          <DropdownMenuContent side={side}>
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}

function DropdownMenuWithIcons() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Open
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <User />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithShortcuts() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Open
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithSubmenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Open
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithCheckboxes() {
  const [showStatusBar, setShowStatusBar] = createSignal(true);
  const [showActivityBar, setShowActivityBar] = createSignal(false);
  const [showPanel, setShowPanel] = createSignal(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Checkboxes
      </DropdownMenuTrigger>
      <DropdownMenuContent class="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={showStatusBar()}
            onCheckedChange={(checked) => setShowStatusBar(checked)}
          >
            <Layout />
            Status Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showActivityBar()}
            onCheckedChange={(checked) => setShowActivityBar(checked)}
            disabled
          >
            <Activity />
            Activity Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showPanel()}
            onCheckedChange={(checked) => setShowPanel(checked)}
          >
            <PanelLeft />
            Panel
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithCheckboxesIcons() {
  const [email, setEmail] = createSignal(true);
  const [sms, setSms] = createSignal(false);
  const [push, setPush] = createSignal(true);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Notifications
      </DropdownMenuTrigger>
      <DropdownMenuContent class="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notification Preferences</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={email()}
            onCheckedChange={(checked) => setEmail(checked)}
          >
            <Mail />
            Email notifications
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={sms()}
            onCheckedChange={(checked) => setSms(checked)}
          >
            <MessageSquare />
            SMS notifications
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={push()}
            onCheckedChange={(checked) => setPush(checked)}
          >
            <Bell />
            Push notifications
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithRadio() {
  const [position, setPosition] = createSignal("bottom");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Radio Group
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={position()}
            onValueChange={(value) => setPosition(value)}
          >
            <DropdownMenuRadioItem value="top">
              <ArrowUp />
              Top
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">
              <ArrowDown />
              Bottom
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="right" disabled>
              <ArrowRight />
              Right
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithRadioIcons() {
  const [method, setMethod] = createSignal("card");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Payment Method
      </DropdownMenuTrigger>
      <DropdownMenuContent class="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Select Payment Method</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={method()}
            onValueChange={(value) => setMethod(value)}
          >
            <DropdownMenuRadioItem value="card">
              <CreditCard />
              Credit Card
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="paypal">
              <Wallet />
              PayPal
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bank">
              <Building2 />
              Bank Transfer
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithDestructive() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Archive />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const accountMenuContent = () => (
  <>
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <BadgeCheck />
        Account
      </DropdownMenuItem>
      <DropdownMenuItem>
        <CreditCard />
        Billing
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Bell />
        Notifications
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <LogOut />
      Sign Out
    </DropdownMenuItem>
  </>
);

function DropdownMenuWithAvatar() {
  return (
    <div class="flex items-center justify-between gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger
          variant="outline"
          class="h-12 justify-start px-2 md:max-w-[200px]"
        >
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn" />
            <AvatarFallback class="rounded-lg">CN</AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">shadcn</span>
            <span class="truncate text-xs text-muted-foreground">
              shadcn@example.com
            </span>
          </div>
          <ChevronsUpDown class="ml-auto text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent class="min-w-56">
          {accountMenuContent()}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          variant="ghost"
          size="md"
          class="rounded-full"
          aria-label="Open account menu"
          icon={
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
          }
        />
        <DropdownMenuContent align="end" side="top">
          {accountMenuContent()}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DropdownMenuInDialog() {
  return (
    <Dialog>
      <DialogTrigger variant="outline">Open Dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dropdown Menu Example</DialogTitle>
          <DialogDescription>
            Click the button below to see the dropdown menu.
          </DialogDescription>
        </DialogHeader>
        <DropdownMenu>
          <DropdownMenuTrigger variant="outline" class="w-fit">
            Open Menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Copy />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Scissors />
              Cut
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ClipboardPaste />
              Paste
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Save Page...</DropdownMenuItem>
                  <DropdownMenuItem>Create Shortcut...</DropdownMenuItem>
                  <DropdownMenuItem>Name Window...</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Developer Tools</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DialogContent>
    </Dialog>
  );
}

function DropdownMenuWithInset() {
  const [showBookmarks, setShowBookmarks] = createSignal(true);
  const [showUrls, setShowUrls] = createSignal(false);
  const [theme, setTheme] = createSignal("system");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Open
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>
            <Copy />
            Copy
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Scissors />
            Cut
          </DropdownMenuItem>
          <DropdownMenuItem inset>Paste</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel inset>Appearance</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            inset
            checked={showBookmarks()}
            onCheckedChange={(checked) => setShowBookmarks(checked)}
          >
            Bookmarks
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            inset
            checked={showUrls()}
            onCheckedChange={(checked) => setShowUrls(checked)}
          >
            Full URLs
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel inset>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme()}
            onValueChange={(value) => setTheme(value)}
          >
            <DropdownMenuRadioItem inset value="light">
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem inset value="dark">
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem inset value="system">
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger inset>More Options</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuGroup>
                <DropdownMenuItem>Save Page...</DropdownMenuItem>
                <DropdownMenuItem>Create Shortcut...</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuComplex() {
  const [showSidebar, setShowSidebar] = createSignal(true);
  const [showStatusBar, setShowStatusBar] = createSignal(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Complex Menu
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <User />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>View</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={showSidebar()}
            onCheckedChange={(checked) => setShowSidebar(checked)}
          >
            <PanelLeft />
            Sidebar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showStatusBar()}
            onCheckedChange={(checked) => setShowStatusBar(checked)}
          >
            <Layout />
            Status Bar
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Users />
              Invite Users
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Mail />
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare />
                    Message
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <CirclePlus />
                    More...
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <CircleHelp />
            Support
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            <LogOut />
            Sign Out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuNested() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger variant="outline" class="w-fit">
        Open
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Message</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>SMS</DropdownMenuItem>
                      <DropdownMenuItem>WhatsApp</DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem>Slack</DropdownMenuItem>
                            <DropdownMenuItem>Discord</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const dropdownMenuSections: Section[] = [
  {
    id: "dropdown-basic",
    title: "Basic",
    description: "A basic dropdown menu.",
    component: DropdownMenuBasic,
  },
  {
    id: "dropdown-sides",
    title: "Sides",
    description: "Open the menu on any side of the trigger.",
    component: DropdownMenuSides,
  },
  {
    id: "dropdown-icons",
    title: "With Icons",
    description: "Items with leading icons.",
    component: DropdownMenuWithIcons,
  },
  {
    id: "dropdown-shortcuts",
    title: "With Shortcuts",
    description: "Items with shortcut hints.",
    component: DropdownMenuWithShortcuts,
  },
  {
    id: "dropdown-submenu",
    title: "With Submenu",
    description: "A nested submenu rendered through DropdownMenuPortal.",
    component: DropdownMenuWithSubmenu,
  },
  {
    id: "dropdown-nested",
    title: "Nested (3+ levels)",
    description:
      "Submenus can be nested arbitrarily deep, not just two levels.",
    component: DropdownMenuNested,
  },
  {
    id: "dropdown-checkboxes",
    title: "With Checkboxes",
    description: "Toggle multiple options without closing the menu.",
    component: DropdownMenuWithCheckboxes,
  },
  {
    id: "dropdown-checkboxes-icons",
    title: "Checkboxes with Icons",
    description: "Checkbox items with leading icons.",
    component: DropdownMenuWithCheckboxesIcons,
  },
  {
    id: "dropdown-radio",
    title: "With Radio Group",
    description: "Pick a single option from a radio group.",
    component: DropdownMenuWithRadio,
  },
  {
    id: "dropdown-radio-icons",
    title: "Radio with Icons",
    description: "Radio items with leading icons.",
    component: DropdownMenuWithRadioIcons,
  },
  {
    id: "dropdown-destructive",
    title: "With Destructive Items",
    description: "Use the destructive variant for irreversible actions.",
    component: DropdownMenuWithDestructive,
  },
  {
    id: "dropdown-avatar",
    title: "With Avatar",
    description: "A user menu with an avatar trigger.",
    component: DropdownMenuWithAvatar,
  },
  {
    id: "dropdown-in-dialog",
    title: "In Dialog",
    description: "A dropdown menu rendered inside a dialog.",
    component: DropdownMenuInDialog,
  },
  {
    id: "dropdown-inset",
    title: "With Inset",
    description: "Align items and labels with inset.",
    component: DropdownMenuWithInset,
  },
  {
    id: "dropdown-complex",
    title: "Complex",
    description:
      "A complex menu combining groups, checks, radios and submenus.",
    component: DropdownMenuComplex,
  },
];
