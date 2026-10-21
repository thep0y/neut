# Toast

命令式 toast：`toast()`、`toast.success/error/promise`，配合根布局里的 `<Toaster />`。

```tsx
// App root
import { Toaster } from "@neut/ui";

<Toaster position="bottom-right" closeButton richColors />;

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
| `richColors` | `boolean` | — | 成功/错误使用彩色背景 |
| `closeButton` | `boolean` | — | 显示关闭按钮 |
| `hotkey` | `string[]` | `["altKey", "KeyT"]` | 展开/收起快捷键 |
| `offset` / `mobileOffset` | `Offset` | — | 视口偏移 |
| `swipeDirections` | `SwipeDirection[]` | — | 可滑动关闭的方向 |
| `icons` | `ToastIcons` | — | 自定义图标 |
| `dir` | `"ltr" \| "rtl" \| "auto"` | `auto` | 书写方向 |
| `theme` | — | — | **已弃用**：Toast 不再自行设置主题，请用 `<html data-theme>` |

`ToastOptions` 还可设置 `class`、`classes`、`closeButtonAriaLabel`、`style`、`toasterId` 等。

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

## 状态

Toast 内部用 `data-*` 驱动动画与布局；`Toaster` 通过 `Portal` 挂到 `document.body`。
滑动关闭、自动关闭、展开/收起的选择逻辑在 `useToaster` 与 `useToastLifecycle` 中。
