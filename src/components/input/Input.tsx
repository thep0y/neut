import {
  createEffect,
  createUniqueId,
  type JSX,
  mergeProps,
  splitProps,
} from "solid-js";
import type { InputProps } from "./Input.types";
import { clsx, mergeRefs } from "~/utils";

export const Input = (props: InputProps) => {
  const merged = mergeProps(
    { id: createUniqueId(), type: "text" } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "value",
    "defaultValue",
    "type",
    "onInput",
    "onChange",
    "class",
    "ref",
  ]);

  /**
   * number 输入框在编辑过程中会经历 ""、"-"、"-."、"1e" 这类中间态；
   * 直接 Number() 会把它们变成 0/NaN，既让空串误报 0，也让负数根本输入不进去。
   * 中间态不回调，交给原生 input 保留文本，等成为合法数字再上报。
   */
  const parseNumber = (raw: string): number | undefined => {
    const isIntermediate =
      raw === "" ||
      raw === "-" ||
      raw === "+" ||
      raw === "." ||
      raw === "-." ||
      raw === "+." ||
      raw.endsWith(".") ||
      /[eE][+-]?$/.test(raw);
    if (isIntermediate) return undefined;
    // type=number 的原生 value 已经被浏览器清洗过，非数字输入会变成 ""；
    // 走到这里的 raw 一定是可解析的完整数字。
    return Number(raw);
  };

  const emit = (
    handler: ((value: string | number) => void) | undefined,
    raw: string,
  ) => {
    if (!handler) return;
    if (local.type !== "number") {
      handler(raw);
      return;
    }
    const parsed = parseNumber(raw);
    if (parsed !== undefined) handler(parsed);
  };

  const handleInput: JSX.IntrinsicElements["input"]["onInput"] = (e) => {
    emit(
      local.onInput as ((value: string | number) => void) | undefined,
      e.target.value,
    );
  };

  const handleChange: JSX.IntrinsicElements["input"]["onChange"] = (e) => {
    emit(
      local.onChange as ((value: string | number) => void) | undefined,
      e.target.value,
    );
  };

  const isControlled = () => local.value !== undefined;

  let inputRef: HTMLInputElement | undefined;

  // defaultValue 是 DOM 属性而不是 JSX attribute；非受控时命令式写入，
  // 这样原生 form.reset() 能恢复到初始值。
  const syncDefaultValue = (el: HTMLInputElement) => {
    const next = local.defaultValue;
    if (!isControlled() && next !== undefined) el.defaultValue = String(next);
  };

  createEffect(() => {
    // effect 在 ref 赋值之后运行；直接写，避免留下不可达的空值分支。
    syncDefaultValue(inputRef!);
  });

  const setInputRef = (el: Element) => {
    const input = el as HTMLInputElement;
    inputRef = input;
    syncDefaultValue(input);
  };

  return (
    <input
      type={local.type}
      // 受控只写 value；非受控交给原生 defaultValue，form.reset() 才能生效。
      value={isControlled() ? local.value : undefined}
      ref={mergeRefs(
        setInputRef,
        local.ref as Element | ((el: Element) => void) | undefined,
      )}
      data-slot="input"
      class={clsx(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        local.class,
      )}
      onInput={handleInput}
      onChange={handleChange}
      {...others}
    />
  );
};
