import { cva } from "class-variance-authority";

/**
 * Toast 的表面样式分三种（`ToastVariant`）：
 *
 * - `popover`（默认）：shadcn 默认样式。popover 底 + `popover-foreground` 文字，
 *   只有图标使用语义色；
 * - `semantic`：把 10% 状态色混进 `--popover` 做浅底，标题/描述跟随语义色；
 * - `colored`：实色状态底 + 对应的 `*-foreground` 文字（Sonner richColors 那种）。
 *
 * 三种都共用同一套"浮层表面"骨架：`rounded-lg` + `shadow-md` + 中性灰
 * `ring-1 ring-foreground/10`，与 Popover / 菜单一致；描边不随状态变色，
 * 需要彩色边框时由使用方通过 `class` 覆盖。
 *
 * 两个踩过的坑：
 * - **底色必须不透明**：`bg-success/10` 会让整个表面只有 10% 不透明度，
 *   折叠堆叠时后面的 toast 会透出来；semantic 用 `color-mix` 混成实色浅底。
 * - **必须用 oklab 而不是 oklch**：`--popover` 是消色（chroma = 0、hue = 0），
 *   oklch 的极坐标插值会把状态色的 hue 一起拉向 0，蓝/绿都会混成偏红；
 *   oklab 是直角坐标，只按 a/b 轴混合，能保住状态色色相。
 *
 * 所有类名都必须是**字面量**（不能拼字符串），否则 Tailwind 扫不到、
 * 不会生成对应工具类。
 */
const toastBase =
  "pointer-events-auto relative flex w-full items-center gap-2 rounded-lg bg-popover px-3 py-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-200";

const semanticSuccess =
  "bg-[color-mix(in_oklab,var(--popover),var(--success)_10%)] text-success [&_[data-slot=toast-description]]:text-success/80";
const semanticInfo =
  "bg-[color-mix(in_oklab,var(--popover),var(--info)_10%)] text-info [&_[data-slot=toast-description]]:text-info/80";
const semanticWarning =
  "bg-[color-mix(in_oklab,var(--popover),var(--warning)_10%)] text-warning [&_[data-slot=toast-description]]:text-warning/80";
const semanticDestructive =
  "bg-[color-mix(in_oklab,var(--popover),var(--destructive)_10%)] text-destructive [&_[data-slot=toast-description]]:text-destructive/80";

const coloredSuccess =
  "bg-success text-success-foreground [&_[data-slot=toast-icon]]:text-success-foreground [&_[data-slot=toast-description]]:text-success-foreground/80 [&_[data-slot=toast-close]]:text-success-foreground/80 [&_[data-slot=toast-close]]:hover:text-success-foreground";
const coloredInfo =
  "bg-info text-info-foreground [&_[data-slot=toast-icon]]:text-info-foreground [&_[data-slot=toast-description]]:text-info-foreground/80 [&_[data-slot=toast-close]]:text-info-foreground/80 [&_[data-slot=toast-close]]:hover:text-info-foreground";
const coloredWarning =
  "bg-warning text-warning-foreground [&_[data-slot=toast-icon]]:text-warning-foreground [&_[data-slot=toast-description]]:text-warning-foreground/80 [&_[data-slot=toast-close]]:text-warning-foreground/80 [&_[data-slot=toast-close]]:hover:text-warning-foreground";
const coloredDestructive =
  "bg-destructive text-destructive-foreground [&_[data-slot=toast-icon]]:text-destructive-foreground [&_[data-slot=toast-description]]:text-destructive-foreground/80 [&_[data-slot=toast-close]]:text-destructive-foreground/80 [&_[data-slot=toast-close]]:hover:text-destructive-foreground";
const coloredNeutral =
  "bg-primary text-primary-foreground [&_[data-slot=toast-icon]]:text-primary-foreground [&_[data-slot=toast-description]]:text-primary-foreground/80 [&_[data-slot=toast-close]]:text-primary-foreground/80 [&_[data-slot=toast-close]]:hover:text-primary-foreground";

export const toastVariants = cva(toastBase, {
  // 变体本身不产出类名：着色只在 `variant` 与 `type` 同时命中时由
  // compoundVariants 提供。这里仍声明完整取值，既让类型收窄，也让调用方
  // 传错值时在编译期报错。
  variants: {
    variant: {
      popover: "",
      semantic: "",
      colored: "",
    },
    type: {
      default: "",
      success: "",
      info: "",
      warning: "",
      error: "",
      loading: "",
    },
  },
  compoundVariants: [
    { variant: "semantic", type: "success", class: semanticSuccess },
    { variant: "semantic", type: "info", class: semanticInfo },
    { variant: "semantic", type: "warning", class: semanticWarning },
    { variant: "semantic", type: "error", class: semanticDestructive },
    { variant: "colored", type: "default", class: coloredNeutral },
    { variant: "colored", type: "loading", class: coloredNeutral },
    { variant: "colored", type: "success", class: coloredSuccess },
    { variant: "colored", type: "info", class: coloredInfo },
    { variant: "colored", type: "warning", class: coloredWarning },
    { variant: "colored", type: "error", class: coloredDestructive },
  ],
  defaultVariants: {
    variant: "popover",
    type: "default",
  },
});

/**
 * 图标槽：尺寸与文字基线对齐（16px，和 Button / Alert / 菜单项一致），
 * 未指定尺寸的内置 lucide 图标会被压到 16px，避免图标比正文大一圈。
 *
 * `popover` / `semantic` 由这里给图标上语义色；`colored` 的实色底上
 * 图标要跟随 foreground，由 `toastVariants` 的 compound 覆盖（选择器
 * 优先级更高）。
 */
export const toastIconVariants = cva(
  "flex size-4 shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      type: {
        default: "text-muted-foreground",
        success: "text-success",
        info: "text-info",
        warning: "text-warning",
        error: "text-destructive",
        loading: "text-muted-foreground",
      },
    },
    defaultVariants: {
      type: "default",
    },
  },
);
