# Utils

从 `@neut/ui`（或 `@neut/ui/utils`）导出。

## clsx

```ts
import { clsx } from "@neut/ui";

clsx("px-2", cond && "bg-primary", props.class);
```

底层直接 re-export `cn` 包（shadcn 的 `clsx` + `tailwind-merge` 替代品），因此依赖 `cn`（见 `peerDependencies`）。

## mergeRefs

合并多个 ref，依次调用：

```tsx
const ref = mergeRefs(internalRef, props.ref);
```

Solid 会把 `ref={variable}` 统一规整成回调，因此这里只处理函数形式。

## callEventHandler

调用用户事件处理器，兼容 Solid 的 `EventHandlerUnion`（普通函数或 bound handler `[handler, data]`）：

```ts
callEventHandler(props.onClick, event);
```

bound handler 的调用约定是：`handler[0]` 先接收绑定的 data、再接收 event。

## createChangeEventDetails

构造 `onXxxChange(value, details)` 的第二个参数：

```ts
const details = createChangeEventDetails("item-press", event, trigger);
```

返回 `{ reason, event, trigger, cancel, allowPropagation, get isCanceled, get isPropagationAllowed }`。
`isCanceled` / `isPropagationAllowed` 是 getter，回调中读取的是最新值。

## getStyleValue

读取元素的计算样式，属性名支持驼峰或连字符：

```ts
getStyleValue(el, "backgroundColor"); // 等价于 "background-color"
```

无 DOM/无效元素/空属性名时输出警告并返回 `null`。

## toKebabCase

把 camelCase 转成 kebab-case，处理 `--custom-property`、`float`/`cssFloat` 与厂商前缀：

```ts
toKebabCase("WebkitTransform"); // "-webkit-transform"
toKebabCase("msTransform");     // "-ms-transform"
toKebabCase("--foo");           // "--foo"
```

## clamp

```ts
clamp(value, min, max); // 两端都可缺省
```

## roving navigation

Tabs / ToggleGroup 共用的键盘导航算法：

```ts
import { ROVING_NAV_KEYS, computeNextIndex, createRovingNavigation } from "@neut/ui";
```

- `ROVING_NAV_KEYS`：Arrow 键 + Home/End。
- `computeNextIndex(key, currentIndex, itemCount, { isVertical, isRTL, loop })`：纯函数；返回 `undefined` 表示不接管。
- `createRovingNavigation(options)`：绑定 `getItems` / `orientation` / `dir` / `loop`，在 `Home/End` 与方向键时移动焦点并回调 `onHighlight`。

## logger

```ts
import { logger } from "@neut/ui";

logger.info("消息", data);
const logFrame = logger.hot("render-loop", "debug", { windowMs: 1000, maxPerWindow: 3 });
logFrame(() => heavyStringify());
```

- `logger.debug/info` 仅开发环境输出；`warn/error` 生产环境保留。
- `logger.hot(tag)` 对高频日志节流，参数支持惰性函数，超额调用不付出求值成本；
  图片开发期校验就用 `logger.hot("image-dev", "warn")` 控制重复警告量。
- `logger.child(prefix)` 创建带子前缀的 logger（去重集合独立）。
