import { Separator, type SeparatorProps } from "~/components/separator";
import { clsx } from "~/utils";

export function SelectSeparator(props: SeparatorProps) {
  return <Separator {...props} class={clsx("my-1", props.class)} />;
}
