import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "~/index";
import type { Section } from "./shared";

function AvatarBasic() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}

function AvatarSizes() {
  return (
    <div class="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  );
}

function AvatarGrouped() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MK</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  );
}

export const avatarSections: Section[] = [
  {
    id: "avatar-basic",
    title: "Basic",
    description: "An image with a fallback for when it fails to load.",
    component: AvatarBasic,
  },
  {
    id: "avatar-sizes",
    title: "Sizes",
    description: "Small, medium and large avatars.",
    component: AvatarSizes,
  },
  {
    id: "avatar-group",
    title: "Group",
    description: "Stack avatars and summarize the remaining count.",
    component: AvatarGrouped,
  },
];
