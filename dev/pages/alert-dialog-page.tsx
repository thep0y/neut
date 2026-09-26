import { ComponentPage } from "../examples/shared";
import { alertDialogSections } from "../examples/alert-dialog";

export default function AlertDialogPage() {
  return (
    <ComponentPage
      id="alert-dialog"
      title="Alert Dialog"
      description="A modal dialog that interrupts the user and requires a response."
      sections={alertDialogSections}
    />
  );
}
