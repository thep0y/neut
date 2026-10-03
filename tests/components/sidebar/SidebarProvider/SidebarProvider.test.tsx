import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "~/components/sidebar/SidebarProvider/SidebarProvider";
import type { SidebarProviderProps } from "~/components/sidebar/SidebarProvider/SidebarProvider.types";
import { useSidebar } from "~/components/sidebar/SidebarProvider/SidebarProvider.context";

/**
 * SidebarProvider 的行为契约：
 * - 非受控：`defaultOpen` 决定初始状态，内部写状态并照常触发 `onOpenChange`；
 * - 受控：传了 `open` 就只回调、不写内部状态，外部回写后 UI 跟随；
 * - `state` 是 `open` 的派生值（expanded / collapsed）；
 * - 键盘 Ctrl/Cmd+B 切换并 `preventDefault`；
 * - 每次切换都写 `sidebar_state` cookie（保留 7 天）。
 *
 * `isMobile` 现在来自 `useIsMobile`（matchMedia 断点），因此移动分支是活的：
 * 需要移动端行为时用 `stubMobile(true)` 把 matchMedia 打到断点内。
 */

/** 把 matchMedia 固定为「是否处于移动端」，用于驱动 isMobile 分支 */
function stubMobile(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      media: "",
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// jsdom 的 cookie 是每个测试环境共享的，逐个过期清理，避免用例互相污染。
function clearCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name) {
      // biome-ignore lint/suspicious/noDocumentCookie: 测试需要真实读写 cookie（jsdom 支持）
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  }
}

function probeValue() {
  return document.querySelector('[data-testid="state"]')?.textContent;
}

type Probe = ReturnType<typeof useSidebar>;

/** 渲染一个把 context 暴露成 DOM 的探针，便于断言用户可见状态。 */
function renderProvider(props: SidebarProviderProps = {}) {
  let ctx: Probe | undefined;
  const Consumer = () => {
    ctx = useSidebar();
    return (
      <div>
        <span data-testid="state">{ctx.state()}</span>
        <span data-testid="open">{String(ctx.open())}</span>
        <span data-testid="open-mobile">{String(ctx.openMobile())}</span>
        <button type="button" data-testid="toggle" onClick={ctx.toggleSidebar}>
          切换
        </button>
        <button
          type="button"
          data-testid="set-open-true"
          onClick={() => ctx?.setOpen(true)}
        >
          展开
        </button>
        <button
          type="button"
          data-testid="set-open-mobile"
          onClick={() => ctx?.setOpenMobile(true)}
        >
          移动端展开
        </button>
      </div>
    );
  };

  const result = render(() => (
    <SidebarProvider {...props}>
      <Consumer />
    </SidebarProvider>
  ));

  return result;
}

beforeEach(() => {
  clearCookies();
});

afterEach(() => {
  clearCookies();
  vi.restoreAllMocks();
});

