import { For, createSignal } from "solid-js";
import { Button, toast, type Position } from "~/index";
import type { Section } from "./shared";

function ToastDemo() {
  return (
    <div class="flex flex-wrap justify-center gap-2">
      <Button onClick={() => toast("This is a default toast")}>Default</Button>
      <Button
        variant="outline"
        onClick={() => toast.success("Saved successfully")}
      >
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Be careful")}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.info("New update available")}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.loading("Loading...")}>
        Loading
      </Button>
    </div>
  );
}

function ToastWithAction() {
  return (
    <div class="flex flex-wrap justify-center gap-2">
      <Button
        onClick={() =>
          toast("Delete this item?", {
            action: {
              label: "Delete",
              onClick: () => toast.success("Item deleted"),
            },
            cancel: {
              label: "Cancel",
              onClick: () => toast("Cancelled"),
            },
          })
        }
      >
        With action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Something happened", {
            action: {
              label: "Undo",
              onClick: () => toast.success("Restored"),
            },
          })
        }
      >
        With undo
      </Button>
    </div>
  );
}

function ToastPromise() {
  const [loading, setLoading] = createSignal(false);

  return (
    <div class="flex justify-center">
      <Button
        disabled={loading()}
        onClick={() => {
          setLoading(true);
          toast.promise(
            new Promise((resolve) => {
              setTimeout(() => resolve("done"), 2000);
            }),
            {
              loading: "Updating...",
              success: "Update completed",
              error: "Update failed",
              finally: () => {
                setLoading(false);
              },
            },
          );
        }}
      >
        {loading() ? "Running..." : "Show promise toast"}
      </Button>
    </div>
  );
}

function ToastCustom() {
  return (
    <div class="flex justify-center">
      <Button
        variant="outline"
        onClick={() =>
          toast.custom((id) => (
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-emerald-500" />
              Custom toast #{id}
            </div>
          ))
        }
      >
        Show custom toast
      </Button>
    </div>
  );
}

const positions: Position[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

function ToastPositions() {
  return (
    <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
      <For each={positions}>
        {(position) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast(position, { position })}
          >
            {position}
          </Button>
        )}
      </For>
    </div>
  );
}

export const toastSections: Section[] = [
  {
    id: "toast-usage",
    title: "Usage",
    description: "Basic toasts for every built-in type.",
    component: ToastDemo,
  },
  {
    id: "toast-action",
    title: "Action",
    description: "Toasts with action and cancel buttons.",
    component: ToastWithAction,
  },
  {
    id: "toast-promise",
    title: "Promise",
    description: "Toast that updates based on a promise lifecycle.",
    component: ToastPromise,
  },
  {
    id: "toast-custom",
    title: "Custom",
    description: "Render custom JSX inside a toast.",
    component: ToastCustom,
  },
  {
    id: "toast-positions",
    title: "Positions",
    description: "Show toasts from different viewport positions.",
    component: ToastPositions,
  },
];
