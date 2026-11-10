# 组件目录

Neut 目前导出 **60 个组件**。所有组件都可以从 `@neut/ui` 引入，也可以按目录单独引入：

```ts
import { Button, Dialog, DialogContent } from "@neut/ui";
import { Button } from "@neut/ui/components/button";
```

通用约定：

- 组件的公开/主要渲染元素按约定带 `data-slot="<component>-<part>"`，可用于样式覆盖与测试定位；
  少数内部辅助元素（如 `SelectItem`、部分 Toast 子元素）没有 `data-slot`，以源码为准。
- 受控/非受控统一为 `value` / `defaultValue`（或 `open` / `defaultOpen`）。
- 支持多态的组件用 `component` 替换默认标签（`PolymorphicProps`）。
- 下表只列**关键** props；完整类型见组件目录下的 `*.types.ts` 或 [架构说明](./architecture.md)。

## 布局与结构

| 组件 | 子部件 / 导出 | 关键 props 与行为 |
| :--- | :--- | :--- |
| **Accordion** | `Accordion`、`AccordionItem`、`AccordionTrigger`、`AccordionContent` | `value`/`defaultValue` 为数组；`multiple`、`disabled`、`orientation`、`loopFocus`、`hiddenUntilFound`、`keepMounted`；`data-slot`：`accordion`、`accordion-item`、`accordion-content`、`accordion-trigger-icon` |
| **AspectRatio** | `AspectRatio` | `ratio`（必填）；`data-slot="aspect-ratio"` |
| **Card** | `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardAction`、`CardContent`、`CardFooter` | 根组件 `size="md" \| "sm"`；各部件均为多态容器 |
| **Carousel** | `Carousel`、`CarouselContent`、`CarouselItem`、`CarouselPrevious`、`CarouselNext`、`CarouselDots` | `loop`、`orientation`、`autoPlay`、`autoPlayInterval`；触摸/触控笔可拖拽切页（鼠标不接管）；`data-slot`：`carousel`、`carousel-content`、`carousel-item`、`carousel-previous`、`carousel-next` |
| **Collapsible** | `Collapsible`、`CollapsibleTrigger`、`CollapsibleContent` | `open`/`defaultOpen`/`onOpenChange`；`data-slot`：`collapsible`、`collapsible-trigger`、`collapsible-content` |
| **Resizable** | `ResizablePanelGroup`、`ResizablePanel`、`ResizableHandle` | `orientation`、`defaultLayout`、`onLayoutChange`、`autoSaveId`、`storage`、`keyboardResizeBy`；panel：`id`、`defaultSize`、`minSize`、`maxSize`、`collapsible`、`collapsedSize`、`panelRef`。详见 [Resizable](./components/resizable.md) |
| **ScrollArea** | `ScrollArea`、`ScrollBar` | `orientation`、`aria-label`；`data-slot`：`scroll-area`、`scroll-area-viewport`、`scroll-area-scrollbar`、`scroll-area-thumb` |
| **Separator** | `Separator` | `orientation="horizontal" \| "vertical"`；`data-slot="separator"` |
| **Sidebar** | `SidebarProvider`、`Sidebar`、`SidebarTrigger`、`SidebarRail`、`SidebarInset`、`SidebarInput`、`SidebarHeader`、`SidebarFooter`、`SidebarSeparator`、`SidebarContent`、`SidebarGroup`、`SidebarGroupLabel`、`SidebarGroupAction`、`SidebarGroupContent`、`SidebarMenu`、`SidebarMenuItem`、`SidebarMenuButton`、`SidebarMenuBadge`、`SidebarMenuSkeleton`、`SidebarMenuSub`、`SidebarMenuSubItem`、`SidebarMenuSubButton` | Provider 支持 `open`/`defaultOpen`/`onOpenChange`；Sidebar：`side`、`variant="sidebar" \| "floating" \| "inset"`、`collapsible="offcanvas" \| "icon" \| "none"`；MenuButton：`isActive`、`tooltip`；移动端自动用 `Sheet` 承载导航（`openMobile`） |
| **Table** | `Table`、`TableHeader`、`TableBody`、`TableFooter`、`TableRow`、`TableHead`、`TableCell`、`TableCaption` | 原生 `table` 语义；`data-slot`：`table-container`、`table`、`table-header`、`table-body`、`table-footer`、`table-row`、`table-head`、`table-cell`、`table-caption` |
| **Tabs** | `Tabs`、`TabsList`、`TabsTrigger`、`TabsContent` | `value`/`defaultValue`、`onValueChange`、`orientation`、`loop`；`TabsList` 的 `activateOnFocus` 默认 false（方向键只移动高亮，不激活）。详见 [Tabs DESIGN](../src/components/tabs/DESIGN.md) |

