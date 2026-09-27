import {
  BookOpenCheck,
  Check,
  FileText,
  GitBranch,
  RotateCcw,
  Search,
} from "lucide-solid";
import { Marker, MarkerContent, MarkerIcon, Spinner } from "~/index";
import type { Section } from "./shared";

function MarkerVariants() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Marker>
        <MarkerContent>A default marker for inline notes.</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>A separator marker</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>A border marker for row boundaries.</MarkerContent>
      </Marker>
    </div>
  );
}

function MarkerStatus() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Compacting conversation</MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Running tests</MarkerContent>
      </Marker>
    </div>
  );
}

function MarkerShimmer() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Marker>
        <MarkerContent class="shimmer">Thinking...</MarkerContent>
      </Marker>
      <Marker>
        <MarkerContent class="shimmer">Reading 4 files</MarkerContent>
      </Marker>
    </div>
  );
}

function MarkerSeparator() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Worked for 42s</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Conversation compacted</MarkerContent>
      </Marker>
    </div>
  );
}

function MarkerBorder() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Marker variant="border">
        <MarkerContent>Switched to release-candidate</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Reviewed 8 related files</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Opened implementation notes</MarkerContent>
      </Marker>
    </div>
  );
}

function MarkerWithIcon() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Marker>
        <MarkerIcon>
          <GitBranch />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <Search />
        </MarkerIcon>
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <BookOpenCheck />
        </MarkerIcon>
        <MarkerContent>Syncing completed</MarkerContent>
      </Marker>
    </div>
  );
}

function MarkerLinksAndButtons() {
  return (
    <div class="flex w-full max-w-md flex-col gap-8">
      <Marker component="a" href="#links-and-buttons">
        <MarkerContent>View the pull request</MarkerContent>
      </Marker>
      <Marker component="button" type="button">
        <MarkerIcon>
          <RotateCcw />
        </MarkerIcon>
        <MarkerContent>Revert this change</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <Check />
        </MarkerIcon>
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <FileText />
        </MarkerIcon>
        <MarkerContent>Opened implementation notes</MarkerContent>
      </Marker>
    </div>
  );
}

export const markerSections: Section[] = [
  {
    id: "marker-variants",
    title: "Variants",
    description: "Inline, labeled separator and bordered row variants.",
    component: MarkerVariants,
  },
  {
    id: "marker-status",
    title: "Status",
    description: "Use role=status with a Spinner for streaming markers.",
    component: MarkerStatus,
  },
  {
    id: "marker-shimmer",
    title: "Shimmer",
    description: "Add the shimmer utility for animated streaming text.",
    component: MarkerShimmer,
  },
  {
    id: "marker-separator",
    title: "Separator",
    description: "Labeled dividers for dates or section breaks.",
    component: MarkerSeparator,
  },
  {
    id: "marker-border",
    title: "Border",
    description: "Status rows that separate the next row.",
    component: MarkerBorder,
  },
  {
    id: "marker-with-icon",
    title: "With Icon",
    description: "Render a decorative icon next to the content.",
    component: MarkerWithIcon,
  },
  {
    id: "marker-links",
    title: "Links and Buttons",
    description: "Render a marker as a link or button.",
    component: MarkerLinksAndButtons,
  },
];
