import { mergeProps, splitProps } from "solid-js";
import { Button } from "~/components/button";
import { clsx } from "~/utils";
import type { MouseEventHandler } from "~/types";
import { useQuestionnaireRootContext } from "../questionnaire.context";
import type { QuestionnaireNavigationProps } from "../questionnaire.types";

type NavigationKind = "previous" | "skip" | "next" | "submit";

interface NavButtonProps extends QuestionnaireNavigationProps {
  kind: NavigationKind;
}

function defaultLabel(kind: NavigationKind) {
  switch (kind) {
    case "previous":
      return "Previous";
    case "skip":
      return "Skip";
    case "next":
      return "Next";
    case "submit":
      return "Submit";
  }
}

function NavButton(props: NavButtonProps) {
  const root = useQuestionnaireRootContext("QuestionnaireNavigation");
  const merged = mergeProps(
    {
      variant: "outline" as const,
      size: "md" as const,
      disabled: false,
    },
    props,
  );
  const [local, rest] = splitProps(merged, [
    "kind",
    "class",
    "classList",
    "variant",
    "size",
    "disabled",
    "onClick",
    "children",
    "type",
  ]);

  const visible = () => {
    const state = root.state();
    switch (local.kind) {
      case "previous":
        return state.total > 1 && !state.first;
      case "next":
        return state.total > 1 && !state.last;
      case "skip":
        return root.activeItemRequired() === false;
      case "submit":
        return state.total > 0 && state.last;
    }
  };

  const shortcut = () =>
    visible() &&
    !local.disabled &&
    (local.kind === "next" || local.kind === "submit")
      ? "Enter"
      : null;

  const handleClick: MouseEventHandler<"button"> = (event) => {
    const userOnClick = local.onClick as
      | ((e: typeof event) => void)
      | [(data: unknown, e: typeof event) => void, unknown]
      | undefined;
    if (Array.isArray(userOnClick)) userOnClick[0](userOnClick[1], event);
    else userOnClick?.(event);
    if (event?.defaultPrevented) return;
    if (local.kind === "previous") root.goPrevious();
    else if (local.kind === "skip") root.skipCurrent();
    else if (local.kind === "next") root.goNext();
  };

  return (
    <Button
      {...rest}
      type={local.type ?? (local.kind === "submit" ? "submit" : "button")}
      variant={local.variant}
      size={local.size}
      disabled={local.disabled}
      onClick={handleClick}
      data-slot={`questionnaire-${local.kind}`}
      data-visible={visible() ? "" : undefined}
      data-hidden={visible() ? undefined : ""}
      data-status={root.activeItemStatus() ?? undefined}
      data-shortcut={shortcut() ?? undefined}
      data-disabled={local.disabled ? "" : undefined}
      aria-hidden={!visible() ? true : undefined}
      aria-keyshortcuts={shortcut() ?? undefined}
      hidden={!visible()}
      inert={!visible()}
      tabIndex={visible() ? 0 : -1}
      class={clsx(
        local.kind === "previous" && "justify-self-start",
        local.kind !== "previous" && "justify-self-end",
        local.class,
      )}
      classList={local.classList}
    >
      {local.children ?? defaultLabel(local.kind)}
    </Button>
  );
}

export const QuestionnairePrevious = (props: QuestionnaireNavigationProps) => (
  <NavButton {...props} kind="previous" />
);
export const QuestionnaireSkip = (props: QuestionnaireNavigationProps) => (
  <NavButton {...props} kind="skip" />
);
export const QuestionnaireNext = (props: QuestionnaireNavigationProps) => (
  <NavButton {...props} kind="next" />
);
export const QuestionnaireSubmit = (props: QuestionnaireNavigationProps) => (
  <NavButton {...props} kind="submit" />
);