## 表单与输入

| 组件 | 子部件 / 导出 | 关键 props 与行为 |
| :--- | :--- | :--- |
| **Button** | `Button` | `variant="primary" \| "outline" \| "secondary" \| "ghost" \| "destructive" \| "link"`；`size="md" \| "xs" \| "sm" \| "lg"`；`icon`、`iconPosition`；默认 `"button"`，可 `component="a"` |
| **ButtonGroup** | `ButtonGroup`、`ButtonGroupText`、`ButtonGroupSeparator` | 根为 `fieldset`，用 `data-slot="button-group"` 让子按钮拼接圆角 |
| **Calendar** | `Calendar`、`calendarClassNames` | `mode="single" \| "multiple" \| "range"`；`selected`/`defaultSelected`、`month`、`numberOfMonths`、`showOutsideDays`、`showWeekNumber`、`weekStartsOn`、`captionLayout`、`locale`、`min`/`max`、`disabled`、`classNames` |
| **Checkbox** | `Checkbox`、`CheckboxIndicator` | `checked`/`defaultChecked`、`onChange(checked: boolean)`、`name`、`disabled`；原生 input 在内部，点击 Label 可勾选 |
| **Combobox** | `Combobox`、`ComboboxInput`、`ComboboxTrigger`、`ComboboxValue`、`ComboboxClear`、`ComboboxContent`、`ComboboxList`、`ComboboxItem`、`ComboboxEmpty`、`ComboboxGroup`、`ComboboxLabel`、`ComboboxCollection`、`ComboboxSeparator`、`ComboboxChips`、`ComboboxChip`、`ComboboxChipsInput`、`useComboboxAnchor` | `items`、`value`/`defaultValue`、`multiple`、`open`/`defaultOpen`、`onOpenChange(open, details)`、`onValueChange(value, details)`、`itemToStringValue`、`lockScroll`、`autoHighlight`；窄屏最大宽度 `100vw - 1rem`、最大高度 `min(24rem, 100dvh - 1rem)`。详见 [Combobox](./components/combobox.md) |
| **DatePicker** | `DatePicker` | `value`/`defaultValue`、`onValueChange`、`min`/`max`、`locale`、`formatDate`、`showOutsideDays`、`weekStartsOn`、`captionLayout`、`side`/`align`、`contentClass`、`calendarClass` |
| **Field** | `FieldSet`、`FieldLegend`、`FieldGroup`、`Field`、`FieldContent`、`FieldLabel`、`FieldTitle`、`FieldError`、`FieldDescription`、`FieldSeparator` | 根 `Field` 支持 `orientation="vertical" \| "horizontal" \| "responsive"`；`FieldError` 接收 `errors?: Array<{ message?: string } \| undefined>` |
| **Input** | `Input` | 字符串与数字两种类型经重载区分：文本 `onChange(value: string)`，`type="number"` 时 `onChange(value: number)`；其余原生 input 属性透传 |
| **InputGroup** | `InputGroup`、`InputGroupAddon`、`InputGroupButton`、`InputGroupText`、`InputGroupInput`、`InputGroupTextarea` | `InputGroupAddon` 的 `align="inline-start" \| "inline-end" \| "block-start" \| "block-end"`；`data-slot="input-group-control"` 用于内嵌控件 |
| **Label** | `Label` | 原生 `label` 语义；点击会激活关联控件（修复了双重激活） |
| **NumberInput** | `NumberInput` | `value`/`defaultValue`（`null` 表示空）、`onValueChange(value, details)`、`min`/`max`、`step`、`largeStep`、`parse`/`format`、`readOnly`、`required`、`name`。详见 [NumberInput](./components/number-input.md) |
| **Questionnaire** | `Questionnaire`、`QuestionnaireProgress`、`QuestionnaireItem`、`QuestionnaireTitle`、`QuestionnaireDescription`、`QuestionnaireChoices`、`QuestionnaireChoice`、`QuestionnaireInput`、`QuestionnaireError`、`QuestionnaireActions`、`QuestionnairePrevious`、`QuestionnaireSkip`、`QuestionnaireNext`、`QuestionnaireSubmit` | `item`/`defaultItem`、`items`、`shortcuts="letters" \| "numbers"`、`noValidate`；题目：`name`、`required`、`multiple`、`invalid`、`onStatusChange`。详见 [Questionnaire](./components/questionnaire.md) |
| **RadioGroup** | `RadioGroup`、`RadioGroupItem` | `value`/`defaultValue`、`onValueChange(value: string)`、`name`、`disabled`；item 的 `value` 必填 |
| **Select** | `Select`、`SelectTrigger`、`SelectValue`、`SelectContent`、`SelectItem`、`SelectGroup`、`SelectLabel`、`SelectSeparator` | `value`/`defaultValue`、`onValueChange`、`open`/`defaultOpen`、`onOpenChange`、`disabled`、`lockScroll`；`SelectContent` 用 `side`/`align`（默认 `bottom`/`start`）与 `alignItemWithTrigger`；`placement` 已弃用；窄屏最大宽度 `100vw - 1rem`，选项区可滚动。详见 [Select](./components/select.md) |
| **Slider** | `Slider`、`SliderControl`、`SliderTrack`、`SliderIndicator`、`SliderThumb` | `value`/`defaultValue`：单值为 `number`、范围为 `number[]`；`min`、`max`、`step`、`orientation`、`disabled`、`onValueChange` |
| **Switch** | `Switch` | `checked`/`defaultChecked`、`onCheckedChange(checked: boolean)`（注意不是 `onChange`）、`size="sm" \| "md"`、`disabled`；支持 Space / Enter 切换 |
| **Textarea** | `Textarea` | 原生 textarea 属性；多态 |
| **TimePicker** | `TimePicker`、`TimePickerTrigger`、`TimePickerContent`、`TimePickerColumn`、`TimePickerOption`、`useTimePickerContext` | `value`/`defaultValue`、`onValueChange(value, details)`、`hourCycle`、`showSeconds`、`hourStep`/`minuteStep`/`secondStep`、`locale`、`formatTime`、`open`/`defaultOpen`、`onOpenChange`。详见 [TimePicker](./components/time-picker.md) |
| **Toggle** | `Toggle`、`toggleVariants` | `pressed`/`defaultPressed`、`onPressedChange`、`variant`/`size`、`value`（在 ToggleGroup 内使用） |
| **ToggleGroup** | `ToggleGroup`、`ToggleGroupItem` | 单选：`value`/`defaultValue` 为标量；`multiple` 时为数组；`onValueChange(value, details)`、`orientation`、`loopFocus`、`spacing`、`variant`/`size` |

