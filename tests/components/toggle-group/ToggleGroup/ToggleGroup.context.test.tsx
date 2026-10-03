import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { useToggleGroupContext } from "~/components/toggle-group/ToggleGroup/ToggleGroup.context";
import { ToggleGroup } from "~/components/toggle-group/ToggleGroup/ToggleGroup";
import { ToggleGroupItem } from "~/components/toggle-group/ToggleGroupItem/ToggleGroupItem";

/**
 * `useToggleGroupContext(component)`：缺 Provider 时抛出**中文**错误，
 * 并把调用方组件名带进消息里，方便定位是哪个自定义 item 用错了位置。
 */
function Probe(props: { name?: string }) {
  useToggleGroupContext(props.name ?? "MyToggle");
  return null;
}

describe("useToggleGroupContext", () => {
  it("缺少 Provider 时抛出带组件名的中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <Probe name="MyToggle" />)).toThrow(
      "<MyToggle> 必须渲染在 <ToggleGroup> 内部",
    );

    error.mockRestore();
  });

  it("默认组件名是 MyToggle", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <Probe />)).toThrow(
      "<MyToggle> 必须渲染在 <ToggleGroup> 内部",
    );

    error.mockRestore();
  });

  it("在 ToggleGroup 内部可用", () => {
    expect(() =>
      render(() => (
        <ToggleGroup defaultValue="bold">
          <ToggleGroupItem value="bold">加粗</ToggleGroupItem>
        </ToggleGroup>
      )),
    ).not.toThrow();
  });
});
