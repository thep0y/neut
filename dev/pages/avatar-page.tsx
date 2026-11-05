import { ComponentPage } from "../examples/shared";
import { avatarSections } from "../examples/avatar";

export default function AvatarPage() {
  return (
    <ComponentPage
      id="avatar"
      title="Avatar"
      description="An image element with a fallback for representing the user."
      sections={avatarSections}
    />
  );
}
