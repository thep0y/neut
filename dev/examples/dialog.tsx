import { createSignal } from "solid-js";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  useDialogContext,
} from "~/index";
import type { Section } from "./shared";

function DialogUsage() {
  return (
    <Dialog>
      <DialogTrigger variant="outline">Edit profile</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="dialog-name">Name</Label>
            <Input id="dialog-name" placeholder="Your name" />
          </div>
          <div class="grid gap-2">
            <Label for="dialog-email">Email</Label>
            <Input
              id="dialog-email"
              type="email"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose variant="outline">Cancel</DialogClose>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogControlled() {
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
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogTrigger variant="outline">Open via trigger</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Controlled dialog</DialogTitle>
            <DialogDescription>
              This dialog is fully controlled by the open prop. Use any button,
              state update, or DialogClose to close it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close via state
            </Button>
            <DialogClose>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DialogDefaultOpen() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger variant="outline">Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Default open</DialogTitle>
          <DialogDescription>
            This dialog is open by default in uncontrolled mode. Close it and
            use the trigger to reopen it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogNoDefaultClose() {
  return (
    <Dialog>
      <DialogTrigger variant="outline">Open dialog</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No default close button</DialogTitle>
          <DialogDescription>
            Set showCloseButton to false to hide the X button. Provide your own
            DialogClose or controlled close instead.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose variant="outline">Cancel</DialogClose>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogSubscribe() {
  const { setOpen } = useDialogContext();

  return (
    <div class="grid gap-4">
      <div class="grid gap-2">
        <Label for="dialog-subscribe-email">Email</Label>
        <Input
          id="dialog-subscribe-email"
          type="email"
          placeholder="you@example.com"
        />
      </div>
      <DialogFooter>
        <DialogClose variant="outline">Cancel</DialogClose>
        <Button onClick={() => setOpen(false)}>Subscribe</Button>
      </DialogFooter>
    </div>
  );
}

function DialogCloseProgrammatically() {
  return (
    <Dialog>
      <DialogTrigger variant="outline">Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close programmatically</DialogTitle>
          <DialogDescription>
            Use the useDialogContext hook inside the dialog to close it after an
            action.
          </DialogDescription>
        </DialogHeader>
        <DialogSubscribe />
      </DialogContent>
    </Dialog>
  );
}

export const dialogSections: Section[] = [
  {
    id: "dialog-usage",
    title: "Usage",
    description: "A basic dialog with a title, description, form fields, and footer actions.",
    component: DialogUsage,
  },
  {
    id: "dialog-controlled",
    title: "Controlled",
    description: "Control the dialog open state with the open prop and onOpenChange.",
    component: DialogControlled,
  },
  {
    id: "dialog-default-open",
    title: "Default Open",
    description: "Uncontrolled mode with defaultOpen sets the initial open state.",
    component: DialogDefaultOpen,
  },
  {
    id: "dialog-no-default-close",
    title: "No Default Close Button",
    description: "Hide the default X button with showCloseButton={false}.",
    component: DialogNoDefaultClose,
  },
  {
    id: "dialog-close-programmatically",
    title: "Close Programmatically",
    description: "Use useDialogContext to close the dialog from an action.",
    component: DialogCloseProgrammatically,
  },
];
