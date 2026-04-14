import type { ComponentProps, ValidComponent } from "solid-js";

export type EmptyObject = Record<never, never>;

export type MouseEventHandler<T extends keyof HTMLElementTagNameMap> = (
  e: MouseEvent & {
    currentTarget: HTMLElementTagNameMap[T];
    target: Element;
  },
) => void;

export type TouchEventHandler<T extends keyof HTMLElementTagNameMap> = (
  e: TouchEvent & {
    currentTarget: HTMLElementTagNameMap[T];
    target: Element;
  },
) => void;

type AsProp<
  T extends ValidComponent,
  Enable extends boolean,
> = Enable extends true ? { as?: T } : EmptyObject;

export type PolymorphicProps<
  T extends ValidComponent,
  P = EmptyObject,
  EnableAs extends boolean = true,
> = P & Omit<ComponentProps<T>, keyof P> & AsProp<T, EnableAs>;
