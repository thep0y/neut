# Neut

> **SolidJS Native Component Library, Zero External Dependencies**

Neut is inspired by [shadcn/ui](https://ui.shadcn.com), but reimplemented entirely from scratch with SolidJS. Unlike shadcn, Neut **does not depend on any upstream component library** (like `@radix-ui` or `@base-ui`).

**Advantages:**

- **Fully Controllable**: All component source code lives in your project — modify them however you want.
- **No Upstream Limitations**: You won't get blocked by third-party component bugs (styling or logic). Fix issues without waiting for a release.
- **SolidJS Native**: Leverages SolidJS's fine-grained reactivity for better performance.

**Let's be clear about the downsides:**

To be honest, because Neut doesn't rely on more mature upstream component libraries, it may not cover all edge cases. There will be fixable but still unresolved issues — such as bugs, accessibility gaps, etc. Therefore, **it is not recommended for large projects or scenarios with strict quality requirements**.

> [!WARNING]
>
> **Under active development — use with caution**
>
> The project is still evolving rapidly, APIs may change. **Do not use in production yet.**

---

## 🚀 Quick Start

Neut follows a **"copy-paste, then use"** pattern (similar to shadcn), though you can also install it as a regular dependency.

### 1. Prerequisites (Peer Dependencies)

Before using any components, make sure these dependencies are installed in your project:

| Dependency                   | Purpose                  | Install Command                  |
| :--------------------------- | :----------------------- | :------------------------------- |
| **Tailwind CSS**             | Styling engine           | `bun i -D tailwindcss`           |
| **Lucide Solid**             | Icon library             | `bun i lucide-solid`             |
| **Tailwind Merge**           | Style merging tool       | `bun i tailwind-merge`           |
| **Class Variance Authority** | Style variant definition | `bun i class-variance-authority` |

**Configure your stylesheet**

In your main stylesheet (e.g., `index.css` or `globals.css`), import in this order:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Neut built-in styles (from animate.css and toast.css) */
@import "./styles/animate.css";
@import "./styles/toast.css";
```

**Create a utility function**

Write a style merging function in `src/lib/utils/clsx.ts`:

```ts
import { twMerge } from "tailwind-merge";

export const clsx = (...classes: (string | undefined | false)[]): string => {
    return twMerge(classes.filter(Boolean));
};
```

> [!NOTE]
> **About the stylesheet files**
> `toast.css` is currently a temporary solution (ported from Sonner). We will rewrite the styles later to remove this external dependency.

### 2. Method A: Copy the source code (recommended)

This is the most flexible approach. Non-primitive components may have overlapping functionality (e.g., `AlertDialog` and `Dialog`), but they are standalone and independent.

1.  Check the component source code in the [GitHub repo - Components](https://github.com/thep0y/neut).
2.  Copy the directory of the component you need (e.g., `button`) into your project.

**Example directory structure:**

```bash
src/
└── components/
    └── button/
        ├── Button.styles.ts   # Styling logic
        ├── Button.tsx         # Component implementation
        ├── Button.types.ts    # Type definitions
        └── index.ts           # Export entry
```

### 3. Method B: Install as a dependency

If you prefer version management, you can also install via a package manager.

**Install:**

```bash
bun i @neut/ui
```

**Import styles:**

Add this to your root stylesheet:

```css
@import "../node_modules/@neut/ui/dist/ui.css";
```

**Use components:**

```tsx
import { Button } from "@neut/ui";

function App() {
    return <Button>Neut Button</Button>;
}
```

**Full example:** [Neut Example Project](https://github.com/thep0y/neut/tree/main/example)

---

## 📚 References & Acknowledgements

The project's design and inspiration come from these great projects:

- **shadcn/ui**: [Installation Guide](https://ui.shadcn.com/docs/installation)
- **Sonner**: [Getting Started](https://sonner.emilkowal.ski/getting-started)
- **SolidJS**: [Official Website](https://www.solidjs.com/)

---

## 💡 Why this pattern?

Neut follows the philosophy of **"headless components"** and **"building your own blocks"**. That means:

1.  **No overhead**: Only the code you actually include is used.
2.  **Freely customizable styles**: Tailwind classes are right in front of you — tweak them anytime.
3.  **Leverage SolidJS strengths**: Compared to React, SolidJS's fine-grained reactivity gives you high-performance components with less code and cleaner logic.
