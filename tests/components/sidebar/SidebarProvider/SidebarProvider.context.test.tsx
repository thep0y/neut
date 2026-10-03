import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "~/components/sidebar/SidebarProvider/SidebarProvider";
import { useSidebar } from "~/components/sidebar/SidebarProvider/SidebarProvider.context";

type SidebarContextValue = ReturnType<typeof useSidebar>;

/** 只验证 context 的读取契约：Provider 内可取到，脱离 Provider 抛中文错误。 */
describe("useSidebar", () => {
  it("在 SidebarProvider 内可以取到 context", () => {
    let seen: SidebarContextValue | undefined;
    const Probe = () => {
      seen = useSidebar();
      return <div />;
    };

    render(() => (
      <SidebarProvider>
        <Probe />
      </SidebarProvider>
    ));

    expect(seen?.open()).toBe(true);
    expect(seen?.state()).toBe("expanded");
  });

  it("脱离 SidebarProvider 使用时抛出带信息的错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(() => {
        useSidebar();
        return <div />;
      }),
    ).toThrow("useSidebar 必须用在 <SidebarProvider> 内部");

    spy.mockRestore();
  });
});
