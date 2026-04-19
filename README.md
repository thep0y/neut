## Dome

这是一个类似shadcn的solidjs组件库，与shadcn不同的是，本组件库不依赖于任何第三方组件库，相比shadcn的优势是能够避免上游组件库的bug，也更容易及时修复bug。

## 使用

与shadcn类似，不需要安装本组件库，而是直接复制某个组件的代码，但也可安装本组件库作为依赖。

### 复制组件代码

本组件的代码基于tailwindcss样式库，因此你需要安装tailwindcss作为开发依赖，具体安装方式请参考tailwindcss文档。

除了tailwindcss外，本组件库还内置了两个样式文件：

- animate.css
- toast.css

在使用时需要在你项目的主样式文件中导入animate.css，如果你要复制或使用toast组件，也需要导入toast.css。

需要注意的是，toast.css本身是临时性的样式文件，因为toast组件移植自sonner，尚未针对性地对toast的组件样式进行相应修改，但在未来的版本中一定会删除这个样式文件。

最终的项目结构类似于：

```
- styles
  - animate.css
  - toast.css
- index.css
```

`index.css`文件头：

```css
@import "tailwindcss";
@import "./styles/animate.css";
@import "./styles/toast.css";
```

除了样式文件外，还需要安装样式合并依赖`tailwind-merge`及样式定义依赖`class-variance-authority`：

```bash
bun i tailwind-merge class-variance-authority
```

然后在`lib/utils`中创建一个`clsx.ts`文件，内容如下：

```ts
import { twMerge } from "tailwind-merge";

export const clsx = (...classes: (string | undefined | false)[]): string => {
  return twMerge(classes.filter(Boolean));
};
```

当然，并非所有组件都需要使用这两个样式依赖，具体可查看shacn文档。我正在考虑将这两个工具独立实现以减少对第三方库的依赖。

现在假如你需要使用`Button`组件，则可以直接复制`button`目录中的代码，在复制时你可以看到，本组件库出于可维护性和单一职责原则的考虑，所有组件的实现都并非放在单文件中，因此建议你直接克隆本项目到本地，然后复制组件目录到你的项目中，否则请按`button`的目录结构创建相对应的文件后复制每个文件中的相应代码：

```
./src/components/button/
└── Button.styles.ts
└── Button.tsx
└── Button.types.ts
└── index.ts
```

### 安装

本组件库也支持作为依赖安装：

```bash
bun i @dome/ui
```

安装后需要在根样式文件中导入样式及注册样式资源：

```css
@import "../node_modules/@dome/ui/styles/index.css";
@source "../node_modules/@dome/ui/dist";
```

然后即可如同其他组件库一样导入并使用组件：

```tsx
import { Button } from "./@dome/ui";

const App = () => {
  return <Button>Click me</Button>;
};
```
