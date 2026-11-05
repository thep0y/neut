# Neut

> **SolidJS native component library — no upstream component runtime**

Neut is a from-scratch SolidJS implementation of the [shadcn/ui](https://ui.shadcn.com) model. Unlike shadcn, it does **not** depend on `@radix-ui`, `@base-ui`, Kobalte, or any other component runtime.

It only relies on the small set of packages a shadcn project already installs — `solid-js`, `class-variance-authority`, `lucide-solid`, and `cn` — and uses Tailwind CSS v4 for styling.

**Status:** pre-1.0 · 60 components · under active development.

**Advantages**

- **Fully controllable**: every component lives in your project — change anything you want.
- **No upstream limitations**: third-party component bugs (styling or behavior) no longer block you.
- **SolidJS native**: fine-grained reactivity instead of a virtual DOM.

**Known trade-offs**

Because Neut does not build on a mature upstream component library, some edge cases and accessibility details may still be missing. It is **not recommended for large projects or products with strict quality requirements** yet.

> [!WARNING]
>
> **Under active development — use with caution**
>
> APIs may change between releases. **Do not use in production yet.**

---

## 📚 Documentation

| Document                                               | Contents                                                                         |
| :----------------------------------------------------- | :------------------------------------------------------------------------------- |
| [Documentation index](./docs/README.md)                | Map of all user and contributor docs                                             |
| [Getting Started](./docs/getting-started.md)           | Install, Tailwind v4 setup, theme tokens, dark mode, copying source              |
| [Component Catalog](./docs/components.md)              | Every exported component and its parts                                           |
| [Custom component guides](./docs/components/README.md) | Detailed APIs for the self-built/complex components                              |
| [Architecture](./docs/architecture.md)                 | Controlled/uncontrolled state, change-event details, polymorphism, styling rules |
| [Positioner](./docs/positioner.md)                     | The built-in floating positioning engine                                         |
| [Hooks](./docs/hooks.md) / [Utils](./docs/utils.md)    | Public hooks and utilities                                                       |
| [Design notes](./docs/README.md#设计文档索引)          | Index of per-component design documents (Chinese)                                |
| [TESTING.md](./TESTING.md)                             | Test layout, coverage gates, contribution rules                                  |
| [AGENTS.md](./AGENTS.md)                               | Repository conventions and branch/PR workflow                                    |

> The internal design and testing documents are written in Chinese; the README is kept in both English and Chinese.

---

## 🚀 Quick Start

Neut follows a **"copy-paste, then use"** pattern (like shadcn), and can also be installed as a regular dependency.

### 1. Requirements

- **Bun** for repository scripts; consumers may use any package manager.
- SolidJS `^1.9.15`.
- Tailwind CSS v4.

### 2. Install

```bash
# library + runtime peer dependencies
bun i @neut/ui solid-js class-variance-authority lucide-solid cn

# Tailwind CSS v4
bun i -D tailwindcss @tailwindcss/vite
```

| Dependency                   | Purpose                                                 | Version   |
| :--------------------------- | :------------------------------------------------------ | :-------- |
| **solid-js**                 | Runtime                                                 | `^1.9.15` |
| **class-variance-authority** | Variants                                                | `^0.7.1`  |
| **lucide-solid**             | Icons                                                   | `^1.51.0` |
| **cn**                       | Class-name merging (replaces `clsx` + `tailwind-merge`) | `^0.4.0`  |
| **tailwindcss**              | Styling engine                                          | `^4`      |

**Configure Vite**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
});
```

**Import the stylesheet**

In your application entry stylesheet, import Tailwind first, then Neut's compiled styles:

```css
@import "tailwindcss";
@import "../node_modules/@neut/ui/dist/ui.css";
```

> [!NOTE]
> Neut ships one compiled stylesheet, `dist/ui.css`. It contains the design tokens, dark theme, animations, scroll-fade helpers, and the i18n font/line-height rules. There is no separate `toast.css` or `animate.css` to import.

**Theme and dark mode**

Design tokens are CSS custom properties (`--background`, `--primary`, `--border`, ...). Override them in `:root`, and switch dark mode with `data-theme="dark"` on `<html>` (not a `.dark` class):

```html
<html data-theme="dark">
```

See [Getting Started](./docs/getting-started.md) for the full token list and the optional language/font setup.

### 3. Package exports

| Entry                        | Contents                             |
| :--------------------------- | :----------------------------------- |
| `@neut/ui`                   | All components, hooks, and utilities |
| `@neut/ui/hooks`             | Public hooks                         |
| `@neut/ui/utils`             | Public utilities                     |
| `@neut/ui/components/<name>` | A single component entry             |
| `@neut/ui/dist/ui.css`       | Compiled stylesheet                  |

### 4. Method A: Copy the source (recommended)

1. Copy the component directory you need, for example `src/components/button/`, into your project.
2. Copy the shared modules it imports: `src/utils/`, `src/types/`, `src/hooks/`, and — for any floating component — `packages/positioner/src/` (map `@neut/positioner` to it; the published package already bundles it).
3. A few components compose others internally (for example `AlertDialog` → `Dialog`, `DatePicker` → `Calendar`/`Popover`/`Button`). Copy those dependencies too, or use the package entry.
4. Keep the `~/*` alias (or rewrite the imports) so `~/utils`, `~/types`, `~/hooks`, and `~/lib` resolve.
5. Copy or import the styles: `src/styles/index.css` (source copy) or `@neut/ui/dist/ui.css` (package). Without the design tokens and animation utilities, components render but lose theme colors/motion.

### 5. Method B: Install as a dependency

```bash
bun i @neut/ui
```

Import the stylesheet as shown above, then use components:

```tsx
import { Button } from "@neut/ui";

function App() {
  return <Button>Neut Button</Button>;
}
```

A complete consumer project lives in [`example/`](./example).

---

## 🧩 Components

Neut currently ships **60 components**. The full catalog, including parts and key props, is in [`docs/components.md`](./docs/components.md).

- **Layout & structure**: Accordion, AspectRatio, Card, Carousel, Collapsible, Resizable, ScrollArea, Separator, Sidebar, Tabs, Table
- **Forms & input**: Button, ButtonGroup, Calendar, Checkbox, Combobox, DatePicker, Field, Input, InputGroup, Label, NumberInput, Questionnaire, RadioGroup, Select, Slider, Switch, Textarea, TimePicker, Toggle, ToggleGroup
- **Overlays**: AlertDialog, ContextMenu, Dialog, Drawer, DropdownMenu, HoverCard, Popover, Sheet, Tooltip
- **Feedback & status**: Alert, Badge, Empty, Item, Kbd, Marker, Progress, Skeleton, Spinner, Toast
- **Data display**: Avatar, Breadcrumb, DataTable, Pagination
- **Chat & AI**: Attachment, Bubble, Message, MessageScroller
- **Media & utilities**: Image, ScrollArrows

---

## 🛠 Development

```bash
bun install
bun run dev             # playground at http://localhost:7789
bun run build           # library build to dist/ (JS + d.ts + ui.css)
bun run serve           # preview the production build
bun run check           # tsc + Biome (2.6.4 via devDependencies)
bun run test            # full unit test suite
bun run test:affected   # only tests affected by current changes
bun run test:coverage   # coverage percentage floors
bun run check:branches  # exact branch-coverage gate (no uncovered real gaps)
```

After changing the playground, verify it builds with `bunx vite build ./dev`.

---

## 🤝 Contributing

- **Branch from `main`, PR back to `main`.** `main` is the only long-lived branch; do not commit or push to it directly.
- Use a feature branch per change and keep one responsibility per branch and commit: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `test/`.
- Use stacked PRs when changes depend on each other: point the dependent PR's base at the prerequisite branch; GitHub retargets it to `main` after the prerequisite merges.
- Put tests under `tests/` mirroring `src/`, and read [TESTING.md](./TESTING.md) before writing them.
- Required before merge: `bun run check`, `bun run test:coverage`, and `bun run check:branches`.
- Full conventions live in [AGENTS.md](./AGENTS.md).

---

## 📚 References & Acknowledgements

- **shadcn/ui**: [Installation Guide](https://ui.shadcn.com/docs/installation)
- **Base UI**: [Documentation](https://base-ui.com/)
- **Sonner**: [Getting Started](https://sonner.emilkowal.ski/getting-started)
- **SolidJS**: [Official Website](https://www.solidjs.com/)

---

## 💡 Why this pattern?

Neut follows the **"headless components"** and **"build your own blocks"** philosophy:

1. **No runtime overhead**: only the code you actually use is included.
2. **Styles you can actually edit**: Tailwind classes are right in front of you.
3. **SolidJS strengths**: fine-grained reactivity keeps components fast while keeping the source readable.
