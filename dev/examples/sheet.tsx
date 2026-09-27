import { For } from "solid-js";
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/index";
import type { SheetSide } from "~/index";
import type { Section } from "./shared";

function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger variant="outline">Open</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div class="grid flex-1 auto-rows-min gap-6 px-4">
          <div class="grid gap-3">
            <Label for="sheet-demo-name">Name</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div class="grid gap-3">
            <Label for="sheet-demo-username">Username</Label>
            <Input id="sheet-demo-username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose variant="outline">Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const SHEET_SIDES: SheetSide[] = ["top", "right", "bottom", "left"];

function SheetSideDemo() {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={SHEET_SIDES}>
        {(side) => (
          <Sheet>
            <SheetTrigger variant="outline" class="capitalize">
              {side}
            </SheetTrigger>
            <SheetContent
              side={side}
              class="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
            >
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </SheetDescription>
              </SheetHeader>
              <div class="no-scrollbar overflow-y-auto px-4">
                <For each={Array.from({ length: 10 })}>
                  {() => (
                    <p class="mb-2 leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident, sunt in culpa qui
                      officia deserunt mollit anim id est laborum.
                    </p>
                  )}
                </For>
              </div>
              <SheetFooter>
                <Button type="submit">Save changes</Button>
                <SheetClose variant="outline">Cancel</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </For>
    </div>
  );
}

function SheetNoCloseButton() {
  return (
    <Sheet>
      <SheetTrigger variant="outline">Open Sheet</SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>No Close Button</SheetTitle>
          <SheetDescription>
            This sheet doesn&apos;t have a close button in the top-right corner.
            Click outside to close.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

export const sheetSections: Section[] = [
  {
    id: "sheet-demo",
    title: "Demo",
    description: "A right-side sheet with a form and a footer.",
    component: SheetDemo,
  },
  {
    id: "sheet-side",
    title: "Side",
    description: "Use the side prop to choose top, right, bottom or left.",
    component: SheetSideDemo,
  },
  {
    id: "sheet-no-close-button",
    title: "No Close Button",
    description: "Hide the close button with showCloseButton={false}.",
    component: SheetNoCloseButton,
  },
];
