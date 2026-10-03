# 测试撰写规则

> 面向在本仓库写测试的 AI 代理与人类贡献者。**强制规则，不是建议。**
> 违背本文件的测试在 review 阶段一律打回，CI 门禁也会拦下。

## 0. 为什么有这份文件

组件库没有测试时，缺陷只能在被使用时暴露；而"补测试"很容易被做成一场表演：为了让覆盖率数字好看，去改实现、去写只走一遍 happy path 的断言、或者把实现逻辑原样抄进测试里再断言两边相等。

本文件同时约束两件事：

1. **覆盖率门槛**：新增/修改的代码必须 100% 覆盖，没有任何例外通道；
2. **测试诚实性**：测试必须验证*行为契约*，而不是验证*实现碰巧长这样*；禁止为了让测试变绿而给实现打补丁，也禁止写永远为真的断言。

**核心原则：测试是"这个组件对外承诺了什么"的可执行规格（spec），而不是"这行代码被执行过"的打卡记录。** 覆盖率是副产品，不是目的。

---

## 1. 覆盖率的精确定义

### 1.1 门槛

对 `src/**` 下的所有源码，下列四项指标**每一项都必须是 100%**：

| 指标       | 含义                             |
| ---------- | -------------------------------- |
| statements | 语句                             |
| branches   | 分支（含 `&&` / `                |     | `/`??`/ 三元 / 可选链 /`default`分支 / 提前`return`） |
| functions  | 函数（含箭头函数、getter、回调） |
| lines      | 行                               |

"新增代码"和"既有代码"一视同仁。回归测试与覆盖率提升可以分批提交，但
**任何一个 PR 都不能让全局数值下降**。

### 1.2 允许的排除（白名单，必须显式声明理由）

只允许排除以下类别，且必须在 `vitest.config.ts` 的 `coverage.exclude` 里
集中声明、每条注明原因：

| 类别         | 例子                                      | 理由                                                   |
| ------------ | ----------------------------------------- | ------------------------------------------------------ |
| 类型声明     | `*.types.ts`、`src/types/**`              | 编译期擦除，无运行时行为                               |
| 纯样式常量   | `*.styles.ts`                             | Tailwind class 字符串，断言它等于某个字符串 = 复述代码 |
| 出口文件     | `index.ts`、`src/index.ts`                | 只做 re-export                                         |
| 构建期死代码 | `import.meta.env.PROD` 分支里不可达的一侧 | 见 §5.4 单独规则，不许简单粗暴整体排除                 |

**禁止**用注释绕过覆盖率：

```ts
// ❌ 禁止：为了让覆盖率过关而屏蔽整段逻辑
/* istanbul ignore next */
if (weirdEdgeCase) { ... }
```

确实无法在 jsdom 里构造的真分支（例如需要真实布局引擎的
`getBoundingClientRect` 非零值），走 §5.5 的"能力缺口登记"流程，
而不是静默 `ignore`。

### 1.3 数字下降 = 失败

`vitest --coverage` 的阈值设为 100，任一指标低于阈值即退出码非 0。
不要把阈值调低，不要写 `thresholds: { autoUpdate: true }`（它会把阈值
悄悄调低到当前值，等于没有门槛）。

---

## 2. 测试技术栈（已确定，不要替换）

| 关注点   | 选型                                                     | 说明                                                                                        |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 运行器   | `vitest`                                                 | 与仓库现有 `vite` / `vite-plugin-solid` 同构，复用 `~/*` 别名与 `jsxImportSource: solid-js` |
| 渲染     | `@solidjs/testing-library`                               | 基于 solid 的 `render`/`screen`，配 `jsdom`                                                 |
| DOM 环境 | `jsdom`                                                  | 仓库已假设浏览器环境；`ResizeObserver` 等缺失 API 在 setup 文件里 polyfill                  |
| 断言增强 | `@testing-library/jest-dom`                              | `toBeVisible()` / `toHaveAttribute()` / `toHaveAccessibleName()` 等语义断言                 |
| 用户交互 | 测试库自带的 `fireEvent` + `@testing-library/user-event` | 优先 `user-event`，它更接近真实交互（含焦点、键盘）                                         |

依赖一律用 `bun add -d` 写入 `devDependencies`。**不要**引入 `jest`、
`@testing-library/react`、`enzyme` 或任何 React 生态的测试工具。

新增 npm scripts：

```json
{
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
}
```

### 2.1 三个已踩过的坑（照抄现有配置即可，别重踩）

1. **`@testing-library/jest-dom@7` 的类型与 `vitest@5` 不兼容**
   （`Assertion` 接口类型参数不一致，报 `TS2428`）。**不要**把
   `@testing-library/jest-dom/vitest` 写进 `tsconfig.json` 的 `types`。
   仓库用 `vitest.d.ts` 自己做接口合并，参数列表必须写成
   `Assertion<R extends void | Promise<void> = void, T = unknown>` 与 vitest 对齐。
2. **`unplugin-dts` 会把 `*.test.d.ts` 打进 `dist/`**，等于把测试类型发布给使用者。
   现在测试整体位于 `tests/`（不在 `src/` 下），library 入口与 dts 都扫不到它们；
   `vite.config.ts` 的 `dts()` 仍保留 `exclude` 作为兜底——**不要**把测试文件放回 `src/`。
3. `vi.stubEnv("DEV", ...)` **确实能作用于 `import.meta.env.DEV`**（已实测），
   所以 `logger.ts` / `warn-once.ts` 的两个分支都能真测，不需要排除它们。

> 注意：本仓库原先"临时搭环境自测完删掉"的做法从本文件生效起作废——
> 测试是常驻资产，脚手架要提交。**但**测试文件不进 `dist`
> （`vite.config.ts` 的 library 入口只扫 `index.ts`，dts 也排除了测试）。

---

## 3. 目录与命名约定

**测试用例一律放在仓库根目录的 `tests/` 下，与 `src/` 结构一一镜像；源码目录里不允许出现
任何 `*.test.*` / `*.spec.*` / 测试脚手架文件。** 测试文件名沿用 `<被测文件名>.test.ts(x)`，
因此从路径即可反推被测文件（`tests/components/tabs/Tabs/Tabs.test.tsx` →
`src/components/tabs/Tabs/Tabs.tsx`）。

```
tests/components/tabs/
├── Tabs/
│   ├── useTabsKeyboard.test.ts        # 纯逻辑
│   ├── Tabs.context.test.tsx          # 需要 jsdom（依赖 document.activeElement）
│   └── Tabs.test.tsx                  # 组件渲染 + 行为
├── TabsTrigger/
│   └── TabsTrigger.test.tsx
└── Tabs.integration.test.tsx          # 跨子组件的组合行为
```

