# Image 组件设计方案（SRP）

> 状态：**已实现**
> 移植目标：`next/image`（props 语义与开发期校验）
> 关联代码：`src/components/image/`

## 1. 背景与现状

`Image` 把 `next/image` 的 props 解析能力搬到 Solid：用户写 `<Image src width height />`，
组件把它翻译成原生 `<img>` 的属性集（`src` / `srcSet` / `sizes` / `style` 等），
并在开发环境对常见误用报错或告警。

原实现把**所有**逻辑塞在一个 851 行的 `Image.utils.ts` 里——props 解析、静态导入、
URL 生成、blur SVG、开发校验、性能观察器彼此交织。本次按 SRP 拆分为
「编排 + 5 个专项模块」，编排层只负责顺序与组装。

## 2. SRP 分工

| 关注点 | 归属文件 | 职责 |
| --- | --- | --- |
| 类型契约 | `Image.types.ts` | props / config / 回调 / `ImgProps` 等纯类型，无实现 |
| 默认配置 | `Image.config.ts` | 默认值 + Context + `resolveConfig` 派生字段 |
| **编排** | `Image.utils.ts` | `getImgProps` 的流程：合并默认值 → 规范化 config → 静态导入 → unoptimized/lazy → 校验 → 样式 → 属性组装 |
| 静态导入识别 | `lib/static-import.ts` | `isStaticRequire` / `isStaticImageData` / `isStaticImport` / `getInt` |
| URL 与 srcSet | `lib/loader.ts` | `defaultLoader` / `getWidths` / `generateImgAttrs` |
| blur 占位 | `lib/blur.ts` | `getImageBlurSvg` + `getPlaceholderStyle` |
| 开发期校验 | `lib/dev-checks.ts` | 全部 `!import.meta.env.PROD` 分支：非法用法抛错、可优化项 `warnOnce`、LCP 观察器 |
| 加载完成副作用 | `lib/handle-loading.ts` | decode → 回调 → 清 blur → fill/宽高比开发警告 |
| 加载门面 | `Image.tsx` / `ImageElement.tsx` / `ImagePreload.tsx` | 渲染与 Solid 生命周期 |

### 文件结构

```
src/components/image/
├── index.ts
├── Image.tsx              # 公开组件：读 Context、调 getImgProps、渲染 ImageElement
├── ImageElement.tsx       # 原生 <img> 渲染 + handleLoading 接线
├── ImagePreload.tsx       # priority/preload 时的 <link rel=preload>
├── Image.config.ts        # 默认配置 + Context + resolveConfig
├── Image.types.ts         # 类型契约
├── Image.utils.ts         # getImgProps 编排（不再自实现任何专项逻辑）
├── lib/
│   ├── static-import.ts   # 静态导入识别 + getInt
│   ├── loader.ts          # URL / srcSet / sizes 生成
│   ├── blur.ts            # blur SVG 与占位样式
│   ├── dev-checks.ts      # 开发期校验/警告（仅 DEV 生效）
│   └── handle-loading.ts  # 加载完成后的副作用
└── DESIGN.md
```

## 3. 关键设计取舍

- **`import.meta.env.PROD` 只出现在编排层与 `lib/dev-checks.ts`**：生产构建时整段
  校验代码被裁掉，运行时不留开销；`lib/dev-checks.ts` 里两个 `import.meta.env.PROD`
  分支都可被测试驱动（见 `TESTING.md §2.1`）。
- **`getInt` 用 `undefined` 与 `NaN` 区分语义**：`undefined` = 未提供，
  `NaN` = 提供了但非法。校验层据此给出不同错误信息（缺失 vs 非法）。
- **`warnOnce` 是模块级 Set**：测试必须 `vi.resetModules()` 重新 import，
  否则前一个用例的警告会"吃掉"后一个用例的断言（`TESTING.md §5.6`）。
- **`lib/handle-loading.ts` 不再判空 `img.parentElement`**：函数开头的
  `!img.parentElement || !img.isConnected` 已经排除该情况，重复判断是不可达的死分支
  （已用变异测试确认删除后用例仍全绿）。
- **兼容性**：`Image.utils.ts` 继续 re-export `handleLoading` 与 `VALID_LOADING_VALUES`，
  使 `ImageElement.tsx` / `Image.types.ts` 的既有导入路径无需改动。

## 4. 测试计划

| 文件 | 覆盖内容 |
| --- | --- |
| `Image.utils.test.ts` | `getImgProps` 端到端：基础属性、loading/priority、srcSet/sizes、fill、静态导入、placeholder、参数校验、style 合并 |
| `lib/static-import.test.ts` | `getInt` 的 undefined/NaN/字符串分支；三种静态导入判定 |
| `lib/loader.test.ts` | `defaultLoader`（DEV 抛错 / PROD 不抛）、`getWidths`（sizes/vw/x 描述符）、`generateImgAttrs`（unoptimized / kind=w/x） |
| `lib/blur.test.ts` | blur SVG 的 viewBox / preserveAspectRatio 分支；占位样式回退链 |
| `lib/dev-checks.test.ts` | 全部抛错分支、warnOnce 分支、loader 宽度检测、LCP 观察器（含 SSR / observe 抛错） |
| `lib/handle-loading.test.ts` | 回调、blurComplete、幂等、卸载、decode 失败、fill 警告、宽高比警告 |

覆盖率：`lib/` 下 5 个模块**语句/分支/函数三项均 100%**（`lib/*.test.ts` 各自同名）。
