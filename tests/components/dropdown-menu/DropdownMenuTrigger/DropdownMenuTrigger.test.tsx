import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu";
import { DropdownMenuContent } from "~/components/dropdown-menu/DropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "~/components/dropdown-menu/DropdownMenuItem/DropdownMenuItem";
import { DropdownMenuTrigger } from "~/components/dropdown-menu/DropdownMenuTrigger/DropdownMenuTrigger";

function trigger(): HTMLElement {
  return document.querySelector(
    '[data-slot="dropdown-menu-trigger"]',
  ) as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DropdownMenuTrigger - 禁用守卫", () => {
  it("disabled 的触发器即使收到 click 事件也不切换开关", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <DropdownMenu disabled onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>项</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    // disabled 的 <button> 在真实浏览器里不会派发 click；这里直接派发是为了
    // 命中"监听器仍在、但禁用时空操作"这条防御分支。
    fireEvent.click(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("data-state", "closed");
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]'),
    ).toBeNull();
  });

  it("trigger 自身的 disabled 会作用到默认的 button 上", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger disabled>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>项</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    expect(trigger()).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("DropdownMenuTrigger - 自身的 disabled（回归）", () => {
  it("多态渲染成 div 时，disabled 的触发器不会打开菜单", () => {
    // 此前守卫只看根状态 ctx.disabled()，而 div 不像 disabled 的 button
    // 那样由浏览器屏蔽点击，因此"禁用的触发器"照样打开了菜单。
    // `disabled` 在多态 div 上不在公开类型里（组件的 disabled 是根 prop），
    // 这里刻意绕过类型来验证运行时守卫本身是完整的。
    const onOpenChange = vi.fn();
    const triggerProps = {
      component: "div" as const,
      disabled: true,
    } as unknown as Record<string, unknown>;
    render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger {...triggerProps}>打开</DropdownMenuTrigger>
        <DropdownMenuContent>内容</DropdownMenuContent>
      </DropdownMenu>
    ));
    const trigger = document.querySelector(
      '[data-slot="dropdown-menu-trigger"]',
    ) as HTMLElement;

    fireEvent.click(trigger);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("多态渲染成 div 时，disabled 的触发器不响应键盘", () => {
    const onOpenChange = vi.fn();
    const triggerProps = {
      component: "div" as const,
      disabled: true,
    } as unknown as Record<string, unknown>;
    render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger {...triggerProps}>打开</DropdownMenuTrigger>
        <DropdownMenuContent>内容</DropdownMenuContent>
      </DropdownMenu>
    ));

    fireEvent.keyDown(
      document.querySelector(
        '[data-slot="dropdown-menu-trigger"]',
      ) as HTMLElement,
      { key: "ArrowDown" },
    );

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("未禁用时多态触发器仍可打开（对照组）", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger component="div">打开</DropdownMenuTrigger>
        <DropdownMenuContent>内容</DropdownMenuContent>
      </DropdownMenu>
    ));

    fireEvent.click(
      document.querySelector(
        '[data-slot="dropdown-menu-trigger"]',
      ) as HTMLElement,
    );

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });
});

describe("DropdownMenuTrigger - 禁用守卫的默认与组合", () => {
  it("未传 ownDisabled 且根未禁用时，键盘可打开（默认参数生效）", () => {
    // useDropdownMenuTrigger 的 ownDisabled 参数有默认值；
    // 这里通过"根未禁用 + 没有 triggers 自己的 disabled"确认默认路径正常
    const onOpenChange = vi.fn();
    render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger component="div">打开</DropdownMenuTrigger>
        <DropdownMenuContent>内容</DropdownMenuContent>
      </DropdownMenu>
    ));

    fireEvent.keyDown(
      document.querySelector(
        '[data-slot="dropdown-menu-trigger"]',
      ) as HTMLElement,
      { key: "ArrowDown" },
    );

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("根 disabled 与触发器 disabled 都为真时同样拦下", () => {
    const onOpenChange = vi.fn();
    const triggerProps = {
      component: "div" as const,
      disabled: true,
    } as unknown as Record<string, unknown>;
    render(() => (
      <DropdownMenu disabled onOpenChange={onOpenChange}>
        <DropdownMenuTrigger {...triggerProps}>打开</DropdownMenuTrigger>
        <DropdownMenuContent>内容</DropdownMenuContent>
      </DropdownMenu>
    ));

    fireEvent.click(
      document.querySelector(
        '[data-slot="dropdown-menu-trigger"]',
      ) as HTMLElement,
    );

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
