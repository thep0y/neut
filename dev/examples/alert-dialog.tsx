import { createSignal } from "solid-js";
import { AlertTriangle } from "lucide-solid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "~/index";
import type { Section } from "./shared";

function AlertDialogBasic() {
  return (
    <AlertDialog>
      <AlertDialogTrigger variant="outline">Show dialog</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlertDialogDestructive() {
  return (
    <AlertDialog>
      <AlertDialogTrigger variant="destructive">Delete chat</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this conversation and its messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlertDialogSmall() {
  return (
    <AlertDialog>
      <AlertDialogTrigger variant="outline">Small dialog</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete file?</AlertDialogTitle>
          <AlertDialogDescription>
            Choose whether to remove this file or keep it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlertDialogWithMedia() {
  return (
    <AlertDialog>
      <AlertDialogTrigger variant="outline">With media</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Storage almost full</AlertDialogTitle>
          <AlertDialogDescription>
            You have used 92% of your storage. Upgrade your plan to keep syncing
            files across devices.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction>Upgrade</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlertDialogControlled() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <span class="text-sm text-muted-foreground">
          State: {open() ? "open" : "closed"}
        </span>
      </div>
      <AlertDialog open={open()} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Controlled alert dialog</AlertDialogTitle>
            <AlertDialogDescription>
              The open state is controlled from outside. Clicking outside or
              pressing Escape does not dismiss an alert dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const alertDialogSections: Section[] = [
  {
    id: "alert-dialog-basic",
    title: "Basic",
    description:
      "A confirmation dialog. Clicking the overlay does not dismiss it.",
    component: AlertDialogBasic,
  },
  {
    id: "alert-dialog-destructive",
    title: "Destructive",
    description: "Use a destructive action for irreversible operations.",
    component: AlertDialogDestructive,
  },
  {
    id: "alert-dialog-small",
    title: "Small",
    description: 'Use size="sm" for a compact, full-width action layout.',
    component: AlertDialogSmall,
  },
  {
    id: "alert-dialog-media",
    title: "With Media",
    description: "Add an icon or media block to the header.",
    component: AlertDialogWithMedia,
  },
  {
    id: "alert-dialog-controlled",
    title: "Controlled",
    description: "Control the open state with open and onOpenChange.",
    component: AlertDialogControlled,
  },
];
