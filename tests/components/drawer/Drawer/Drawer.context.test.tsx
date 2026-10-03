import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Drawer } from "~/components/drawer/Drawer/Drawer";
import { useDrawerContext } from "~/components/drawer/Drawer/Drawer.context";

function Orphan() {
  useDrawerContext("DrawerTrigger");
  return <span>孤立</span>;
}

describe("useDrawerContext", () => {
  it("脱离 Drawer 渲染时抛出中文错误", () => {
    expect(() => render(() => <Orphan />)).toThrow("必须渲染在 <Drawer> 内部");
  });

  it("在 Drawer 内部可以拿到 context", () => {
    let ctx: ReturnType<typeof useDrawerContext> | undefined;
    function Consumer() {
      ctx = useDrawerContext("Consumer");
      return null;
    }

    render(() => (
      <Drawer>
        <Consumer />
      </Drawer>
    ));

    expect(ctx?.contentId).toMatch(/^drawer-content-/);
    expect(ctx?.open()).toBe(false);
  });
});
