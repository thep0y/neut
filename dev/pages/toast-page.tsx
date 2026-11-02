import { Toaster } from "~/index";
import { ComponentPage } from "../examples/shared";
import { toastSections } from "../examples/toast";

export default function ToastPage() {
  return (
    <>
      <Toaster position="bottom-right" closeButton />
      <ComponentPage
        id="toast"
        title="Toast"
        description="A succinct message that is displayed temporarily."
        sections={toastSections}
      />
    </>
  );
}
