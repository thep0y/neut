import type { ValidComponent } from "solid-js";
import type { ButtonProps } from "~/components/button";
import type { DialogProps, DialogSurfaceProps } from "~/components/dialog";
import type { BaseProps, PolymorphicProps } from "~/types";

export type SheetSide = "top" | "right" | "bottom" | "left";

/** Sheet 根:复用 Dialog 的 open/defaultOpen/onOpenChange/lockScroll */
export type SheetProps = DialogProps;

export type SheetTriggerProps<T extends ValidComponent> = PolymorphicProps<T>;

export type SheetCloseProps = ButtonProps<"button">;

export type SheetContentProps = DialogSurfaceProps & {
  /** 贴靠的屏幕边缘,默认 "right" */
  side?: SheetSide;
  /** 是否显示右上角关闭按钮,默认 true */
  showCloseButton?: boolean;
};

export type SheetHeaderProps = PolymorphicProps<"div", BaseProps, false>;
export type SheetFooterProps = PolymorphicProps<"div", BaseProps, false>;
export type SheetTitleProps = PolymorphicProps<"h2", BaseProps, false>;
export type SheetDescriptionProps = PolymorphicProps<"p", BaseProps, false>;
