/**
 * 对齐 shadcn base 版 `dropdown-menu.tsx` 的类名。
 * 与 context-menu 一样，把 `focus:` 系列变体换成 `data-highlighted:`
 * ——焦点始终在 popup 上，高亮项通过 `aria-activedescendant` + `data-highlighted` 表达。
 */

export const dropdownMenuItemClass =
  "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive/10 data-[variant=destructive]:data-highlighted:text-destructive dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-highlighted:bg-accent data-highlighted:text-accent-foreground data-highlighted:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive";

export const dropdownMenuSubTriggerClass =
  "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

export const dropdownMenuCheckableItemClass =
  "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-highlighted:bg-accent data-highlighted:text-accent-foreground";

export const dropdownMenuLabelClass =
  "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7";

export const dropdownMenuShortcutClass =
  "ml-auto text-xs tracking-widest text-muted-foreground group-data-[highlighted]/dropdown-menu-item:text-accent-foreground";

export const dropdownMenuIndicatorClass =
  "pointer-events-none absolute right-2 flex items-center justify-center";