导入规则（**强约定**）：

- 引用被测源码一律走 `~/*` 别名（`~` → `src/`），**不要**写 `../../src/...`；
- 测试之间互相引用辅助文件走 `~tests/*` 别名（`~tests` → `tests/`），
  例如共享脚手架 `~tests/lib/positioner/test-utils.ts`；
- 同一个测试目录内的私有辅助可以用相对路径，跨目录一律用别名。

> 只有测试使用、`src/` 不依赖的文件（共享脚手架、夹具）也必须放在 `tests/` 下，
> 并且不得出现在 `src/` 的任何 `index.ts` 导出里。

`tsconfig.json` 的 `include` 含 `tests`，`vitest.config.ts` 的 `include` 只扫
`tests/**`，`coverage.include` 只扫 `src/**`：三者共同保证"测试被类型检查、被运行，
但从不进入覆盖率与产物"。

分层命名（**强约定**，一眼看出测的是什么）：

| 后缀                    | 测什么                                               |
| ----------------------- | ---------------------------------------------------- |
| `.test.ts`              | 纯函数 / 纯算法（也可以有 DOM，环境统一是 jsdom）    |
| `.test.tsx`             | 单个组件或 hook：渲染、事件、ARIA、`data-*`          |
| `.integration.test.tsx` | 多个子组件协作（如 Tabs + List + Trigger + Content） |

环境统一是 `jsdom`（`vitest.config.ts`）。不要再引入第二套环境配置或 per-file 的 `// @vitest-environment node` 注释——统一环境才能保证测试文件之间可以互相参考、不会因为环境差异出现"本地过、CI 挂"。

一个测试文件只测一个模块。不要建 `components/all.test.tsx` 这种"大杂烩"。

### 3.1 参考实现

仓库已有一套跑通的样板，动手前先读一遍：

| 文件                                                   | 演示了什么                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `tests/utils/clsx.test.ts`                             | 纯函数测试、`toHaveAttribute` 之外的普通断言                                                         |
| `tests/utils/ref.test.ts`                              | 函数 ref 合并、调用顺序断言                                                                          |
| `tests/utils/warn-once.test.ts`                        | `vi.stubEnv` 切 DEV/PROD、`vi.resetModules()` 重载模块级状态                                         |
| `tests/components/tabs/TabsTrigger/TabsTrigger.test.tsx` | Solid 组件渲染、`getByRole` 查询、ARIA 交叉引用、`data-*` 双向断言、`user-event` 点击、disabled 分支 |

---

## 4. 反作弊条款（这是本文件最重要的部分）

以下每条都是**一票否决**。评审时逐条检查，CI 脚本也做机械检查。

### 4.1 禁止为了通过测试而修改实现语义

测试失败时，先问"**实现的对外承诺**到底是哪一个"。允许的修改：

- 修真实的 bug（这是测试的价值所在）；
- 补齐遗漏的边界处理（需要同步更新 `DESIGN.md`，见 §7）。

**不允许**的修改：

- 为了让断言通过而删掉防御性分支、删掉 `else`、把 `throw` 换成静默返回；
- 把"受控模式下不写内部状态"改成"也写一份"以迁就写错的测试；
- 把已有的、有注释解释的设计取舍（如浮层两层结构、迟滞阈值）改成更容易测的写法。

判断标准：**如果没有人写这个测试，这个改动你会做吗？** 不会做，就是作弊。

### 4.2 禁止把实现逻辑抄进测试

```ts
// ❌ 作弊：测试重新实现了一遍被测逻辑，两边一起错也发现不了
const expected = (current + (rtl ? -1 : 1) + len) % len;
expect(nextIndex).toBe(expected);
```

```ts
// ✅ 正确：用具体场景 + 期望的具体结果
// 3 个 tab，当前在最后一个，ltr，loop=true，按 ArrowRight
expect(focusSpy).toHaveBeenCalledWith(triggers[0]);
```

期望值必须是**手写常量**或**从需求推导出的具体值**，不能是"用同样的公式再算一遍"。

### 4.3 禁止空洞断言

- `expect(true).toBe(true)`、`expect(1).toBe(1)`；
- 只断言 `expect(fn).toBeDefined()` / `expect(container).toBeTruthy()`
  就算测过一个分支；
- `expect(() => fn()).not.toThrow()` 用来"覆盖"一个本该验证返回值/副作用的函数；
- 断言 `.toContain("flex")` 这种只截取 class 子串、无区分度的检查（要么断完整 class，要么断它确实起作用的 `data-*` 语义）。

每一条断言都要能回答："**这条断言失败时，是哪个用户可见的行为坏了？**"

### 4.4 禁止用快照替代行为测试

不用 `toMatchSnapshot()` 做组件测试。快照会把"当前 DOM 长什么样"冻结下来，看起来覆盖了，实际改个 class 就红、真坏了却看不出来。ARIA 属性和 `data-*` 用显式断言逐条写出来。

### 4.5 禁止 mock 掉被测对象本身

- 测 `useTabsKeyboard` 时不要 mock 它，要给它一个假的 `TabsContextValue`；
- 测组件时不要 mock 该组件；只 mock **系统边界**：
  `ResizeObserver` / `IntersectionObserver` / `requestAnimationFrame` /
  `matchMedia` / `getBoundingClientRect`（jsdom 返回全 0）/ `Date.now`。
- mock 必须写在测试里并说明为什么（jsdom 没实现 / 需要确定性）。

### 4.6 覆盖率白名单不许"顺手"扩大

给 `coverage.exclude` 加条目 = 给一段代码发免测通行证。加就必须在 PR 描述里写明理由，并且**该文件必须仍被其他测试间接执行**（例如 types 文件被 import 时不报错）。

### 4.7 不允许"注释掉测试"或 `.skip`

`describe.skip` / `it.skip` / `it.todo` / `xit` 一律不允许出现在提交里。
临时调试可以用 `it.only` **本地**跑，但提交前必须删掉；CI 会检查（`.only` 存在即失败）。

---

## 5. 怎么写合格的测试

### 5.1 查询元素：优先无障碍语义，其次 `data-slot`，最后才是 class

按优先级：

1. `getByRole("tab", { name: "账号" })`、`getByRole("tablist")` —— 首选，顺便验证了 ARIA 是否正确；
2. `getByLabelText` / `getByText` —— 面向用户可见文本；
3. `container.querySelector('[data-slot="tabs-trigger"]')` —— 语义查询不够时；
4. `getByTestId` —— **最后手段**，且需要理由；能用角色名就别用。

禁止用 Tailwind class 做查询（`querySelector(".flex-1")`），class 是样式细节，
不是契约。

