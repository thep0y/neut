import { For } from "solid-js";
import {
  AlertTriangle,
  Clock,
  Copy,
  FileCode,
  FileText,
  X,
} from "lucide-solid";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "~/index";
import type { AttachmentState } from "~/index";
import type { Section } from "./shared";

function AttachmentBasic() {
  return (
    <Attachment>
      <AttachmentMedia>
        <FileText />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
        <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove sales-dashboard.pdf">
          <X />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

function AttachmentImage() {
  return (
    <div class="flex flex-wrap items-start justify-center gap-4">
      <Attachment orientation="vertical">
        <AttachmentMedia variant="image">
          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&auto=format&fit=crop&q=60"
            alt="Workspace"
          />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>workspace.png</AttachmentTitle>
          <AttachmentDescription>PNG · 820 KB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove workspace.png">
            <X />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </div>
  );
}

const states: {
  state: AttachmentState;
  title: string;
  description: string;
}[] = [
  { state: "idle", title: "selected-file.pdf", description: "Ready to upload" },
  {
    state: "uploading",
    title: "design-system.zip",
    description: "Uploading · 64%",
  },
  {
    state: "processing",
    title: "market-research.pdf",
    description: "Processing document",
  },
  {
    state: "error",
    title: "financial-model.xlsx",
    description: "Upload failed. Try again.",
  },
  {
    state: "done",
    title: "uploaded-report.pdf",
    description: "Uploaded · 1.8 MB",
  },
];

function AttachmentStates() {
  return (
    <div class="flex flex-col items-center gap-3">
      <For each={states}>
        {(item) => (
          <Attachment state={item.state}>
            <AttachmentMedia>
              <FileText />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{item.title}</AttachmentTitle>
              <AttachmentDescription>{item.description}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        )}
      </For>
    </div>
  );
}

const sizes = ["default", "sm", "xs"] as const;

function AttachmentSizes() {
  return (
    <div class="flex flex-wrap items-center justify-center gap-4">
      <For each={sizes}>
        {(size) => (
          <Attachment size={size}>
            <AttachmentMedia>
              <FileText />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>attachment.pdf</AttachmentTitle>
              <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        )}
      </For>
    </div>
  );
}

const files = [
  { icon: FileText, name: "briefing-notes.pdf", meta: "PDF · 1.4 MB" },
  { icon: FileCode, name: "renderer.tsx", meta: "TSX · 12 KB" },
  { icon: FileText, name: "customers.csv", meta: "CSV · 18 KB" },
  { icon: FileCode, name: "schema.sql", meta: "SQL · 6 KB" },
  { icon: FileText, name: "roadmap.docx", meta: "DOCX · 44 KB" },
];

function AttachmentGroupDemo() {
  return (
    <AttachmentGroup class="w-full max-w-md">
      <For each={files}>
        {(file) => (
          <Attachment>
            <AttachmentMedia>
              <file.icon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
              <AttachmentDescription>{file.meta}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        )}
      </For>
    </AttachmentGroup>
  );
}

function AttachmentTriggerDemo() {
  return (
    <Attachment>
      <AttachmentMedia>
        <FileText />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
        <AttachmentDescription>
          <span class="inline-flex items-center gap-1">
            <Clock class="size-3" /> Open preview
          </span>
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Copy link">
          <Copy />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger
        component="a"
        href="https://example.com/research-summary.pdf"
        target="_blank"
        rel="noreferrer"
        aria-label="Open research-summary.pdf"
      />
    </Attachment>
  );
}

function AttachmentErrorDemo() {
  return (
    <Attachment state="error">
      <AttachmentMedia>
        <AlertTriangle />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
        <AttachmentDescription>
          Upload failed. The file exceeds 25 MB.
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove financial-model.xlsx">
          <X />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

export const attachmentSections: Section[] = [
  {
    id: "attachment-basic",
    title: "Basic",
    description:
      "An icon attachment with a title, metadata and a remove action.",
    component: AttachmentBasic,
  },
  {
    id: "attachment-image",
    title: "Image",
    description:
      'Use variant="image" and orientation="vertical" for image previews.',
    component: AttachmentImage,
  },
  {
    id: "attachment-states",
    title: "States",
    description: "idle, uploading, processing, error and done upload states.",
    component: AttachmentStates,
  },
  {
    id: "attachment-sizes",
    title: "Sizes",
    description: "default, sm and xs sizes.",
    component: AttachmentSizes,
  },
  {
    id: "attachment-group",
    title: "Group",
    description: "A horizontally scrollable, snapping row with an edge fade.",
    component: AttachmentGroupDemo,
  },
  {
    id: "attachment-trigger",
    title: "Trigger",
    description: "A full-card link trigger while the actions stay clickable.",
    component: AttachmentTriggerDemo,
  },
  {
    id: "attachment-error",
    title: "Error",
    description:
      "The error state uses a destructive treatment and keeps the reason.",
    component: AttachmentErrorDemo,
  },
];