## 浮层

| 组件 | 子部件 / 导出 | 关键 props 与行为 |
| :--- | :--- | :--- |
| **AlertDialog** | `AlertDialog`、`AlertDialogTrigger`、`AlertDialogPortal`、`AlertDialogOverlay`、`AlertDialogContent`、`AlertDialogHeader`、`AlertDialogFooter`、`AlertDialogTitle`、`AlertDialogDescription`、`AlertDialogAction`、`AlertDialogCancel`、`AlertDialogMedia` | 复用 Dialog 的 `open`/`defaultOpen`/`onOpenChange`/`lockScroll`；`role="alertdialog"`；Escape 不关闭（必须显式选择）；移动端最大高度 `100dvh - 2rem` 且内容可滚动 |
| **ContextMenu** | `ContextMenu`、`ContextMenuTrigger`、`ContextMenuPortal`、`ContextMenuContent`、`ContextMenuItem`、`ContextMenuCheckboxItem`、`ContextMenuRadioGroup`、`ContextMenuRadioItem`、`ContextMenuGroup`、`ContextMenuLabel`、`ContextMenuSeparator`、`ContextMenuShortcut`、`ContextMenuSub`、`ContextMenuSubTrigger`、`ContextMenuSubContent` | 右键坐标通过虚拟锚点定位；`onOpenChange(open, details)`；`modal`（默认 true）、`loopFocus`、`highlightItemOnHover`、`orientation`；`ContextMenuItem` 支持 `inset`、`variant="destructive"`。详见 [ContextMenu](./components/context-menu.md) |
| **Dialog** | `Dialog`、`DialogTrigger`、`DialogPortal`、`DialogOverlay`、`DialogContent`、`DialogSurface`、`DialogHeader`、`DialogFooter`、`DialogTitle`、`DialogDescription`、`DialogClose` | `open`/`defaultOpen`/`onOpenChange`、`dismissOnEscape`（默认 true）、`lockScroll`（默认 true）；`DialogSurface` 是不带定位/动画的外层视觉容器；移动端最大高度 `100dvh - 2rem` 且内容可滚动 |
| **Drawer** | `Drawer`、`DrawerTrigger`、`DrawerPortal`、`DrawerOverlay`、`DrawerSwipeHandle`、`DrawerContent`、`DrawerHeader`、`DrawerFooter`、`DrawerTitle`、`DrawerDescription`、`DrawerClose`、`useDrawerContext` | `open`/`defaultOpen`、`onOpenChange(open, details)`、`modal`、`swipeDirection`、`showSwipeHandle`、`disablePointerDismissal`。详见 [Drawer DESIGN](../src/components/drawer/DESIGN.md) |
| **DropdownMenu** | `DropdownMenu`、`DropdownMenuTrigger`、`DropdownMenuPortal`、`DropdownMenuContent`、`DropdownMenuGroup`、`DropdownMenuLabel`、`DropdownMenuItem`、`DropdownMenuCheckboxItem`、`DropdownMenuRadioGroup`、`DropdownMenuRadioItem`、`DropdownMenuSeparator`、`DropdownMenuShortcut`、`DropdownMenuSub`、`DropdownMenuSubTrigger`、`DropdownMenuSubContent` | `open`/`defaultOpen`、`onOpenChange(open, details)`、`disabled`、`loopFocus`、`orientation`、`modal`；item 支持 `inset`、`variant`、`closeOnClick`。详见 [DropdownMenu DESIGN](../src/components/dropdown-menu/DESIGN.md) |
| **HoverCard** | `HoverCard`、`HoverCardTrigger`、`HoverCardContent` | `open`/`defaultOpen`、`delay`（默认 700）、`closeDelay`（默认 300）、`disabled`；content 支持 `side`/`align`/`sideOffset`/`alignOffset`/`collisionPadding`。触摸设备不响应 hover（`pointerType=touch` 被忽略）。详见 [HoverCard DESIGN](../src/components/hover-card/DESIGN.md) |
| **Popover** | `Popover`、`PopoverTrigger`、`PopoverContent`、`PopoverHeader`、`PopoverTitle`、`PopoverDescription` | `open`/`defaultOpen`、`onOpenChange`、`disabled`、`modal`、`lockScroll`（默认 true）；content 支持 `side`/`align` 等定位 props；窄屏最大宽/高受视口约束，内容可滚动 |
| **Sheet** | `Sheet`、`SheetTrigger`、`SheetContent`、`SheetHeader`、`SheetFooter`、`SheetTitle`、`SheetDescription`、`SheetClose` | 根复用 Dialog props；`SheetContent` 的 `side="top" \| "right" \| "bottom" \| "left"`（默认 right）、`showCloseButton`。详见 [Sheet DESIGN](../src/components/sheet/DESIGN.md) |
| **Tooltip** | `TooltipProvider`、`TooltipGroup`、`Tooltip`、`TooltipTrigger`、`TooltipContent`、`TooltipArrow` | `open`/`defaultOpen`、`openDelay`（默认 700）、`closeDelay`（默认 150）、`disabled`；content 支持 `side`/`align`/`sideOffset`/`alignOffset`/`collisionPadding`；Group 控制连续 tooltip 的“抢占”；触摸设备不响应 hover |

