import { createEffect, createSignal, type JSX } from "solid-js";
import { Minus, Plus } from "lucide-solid";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/input-group";
import { clsx } from "~/utils";
import { createNumberInputChangeEventDetails } from "./create-change-event-details";
import {
  clamp,
  defaultFormatNumber,
  defaultParseNumber,
  roundToStep,
} from "./NumberInput.utils";
import type {
  NumberInputChangeReason,
  NumberInputProps,
} from "./NumberInput.types";

/**
 * NumberInput:数字输入框,带自定义的减/加按钮,避开原生 `type="number"`
 * 在各浏览器里样式与行为都不一致的 spinner。
 *
 * 复用 `InputGroup` 系列(InputGroupAddon/InputGroupButton/InputGroupInput),
 * 输入框用 `type="text"` + `inputmode="decimal"` + `role="spinbutton"`。
 *
 * 这是便捷封装;可组合的 parts(Increment/Decrement/ScrubArea 等)与更多能力
 * 见同目录的 DESIGN.md「后续待实现」。
 *
 * @example
 * ```tsx
 * const [qty, setQty] = createSignal<number | null>(1);
 * <NumberInput value={qty()} onValueChange={(v) => setQty(v)} min={1} max={99} />
 * ```
 */
export function NumberInput(props: NumberInputProps): JSX.Element {
  const step = () => props.step ?? 1;
  const largeStep = () => props.largeStep ?? step() * 10;
  const parse = (text: string) => (props.parse ?? defaultParseNumber)(text);
  const format = (value: number | null) =>
    value === null ? "" : (props.format ?? defaultFormatNumber)(value);

  const isControlled = () => props.value !== undefined;
  const [internalValue, setInternalValue] = createSignal<number | null>(
    props.defaultValue ?? null,
  );
  const value = (): number | null =>
    isControlled() ? (props.value ?? null) : internalValue();

  const [focused, setFocused] = createSignal(false);
  const [text, setText] = createSignal(format(value()));

  // 外部值变化时同步显示文本;正在输入时不要覆盖用户正在敲的内容
  createEffect(() => {
    const next = value();
    if (focused()) return;
    setText(format(next));
  });

  const commit = (
    next: number | null,
    reason: NumberInputChangeReason,
    event?: Event,
  ) => {
    const details = createNumberInputChangeEventDetails(reason, event);
    props.onValueChange?.(next, details);
    if (details.isCanceled) return;
    if (!isControlled()) setInternalValue(next);
  };

  const commitClamped = (
    next: number,
    reason: NumberInputChangeReason,
    event?: Event,
  ) => {
    const clamped = clamp(roundToStep(next, step()), props.min, props.max);
    commit(clamped, reason, event);
    setText(format(clamped));
  };

  const stepBy = (
    delta: number,
    reason: NumberInputChangeReason,
    event?: Event,
  ) => {
    const base = value() ?? props.min ?? 0;
    commitClamped(base + delta, reason, event);
  };

  const handleInput = (raw: string) => {
    setText(raw);
    const parsed = parse(raw);
    // 输入过程中不立即 clamp,否则无法敲入越界中间值;失焦/回车再收敛
    if (parsed !== null) commit(parsed, "input");
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parse(text());
    if (parsed === null) {
      if (value() !== null) commit(null, "blur");
      setText(format(null));
      return;
    }
    commitClamped(parsed, "blur");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (props.disabled || props.readOnly) return;
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        stepBy(step(), "keyboard", event);
        break;
      case "ArrowDown":
        event.preventDefault();
        stepBy(-step(), "keyboard", event);
        break;
      case "PageUp":
        event.preventDefault();
        stepBy(largeStep(), "keyboard", event);
        break;
      case "PageDown":
        event.preventDefault();
        stepBy(-largeStep(), "keyboard", event);
        break;
      case "Home":
        if (props.min !== undefined) {
          event.preventDefault();
          commitClamped(props.min, "keyboard", event);
        }
        break;
      case "End":
        if (props.max !== undefined) {
          event.preventDefault();
          commitClamped(props.max, "keyboard", event);
        }
        break;
      case "Enter": {
        event.preventDefault();
        const parsed = parse(text());
        if (parsed !== null) commitClamped(parsed, "keyboard", event);
        break;
      }
      case "Escape":
        event.preventDefault();
        setText(format(value()));
        break;
      default:
        break;
    }
  };

  const canDecrement = () =>
    !props.disabled &&
    !props.readOnly &&
    !(value() !== null && props.min !== undefined && value()! <= props.min);
  const canIncrement = () =>
    !props.disabled &&
    !props.readOnly &&
    !(value() !== null && props.max !== undefined && value()! >= props.max);

  return (
    <InputGroup class={clsx("w-32", props.class)}>
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          icon={<Minus />}
          aria-label="Decrease"
          disabled={!canDecrement()}
          onClick={() => stepBy(-step(), "button-press")}
        />
      </InputGroupAddon>
      <InputGroupInput
        id={props.id}
        role="spinbutton"
        inputmode="decimal"
        autocomplete="off"
        value={text()}
        onInput={(next: string) => handleInput(next)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        name={props.name}
        placeholder={props.placeholder}
        aria-label={props["aria-label"]}
        aria-valuenow={value() ?? undefined}
        aria-valuemin={props.min}
        aria-valuemax={props.max}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          icon={<Plus />}
          aria-label="Increase"
          disabled={!canIncrement()}
          onClick={() => stepBy(step(), "button-press")}
        />
      </InputGroupAddon>
    </InputGroup>
  );
}
