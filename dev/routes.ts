import { lazy, type Component } from "solid-js";

export interface DevRoute {
  path: string;
  title: string;
  component: Component;
  /** 为 true 时只注册路由，不在侧边栏显示 */
  hideInSidebar?: boolean;
}

const AccordionPage = lazy(() => import("./pages/accordion-page"));
const AlertPage = lazy(() => import("./pages/alert-page"));
const AspectRatioPage = lazy(() => import("./pages/aspect-ratio-page"));
const AvatarPage = lazy(() => import("./pages/avatar-page"));
const BadgePage = lazy(() => import("./pages/badge-page"));
const BreadcrumbPage = lazy(() => import("./pages/breadcrumb-page"));
const ButtonGroupPage = lazy(() => import("./pages/button-group-page"));
const CardPage = lazy(() => import("./pages/card-page"));
const CheckboxPage = lazy(() => import("./pages/checkbox-page"));
const CollapsiblePage = lazy(() => import("./pages/collapsible-page"));
const FieldPage = lazy(() => import("./pages/field-page"));
const InputPage = lazy(() => import("./pages/input-page"));
const InputGroupPage = lazy(() => import("./pages/input-group-page"));
const ItemPage = lazy(() => import("./pages/item-page"));
const KbdPage = lazy(() => import("./pages/kbd-page"));
const LabelPage = lazy(() => import("./pages/label-page"));
const PaginationPage = lazy(() => import("./pages/pagination-page"));
const ProgressPage = lazy(() => import("./pages/progress-page"));
const ScrollAreaPage = lazy(() => import("./pages/scroll-area-page"));
const SeparatorPage = lazy(() => import("./pages/separator-page"));
const SidebarPage = lazy(() => import("./pages/sidebar-page"));
const SkeletonPage = lazy(() => import("./pages/skeleton-page"));
const SpinnerPage = lazy(() => import("./pages/spinner-page"));
const TabsPage = lazy(() => import("./pages/tabs-page"));
const TextareaPage = lazy(() => import("./pages/textarea-page"));
const ButtonPage = lazy(() => import("./pages/button-page"));
const SliderPage = lazy(() => import("./pages/slider-page"));
const SwitchPage = lazy(() => import("./pages/switch-page"));
const DatePickerPage = lazy(() => import("./pages/date-picker-page"));
const DataTablePage = lazy(() => import("./pages/data-table-page"));
const DialogPage = lazy(() => import("./pages/dialog-page"));
const DrawerPage = lazy(() => import("./pages/drawer-page"));
const DropdownMenuPage = lazy(() => import("./pages/dropdown-menu-page"));
const AlertDialogPage = lazy(() => import("./pages/alert-dialog-page"));
const CalendarPage = lazy(() => import("./pages/calendar-page"));
const CarouselPage = lazy(() => import("./pages/carousel-page"));
const BubblePage = lazy(() => import("./pages/bubble-page"));
const MarkerPage = lazy(() => import("./pages/marker-page"));
const MessagePage = lazy(() => import("./pages/message-page"));
const MessageScrollerPage = lazy(() => import("./pages/message-scroller-page"));
const AttachmentPage = lazy(() => import("./pages/attachment-page"));
const ComboboxPage = lazy(() => import("./pages/combobox-page"));
const SelectPage = lazy(() => import("./pages/select-page"));
const ContextMenuPage = lazy(() => import("./pages/context-menu-page"));
const PopoverPage = lazy(() => import("./pages/popover-page"));
const NumberInputPage = lazy(() => import("./pages/number-input-page"));
const RadioGroupPage = lazy(() => import("./pages/radio-group-page"));
const ResizablePage = lazy(() => import("./pages/resizable-page"));
const SheetPage = lazy(() => import("./pages/sheet-page"));
const QuestionnairePage = lazy(() => import("./pages/questionnaire-page"));
const HoverCardPage = lazy(() => import("./pages/hover-card-page"));
const TogglePage = lazy(() => import("./pages/toggle-page"));
const ToggleGroupPage = lazy(() => import("./pages/toggle-group-page"));
const TimePickerPage = lazy(() => import("./pages/time-picker-page"));
const EmptyPage = lazy(() => import("./pages/empty-page"));
const TooltipPage = lazy(() => import("./pages/tooltip-page"));
const ToastPage = lazy(() => import("./pages/toast-page"));
const TablePage = lazy(() => import("./pages/table-page"));