## 反馈与状态

| 组件 | 子部件 / 导出 | 关键 props 与行为 |
| :--- | :--- | :--- |
| **Alert** | `Alert`、`AlertTitle`、`AlertDescription`、`AlertAction` | `variant="outline" \| "destructive"`；带 `AlertAction` 时右侧自动留白 |
| **Badge** | `Badge` | `variant="primary" \| "secondary" \| "destructive" \| "outline" \| "ghost" \| "link"` |
| **Empty** | `Empty`、`EmptyHeader`、`EmptyMedia`、`EmptyTitle`、`EmptyDescription`、`EmptyContent` | `EmptyMedia` 的 `variant="default" \| "icon"`；`data-slot`：`empty`、`empty-header`、`empty-icon`（media）、`empty-title`、`empty-description`、`empty-content` |
| **Item** | `ItemGroup`、`ItemSeparator`、`Item`、`ItemMedia`、`ItemContent`、`ItemTitle`、`ItemDescription`、`ItemActions`、`ItemHeader`、`ItemFooter` | 根 `Item` 的 `variant="ghost" \| "outline" \| "muted"`（默认 ghost）、`size="sm" \| "xs"`（默认 sm）；media 变体 `ghost \| "icon" \| "image"`（默认 ghost） |
| **Kbd** | `Kbd`、`KbdGroup` | 纯展示；`KbdGroup` 把多个键组合成一个整体 |
| **Marker** | `Marker`、`MarkerIcon`、`MarkerContent`、`markerVariants` | `variant`（见 `markerVariants`）；`data-slot`：`marker`、`marker-icon`、`marker-content`。详见 [Marker DESIGN](../src/components/marker/DESIGN.md) |
| **Progress** | `Progress`、`ProgressLabel`、`ProgressValue` | 根 `Progress` 的 `value: number`（0–100）；内部渲染 `role="progressbar"`；`data-slot`：`progress`、`progress-track`、`progress-indicator`、`progress-label`、`progress-value` |
| **Skeleton** | `Skeleton` | 纯占位块；用 `class` 控制尺寸与圆角 |
| **Spinner** | `Spinner` | SVG 旋转指示器；`aria-hidden` 由使用方决定 |
| **Toast** | `Toaster`、`Toast`、`toast`、`useSonner`、`getToasts`、`getHistory` | 命令式 `toast(...)` / `toast.success` / `toast.promise`；`Toaster` 的 `position`、`duration`、`visibleToasts`、`expand`、`variant`、`swipeDirections`、`offset`、`mobileOffset`。`variant` 支持 `popover`（默认，shadcn 样式）/ `semantic` / `colored`；描边恒为中性灰，彩色边框由使用方覆盖。详见 [Toast](./components/toast.md) |

