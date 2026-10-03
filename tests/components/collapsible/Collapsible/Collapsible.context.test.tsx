import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Collapsible } from "~/components/collapsible/Collapsible/Collapsible";
import { useCollapsibleContext } from "~/components/collapsible/Collapsible/Collapsible.context";

/** 读回 context 的探针：确认根组件把状态与回调下发给了子树 */
function Probe() {
  const ctx = useCollapsibleContext();
  return (
    <>
      <span data-testid="open">{String(ctx.open())}</span>
      <span data-testid="handler-type">{typeof ctx.onOpenChange}</span>
    </>
  );
}

describe("useCollapsibleContext", () => {
  it("在 Collapsible 内部返回根状态与 onOpenChange", () => {
    const onOpenChange = vi.fn();
    const { getByTestId } = render(() => (
      <Collapsible defaultOpen onOpenChange={onOpenChange}>
        <Probe />
      </Collapsible>
    ));

    expect(getByTestId("open").textContent).toBe("true");
    expect(getByTestId("handler-type").textContent).toBe("function");
  });

  it("没有 onOpenChange 时 context 里是 undefined", () => {
    const { getByTestId } = render(() => (
      <Collapsible>
        <Probe />
      </Collapsible>
    ));

    expect(getByTestId("open").textContent).toBe("false");
    expect(getByTestId("handler-type").textContent).toBe("undefined");
  });

  it("脱离 Collapsible 使用时抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <Probe />)).toThrow(
      /useCollapsibleContext 必须用在 <Collapsible> 内部/,
    );

    error.mockRestore();
  });
});
