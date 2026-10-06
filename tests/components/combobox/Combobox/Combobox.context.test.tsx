import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import { ComboboxChip } from "~/components/combobox/ComboboxChip/ComboboxChip";
import { ComboboxChips } from "~/components/combobox/ComboboxChips/ComboboxChips";
import { ComboboxChipsInput } from "~/components/combobox/ComboboxChipsInput/ComboboxChipsInput";
import { ComboboxClear } from "~/components/combobox/ComboboxClear/ComboboxClear";
import { ComboboxCollection } from "~/components/combobox/ComboboxCollection/ComboboxCollection";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import { ComboboxTrigger } from "~/components/combobox/ComboboxTrigger/ComboboxTrigger";
import { ComboboxValue } from "~/components/combobox/ComboboxValue/ComboboxValue";

/**
 * `useComboboxContext` 的上下文约束：所有消费 Context 的子组件脱离
 * `<Combobox>` 渲染时都必须抛出可读的中文错误（TESTING.md §5.3）。
 *
 * 每个组件单独一条用例：组件名会被拼进错误信息，因此错误信息里出现哪个名字
 * 也就顺带验证了是哪个组件在报错。
 */
const CONSUMERS: Array<[string, () => JSX.Element]> = [
  ["ComboboxInput", () => <ComboboxInput />],
  ["ComboboxTrigger", () => <ComboboxTrigger />],
  ["ComboboxValue", () => <ComboboxValue />],
  ["ComboboxContent", () => <ComboboxContent />],
  ["ComboboxList", () => <ComboboxList />],
  ["ComboboxItem", () => <ComboboxItem value="apple" />],
  ["ComboboxCollection", () => <ComboboxCollection items={["apple"]} />],
  ["ComboboxChips", () => <ComboboxChips />],
  ["ComboboxChip", () => <ComboboxChip value="apple">apple</ComboboxChip>],
  ["ComboboxChipsInput", () => <ComboboxChipsInput />],
  ["ComboboxClear", () => <ComboboxClear />],
];

describe("useComboboxContext - 上下文约束", () => {
  for (const [name, component] of CONSUMERS) {
    it(`${name} 脱离 <Combobox> 渲染时抛出中文错误`, () => {
      expect(() => render(() => <>{component()}</>)).toThrow(
        `必须渲染在 <Combobox> 内部`,
      );
    });
  }
});
