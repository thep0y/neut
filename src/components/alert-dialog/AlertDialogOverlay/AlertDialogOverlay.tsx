import type { AlertDialogOverlayProps } from "./AlertDialogOverlay.types";
import { DialogOverlay } from "~/components/dialog";

export const AlertDialogOverlay = (props: AlertDialogOverlayProps) => (
  <DialogOverlay {...props} data-slot="alert-dialog-overlay" />
);
