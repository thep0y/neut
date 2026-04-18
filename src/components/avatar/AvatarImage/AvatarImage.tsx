import { Show, splitProps } from "solid-js";
import { clsx } from "~/lib/utils";
import type { AvatarImageProps } from "./AvatarImage.types";
import { useAvatarContext } from "../Avatar/Avatar.context";

export const AvatarImage = (props: AvatarImageProps) => {
  const { imageLoadFailed, setImageLoadFailed } = useAvatarContext();

  const [local, others] = splitProps(props, ["alt", "class", "classList"]);

  const handleError = () => {
    setImageLoadFailed(true);
  };

  return (
    <Show when={!imageLoadFailed()}>
      <img
        data-slot="avatar-image"
        alt={local.alt ?? "Avatar Image"}
        onError={handleError}
        class={clsx(
          "aspect-square size-full rounded-full object-cover",
          local.class,
        )}
        {...others}
      />
    </Show>
  );
};
