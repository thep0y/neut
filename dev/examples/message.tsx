import { Copy, Download, FileText, RefreshCcw } from "lucide-solid";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Bubble,
  BubbleContent,
  Button,
  Marker,
  MarkerContent,
  MarkerIcon,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
  MessageGroup,
  Spinner,
} from "~/index";
import type { Section } from "./shared";

function AvatarFor(props: { fallback: string; src?: string }) {
  return (
    <Avatar>
      {props.src ? <AvatarImage src={props.src} alt={props.fallback} /> : null}
      <AvatarFallback>{props.fallback}</AvatarFallback>
    </Avatar>
  );
}

function MessageUsage() {
  return (
    <div class="flex w-full max-w-md flex-col gap-4">
      <MessageGroup>
        <Message align="end">
          <MessageAvatar>
            <AvatarFor fallback="ME" />
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>Deploying to prod real quick.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <AvatarFor fallback="R" />
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="secondary">
              <BubbleContent>It's 4:55 PM. On a Friday.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar>
            <AvatarFor fallback="ME" />
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>It's a one-line change.</BubbleContent>
            </Bubble>
            <MessageFooter>Delivered</MessageFooter>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <AvatarFor fallback="R" />
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="secondary">
              <BubbleContent>It's always a one-line change 😭.</BubbleContent>
            </Bubble>
            <Bubble variant="secondary">
              <BubbleContent>Alright, let me take a look.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </div>
  );
}

function MessageAlignment() {
  return (
    <div class="flex w-full max-w-md flex-col gap-4">
      <MessageGroup>
        <Message>
          <MessageAvatar>
            <AvatarFor fallback="R" />
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>
                The build failed during dependency installation.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <AvatarFor fallback="R" />
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>Can you share the exact error?</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar>
            <AvatarFor fallback="ME" />
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>Here's the error from the logs</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </div>
  );
}

function MessageGrouped() {
  return (
    <div class="flex w-full max-w-md flex-col gap-4">
      <MessageGroup>
        <Message>
          <MessageAvatar />
          <MessageContent>
            <MessageHeader>CN</MessageHeader>
            <Bubble variant="secondary">
              <BubbleContent>I checked the registry addresses.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <AvatarFor fallback="CN" src="https://github.com/shadcn.png" />
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="secondary">
              <BubbleContent>
                The component and example JSON now live under the UI registry.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </div>
  );
}

function MessageHeaderFooter() {
  return (
    <div class="flex w-full max-w-md flex-col gap-4">
      <Message>
        <MessageAvatar>
          <AvatarFor fallback="O" />
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Olivia</MessageHeader>
          <Bubble variant="secondary">
            <BubbleContent>I already checked the logs.</BubbleContent>
          </Bubble>
          <Bubble variant="secondary">
            <BubbleContent>
              Send the report to the team. Ping @shadcn if you need help.
            </BubbleContent>
          </Bubble>
          <MessageFooter>Read · Yesterday</MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageActions() {
  return (
    <div class="flex w-full max-w-md flex-col gap-4">
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>
              The install failure is coming from the workspace package.
            </BubbleContent>
          </Bubble>
          <MessageFooter class="gap-1">
            <Button
              variant="ghost"
              size="xs"
              aria-label="Copy"
              icon={<Copy />}
            />
            <Button
              variant="ghost"
              size="xs"
              aria-label="Retry"
              icon={<RefreshCcw />}
            />
          </MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>Okay drop me a link. Taking a look...</BubbleContent>
          </Bubble>
          <MessageFooter>Failed to send</MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageAttachment() {
  return (
    <div class="flex w-full max-w-md flex-col gap-4">
      <Message>
        <MessageAvatar>
          <AvatarFor fallback="ME" />
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>
              Here's the image. Can you add it to the PDF? Use it for the cover
              page.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <AvatarFor fallback="R" />
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="secondary">
            <BubbleContent>
              Done. Here's the PDF with the image added as the cover page.
            </BubbleContent>
          </Bubble>
          <Attachment>
            <AttachmentMedia>
              <FileText />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
              <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Download sales-dashboard.pdf">
                <Download />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </MessageContent>
      </Message>
    </div>
  );
}

function MessageStatus() {
  return (
    <div class="flex w-full max-w-md flex-col gap-4">
      <Message>
        <MessageContent>
          <Marker role="status">
            <MarkerIcon>
              <Spinner />
            </MarkerIcon>
            <MarkerContent>Checking the logs...</MarkerContent>
          </Marker>
        </MessageContent>
      </Message>
    </div>
  );
}

export const messageSections: Section[] = [
  {
    id: "message-usage",
    title: "Usage",
    description: "Avatar, alignment, header and footer around Bubble.",
    component: MessageUsage,
  },
  {
    id: "message-alignment",
    title: "Alignment",
    description: "Align messages to the start or end of the conversation.",
    component: MessageAlignment,
  },
  {
    id: "message-group",
    title: "Group",
    description: "Stack consecutive messages from the same sender.",
    component: MessageGrouped,
  },
  {
    id: "message-header-footer",
    title: "Header and Footer",
    description: "Sender name and metadata such as delivery status.",
    component: MessageHeaderFooter,
  },
  {
    id: "message-actions",
    title: "Actions",
    description: "Message-level actions in MessageFooter.",
    component: MessageActions,
  },
  {
    id: "message-attachment",
    title: "Attachment",
    description: "Render attachments inside a message.",
    component: MessageAttachment,
  },
  {
    id: "message-status",
    title: "Status",
    description: "Use a Marker with role=status for in-progress messages.",
    component: MessageStatus,
  },
];
