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

门槛分两层，两者都必须通过：

**第一层（vitest 阈值）**：函数覆盖率 **100%**（它是可达的）。

**第二层（真实缺口零遗漏脚本）**：`bun run check:branches` 要求
「`src/**` 里任何未覆盖的语句 / 分支 / 函数，若不与编译器归因产物重合、
也不属于已登记原因的不可达防御代码，则失败」。

为什么语句 / 分支 / 行不再用百分比阈值，见 §8：SolidJS 的 JSX 编译会把
模板提升到模块顶层，V8 覆盖率会把 `solid-js/web` 内部的条件归因到我们的文件上
（**每个使用 JSX 的模块各一条**，且没有任何源码构造与之对应）；再加上
文档化的 `ref={el}` 会编译出恒有一侧不可达的三元。"分支 100%"在**保留 Solid
惯用写法**的前提下结构上不可达，百分比阈值只会逼人去把惯用写法改写成特殊情况
（本仓库真的这么错过一次，见 §4.1 的补充）。

第二层**比对真实分支要求一个百分比更严格**：它不允许任何一条真实缺口存在，
并且白名单条目一旦与实际缺口对不上（代码已覆盖或行号漂移）同样失败，
避免名单腐烂成"随便放行"。

"新增代码"和"既有代码"一视同仁。回归测试与覆盖率提升可以分批提交，但
**任何一个 PR 都不能让真实缺口变多**。

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

### 1.3 真实缺口变多 = 失败

`vitest --coverage` 的 `functions` 阈值设为 100，低于即退出码非 0；
语句 / 分支 / 行的把关交给 `bun run check:branches`（见 §8）。
不要把 `functions` 阈值调低，不要写 `thresholds: { autoUpdate: true }`
（它会把阈值悄悄调低到当前值，等于没有门槛）。

`check:branches` 的放行名单分两张表，**都不允许"顺手"扩大**（§4.6 同样适用）：

- `UNREACHABLE`：已证明在当前环境里结构上不可达的防御代码，每条必须写清原因；
- `DEFERRED`：确属竞态 / 时序、但**尚未构造出用例**的缺口。它只是不阻塞门禁，
  每次运行都会打印成技术债——不许把"其实能测、只是没测"的东西塞进
  `UNREACHABLE` 冒充不可达。

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
   `// 测试能力缺口：<分支> 需要真实布局，无法在 jsdom 断言；已登记于 check-branches.mjs`，
   并把条目加到 `.github/scripts/check-branches.mjs` 的 `UNREACHABLE`（已证明不可达）
   或 `DEFERRED`（确认是竞态但暂无用例）——**门禁直接读那里**，见 §8；
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

## 8. 覆盖率缺口：编译器归因产物与不可达防御代码

这一节替代了原先那张"逐条登记能力缺口"的长表——原因见下：那张表里
大量条目的前提是错的（把可达的分支写成了"jsdom 不可达"），而且它没有
任何机械化的执行手段。现在**权威登记处是 `.github/scripts/check-branches.mjs`
里的 `UNREACHABLE` / `DEFERRED` 两张表**，因为门禁直接读它、并会在条目失效时失败。

### 8.1 两类"结构性不可达"，与它们为什么不能靠改代码消除

**（a）Solid JSX 编译的归因产物（当前 336 条）**

Solid 会把模板提升到模块顶层。V8 覆盖率把 `solid-js/web` 内部的某个条件
归因到**我们的文件**上，落点是"模块最后一个顶层语句"。

实测证据（`babel-preset-solid` + `v8` 覆盖率）：

- 一个只写 `<Button>hi</Button>` 的模块（连元素模板都不产生），转译结果里
  **没有任何条件语句**，V8 仍报出一条 `if` 分支；
- 该分支的位置在没有分支构造的行上（例如组件结尾的 `};`，或
  `export const ANSWER = 42;`）；
- 也就是说：**每个使用 JSX 的模块各有一条**，与是否使用 `ref`、写了什么业务逻辑无关。

