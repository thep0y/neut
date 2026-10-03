import { fireEvent, render } from "@solidjs/testing-library";
import { onMount } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useContextMenuContext } from "~/components/context-menu/ContextMenu/ContextMenu.context";
import type { ContextMenuContextValue } from "~/components/context-menu/context-menu.types";
import { DropdownMenu } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu";
import { useDropdownMenuContext } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu.context";
import type { DropdownMenuContextValue } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu.types";
import { DropdownMenuContent } from "~/components/dropdown-menu/DropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "~/components/dropdown-menu/DropdownMenuItem/DropdownMenuItem";
import { DropdownMenuTrigger } from "~/components/dropdown-menu/DropdownMenuTrigger/DropdownMenuTrigger";

/**
 * DropdownMenu 根组件的 context 契约。
 *
 * 有几条必须成立、但从 trigger/content 的公开交互走不到的边界：
 * - 禁用时 `setOpen(true)` / `toggle()` 是空操作；
 * - `setOpen` 收到与当前相同的值时不重复回调；关闭时 reason 是 `imperative-action`；
 * - 已关闭时 `closeAll` 不重复回调；
 * - dropdown 不使用虚拟锚点：复用 context-menu 的 root 值时 `anchor` 恒为
 *   undefined、`openAt` 是空实现。
 */
interface ProbeValue {
  menu: DropdownMenuContextValue;
  root: ContextMenuContextValue;
}

function Probe(props: { onReady: (value: ProbeValue) => void }) {
  const menu = useDropdownMenuContext("Probe");
  const root = useContextMenuContext("Probe");
  onMount(() => props.onReady({ menu, root }));
  return null;
}

async function renderProbe(
  rootProps: { disabled?: boolean; defaultOpen?: boolean } = {},
  onOpenChange = vi.fn(),
) {
  let value: ProbeValue | undefined;
  const result = render(() => (
    <DropdownMenu
      disabled={rootProps.disabled}
      defaultOpen={rootProps.defaultOpen}
      onOpenChange={onOpenChange}
    >
      <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
      <Probe onReady={(next) => (value = next)} />
    </DropdownMenu>
  ));
  await Promise.resolve();
  return { ...result, ...value!, onOpenChange };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DropdownMenu context - setOpen / toggle", () => {
  it("disabled 时 setOpen(true) 不回调也不打开", async () => {
    const { menu, onOpenChange } = await renderProbe({ disabled: true });

    menu.setOpen(true);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(menu.open()).toBe(false);
  });

  it("disabled 时 toggle 不回调", async () => {
    const { menu, onOpenChange } = await renderProbe({ disabled: true });

    menu.toggle();

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("setOpen 传入与当前相同的值时不重复回调", async () => {
    const { menu, onOpenChange } = await renderProbe({});

    menu.setOpen(true);
    menu.setOpen(true);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("关闭时的 reason 是 imperative-action", async () => {
    const { menu, onOpenChange } = await renderProbe({ defaultOpen: true });

    menu.setOpen(false);

    const details = onOpenChange.mock.calls[0]?.[1] as { reason: string };
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(details.reason).toBe("imperative-action");
  });

  it("已关闭时 closeAll 不重复回调", async () => {
    const { root, onOpenChange } = await renderProbe({});

    root.closeAll("escape-key");

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("没有触发器时 closeAll 仍如实上报关闭（只是无处还焦）", async () => {
    let value: ProbeValue | undefined;
    const onOpenChange = vi.fn();
    render(() => (
      <DropdownMenu defaultOpen onOpenChange={onOpenChange}>
        <Probe onReady={(next) => (value = next)} />
      </DropdownMenu>
    ));
    await Promise.resolve();

    value!.root.closeAll("escape-key");

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key", trigger: undefined }),
    );
    expect(value!.menu.open()).toBe(false);
  });
});

describe("DropdownMenu context - 虚拟锚点与 openAt（dropdown 不使用）", () => {
  it("anchor 恒为 undefined，openAt 是空操作", async () => {
    const { menu, root, onOpenChange } = await renderProbe({});

    expect(root.anchor()).toBeUndefined();

    root.openAt(10, 20, undefined);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(menu.open()).toBe(false);
  });
});

describe("DropdownMenu - 点击 document 视为菜单外部", () => {
  it("pointerdown 落在 document 上（非 Element）时按 outside-press 关闭", async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <DropdownMenu defaultOpen onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>项</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ));
    await Promise.resolve();

    fireEvent.pointerDown(document);

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "outside-press" }),
    );
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]'),
    ).toBeNull();
  });
});
