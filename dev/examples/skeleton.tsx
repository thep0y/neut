import { Skeleton } from "~/index";
import type { Section } from "./shared";

function SkeletonBasic() {
  return (
    <div class="flex w-full max-w-sm items-center gap-4">
      <Skeleton class="size-10 rounded-full" />
      <div class="flex flex-1 flex-col gap-2">
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div class="flex w-full max-w-sm flex-col gap-3 rounded-lg border p-4">
      <Skeleton class="h-32 w-full rounded-md" />
      <Skeleton class="h-4 w-2/3" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-5/6" />
    </div>
  );
}

export const skeletonSections: Section[] = [
  {
    id: "skeleton-basic",
    title: "Basic",
    description: "Placeholder shapes for loading content.",
    component: SkeletonBasic,
  },
  {
    id: "skeleton-card",
    title: "Card",
    description: "A skeleton for a media card.",
    component: SkeletonCard,
  },
];
