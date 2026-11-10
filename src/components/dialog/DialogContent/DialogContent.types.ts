import type { BaseProps, PolymorphicProps } from "~/types";

export type DialogContentProps = PolymorphicProps<
  "div",
  BaseProps & {
    showCloseButton?: boolean;
    /** 点击遮罩是否关闭，默认 true；DialogContent 会透传给 DialogSurface */
    dismissOnOverlayClick?: boolean;
    /** 遮罩的额外 class */
    overlayClass?: string;
  },
  false
>;
