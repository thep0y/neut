import { ComponentPage } from "../examples/shared";
import { attachmentSections } from "../examples/attachment";

export default function AttachmentPage() {
  return (
    <ComponentPage
      id="attachment"
      title="Attachment"
      description="Displays a file or image attachment with media, metadata, upload state, and actions."
      sections={attachmentSections}
    />
  );
}