### 5.2 断言"用户能观察到的东西"

一个交互测试至少要能回答：

- **DOM**：元素出现/消失/属性变化（`hidden`、`disabled`、`tabindex`）；
- **ARIA**：`aria-selected` / `aria-controls` / `aria-labelledby` /
  `role` / roving tabindex 是否联动正确；
- **`data-*` 状态**：`data-active` / `data-open` / `data-highlighted` /
  `data-disabled` 等，因为下游样式依赖它们；
- **回调**：`onValueChange` / `onOpenChange` 收到的值**与事件详情**；
- **焦点**：`document.activeElement` 是否落在预期元素上。

### 5.3 每个组件必须覆盖的固定清单

凡是有下列特征的组件，下列场景**逐条**要有测试，缺一条即视为未达标：

| 特征                     | 必测场景                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 受控 / 非受控双模式      | ① `defaultValue` 初始化；② 非受控下交互写内部状态并回调；③ **受控下交互只回调、内部状态不变**（这条最容易漏，也最容易有 bug）；④ 受控值由外部回写后 UI 跟随 |
| `onXxxChange` 带事件详情 | 断言 `reason`、`trigger`、`event`；断言 `cancel()` 后行为被取消、`isCanceled` 为 true、`allowPropagation()` 生效                                            |
| `data-*` 状态            | 每个状态属性都有一条断言，覆盖"进入"和"退出"两个方向                                                                                                        |
| ARIA 关联                | id 交叉引用成对成立（`aria-controls` 指向的元素存在且 `aria-labelledby` 反向指回）                                                                          |
| 键盘交互                 | 每个按键分支：方向键映射、Home/End、Enter/Space、Escape；`loop` 开关两侧；跳过 disabled                                                                     |
| 上下文约束               | 子组件脱离父组件渲染时**抛出中文错误**，用 `expect(() => ...).toThrow("必须渲染在")` 断言                                                                   |
| 多态 `component`         | 传自定义标签/组件时正确渲染，`ref` 透传，用户自己的 `onClick` 不被覆盖                                                                                      |
| 条件渲染 / 分支          | `Show` / `Switch` / 三元 / 提前 `return` 的每一侧都要有触发它的用例                                                                                         |

### 5.4 `import.meta.env` 分支

`utils/logger.ts`、`utils/warn-once.ts` 里有 `import.meta.env.DEV` / `PROD`
分支，这是**构建期**常量。测试里用 `vi.stubEnv("DEV", false)`（或
`vi.stubGlobal`）分别跑两个用例，不要在 `coverage.exclude` 里整体排除
这两个文件——它们有真实的运行时语义。

`vi.stubEnv` 之后必须 `vi.unstubAllEnvs()`（放 `afterEach`）。

### 5.5 能力缺口登记（替代静默 ignore）

jsdom 无法构造的场景（真实布局、滚动尺寸、`ResizeObserver` 回调时序），
处理步骤：

1. 在 setup 文件里提供最小可控 polyfill，让**逻辑分支**可测
   （例如 `ResizeObserver` 手动触发回调）；
2. 若某个分支确实依赖真实浏览器引擎，在该文件顶部写一段
   `// 测试能力缺口：<分支> 需要真实布局，无法在 jsdom 断言；已登记于 TESTING.md §8`，
   并把条目加到本文档 §8 的登记表；
3. **不允许**直接 `/* istanbul ignore */` 了事。

### 5.6 响应式与异步

- Solid 的更新是同步的，但 `onMount` / `createEffect` 需要在渲染后触发：
  用 `await Promise.resolve()` 或 `await waitFor(...)` 让微任务落地，
  不要靠 `setTimeout(0)` 猜时序；
- **`render()` 后立刻交互可能被丢掉**：依赖 `onMount` 注册（如菜单项把 id 登记到
  父浮层）的组件，`openSubmenu` 之类的方法在注册完成前会直接 return。
  真实浏览器里用户点击必然晚于挂载，但测试里 `render()` 与 `fireEvent` 可能在同一
  tick 内。因此**先 `await Promise.resolve()` 一到两轮再交互**（参考
  `dropdown-menu-sub.integration.test.tsx` 的 `waitForMount()`）；
- 计时相关（动画、节流、toast 自动关闭）用 `vi.useFakeTimers()` +
  `vi.advanceTimersByTime()`，并在 `afterEach` 里 `vi.useRealTimers()`；
- 每个测试之间必须清理 DOM 与全局状态（`useScrollLock` 有模块级引用计数、
  `warnOnce` 有模块级 `Set`）——在 setup 里 `afterEach(cleanup)` +
  必要时 `vi.resetModules()` 重新 import 模块，避免测试互相污染。
  这类**模块级可变状态**是最容易产生"顺序相关失败"的地方，必须显式重置。

### 5.7 测试名用中文，描述行为与场景

```ts
// ✅ 读起来就是一条规格
it("受控模式下点击 trigger 只回调 onValueChange，不改变内部高亮", () => {});
it("vertical 布局下 ArrowLeft/ArrowRight 不移动焦点", () => {});
it("loop=false 时在最后一个 tab 上按 ArrowRight 停在原地", () => {});

// ❌ 复述代码
it("test handleKeyDown", () => {});
```

---

## 6. 必须纳入测试的既有行为（回归清单）

以下行为目前在代码里有明确实现。**带 ✅ 的已完成**（测试文件在 `tests/` 下同名路径），
其余为待补项。补测试时按此清单优先，每条都对应一个已声明的契约：