**（b）Solid `ref` 的三元（当前 11 条）**

[官方文档](https://docs.solidjs.com/concepts/refs) 把变量形式列为 `ref` 的**主用法**：

> To use `ref`, you declare a variable and use it as the `ref` attribute:
> `let myElement; <p ref={myElement}>` … If access to an element is needed before it
> is added to the DOM, you can use the callback form

变量形式编译成 `typeof ref === "function" ? ref(el) : el = node`，恒有一侧不可达；
函数引用形式（`ref={ctx.setEl}`）与 signal setter 形式同样如此。
**只有内联箭头这个"特殊情况"不产生三元**——为了覆盖率把 11 处主用法改写成特殊情况，
是在拿工具反向扭曲代码，本仓库不做。

结论：这两类占全部未覆盖分支的绝大多数，且**无法通过修改业务代码消除**，
除非放弃 Solid 的文档化惯用写法。因此门槛从"分支 100%"改为"真实源码构造零遗漏"。

### 8.2 判定规则（`bun run check:branches`）

对每个未覆盖的**分支**条目：

1. 该行源码里没有任何分支构造（`if` / `?` / `&&` / `||` / `??` / `switch` / `case` / `catch`）
   → 判为（a）类归因产物，放行；
2. `cond-expr` 且该行是 `ref={...}` → 判为（b）类，放行；
3. 命中 `UNREACHABLE` → 放行（必须写明不可达原因）；
4. 命中 `DEFERRED` → 放行，但每次运行都会打印成技术债；
5. 其余一律**失败**。

未覆盖的**语句 / 函数**不做归因产物判定（它们一定对应真实源码），只能走 3/4/5。

维护规则：

- 不要为了让它变绿而往名单里加条目（§4.6）；先试着补测试；
- 条目与实际缺口对不上（代码已覆盖 / 行号漂移）会**失败**，必须清理；
- `DEFERRED` 是"确认是竞态、但暂时构造不出用例"的显式债务，不是免测通道；
- 必须针对**全量**覆盖率结果运行（`bun run test:coverage` 之后）；
  用 `--coverage.include` 收窄过的结果会产生大量"名单失效"误报。

### 8.3 仍然值得单独记录的能力缺口（非分支问题）

这类不是"某条分支测不到"，而是**设计上的缺口**，登记在此以便后续对齐上游：

| 位置 | 缺口 | 说明 |
| --- | --- | --- |
| `components/dialog/Dialog/Dialog.types.ts`（AlertDialog / Sheet 继承） | `DialogProps.onOpenChange` 是**单参数** `(open: boolean) => void`，没有 `ChangeEventDetails` | drawer / context-menu / combobox / toggle-group 都有 details，Dialog 家族没有，调用方无从调用 `details.cancel()`（实测 `mock.calls[0].length === 1`）。因此本模块**不存在**"cancel() 被忽略"的缺陷，不能写一条永远为绿的 cancel 断言冒充覆盖。补齐需先给 Dialog 引入 details（属于实现变更） |
| `components/message-scroller/message-scroller.anchoring.ts:207` | 原以为 `if (applied)` 的 false 侧是"滚动失败路径" | **实为不可达**：入口已排除 `!viewport`；`applied` 的三个来源中 `scrollToEnd`/`scrollToStart` 只在 `!viewport` 时返回 `false`，而 `scrollToElement` 只在 `!viewport` 或 `!content.contains(element)` 时返回 `false`——它拿到的元素来自 `measure.items()`（即 `content.children`），同一同步执行内 content 不变，必被包含。已从 `DEFERRED` 转入 `UNREACHABLE` |
| `components/questionnaire/useQuestionnaireRoot.ts:167` | 原为"导航后、focus effect 落地前该项被禁用"的竞态 | **已补测**：非受控模式下 `batch(() => { goNext(); setDisabled(true) })` 让两次变更进入同一次 effect 刷新。注意受控模式走不到这里——受控时 `navigate` 不改 `activeName`，effect 会在第一个守卫早退 |

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

1. 覆盖率门槛分两层，**两层都要过**（见 §1.1 / §8）：
    `bun run test:coverage` 把关函数 100%；`bun run check:branches` 把关
    「真实源码构造零遗漏」——任何未覆盖的语句/分支/函数，若不对应 Solid 的
    JSX 编译归因产物、也不是已登记原因的不可达防御代码，即失败；
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
bun run test:coverage  # 函数必须 100%（并产出 coverage-final.json）
bun run check:branches # 真实源码构造零遗漏（见 §8）
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

## 10. 增量测试（开发时快速反馈）

全量跑一次约 1m50s（456 个文件 / 5100+ 用例），其中 jsdom 环境重建占了
四分之一以上的 CPU。日常改一个组件时并不需要全量：

```bash
bun run test:affected                    # 与 HEAD 比较，只跑受影响的测试
bun run test:affected -- --base main     # 与某个分支比较（CI 用）
bun run test:affected -- --dry-run       # 只打印将跑哪些文件
```

选择逻辑（`.github/scripts/test-affected.mjs`）：

1. **触碰全局基础设施就全量**：`vitest.config.ts` / `vitest.setup.ts` /
   `tsconfig.json` / `package.json` / `biome.json` / `check-classlist.mjs` /
   `TESTING.md` 等一旦变动，影响面是全局的，模块图推不出来。这是**精确清单**
   而不是整个 `.github/scripts/` 目录——`coverage-comment.mjs` 只生成 PR 评论，
   不参与测试，没必要因此触发全量。
2. **测试脚手架改了要按引用者扩散**：`tests/**` 下非 `*.test.*` 的文件
   （`test-utils.ts` 等）自己不匹配测试 glob，vitest 的 `--changed` 也不认识
   「脚手架 → 引用者」这条边，脚本会扫描 import 把它引用者一并加上。
   匹配的是**具体 import 别名**（`~tests/...`，TESTING.md §3 规定）而不是子串，
   否则会把名字里恰好含 `test-utils` 的其它模块一起拖进来
   （实测会从 18 个误扩到 100 个）。
3. 其余情况交给 vitest 的 `--changed`，它按模块图找出导入了改动文件的测试。

### 与覆盖率门禁的关系（重要）

**增量跑不校验覆盖率**，只用于开发时的快速反馈。只跑一部分测试时，
全仓四项 100% 的门槛必然失败——那个门槛衡量的是"整个仓库的测试是否完整"，
而这正是它的意义所在。

因此：

- **提交前与 CI 一律跑全量** `bun run test:coverage`，门禁不做任何放宽；
- 增量结果**不能**用来判断"可以提交了"，只能用来快速发现"跑挂了"；
- CI 里增量步骤是 `continue-on-error: true`，它只是提前给反馈，
  红/绿都不影响真正的门禁。

### 两个看似更快的做法，实测不可用

- **`isolate: false`**（复用 jsdom 实例，实测 1m51s → 30s）**不可用**：
  同一个 `window` 跨文件共享，而本仓库有测试会删掉 `window` / `matchMedia`
  来模拟 SSR，状态泄漏会导致**随机文件失败**——同一条命令连续跑两次，
  失败的集合不一样。这类"偶发红"比慢更伤。
- **`pool: 'vmThreads'`**（保留每文件隔离、只共享环境）同样**不可用**：
  实测 4 个 SSR 用例失败，原因同上。

也就是说，这个仓库为了保住"每文件隔离"必须接受环境重建的成本；真正的省时
手段是**少跑**（本节的增量），而不是**少隔离**。按当前规模，改单个组件的
反馈循环从 ~110s 降到 ~7s。

---

## 11. 一页速查：PR 自查清单

提交前逐条打勾，任何一条打不上就是没做完：

- [ ] 新增/修改的每个源文件都在 `tests/` 下有镜像路径的同名 `.test.ts(x)`（源码目录里不放测试），函数 100%，且 `bun run check:branches` 通过；
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
