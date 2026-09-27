import { For, Show, createSignal } from "solid-js";
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  clsx,
} from "~/index";
import type { ResizableLayout, ResizablePanelHandle } from "~/index";
import type { Section } from "./shared";

function PanelContent(props: { label: string; class?: string }) {
  return (
    <div
      class={clsx(
        "flex h-full items-center justify-center p-6 text-sm font-semibold",
        props.class,
      )}
    >
      {props.label}
    </div>
  );
}

function ResizableBasic() {
  return (
    <ResizablePanelGroup class="min-h-[200px] w-full max-w-md rounded-lg border">
      <ResizablePanel>
        <PanelContent label="One" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <PanelContent label="Two" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <PanelContent label="Three" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ResizableHorizontal() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      class="min-h-[200px] w-full max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize="25%">
        <PanelContent label="Sidebar" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="75%">
        <PanelContent label="Content" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ResizableVertical() {
  return (
    <ResizablePanelGroup
      orientation="vertical"
      class="min-h-[200px] w-full max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize="25%">
        <PanelContent label="Header" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="75%">
        <PanelContent label="Content" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ResizableWithHandle() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      class="min-h-[200px] w-full max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize="25%">
        <PanelContent label="Sidebar" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="75%">
        <PanelContent label="Content" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ResizableNested() {
  return (
    <ResizablePanelGroup class="w-full max-w-md rounded-lg border">
      <ResizablePanel defaultSize="50%">
        <PanelContent label="One" class="h-[200px]" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="50%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel defaultSize="25%">
            <PanelContent label="Two" />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="75%">
            <PanelContent label="Three" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ResizableControlled() {
  const [layout, setLayout] = createSignal<ResizableLayout>({});
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      class="min-h-[200px] w-full max-w-md rounded-lg border"
      onLayoutChange={setLayout}
    >
      <ResizablePanel id="left" defaultSize="30%" minSize="20%">
        <div class="flex h-full flex-col items-center justify-center gap-2 p-6">
          <span class="text-sm font-semibold">
            {Math.round(layout().left ?? 30)}%
          </span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="right" defaultSize="70%" minSize="30%">
        <div class="flex h-full flex-col items-center justify-center gap-2 p-6">
          <span class="text-sm font-semibold">
            {Math.round(layout().right ?? 70)}%
          </span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ResizableCollapsible() {
  const [sidebar, setSidebar] = createSignal<ResizablePanelHandle>();
  return (
    <div class="flex w-full max-w-md flex-col gap-2">
      <ResizablePanelGroup
        orientation="horizontal"
        class="min-h-[200px] rounded-lg border"
      >
        <ResizablePanel
          defaultSize="30%"
          minSize="20%"
          maxSize="50%"
          collapsible
          collapsedSize="0%"
          panelRef={setSidebar}
        >
          <PanelContent label="Sidebar" />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="70%">
          <PanelContent label="Content" />
        </ResizablePanel>
      </ResizablePanelGroup>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => sidebar()?.collapse()}
        >
          Collapse
        </Button>
        <Button variant="outline" size="sm" onClick={() => sidebar()?.expand()}>
          Expand
        </Button>
      </div>
    </div>
  );
}

function ResizablePersisted() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      autoSaveId="neut-docs-resizable"
      class="min-h-[200px] w-full max-w-md rounded-lg border"
    >
      <For each={["One", "Two", "Three"]}>
        {(label, index) => (
          <>
            <ResizablePanel id={label.toLowerCase()} defaultSize="33.33%">
              <PanelContent label={label} />
            </ResizablePanel>
            <Show when={index() < 2}>
              <ResizableHandle withHandle />
            </Show>
          </>
        )}
      </For>
    </ResizablePanelGroup>
  );
}

export const resizableSections: Section[] = [
  {
    id: "resizable-basic",
    title: "Basic",
    description: "A horizontal group with three panels.",
    component: ResizableBasic,
  },
  {
    id: "resizable-horizontal",
    title: "Horizontal",
    description: "Sidebar and content split 25 / 75.",
    component: ResizableHorizontal,
  },
  {
    id: "resizable-vertical",
    title: "Vertical",
    description: "Use orientation=\"vertical\" for vertical resizing.",
    component: ResizableVertical,
  },
  {
    id: "resizable-with-handle",
    title: "Handle",
    description: "Show a visible handle with the withHandle prop.",
    component: ResizableWithHandle,
  },
  {
    id: "resizable-nested",
    title: "Nested",
    description: "Nest a vertical group inside a horizontal one.",
    component: ResizableNested,
  },
  {
    id: "resizable-controlled",
    title: "Controlled",
    description: "Read the live layout with onLayoutChange.",
    component: ResizableControlled,
  },
  {
    id: "resizable-collapsible",
    title: "Collapsible",
    description: "Collapse a panel below its minSize via the imperative handle.",
    component: ResizableCollapsible,
  },
  {
    id: "resizable-persisted",
    title: "Persisted",
    description: "Persist the layout to localStorage with autoSaveId.",
    component: ResizablePersisted,
  },
];