| 模块                                   | 行为                                                                                                                 | 状态                                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `utils/clsx`                           | 过滤 `undefined`/`false`、`twMerge` 解冲突                                                                           | ✅ `clsx.test.ts`                                                                                          |
| `utils/ref`                            | `mergeRefs` 依次调用、跳过非函数项、保持顺序                                                                         | ✅ `ref.test.ts`                                                                                           |
| `utils/warn-once`                      | 同消息只警告一次、DEV/PROD 两套行为                                                                                  | ✅ `warn-once.test.ts`                                                                                     |
| `utils/logger`                         | DEV/PROD、`hot()` 节流上限与"跳过 N 条"、惰性求值、`child()`                                                         | ✅ `logger.test.ts`                                                                                        |
| `utils/get-style`                      | 驼峰/连字符、参数校验、环境缺失、异常兜底                                                                            | ✅ `get-style.test.ts`                                                                                     |
| `utils/string`                         | camelCase→kebab、`--custom`、`float`、厂商前缀                                                                       | ✅ `string.test.ts`                                                                                        |
| `utils/number`                         | `clamp` 双边缺省、边界相等、负数/小数                                                                                | ✅ `number.test.ts`                                                                                        |
| `utils/call-event-handler`             | 单函数/数组/混入非函数项/顺序                                                                                        | ✅ `call-event-handler.test.ts`                                                                            |
| `utils/create-change-event-details`    | getter 即时语义、`cancel`/`allowPropagation` 独立                                                                    | ✅ `create-change-event-details.test.ts`                                                                   |
| `utils/roving-navigation`              | 方向映射、Home/End、loop、跳过 disabled、RTL 解析、焦点与高亮联动                                                    | ✅ `roving-navigation.test.ts`                                                                             |
| `components/number-input`              | `decimalPlaces` / `roundToStep` / 数值解析与格式化                                                                   | ✅ `NumberInput.utils.test.ts`                                                                             |
| `components/resizable`                 | `parseSize` / `roundPercent` / `normalizeSizes` 迭代收敛与不可行边界；`useResizablePanelGroup` 布局引擎（初始化归一化/相邻拖拽 min-max 约束/折叠吸附/命令式 collapse-expand/持久化/groupSizePx）；约束代数（`effectiveMin`/`isCollapsedSize`/`constraintBounds`/`pairConstraintsOf`）；面板注册表（注册顺序、跳过非面板节点解析相邻、前后邻居）；三个组件的渲染与 ARIA（`role=group`/`role=separator`/`aria-valuenow` 跟随尺寸）、指针拖拽（rAF 合并、pointerId 与 capture 守卫、RTL 取反、纵向主轴）、键盘调整（方向键/Home/End/Enter 折叠） | ✅ `resizable.utils.test.ts` / `resizable.constraints.test.ts` / `resizable.registry.test.ts` / `resizable.resize.test.ts` / `resizable.storage.test.ts` / `resizable.context.test.tsx` / `useResizablePanelGroup.test.tsx` / `resizable.integration.test.tsx` |
| `components/select`                    | 两套定位配方、选中项对齐算法、`size` 可用高度回调                                                                    | ✅ `SelectContent.utils.test.ts` / `align-selected-item.test.ts`                                           |
| `components/time-picker`               | 单位列生成、12/24 小时制、AM/PM 本地化、`withUnit` 合并                                                              | ✅ `time-picker.utils.test.ts`                                                                             |
| `components/calendar`                  | 日期运算、周首尾、区间枚举、ISO 周号、格式化；初始月份解析（month > defaultMonth > selected > 今天）；单格渲染（选中/区间/禁用/非本月/点击守卫）；月份视图（翻月导航、7 列表头、周切分与周序号）；标题两种布局与月/年下拉联动；组件装配（三种 mode、两种 captionLayout 的月份与年份下拉联动、受控/非受控、透传） | ✅ `Calendar.utils.test.ts` / `Calendar.options.test.ts` / `Calendar.selection.test.ts` / `CalendarDay.test.tsx` / `CalendarMonth.test.tsx` / `CalendarMonthCaption.test.tsx` / `Calendar.test.tsx` |
| `components/toast`                     | 位置类名、offset 样式（桌面/移动）、滑动方向、文档方向                                                               | ✅ `Toaster.utils.test.ts`                                                                                 |
| `components/toast`（状态与交互）        | store 原语（同 id 原地更新、message 缺省保留标题、dismiss 单条/全部、remove）；`toast.promise` 编排（loading→success/error、resolver 返回 undefined 收起 loading、resolver 抛错转 error、finally）；Toast 生命周期（open 时机、close 幂等、onDismiss/onRemove 时序、delete 同步、四种不自动关闭、卸载清理定时器）；操作/取消按钮（preventDefault 语义）；堆叠变换与动画类名；Toaster 选择/分组/截断/展开/热键与 `closeButton`、`duration` 优先级链 | ✅ `store.test.ts` / `promise-toast.test.ts` / `toast.test.ts` / `useToastLifecycle.test.tsx` / `Toast.utils.test.ts` / `ToastActionButton.test.tsx` / `Toast.test.tsx` / `useToaster.test.tsx` / `Toaster.test.tsx` |
| `components/image`                     | `getImgProps` 全部推导（srcSet/sizes/fill/layout/静态导入/校验）+ `handleLoading`                                    | ✅ `Image.utils.test.ts`                                                                                   |
| `components/message-scroller`          | 引擎公开契约：可滚动状态、模式切换、`scrollToStart/End`、autoscrolling、`scrollToMessage` 排队                       | ✅ `useMessageScrollerEngine.test.ts`                                                                      |
| `components/questionnaire`             | **全套 4 个文件已覆盖**：`questionnaire.utils`；`useQuestionnaireInput`/`useQuestionnaireChoice` 的选中/填充/受控/FormData；`useQuestionnaireItem` 状态机（status/invalid/validate/skip/reset/快捷键/焦点）；`useQuestionnaireRoot` 状态机（注册排序/激活项/进度/导航/提交重置/键盘） | ✅ 4 个测试文件（`.utils.test.ts` / 三个 hook 的 `.test.tsx`）    |
| `hooks/useScrollEdges`                 | 迟滞阈值（进 4px / 出 1px）、元素替换/缺失、scroll 驱动                                                              | ✅ `useScrollEdges.test.ts`                                                                                |
| `hooks/useScrollLock`                  | 引用计数、`allowedSelector` 放行、恢复内联样式与滚动位置、滚动条补偿                                                 | ✅ `useScrollLock.test.ts`                                                                                 |
| `hooks/useFontLoader`                  | 语言映射、去重缓存、目标元素、卸载恢复、未知语言告警                                                                 | ✅ `useFontLoader.test.ts`                                                                                 |
| `lib/positioner/core/placement`        | 方向/对齐解析、翻转、坐标推导                                                                                        | ✅ `placement.test.ts`                                                                                     |
| `lib/positioner/core/compute-position` | middleware 链、reset 重跑与上限、strategy 换算、虚拟锚点                                                             | ✅ `compute-position.test.ts`                                                                              |
| `lib/positioner/middleware/*`          | offset/shift/flip/hide/size/arrow/containingBlockOffset                                                              | ✅ 各自 `.test.ts`                                                                                         |
| `lib/positioner/utils/dom`             | rect 换算、视口边界、overflow 判定、滚动祖先                                                                         | ✅ `dom.test.ts`                                                                                           |
| `lib/positioner/auto-update`           | scroll/resize 监听、ResizeObserver 连接与断开、虚拟元素                                                              | ✅ `auto-update.test.ts`                                                                                   |
| `lib/positioner/create-positioner`     | 首次定位、响应式 options、autoUpdate 开关、floatingStyles                                                            | ✅ `create-positioner.test.ts`                                                                             |
| `lib/positioner/virtual-element`       | 坐标锚定、`contextElement` 透传                                                                                      | ✅ `virtual-element.test.ts`                                                                               |
| `tabs/*`                               | 键盘导航、受控/非受控、roving tabindex、惰性挂载、上下文约束、用户事件不丢                                           | ✅ `tabs.integration.test.tsx` / `Tabs.context.test.tsx` / `tabs-events.test.tsx` / `TabsTrigger.test.tsx` |
| `toggle-group/*`                       | 键盘导航、单选/多选、受控/非受控、`cancel()` 语义                                                                    | ✅ `toggle-group.integration.test.tsx`                                                                     |
| `components/popover`                   | 受控/非受控、disabled、ARIA（`aria-haspopup`/`aria-controls`/`data-side`）、Escape 与点击外部关闭、Trigger 键盘、用户 `onClick` 不丢、上下文约束 | ✅ `popover.integration.test.tsx`                                                                          |
| `components/tooltip`                   | `openDelay`/`closeDelay`（含取消待关闭）、**focus/blur 跳过延时**、Escape 关闭并阻止冒泡、**mousedown 关闭与自动 focus 的冲突**、受控模式、ARIA（`aria-describedby`/`role=tooltip`） | ✅ `tooltip-trigger.integration.test.tsx`                                                                  |
| `components/select`                     | 值/开关双维度受控与非受控、trigger 开关与键盘（含 Escape）、item 注册/选中/高亮、选中后关闭并还焦、跳过 disabled 作为初始高亮、ARIA（`role=option`/`aria-selected`） | ✅ `select.integration.test.tsx`（含 `SelectContent.utils` / `align-selected-item` 单测）                  |
| `components/combobox`                   | 过滤（大小写不敏感 / 空白忽略 / 自定义 `itemToStringValue`）、单选关面板与多选累加/移除/不关面板、键盘（ArrowDown/Up 环绕、Enter 选中 active、Escape 关闭）、ARIA（`role=option`/`aria-selected`）、受控与非受控 | ✅ `combobox.integration.test.tsx`                                                                         |
| `components/checkbox`                   | `role=checkbox` + sr-only 原生 input 的镜像同步、`aria-checked`/`data-checked` 双向、`aria-labelledby` 成对关联、id/name 自动生成与回退、点击切换、受控/非受控/disabled、`class`/`classList` 透传 | ✅ `checkbox.test.tsx`（100% stmts/funcs/lines）                                                           |
| `components/hover-card`                 | 默认延时 700/300ms、trigger 的 `delay`/`closeDelay` 优先于根、focus/blur 跳过延时、Escape 阻止冒泡、mousedown 只设标记（不主动关闭）、受控模式、多态 `component` | ✅ `hover-card.integration.test.tsx`                                                                       |
| `components/dialog`                    | 挂载/卸载动画两阶段、overlay 点击关闭与 `dismissOnOverlayClick`、`DialogClose`、受控模式、`aria-labelledby`/`describedby` 关联、结构子组件 | ✅ `dialog.integration.test.tsx`                                                                           |
| `components/scroll-arrows` | 箭头显隐（`useScrollEdges` 的迟滞阈值、上下边界与内容放得下）、箭头恒为装饰层（`pointer-events-none` / `aria-hidden` / 不可聚焦，不抢边缘点击）、悬停滚动在**滚动容器**上按指针坐标驱动（上/下 24px 边缘带、停留 150ms、带内移动重置计时、指针居中停止、`canScroll*` 同源门控、`pointerdown`/`touchstart`/`wheel`/`keydown`/`pointerleave`/到边界全部停止、禁用与卸载、迟到帧不继续滚） | ✅ `useHoverScroll.test.ts`（19 条，四项 100%）、`ScrollArrows.test.tsx`（10 条）、`ScrollArrowButton.test.tsx`（8 条） |
| `components/message-scroller`（滚动引擎与部件） | 引擎已按 `REFACTOR-PLAN.md` 拆成 5 个模块：DOM 几何测量、滚动状态机（四种模式迁移、可滚动阈值、autoscrolling、让位）、滚动命令与 spacer（容差内直接落位、spacer 三态与负 margin、四种 align）、可见性与阅读锚点（IO 按需订阅、无 IO 退化、订阅计数）、锚定与保位（初次定位三条路径、prepend 保位、新回合单锚点、同批多锚点跟随、行数不变打开锚点、排队补滚、resize 四条）。六个部件的渲染/ARIA/接线：data-scrollable 三态与响应式、aria-busy 三态、role/aria-label/tabIndex 默认值与覆盖、inert/data-active/tabIndex 联动、点击先失焦再发命令、用户 onClick（含 `[handler, data]` 形式）与 preventDefault、spacer 的 hidden/aria-hidden/class、messageId 与 scrollAnchor 的 data 属性、脱离 Provider 的中文错误 | ✅ 引擎与 5 个模块（`useMessageScrollerEngine{,.scrolling,.anchoring,.visibility}.test.ts` + `message-scroller.{dom-measure,scroll-state,commands,visibility,anchoring}.test.ts`）；六个部件各一份 `MessageScroller*/*.test.tsx`；整机 `message-scroller.integration.test.tsx`（拼真实 Provider + 五部件，覆盖初始定位/跟随让位/新回合锚定/按钮/空会话遮罩）；全套 19 文件 313 条。**仍未做**：真机滚动观感（见 `DESIGN.md` §5.4，本环境无桌面浏览器） |
| `components/drawer`（滑动关闭判定） | 起手判定（可交互元素 / 拖拽把手 / 滚动容器是否贴边，含横向左右与纵向上下四种方向）、最近滚动容器查找（只读指定轴的 overflow 与尺寸）、关闭阈值（比例 vs 最小像素）、位移夹取、关闭方向判定（严格大于阈值）；**待补**：Drawer / DrawerContent / useDrawerSwipe 组件层 | ⚠️ 部分：`drawer-swipe.utils.test.ts` 44 条已四项 100%；组件层仍 0% |
| `components/context-menu`（浮层运行时与触发器） | 按键映射（方向键/Home/End/Enter/Space/Escape/Tab，及字符导航与修饰键排除）；typeahead（前缀累积、大小写不敏感、窗口续期与到期重置、`dispose` 清理）；触发器唤起判定（菜单键/Shift+F10、只对触摸与手写笔长按、抖动容差、矩形中心锚点）与长按手势（计时、容差取消、重复起点接管）；**待补**：组件树集成（trigger/content/submenu/radio/checkbox 的开关、ARIA 与事件详情） | ⚠️ 部分：`context-menu.keyboard.test.ts` / `context-menu.typeahead.test.ts` / `ContextMenuTrigger/context-menu.trigger.utils.test.ts` / `ContextMenuTrigger/context-menu.long-press.test.ts` 已 100%；组件层仍 0%，见「其余组件」行 |
| `components/dropdown-menu`             | 开关与 `reason`（trigger-press/item-press/escape-key/outside-press）、Trigger 键盘、`closeOnClick`/`preventDefault` 语义、外点关闭、ARIA（menu/menuitem/menuitemcheckbox/menuitemradio）、受控模式、上下文约束；**子菜单**：hover 延时开关、`closeDelay` 与 100ms 宽限期、点击/ArrowRight 打开、ArrowLeft 关闭、兄弟互斥 | ✅ `dropdown-menu.integration.test.tsx` + `dropdown-menu-sub.integration.test.tsx`                          |
| `components/**` 其余组件               | 受控/非受控、ARIA、`data-*`、事件详情、键盘                                                                          | 🚧 待按 §5.3 逐组件补                                                                                      |

