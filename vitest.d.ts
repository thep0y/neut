/**
 * 让 `expect(el).toHaveAttribute(...)` 等 jest-dom 匹配器在测试里获得类型。
 *
 * 不能直接在 tsconfig 的 `types` 里写 `@testing-library/jest-dom/vitest`：
 * 该包对 vitest 的 `Assertion` 接口做的是 `extends TestingLibraryMatchers<any, T>`，
 * 与当前 vitest 版本自带的 `Assertion<R extends void | Promise<void> = void, T = unknown>`
 * 声明不兼容，会直接报 TS2428（All declarations of 'Assertion' must have identical
 * type parameters）。因此在仓库内自己写一份声明，只做接口合并，
 * 参数列表与 vitest 自身保持完全一致。
 *
 * 运行时由 `vitest.setup.ts` 里的 `import "@testing-library/jest-dom/vitest"` 注入。
 */
import "vitest";

declare module "vitest" {
  interface Assertion<R extends void | Promise<void> = void, T = unknown> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveAttribute(name: string, value?: unknown): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveAccessibleName(name?: string | RegExp): R;
    toHaveClass(...classNames: string[]): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeChecked(): R;
    toHaveValue(value?: unknown): R;
    toHaveFocus(): R;
    toBeEmptyDOMElement(): R;
  }
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): void;
    toHaveAttribute(name: string, value?: unknown): void;
  }
}