## 数据展示

| 组件 | 子部件 / 导出 | 关键 props 与行为 |
| :--- | :--- | :--- |
| **Avatar** | `Avatar`、`AvatarImage`、`AvatarFallback`、`AvatarBadge`、`AvatarGroup`、`AvatarGroupCount` | `Avatar` 的 `size="md" \| "sm" \| "lg"`；无图片时 fallback 仍显示 |
| **Breadcrumb** | `Breadcrumb`、`BreadcrumbList`、`BreadcrumbItem`、`BreadcrumbLink`、`BreadcrumbPage`、`BreadcrumbSeparator`、`BreadcrumbEllipsis` | `Breadcrumb` 渲染 `nav`；`BreadcrumbLink` 默认 `a`，可多态 |
| **DataTable** | `createTable` + 类型 | 自研 Solid 表格引擎：`columns`、`data: () => T[]`、`getRowId`、排序/过滤/显隐/选择/分页。详见 [DataTable](./components/data-table.md) |
| **Pagination** | `Pagination`、`PaginationContent`、`PaginationItem`、`PaginationLink`、`PaginationPrevious`、`PaginationNext`、`PaginationEllipsis` | `PaginationLink` 可传 `page` 或自定义 `children`，支持 `isActive`、`size` |

## 聊天与 AI