> 新增组件时，同步在此表加一行"该组件必须覆盖的行为"，再写测试。
> 表里没有的行为 = 没有契约 = 要么补进 `DESIGN.md`，要么删掉实现。

---

## 7. 测试与设计文档联动

- 有 `DESIGN.md` 的组件，其 `## 测试计划` 一节必须与真实测试文件一一对应；
  写测试时如果发现计划与实现不符，**先改文档再改测试**，不允许文档躺在
  那里过期。
- 新增/修改公开 API 行为时：`*.types.ts` + 组件注释 `@example` + `DESIGN.md`
    - 测试四处同步，缺一处就是未完成。
- 修 bug 必须**先写一个能复现的失败测试**，再改实现，最后保留这个测试
  作为回归用例。commit 信息里带 `fix(scope):`，并把该用例加进 §6 清单。

---

## 8. 测试能力缺口登记表

按 §5.5 的流程追加。宁可在这里写明"这条分支在 jsdom 里不可达"，
也不要写一条假装覆盖它的测试。

| 文件                                              | 无法测的分支                                                  | 原因                                                                                                                                                    | 替代方案                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `components/dialog/Dialog/Dialog.types.ts`（AlertDialog / Sheet 继承） | 无：这是**能力缺口**而非不可达分支 | `DialogProps.onOpenChange` 是**单参数** `(open: boolean) => void`，没有 `ChangeEventDetails`，调用方无从调用 `details.cancel()`（实测 `mock.calls[0].length === 1`，第二参为 undefined）。drawer / context-menu / combobox / toggle-group 都有 details，Dialog 家族没有——因此本模块**不存在**"cancel() 被忽略"的缺陷，不能写一条永远为绿的 cancel 断言冒充覆盖 | 已在 alert-dialog / sheet 的测试里按现状断言，并在集成用例中标注该缺口；补齐需先给 Dialog 引入 details（实现变更） |
| `components/questionnaire/questionnaire.utils.ts` | `compareDocumentOrder` 末尾的 `return 0`（两个**已连接**节点既非 FOLLOWING 也非 PRECEDING） | `compareDocumentPosition` 对任意两个不同的已连接节点都会置 FOLLOWING 或 PRECEDING 位（jsdom 与 Chromium 均如此），落到兜底需要两者都不含，实际不可达；把该行改成 `return 1` 后仍全绿（变异测试确认，27 文件 564 条）。注：分离节点现在走上面新增的 `isConnected` 早退分支，那条可达且有专门用例 | 保留为防御性代码；不写假测试 |
| `hooks/useScrollLock.ts`                          | `if (released) return;`（释放函数幂等守卫）                   | `renderHook().cleanup()` / `root.dispose()` 本身幂等，`onCleanup` 只触发一次，无法从公共 API 调用到第二次；去掉该守卫全部测试仍通过（已用变异测试确认） | 保留为防御性代码；不写假测试。若将来改为暴露 `release()`，再补用例                    |
| `hooks/useFontLoader.ts`                          | `targetRef ?? document.documentElement` 的 `??` 右侧          | `targetRef` 已在解构默认值里兜底为 `document.documentElement`，运行到此行时永不为 `undefined`；去掉 `??` 右侧全部测试仍通过（已用变异测试确认）         | 保留为防御性代码；已登记，不写假测试                                                  |
| `lib/positioner/utils/dom.ts`                     | `getViewportBoundary` 的 `window.scrollX ?? pageXOffset` 兜底 | jsdom 两者都可用，`??` 右侧不可达                                                                                                                       | 通过 `Object.defineProperty` 移除 `scrollX` 覆盖                                      |
| 布局相关                                          | 任何依赖真实 `getBoundingClientRect` 非零值的分支             | jsdom 不做布局，所有元素矩形恒为 0                                                                                                                      | 显式 stub `getBoundingClientRect`（见 `lib/positioner/test-utils.ts` 的 `asDOMRect`） |
| 样式相关                                          | `getComputedStyle` 对内联 `overflow` 简写的展开               | jsdom 不展开 shorthand，`style.overflowY` 读回 `""`                                                                                                     | stub `getComputedStyle` 返回构造好的声明对象                                          |
| `components/dropdown-menu`                        | 菜单键盘高亮时的 `scrollIntoView`（"高亮项滚入视野"）          | jsdom 未实现 `Element.prototype.scrollIntoView`，调用即抛 `TypeError`                                                                                    | 在 `vitest.setup.ts` 补空实现；滚动本身在 jsdom 无法验证                              |
| `components/select`                               | 浮层可见性（外层 `visibility: hidden` 依赖 `pos.isPositioned()`）；Enter/Space 打开后的"合成 click"净效果 | ① 可见性需要真实布局，jsdom 下永远达不到可见态；② jsdom 不会自动合成 click，手动补又与真实时序对不齐 | ① 用 `data-state` 判断开关；② 只分别验证 keydown 与 click 两个分支，不断言叠加效果；③ 用 `fireEvent.click` 代替 `userEvent.click`（后者会因元素不可见而拒绝点击） |
| `components/combobox`                             | ① 输入框缺少 `aria-expanded`/`aria-controls`/`role="combobox"`；② 受控模式下 `inputValue` 与 `props.value` 脱节 | ① 属**无障碍缺口**（非测试能力问题），开关状态没有可断言的 ARIA 出口；② `inputValue` 是根组件里的独立本地信号，`selectItem` 无条件写它 | ① 开关断言改用 `onOpenChange` 回调，并把缺口登记在此；② 用 `[当前行为]` 前缀的用例锁定现状（`aria-selected` 仍正确跟随），修复后改断言 |
| `components/scroll-area/ScrollBar/useScrollBarInteraction.ts` | （已修复，无遗留缺口） | 原先 `if (event.target.dataset.slot === "scroll-area-thumb") return;` 是不可达的冗余守卫（滑块 handler 会 `stopPropagation()`） | 2026-09 重构时删除；变异测试确认删除后全部用例仍通过 |
| `components/calendar/Calendar/Calendar.tsx` | `merged.numberOfMonths ?? 1` 的 `??` 右侧（107） | `mergeProps` 会跳过 `undefined`（`<Calendar numberOfMonths={undefined}>` 也回退到默认值 1），因此该侧不可达 | 保留为防御性代码；不写假测试 |
| `components/calendar/Calendar/Calendar.tsx`（重构时删除的冗余守卫） | 原 `selectDay` 里的 `if (isDisabledDay(day)) return;` | 禁用判定已下移到 `CalendarDay`（同一个判定同时决定按钮 `disabled` 与点击是否回调），父级再判一次永远为假；删除后 206 条日历用例仍全绿（变异式确认） | 已删除；如将来有第二个调用方（不经过 `CalendarDay`），需要把守卫移回 `selectDay` |
| `components/tooltip/TooltipContent/usePresence.ts`（重构时删除的冗余条件） | 原 `else if (!visible) { setMounted(false) }` | 前一个分支已是 `if (visible)`，进入 else 时必然 `!visible`，该条件恒真；改为 `else` 后 33 条 tooltip 用例全绿 | 已删除；`mounted` 的进入/退场/兜底/抢占四条路径均有独立用例 |
| `components/resizable/useResizablePanelGroup.ts`（真正不可达） | `applySizes` 的 `values[index] !== undefined`（108/115）、`initialize` 的「已初始化」早返回（131）、`typeof window === "undefined"` SSR 守卫（133/142） | 调用路径上不可达：`scheduleInitialize` 已先判 `!initialized`，故 `initialize` 不会二次进入；`applySizes` 的入参长度总与注册面板数一致；jsdom 里 `window` 始终存在（SSR 守卫属测试能力缺口） | 保留为防御性代码/SSR 兜底；不写假测试 |
| `components/resizable/useResizablePanelGroup.ts`（**下一轮补测**） | 各 `store[id] ?? 0` 兜底（68/191/192/226/237/239/249/252）、`if (!adjacent) return`（205/213/268） | 这些分支只有在「面板已注册、但 `initialize` 的微任务尚未跑完」时才会走到，而现有引擎用例都在 `flushInit()` 之后再操作 | **不靠 §8 免测**：下一轮补「初始化前调用命令式 API」（`collapsePanel`/`expandPanel`/`setPanelSize`/`nudgeAdjacent`）的用例把它们覆盖掉 |
| `components/questionnaire/questionnaire.aria.ts`（重构时删除的冗余兜底） | `buildItemKeyshortcuts` 末尾的 `\|\| undefined` | 数组首项是常量 `"Meta+Enter Control+Enter"`，`filter(Boolean).join(" ")` 永不为空串，`\|\| undefined` 恒不命中；删除后问卷全量用例仍全绿 | 已删除；非激活题目仍由开头的 `if (!active) return undefined` 返回 undefined |
| `components/resizable/ResizableHandle/resizable.handle-drag.ts` | `flush` 与 `onPointerUp` 里的 `drag.pending !== null`（67/114） | `frame !== null` 与 `pending` 在同一处赋值，因此「有帧待落地但 pending 为空」不可达；去掉守卫后 resizable 全量用例仍全绿（变异测试确认）；键盘/拖拽拆成独立模块后行号随之变化 | 保留为防御性代码；不写假测试。`flush` 的 `!drag` 守卫与 `hasPointerCapture` 的两个分支已有专门用例（迟到帧、捕获丢失） |
| `components/resizable/ResizableHandle/ResizableHandle.tsx` | `adjacent()` 里 `el ? … : undefined` 的 `undefined` 侧（34） | Solid 的属性 effect 在 ref 赋值之后才求值，且组件卸载时 effect 先于 ref cleanup 释放，因此该侧不可达；改成 `ctx.resolveAdjacent(el!)` 后 228 条用例仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/message-scroller/message-scroller.anchoring.ts` | `if (applied)` 的 false 侧（207） | 进入该函数时已由顶部守卫排除「没有视口 / 已应用过 / 会话为空」，而三条分支（start / end / last-anchor）在**有视口**且目标在内容内时都会返回 true，因此 `applied` 恒为 true；改成无条件 `defaultApplied = true; setPendingScroll(false);` 后 message-scroller 全量 220 条用例仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/message-scroller/message-scroller.anchoring.ts` | `previousFirst ? list.indexOf(previousFirst) : -1` 的 false 侧（300） | `previousCount > 0` 蕴含上一轮的 `firstItem` 非空（`itemCount` 与 `firstItem` 在同一次 `handleContentChange` 里一起赋值），因此 `previousFirst` 不可能为空；改成 `list.indexOf(previousFirst as HTMLElement)` 后 220 条用例仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/combobox/ComboboxInput/ComboboxInput.tsx` | `if (disabled()) return;`（41）的 true 侧 | Solid 的事件委托实现是 `if (handler && !node.disabled)`，会直接跳过被禁用的节点，而 `disabled()` 与传给 input 的 `disabled` 是同一个表达式，因此「input 已禁用却收到 keydown」在 jsdom 与真实浏览器都到不了；把该行换成 `if (false)` 后 combobox 全量 182 条仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/carousel/CarouselNext/CarouselNext.tsx`、`CarouselPrevious/CarouselPrevious.tsx` | `if (!event) return;`（25）的 true 侧 | `onClick` 由 Solid 的事件委托调用，必然带事件对象；该守卫只是给 `MouseEventHandler<T>` 的可选形参留兜底，把整行删掉后 carousel 全量 100 条仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/image`（ImageElement / Image.utils） | 若干防御性守卫的短路侧：`handleRef` 的 `if (!img) return;`（ref 回调总是带元素）、`typeof internal.onError !== "function"`（类型已收窄为函数）、`config.unoptimized` / `local.loading === "eager"` 等在与其它条件组合时不会被子集输入命中 | 这些分支要么是类型层面已排除、要么是给未来调用方留的兜底；语句/函数/行都已 100%，未逐个做变异测试（它们是单行早退，删掉不改变任何可达路径） | 保留为防御性代码；不写假测试 |
| `components/context-menu/ContextMenuTrigger/useContextMenuTrigger.ts` | `if (!press) return;` 的 true 侧（43） | `press` 只在 touch/pen 的 pointerdown 里赋值，而 pointerup/pointercancel 会先清 `press`、紧接着同步 `clearTimeout`；JS 单线程下不存在「press 已清空而定时器仍存活」的时序（分支数据实测 false 侧 4 次、true 侧 0 次） | 保留为防御性代码；不写假测试 |
| `components/slider/SliderTrack/SliderTrack.tsx` | `ref={ctx.setTrackRef}` 编译产物里 `typeof ref === "function" ? … : …` 的「非函数 ref」侧（16） | 源码硬编码函数 ref，该侧恒不命中；把 ref 换成箭头函数后 slider 全量 89 条用例仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/time-picker/TimePickerColumn/TimePickerColumn.tsx` | `if (event) selectOption(...)` 的 false 侧（65） | 选项组件永远把 MouseEvent 传给 `onSelect`（`local.onSelect?.(event)`），因此从公共 API 到不了无事件的一侧；去掉守卫后 time-picker 全量 218 条用例仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/accordion/AccordionTrigger/AccordionTrigger.tsx` | `if (disabled) return;` 的 true 侧（22） | 禁用的 `<button disabled>` 根本不会收到 click（jsdom 与浏览器都不为 disabled 表单控件派发用户点击，Solid 的 JSX `onClick` 又是委托到根节点，因此 `dispatchEvent` 也到不了）；去掉该守卫后 accordion 全量 43 条用例仍全绿（变异测试确认） | 保留为防御性代码；不写假测试 |
| `components/scroll-area/**`、`components/switch`、`components/checkbox`、`components/toast/Toast/**`、`components/toast/Toaster/Toaster.tsx`、`components/resizable/**` 等 | 组件函数体最后一行（`};`）上的一条隐性分支 | Solid JSX 转译后 `createMemo`/`clsx` 的隐式 else 被 v8 计为分支，与源码逻辑无关（同仓库既有已测组件同样存在 1 条） | 不处理：语句/行/函数三项均为 100%，该条为转译产物 |

---

## 9. CI 门禁

`.github/workflows/pr-check.yml` 已经加好（在原有 `bun run check` 之后）：

```yaml
- name: Test with coverage
  id: coverage
  run: bun run test:coverage

- name: Guard against test cheating
  run: |
      if grep -rnE '(it|describe|test)\.(only|skip|todo)\(' tests --include='*.test.ts' --include='*.test.tsx'; then
        echo "::error::检测到 .only / .skip / .todo，见 TESTING.md §4.7"
        exit 1
      fi
      if grep -rnE '(istanbul|v8|c8) ignore' tests --include='*.test.ts' --include='*.test.tsx'; then
        echo "::error::检测到覆盖率屏蔽注释，见 TESTING.md §9"
        exit 1
      fi
```

覆盖率结果会由 `.github/scripts/coverage-comment.mjs` 整理成一条 **PR 评论**：

- 用隐藏标记 `<!-- neut-ui-coverage-report -->` 在**同一个 PR 上原地更新**，不会刷屏；
- 内容：四项总览（覆盖数 / 百分比 / 门槛 / 状态）、**本 PR 改动的源码文件**逐个的覆盖率、
  以及"最接近达标"的未覆盖文件（整个仓库有几百个 0% 的文件，列它们只是噪声）；
- 该步骤 `if: always()` + `continue-on-error: true`：**没达标时才更需要看到报告**，
  而 fork PR 只有只读 token、发不出去也不该让门禁再多一条红；
- 明细（`lcov-report` 的 HTML）随运行产物 `coverage-report` 上传，保留 7 天；
- 本地核对：`node .github/scripts/coverage-comment.mjs --print`。

因此 `vitest.config.ts` 的 coverage reporter 里有 `json-summary`（多写一份机器可读的
汇总，不改变任何门槛）；`reportOnFailure: true` 保证**即使门禁失败也会写出报告**，
否则报告恰恰在最需要的时候缺席。

门禁规则：

1. 覆盖率四项指标**全部 100%**，否则 `vitest` 退出码非 0、CI 失败
   （已在本地实测：阈值生效）；
1.1 组件约定守卫 `node .github/scripts/check-classlist.mjs`：凡在 `splitProps` 里
   拿走 `classList` 的文件，必须在元素上写 `classList={...}`，否则报错——
   `classList` 是 `BaseProps` 的公开 prop，被摘掉却不应用等于**静默丢弃**
   （仓库里曾一次性存在 119 个这样的文件）。确实不支持时写
   `// classlist-opt-out: <原因>` 显式豁免。写新组件时最容易漏这一条；
2. 机械检查 `.only` / `.skip` / `.todo` 与覆盖率屏蔽注释（只扫 `tests/`，
   源码目录里本就不该有测试）；
3. `bun run build` 仍必须通过，且 `dist/` 里不得出现 `*.test.*`
   （测试不在 `src/` 下，`dts.exclude` 只是兜底）。

本地提交前至少跑：

```bash
bun run check          # tsc + biome
bun run test:coverage  # 必须四项 100%
bun run build
```

### 9.1 进阶：变异测试（可选但强烈推荐）

覆盖率骗得过 CI，骗不过变异测试。想验证"测试是不是真的有效"，可以
临时故意改坏实现（把 `if (!import.meta.env.PROD)` 改成 `if (true)`、
把 `% tabs.length` 去掉、把 `prev ? top > EXIT...` 的阈值改掉），
跑一遍测试，**必须变红**。如果一个"bug"改下去测试还是绿的，说明那块
没有真正的断言——补上，然后还原实现。

这类实验**只用于自查，不要提交**（不要留下被改坏的实现）。

---

## 10. 一页速查：PR 自查清单

提交前逐条打勾，任何一条打不上就是没做完：

- [ ] 新增/修改的每个源文件都在 `tests/` 下有镜像路径的同名 `.test.ts(x)`（源码目录里不放测试），四个覆盖率指标 100%；
- [ ] 受控/非受控两条路径都有独立用例；
- [ ] 每个 `data-*` 状态属性都有"设置"与"清除"双向断言；
- [ ] ARIA 交叉引用成对断言，查询用 `getByRole` 而非 class；
- [ ] 键盘交互每个按键分支都有用例，包含 disabled 跳过与 loop 两侧；
- [ ] 事件回调的第二个参数（事件详情）被断言，含 `cancel()` 语义；
- [ ] 期望值是手写常量/具体值，不是重算一遍的公式；
- [ ] 没有 `toMatchSnapshot`、没有 `it.only` / `.skip`、没有 `istanbul ignore`；
- [ ] 模块级可变状态（ref 计数、warn 缓存、定时器）在每个用例后重置；
- [ ] bug 修复附带一个先失败后通过的回归用例；
- [ ] `DESIGN.md` 的 `## 测试计划` 与实际测试文件一致。