describe("SidebarProvider - 非受控状态", () => {
  it("默认 open=true，state 为 expanded", () => {
    renderProvider();

    expect(probeValue()).toBe("expanded");
    expect(document.querySelector('[data-testid="open"]')).toHaveTextContent(
      "true",
    );
  });

  it("defaultOpen=false 时初始为 collapsed", () => {
    renderProvider({ defaultOpen: false });

    expect(probeValue()).toBe("collapsed");
    expect(document.querySelector('[data-testid="open"]')).toHaveTextContent(
      "false",
    );
  });

  it("点击 toggle 在 expanded 与 collapsed 之间切换内部状态", () => {
    renderProvider();

    fireEvent.click(document.querySelector('[data-testid="toggle"]')!);
    expect(probeValue()).toBe("collapsed");

    fireEvent.click(document.querySelector('[data-testid="toggle"]')!);
    expect(probeValue()).toBe("expanded");
  });

  it("setOpen 接受布尔值并写内部状态", () => {
    renderProvider({ defaultOpen: false });

    fireEvent.click(document.querySelector('[data-testid="set-open-true"]')!);
    expect(probeValue()).toBe("expanded");
  });

  it("toggleSidebar 以更新函数形式调用 setOpen，基于当前值推导", () => {
    renderProvider({ defaultOpen: false });

    fireEvent.click(document.querySelector('[data-testid="toggle"]')!);
    expect(probeValue()).toBe("expanded");
  });

  it("切换时把内部状态写入 sidebar_state cookie", () => {
    renderProvider();

    fireEvent.click(document.querySelector('[data-testid="toggle"]')!);

    expect(document.cookie).toContain("sidebar_state=false");
  });

  it("移动端下 toggleSidebar 走 openMobile 分支（不再碰 open）", () => {
    stubMobile(true);
    const { getByTestId } = renderProvider();

    expect(getByTestId("open-mobile")).toHaveTextContent("false");

    fireEvent.click(getByTestId("toggle"));
    expect(getByTestId("open-mobile")).toHaveTextContent("true");

    fireEvent.click(getByTestId("toggle"));
    expect(getByTestId("open-mobile")).toHaveTextContent("false");
  });

  it("移动端下 open 保持不变（桌面状态不被移动切换影响）", () => {
    stubMobile(true);
    const onOpenChange = vi.fn();
    const { getByTestId } = renderProvider({ defaultOpen: true, onOpenChange });

    fireEvent.click(getByTestId("toggle"));

    expect(getByTestId("open")).toHaveTextContent("true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("setOpenMobile 只影响 openMobile，不影响 open", () => {
    renderProvider();

    expect(
      document.querySelector('[data-testid="open-mobile"]'),
    ).toHaveTextContent("false");

    fireEvent.click(document.querySelector('[data-testid="set-open-mobile"]')!);

    expect(
      document.querySelector('[data-testid="open-mobile"]'),
    ).toHaveTextContent("true");
    expect(probeValue()).toBe("expanded");
  });
});

describe("SidebarProvider - 受控模式", () => {
  it("受控下 toggle 只回调 onOpenChange，内部状态不变", () => {
    const onOpenChange = vi.fn();
    renderProvider({ open: false, onOpenChange });

    fireEvent.click(document.querySelector('[data-testid="toggle"]')!);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // 内部状态仍跟随受控 prop
    expect(probeValue()).toBe("collapsed");
  });

  it("外部回写 open 后 UI 跟随", () => {
    const [open, setOpen] = createSignal(false);
    const Consumer = () => {
      const ctx = useSidebar();
      return <span data-testid="state">{ctx.state()}</span>;
    };

    render(() => (
      <>
        <SidebarProvider open={open()} onOpenChange={setOpen}>
          <Consumer />
        </SidebarProvider>
        <button
          type="button"
          data-testid="external-open"
          onClick={() => setOpen(true)}
        >
          外部展开
        </button>
      </>
    ));

    expect(probeValue()).toBe("collapsed");

    fireEvent.click(document.querySelector('[data-testid="external-open"]')!);

    expect(probeValue()).toBe("expanded");
  });
});

describe("SidebarProvider - 快捷键", () => {
  it("Ctrl+B 切换侧边栏并阻止默认行为", async () => {
    renderProvider();
    await Promise.resolve();

    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(probeValue()).toBe("collapsed");
  });

  it("Cmd+B 同样切换", async () => {
    renderProvider();
    await Promise.resolve();

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "b", metaKey: true }),
    );

    expect(probeValue()).toBe("collapsed");
  });

  it("缺少修饰键时不切换", async () => {
    renderProvider();
    await Promise.resolve();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));

    expect(probeValue()).toBe("expanded");
  });

  it("修饰键配其它按键时不切换", async () => {
    renderProvider();
    await Promise.resolve();

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
    );

    expect(probeValue()).toBe("expanded");
  });
});

describe("SidebarProvider - 容器属性", () => {
  it("渲染 sidebar-wrapper 并合并 class / classList / 自定义 style", () => {
    renderProvider({
      class: "custom-class",
      classList: { "custom-list": true, "never-on": false },
      style: { "--sidebar-width": "20rem", color: "red" },
    });

    const wrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement;

    expect(wrapper).toHaveClass("custom-class");
    expect(wrapper).toHaveClass("custom-list");
    expect(wrapper).not.toHaveClass("never-on");
    // 默认宽度变量被调用方覆盖
    expect(wrapper.style.getPropertyValue("--sidebar-width")).toBe("20rem");
    expect(wrapper.style.getPropertyValue("--sidebar-width-icon")).toBe("3rem");
    expect(wrapper.style.getPropertyValue("color")).toBe("red");
  });

  it("把未消费的原生属性透传到 wrapper", () => {
    renderProvider({ id: "app-sidebar" });

    expect(
      document.querySelector('[data-slot="sidebar-wrapper"]'),
    ).toHaveAttribute("id", "app-sidebar");
  });
});