export const routes: DevRoute[] = [
  {
    path: "/",
    title: "Date Picker",
    component: DatePickerPage,
    hideInSidebar: true,
  },
  { path: "/button", title: "Button", component: ButtonPage },
  { path: "/carousel", title: "Carousel", component: CarouselPage },
  { path: "/slider", title: "Slider", component: SliderPage },
  { path: "/switch", title: "Switch", component: SwitchPage },
  { path: "/dialog", title: "Dialog", component: DialogPage },
  { path: "/drawer", title: "Drawer", component: DrawerPage },
  {
    path: "/dropdown-menu",
    title: "Dropdown Menu",
    component: DropdownMenuPage,
  },
  { path: "/alert-dialog", title: "Alert Dialog", component: AlertDialogPage },
  { path: "/date-picker", title: "Date Picker", component: DatePickerPage },
  { path: "/data-table", title: "Data Table", component: DataTablePage },
  { path: "/calendar", title: "Calendar", component: CalendarPage },
  { path: "/bubble", title: "Bubble", component: BubblePage },
  { path: "/marker", title: "Marker", component: MarkerPage },
  { path: "/message", title: "Message", component: MessagePage },
  {
    path: "/message-scroller",
    title: "Message Scroller",
    component: MessageScrollerPage,
  },
  { path: "/attachment", title: "Attachment", component: AttachmentPage },
  { path: "/combobox", title: "Combobox", component: ComboboxPage },
  { path: "/select", title: "Select", component: SelectPage },
  { path: "/context-menu", title: "Context Menu", component: ContextMenuPage },
  { path: "/popover", title: "Popover", component: PopoverPage },
  { path: "/number-input", title: "Number Input", component: NumberInputPage },
  { path: "/radio-group", title: "Radio Group", component: RadioGroupPage },
  { path: "/resizable", title: "Resizable", component: ResizablePage },
  { path: "/sheet", title: "Sheet", component: SheetPage },
  { path: "/hover-card", title: "Hover Card", component: HoverCardPage },
  {
    path: "/questionnaire",
    title: "Questionnaire",
    component: QuestionnairePage,
  },
  { path: "/tooltip", title: "Tooltip", component: TooltipPage },
  { path: "/toggle", title: "Toggle", component: TogglePage },
  { path: "/toggle-group", title: "Toggle Group", component: ToggleGroupPage },
  { path: "/empty", title: "Empty", component: EmptyPage },
  { path: "/toast", title: "Toast", component: ToastPage },
  { path: "/table", title: "Table", component: TablePage },
  { path: "/time-picker", title: "Time Picker", component: TimePickerPage },
  { path: "/accordion", title: "Accordion", component: AccordionPage },
  { path: "/alert", title: "Alert", component: AlertPage },
  { path: "/aspect-ratio", title: "Aspect Ratio", component: AspectRatioPage },
  { path: "/avatar", title: "Avatar", component: AvatarPage },
  { path: "/badge", title: "Badge", component: BadgePage },
  { path: "/breadcrumb", title: "Breadcrumb", component: BreadcrumbPage },
  { path: "/button-group", title: "Button Group", component: ButtonGroupPage },
  { path: "/card", title: "Card", component: CardPage },
  { path: "/checkbox", title: "Checkbox", component: CheckboxPage },
  { path: "/collapsible", title: "Collapsible", component: CollapsiblePage },
  { path: "/field", title: "Field", component: FieldPage },
  { path: "/input", title: "Input", component: InputPage },
  { path: "/input-group", title: "Input Group", component: InputGroupPage },
  { path: "/item", title: "Item", component: ItemPage },
  { path: "/kbd", title: "Kbd", component: KbdPage },
  { path: "/label", title: "Label", component: LabelPage },
  { path: "/pagination", title: "Pagination", component: PaginationPage },
  { path: "/progress", title: "Progress", component: ProgressPage },
  { path: "/scroll-area", title: "Scroll Area", component: ScrollAreaPage },
  { path: "/separator", title: "Separator", component: SeparatorPage },
  { path: "/sidebar", title: "Sidebar", component: SidebarPage },
  { path: "/skeleton", title: "Skeleton", component: SkeletonPage },
  { path: "/spinner", title: "Spinner", component: SpinnerPage },
  { path: "/tabs", title: "Tabs", component: TabsPage },
  { path: "/textarea", title: "Textarea", component: TextareaPage },
];

export const sidebarRoutes = routes
  .filter((route) => !route.hideInSidebar)
  .sort((a, b) => a.title.localeCompare(b.title));
