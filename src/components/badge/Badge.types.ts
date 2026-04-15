import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "./Badge.styles";
import type { BaseProps, PolymorphicProps } from "~/types";

type BaseBadgeProps = VariantProps<typeof badgeVariants> & BaseProps;

export type BadgeProps = PolymorphicProps<"span", BaseBadgeProps, false>;
