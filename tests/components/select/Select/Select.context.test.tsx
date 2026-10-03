import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { useSelectContext } from "~/components/select/Select/Select.context";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";

/**
 * `useSelectContext(component)` 在缺少 Provider 时抛出**中文**错误，
 * 并把调用方组件名带进消息里，方便定位是哪个子组件用错了位置。
 */
function Probe() {
  useSelectContext("Probe");
  return null;
}

describe("useSelectContext", () => {
  it("缺少 Provider 时抛出带组件名的中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <Probe />)).toThrow(
      "<Probe> 必须渲染在 <Select> 内部",
    );

    error.mockRestore();
  });

  it("在 Select 内部可用", () => {
    expect(() =>
      render(() => (
        <Select defaultOpen>
          <SelectContent>
            <SelectItem value="apple">苹果</SelectItem>
          </SelectContent>
        </Select>
      )),
    ).not.toThrow();
  });
});
