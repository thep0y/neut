# Toast

命令式 toast：`toast()`、`toast.success/error/promise`，配合根布局里的 `<Toaster />`。

```tsx
// App root
import { Toaster } from "@neut/ui";

<Toaster position="bottom-right" closeButton />;

// anywhere
import { toast } from "@neut/ui";

toast("已保存");
toast.success("上传完成");
toast.error("保存失败", { description: "稍后重试" });
const id = toast.loading("处理中…");
toast.dismiss(id);
toast.promise(save(), {
    loading: "保存中…",
    success: (data) => "已保存 " + data.name,
    error: "保存失败",
});
```

## Toaster props

| Prop | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `position` | `"top-left" \| "top-right" \| "top-center" \| "bottom-left" \| "bottom-right" \| "bottom-center"` | `"bottom-right"` | 视口位置 |
| `duration` | `number` | — | 自动关闭时间（ms） |
| `visibleToasts` | `number` | `3` | 同时可见条数 |
| `gap` | `number` | `14` | 间距（px） |
| `expand` | `boolean` | — | 默认展开 |
| `variant` | `"popover" \| "semantic" \| "colored"` | `"popover"` | 表面样式，见下文“视觉约定”；单条 toast 可覆盖 |
| `richColors` | `boolean` | — | **已弃用**：`true` 等价于 `variant="semantic"`，新代码请用 `variant` |
| `closeButton` | `boolean` | — | 显示关闭按钮 |
| `hotkey` | `string[]` | `["altKey", "KeyT"]` | 展开/收起快捷键 |
| `offset` / `mobileOffset` | `Offset` | — | 视口偏移 |
| `swipeDirections` | `SwipeDirection[]` | — | 可滑动关闭的方向 |
| `icons` | `ToastIcons` | — | 自定义图标 |
| `dir` | `"ltr" \| "rtl" \| "auto"` | `auto` | 书写方向 |
| `theme` | — | — | **已弃用**：Toast 不再自行设置主题，请用 `<html data-theme>` |

`ToastOptions` 还可设置 `variant`、`class`、`classes`、`closeButtonAriaLabel`、`style`、`toasterId` 等。

## toast API

```ts
toast(message, options?)
toast.success(message, options?)
toast.info(message, options?)
toast.warning(message, options?)
toast.error(message, options?)
toast.loading(message, options?)
toast.message(message, options?)
toast.custom((id) => JSX, options?)
toast.promise(promiseOrFactory, { loading?, success?, error?, description?, finally? })
toast.dismiss(id?)
toast.remove(id)
toast.getToasts() / toast.getHistory()
```

- 同 id 再次调用会**原地更新**，不会新增一条。
- 新 toast 插到队首（列表顺序为新 → 旧）。
- `dismiss(id)` 只是标记退场，真正移除发生在退场动画结束后。
- `useSonner()` 返回响应式 `{ toasts }`，可用于自定义渲染或测试。
- 单条的 `options.variant` 优先级最高：单条 > `toastOptions.variant` > `Toaster.variant` >
  已弃用的 `richColors`（`true` → `semantic`）> 默认 `popover`。

## 视觉约定

三种表面样式（`variant`）共用同一套"浮层表面"骨架：

- `rounded-lg` + `shadow-md` + `ring-1 ring-foreground/10`（中性灰描边，不用实色 `border`）
- 内边距 `px-3 py-2.5`，字号 `text-sm`

| `variant` | 背景 | 文字 | 图标 |
| :--- | :--- | :--- | :--- |
| `popover`（默认，shadcn 样式） | `bg-popover` | `text-popover-foreground` | 语义色（`text-success` 等） |
| `semantic` | 10% 状态色混入 `--popover` 的实色浅底 | 语义色标题，描述 80% | 语义色 |
| `colored` | 实色状态底（`bg-success` / `bg-destructive` 等） | 对应的 `*-foreground` | 跟随 `*-foreground` |

`popover` 是默认值，也是 shadcn 的默认长相：背景与浮层一致，**只有图标染色**。
需要更强的提示时显式选 `semantic` 或 `colored`：

```tsx
// 单条指定
toast.success("已保存", { variant: "semantic" });
toast.error("保存失败", { variant: "colored" });

// 全局默认（单条仍可覆盖）
<Toaster variant="semantic" />;
```

`default` / `loading` 在 `colored` 下用 `bg-primary` + `text-primary-foreground`。

> `semantic` 的底色必须**不透明**，不能写成 `bg-success/10`：那会让整个表面只有
> 10% 不透明度，折叠堆叠时后面的 toast 会透出来。用
> `color-mix(in oklab, var(--popover), var(--success) 10%)` 才是实色浅底。
>
> 必须是 **oklab**：`--popover` 是消色（hue = 0），`color-mix(in oklch, …)`
> 会在极坐标里把状态色的 hue 一起拉向 0，蓝色/绿色混出来都会偏红。

这些颜色来自主题 token（`--success` / `--warning` / `--info` / `--destructive`
及其 `*-foreground`），会跟随 `data-theme="dark"` 与自定义主题，
不要在业务代码里写死 `emerald-500` 之类的原生色。

**描边始终是中性灰**（`ring-1 ring-foreground/10`），状态不会改变边框颜色。
需要彩色边框时由使用方自己覆盖，例如：

```tsx
toast.error("保存失败", { class: "ring-2 ring-destructive/40" });

// 或者不要边框
toast("已保存", { class: "ring-0" });
```

## 状态

Toast 内部用 `data-*` 驱动动画与布局：`data-type`（状态）、`data-variant`（表面样式）、
`data-state`（进出场）、`data-rich-colors`（兼容旧属性）；`Toaster` 通过 `Portal` 挂到 `document.body`。
滑动关闭、自动关闭、展开/收起的选择逻辑在 `useToaster` 与 `useToastLifecycle` 中。