| 组件 | 子部件 / 导出 | 关键 props 与行为 |
| :--- | :--- | :--- |
| **Attachment** | `Attachment`、`AttachmentGroup`、`AttachmentMedia`、`AttachmentContent`、`AttachmentTitle`、`AttachmentDescription`、`AttachmentActions`、`AttachmentAction`、`AttachmentTrigger` | 根 `state="idle" \| "uploading" \| "processing" \| "error" \| "done"`（默认 done）、`size="default" \| "sm" \| "xs"`、`orientation="horizontal" \| "vertical"`。详见 [Attachment](./components/attachment.md) |
| **Bubble** | `BubbleGroup`、`Bubble`、`BubbleContent`、`BubbleReactions` | 根 `align="start" \| "end"`；`variant`（见 `bubbleVariants`）。详见 [Bubble](./components/bubble.md) |
| **Message** | `MessageGroup`、`Message`、`MessageAvatar`、`MessageContent`、`MessageHeader`、`MessageFooter` | 根 `align="start" \| "end"`。详见 [Message](./components/message.md) |
| **MessageScroller** | `MessageScrollerProvider`、`MessageScroller`、`MessageScrollerViewport`、`MessageScrollerContent`、`MessageScrollerItem`、`MessageScrollerButton`、`useMessageScroller`、`useMessageScrollerScrollable`、`useMessageScrollerVisibility` | `autoScroll`、`defaultScrollPosition`、`scrollEdgeThreshold`、`scrollPreviousItemPeek`、`scrollMargin`；viewport：`preserveScrollOnPrepend`；item：`messageId`、`scrollAnchor`。详见 [MessageScroller](./components/message-scroller.md) |

## 媒体与工具

| 组件 | 子部件 / 导出 | 关键 props 与行为 |
| :--- | :--- | :--- |
| **Image** | `Image` | Next.js `next/image` 风格：`src`、`alt`、`width`/`height`、`fill`、`loader`、`quality`、`preload`、`placeholder="blur" \| "empty"`、`blurDataURL`、`unoptimized`；`priority`/`onLoadingComplete` 已弃用。详见 [Image](./components/image.md) |
| **ScrollArrows** | `ScrollArrows` | `target: Accessor<HTMLElement \| undefined>`、`hoverScroll`（默认 true）、`class`/`upClass`/`downClass`；箭头本身 `pointer-events-none`。详见 [ScrollArrows](./components/scroll-arrows.md) |

## 相关文档

- [自研/复杂组件用法](./components/README.md)
- [架构说明](./architecture.md)
- [定位器](./positioner.md)
- [Hooks](./hooks.md) / [Utils](./utils.md)
