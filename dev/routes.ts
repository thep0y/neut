import { lazy, type Component } from "solid-js";

export interface DevRoute {
  path: string;
  title: string;
  component: Component;
  /** 为 true 时只注册路由，不在侧边栏显示 */
  hideInSidebar?: boolean;
}

const DatePickerPage = lazy(() => import("./pages/date-picker-page"));
const DialogPage = lazy(() => import("./pages/dialog-page"));
const CalendarPage = lazy(() => import("./pages/calendar-page"));
const ComboboxPage = lazy(() => import("./pages/combobox-page"));
const PopoverPage = lazy(() => import("./pages/popover-page"));
const RadioGroupPage = lazy(() => import("./pages/radio-group-page"));
const TogglePage = lazy(() => import("./pages/toggle-page"));
const ToggleGroupPage = lazy(() => import("./pages/toggle-group-page"));
const EmptyPage = lazy(() => import("./pages/empty-page"));
const TooltipPage = lazy(() => import("./pages/tooltip-page"));
const ToastPage = lazy(() => import("./pages/toast-page"));

export const routes: DevRoute[] = [
  {
    path: "/",
    title: "Date Picker",
    component: DatePickerPage,
    hideInSidebar: true,
  },
  { path: "/dialog", title: "Dialog", component: DialogPage },
  { path: "/date-picker", title: "Date Picker", component: DatePickerPage },
  { path: "/calendar", title: "Calendar", component: CalendarPage },
  { path: "/combobox", title: "Combobox", component: ComboboxPage },
  { path: "/popover", title: "Popover", component: PopoverPage },
  { path: "/radio-group", title: "Radio Group", component: RadioGroupPage },
  { path: "/tooltip", title: "Tooltip", component: TooltipPage },
  { path: "/toggle", title: "Toggle", component: TogglePage },
  { path: "/toggle-group", title: "Toggle Group", component: ToggleGroupPage },
  { path: "/empty", title: "Empty", component: EmptyPage },
  { path: "/toast", title: "Toast", component: ToastPage },
];

export const sidebarRoutes = routes
  .filter((route) => !route.hideInSidebar)
  .sort((a, b) => a.title.localeCompare(b.title));
