import { For } from "solid-js";
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/index";
import type { DrawerSwipeDirection } from "~/index";
import type { Section } from "./shared";

const PARAGRAPHS = [
  "Your changes are saved automatically as you type.",
  "Delivery usually takes three to five business days, depending on your location and the shipping method you selected at checkout.",
  "We use your email address for account notifications and order updates. You can change this anytime from your profile settings.",
  "Refunds are processed within five to ten business days after we receive your return.",
  "API requests are rate-limited to 1,000 calls per hour on the free plan.",
  "Upgrade to Pro for unlimited projects, priority support, and advanced analytics.",
];

const DRAWER_SIDES: DrawerSwipeDirection[] = ["up", "right", "down", "left"];

function DrawerDemo() {
  return (
    <div class="flex flex-wrap gap-2">
      <Drawer>
        <DrawerTrigger variant="outline">Open Drawer</DrawerTrigger>
        <DrawerContent>
          <div class="p-4">
            <div class="h-80 w-full bg-muted" />
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer>
        <DrawerTrigger variant="outline">Header</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>
              Make changes to your profile here. Click save when you're done.
            </DrawerDescription>
          </DrawerHeader>
          <div class="p-4">
            <div class="h-80 w-full bg-muted" />
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer>
        <DrawerTrigger variant="outline">Footer</DrawerTrigger>
        <DrawerContent>
          <div class="p-4">
            <div class="h-80 w-full bg-muted" />
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose variant="outline">Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Drawer>
        <DrawerTrigger variant="outline">Header and Footer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>
              Make changes to your profile here. Click save when you're done.
            </DrawerDescription>
          </DrawerHeader>
          <div class="p-4">
            <div class="h-80 w-full bg-muted" />
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose variant="outline">Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Drawer>
        <DrawerTrigger variant="outline">Edge to Edge</DrawerTrigger>
        <DrawerContent>
          <div class="h-80 w-full bg-blue-200" />
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function DrawerPosition() {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={DRAWER_SIDES}>
        {(side) => (
          <Drawer swipeDirection={side}>
            <DrawerTrigger variant="outline" class="capitalize">
              {side}
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Move Goal</DrawerTitle>
                <DrawerDescription>
                  Set your daily activity goal.
                </DrawerDescription>
              </DrawerHeader>
              <div class="flex-1 p-4">
                <div class="bg-muted group-data-[swipe-axis=y]/drawer-popup:h-80 group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=x]/drawer-popup:size-full" />
              </div>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose variant="outline">Cancel</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </For>
    </div>
  );
}

function DrawerSwipeHandleExample() {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={DRAWER_SIDES}>
        {(side) => (
          <Drawer swipeDirection={side} showSwipeHandle>
            <DrawerTrigger variant="outline" class="capitalize">
              {side}
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle class="capitalize">Drawer</DrawerTitle>
                <DrawerDescription>
                  Drawer with a swipe handle.
                </DrawerDescription>
              </DrawerHeader>
              <div class="flex-1 p-4">
                <div class="bg-muted group-data-[swipe-axis=y]/drawer-popup:h-80 group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=x]/drawer-popup:size-full" />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </For>
    </div>
  );
}

function DrawerScrollable() {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={DRAWER_SIDES}>
        {(side) => (
          <Drawer swipeDirection={side}>
            <DrawerTrigger variant="outline" class="capitalize">
              {side}
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Move Goal</DrawerTitle>
                <DrawerDescription>
                  Set your daily activity goal.
                </DrawerDescription>
              </DrawerHeader>
              <div class="flex-1 overflow-y-auto p-4">
                <For each={Array.from({ length: 20 })}>
                  {(_, index) => (
                    <p class="mb-4 leading-normal">
                      {PARAGRAPHS[index() % PARAGRAPHS.length]}
                    </p>
                  )}
                </For>
              </div>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose variant="outline">Cancel</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </For>
    </div>
  );
}

function DrawerCustomWidthAndHeight() {
  return (
    <div class="flex flex-wrap gap-2">
      <Drawer swipeDirection="down">
        <DrawerTrigger variant="outline">Down</DrawerTrigger>
        <DrawerContent class="data-[swipe-direction=down]:h-64">
          <DrawerHeader>
            <DrawerTitle>Down drawer</DrawerTitle>
            <DrawerDescription>Drawer with a custom height.</DrawerDescription>
          </DrawerHeader>
          <div class="flex-1 overflow-y-auto p-4">
            <For each={Array.from({ length: 10 })}>
              {(_, index) => (
                <p class="mb-4 leading-normal">
                  {PARAGRAPHS[index() % PARAGRAPHS.length]}
                </p>
              )}
            </For>
          </div>
          <DrawerFooter>
            <DrawerClose variant="outline">Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Drawer swipeDirection="right">
        <DrawerTrigger variant="outline">Right</DrawerTrigger>
        <DrawerContent class="data-[swipe-direction=right]:w-80">
          <DrawerHeader>
            <DrawerTitle>Right drawer</DrawerTitle>
            <DrawerDescription>Drawer with a custom width.</DrawerDescription>
          </DrawerHeader>
          <div class="flex-1 overflow-y-auto p-4">
            <For each={Array.from({ length: 10 })}>
              {(_, index) => (
                <p class="mb-4 leading-normal">
                  {PARAGRAPHS[index() % PARAGRAPHS.length]}
                </p>
              )}
            </For>
          </div>
          <DrawerFooter>
            <DrawerClose variant="outline">Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function DrawerNonModal() {
  return (
    <Drawer modal={false} disablePointerDismissal swipeDirection="right">
      <DrawerTrigger variant="outline">Non Modal</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Non Modal Drawer</DrawerTitle>
        </DrawerHeader>
        <div class="flex-1 p-4">
          <div class="bg-muted group-data-[swipe-axis=y]/drawer-popup:h-80 group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=x]/drawer-popup:size-full" />
        </div>
        <DrawerFooter>
          <DrawerClose variant="outline">Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export const drawerSections: Section[] = [
  {
    id: "drawer-demo",
    title: "Demo",
    description: "Content, header, footer and edge-to-edge variants.",
    component: DrawerDemo,
  },
  {
    id: "drawer-position",
    title: "Position",
    description: "Open the drawer from any side with swipeDirection.",
    component: DrawerPosition,
  },
  {
    id: "drawer-swipe-handle",
    title: "Swipe Handle",
    description: "Render a drag handle with showSwipeHandle.",
    component: DrawerSwipeHandleExample,
  },
  {
    id: "drawer-scrollable",
    title: "Scrollable Content",
    description: "Make a flex-1 region scrollable inside the drawer.",
    component: DrawerScrollable,
  },
  {
    id: "drawer-custom-size",
    title: "Custom Width and Height",
    description: "Customize size with h-*/w-* utilities.",
    component: DrawerCustomWidthAndHeight,
  },
  {
    id: "drawer-non-modal",
    title: "Non Modal",
    description: "modal={false} allows interacting with the page behind.",
    component: DrawerNonModal,
  },
];
