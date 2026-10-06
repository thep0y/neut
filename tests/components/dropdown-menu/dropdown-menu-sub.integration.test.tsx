import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu";
import { DropdownMenuContent } from "~/components/dropdown-menu/DropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "~/components/dropdown-menu/DropdownMenuItem/DropdownMenuItem";
import { DropdownMenuSub } from "~/components/dropdown-menu/DropdownMenuSub/DropdownMenuSub";
import { DropdownMenuSubContent } from "~/components/dropdown-menu/DropdownMenuSubContent/DropdownMenuSubContent";
import { DropdownMenuSubTrigger } from "~/components/dropdown-menu/DropdownMenuSubTrigger/DropdownMenuSubTrigger";
import { DropdownMenuTrigger } from "~/components/dropdown-menu/DropdownMenuTrigger/DropdownMenuTrigger";

/**
 * DropdownMenu 子菜单集成测试。
 *
 * 子菜单复用 context-menu 的 Sub 运行时，行为重点是：
 * - `openOnHover` 的**延时**开关（默认 100ms）与 `closeDelay`；
 * - 键盘/点击直接打开（`trigger-press`）与 hover 打开（`trigger-hover`）区分；
 * - `aria-haspopup=menu` / `aria-expanded` / `data-open`；
 * - 兄弟子菜单互斥（sibling-open）；
 * - `disabled` 时不响应 hover 与点击。
 *
 * 计时相关的断言一律用 fake timers，避免用真实延时导致 flaky。
 */
function renderSubMenu(
  props: {
    subProps?: Record<string, unknown>;
    items?: string[];
    subItems?: string[];
  } = {},
) {
  const items = props.items ?? ["父级项"];
  const subItems = props.subItems ?? ["子项 1", "子项 2"];
  return render(() => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>打开</DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((label) => (
          <DropdownMenuItem>{label}</DropdownMenuItem>
        ))}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger {...props.subProps}>
            更多
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {subItems.map((label) => (
              <DropdownMenuItem>{label}</DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ));
}

function subTrigger(): HTMLElement {
  return document.querySelector(
    '[data-slot="dropdown-menu-sub-trigger"]',
  ) as HTMLElement;
}

function subContent(): HTMLElement | null {
  return document.querySelector('[data-slot="dropdown-menu-sub-content"]');
}

/**
 * 等待"挂载完成"。
 *
 * `DropdownMenuSubTrigger` 在 `onMount` 里通过 effect 把 `itemId` 登记到父浮层，
 * 而 `openSubmenu` 在 `itemId` 为空时直接返回。真实浏览器里用户点击必然发生在
 * 挂载之后，但测试里 `render()` 与随后的 `fireEvent` 可能在同一个 tick 内，
 * 于是点击会被丢掉。这里显式 flush 一轮微任务来模拟"已挂载完成"。
 */
async function waitForMount(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DropdownMenuSub - 渲染与 ARIA", () => {
  it("sub trigger 是 role=menuitem 且 aria-haspopup=menu", async () => {
    renderSubMenu();
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("role", "menuitem");
    expect(subTrigger()).toHaveAttribute("aria-haspopup", "menu");
  });

  it("初始 aria-expanded=false 且无 data-open", async () => {
    renderSubMenu();
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(subTrigger()).not.toHaveAttribute("data-open");
  });

  it("初始不渲染 sub content", async () => {
    renderSubMenu();
    await waitForMount();

    expect(subContent()).toBeNull();
  });

  it("inset 时带 data-inset", async () => {
    renderSubMenu({ subProps: { inset: true } });
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("data-inset", "");
  });

  it("disabled 时带 aria-disabled 与 data-disabled", async () => {
    renderSubMenu({ subProps: { disabled: true } });
    await waitForMount();

    expect(subTrigger()).toHaveAttribute("aria-disabled", "true");
    expect(subTrigger()).toHaveAttribute("data-disabled", "");
  });

  it("渲染 ChevronRight 指示图标", async () => {
    renderSubMenu();
    await waitForMount();

    expect(subTrigger().querySelector("svg")).toBeInTheDocument();
  });
});

describe("DropdownMenuSub - hover 延时开关", () => {
  it("hover 后默认 100ms 才打开（延时可配置）", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    // 未到延时：仍未打开
    expect(subContent()).toBeNull();

    await vi.advanceTimersByTimeAsync(100);

    expect(subContent()).toBeInTheDocument();
    expect(subTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(subTrigger()).toHaveAttribute("data-open", "");
  });

  it("用 delay 覆盖默认延时", async () => {
    renderSubMenu({ subProps: { delay: 500 } });
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(100);
    expect(subContent()).toBeNull();

    await vi.advanceTimersByTimeAsync(400);
    expect(subContent()).toBeInTheDocument();
  });

  it("在延时内离开会取消打开", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(50);
    fireEvent.pointerLeave(subTrigger());
    await vi.advanceTimersByTimeAsync(200);

    expect(subContent()).toBeNull();
  });

  it("openOnHover=false 时 hover 不打开", async () => {
    renderSubMenu({ subProps: { openOnHover: false } });
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(500);

    expect(subContent()).toBeNull();
  });

  it("disabled 时 hover 不打开", async () => {
    renderSubMenu({ subProps: { disabled: true } });
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(500);

    expect(subContent()).toBeNull();
  });

  it("已打开时重复 hover 不再安排新的打开", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(100);
    expect(subContent()).toBeInTheDocument();

    fireEvent.pointerEnter(subTrigger());
    await vi.advanceTimersByTimeAsync(200);
    expect(subContent()).toBeInTheDocument();
  });
});

describe("DropdownMenuSub - 点击与键盘", () => {
  it("点击立即打开子菜单（不等延时）", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(subContent()).toBeInTheDocument();
  });

  it("再次点击关闭子菜单", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);
    expect(subContent()).toBeInTheDocument();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);
    expect(subContent()).toBeNull();
  });

  it("用户的 onClick 被调用，且打开逻辑同时生效", async () => {
    const onClick = vi.fn();
    renderSubMenu({ subProps: { onClick } });
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(subContent()).toBeInTheDocument();
  });

  it("用户 onClick 里 preventDefault 后不打开子菜单", async () => {
    const onClick = vi.fn((e: MouseEvent) => e.preventDefault());
    renderSubMenu({ subProps: { onClick } });
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(onClick).toHaveBeenCalled();
    expect(subContent()).toBeNull();
  });

  it("disabled 时点击不打开", async () => {
    renderSubMenu({ subProps: { disabled: true } });
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);

    expect(subContent()).toBeNull();
  });

  it("按 ArrowRight 打开子菜单（需先高亮该项）", async () => {
    renderSubMenu();
    await waitForMount();

    // ArrowRight 作用于父浮层的 activeEntry，因此先把触发器高亮为 active
    fireEvent.pointerMove(subTrigger());
    fireEvent.keyDown(subTrigger(), { key: "ArrowRight" });
    await vi.advanceTimersByTimeAsync(0);

    expect(subContent()).toBeInTheDocument();
  });

  it("在子菜单内容上按 ArrowLeft 关闭子菜单", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);
    expect(subContent()).toBeInTheDocument();

    // ArrowLeft 由**子浮层**的运行时处理（它有 submenu 上下文）：
    // 关闭自己并把焦点还给父浮层。
    fireEvent.keyDown(subContent()!, { key: "ArrowLeft" });
    await vi.advanceTimersByTimeAsync(0);

    expect(subContent()).toBeNull();
  });
});

describe("DropdownMenuSub - 关闭延时与兄弟互斥", () => {
  it("指针离开后按 closeDelay 关闭", async () => {
    renderSubMenu({ subProps: { closeDelay: 200 } });
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);
    expect(subContent()).toBeInTheDocument();

    fireEvent.pointerLeave(subTrigger());
    // 未到 closeDelay
    await vi.advanceTimersByTimeAsync(100);
    expect(subContent()).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(200);
    expect(subContent()).toBeNull();
  });

  it("closeDelay 传 0 时仍受 100ms 最小宽限期保护", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);

    fireEvent.pointerLeave(subTrigger());
    // scheduleClose 用 Math.max(delay, HOVER_CLOSE_GRACE=100)，
    // 因此即便 closeDelay=0，指针扫过时子菜单也不会立刻消失
    //（这是刻意的：给用户从触发器移到子菜单留出时间）。
    await vi.advanceTimersByTimeAsync(50);
    expect(subContent()).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(100);
    expect(subContent()).toBeNull();
  });

  it("只打开一个子菜单：打开第二个会关闭第一个", async () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>第一个</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>子项 A</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>第二个</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>子项 B</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    const triggers = document.querySelectorAll(
      '[data-slot="dropdown-menu-sub-trigger"]',
    );
    const contents = () =>
      document.querySelectorAll('[data-slot="dropdown-menu-sub-content"]');

    fireEvent.click(triggers[0] as HTMLElement);
    await vi.advanceTimersByTimeAsync(0);
    expect(contents()).toHaveLength(1);
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(triggers[1] as HTMLElement);
    await vi.advanceTimersByTimeAsync(0);

    // 仍然只有一个子菜单内容（互斥）
    expect(contents()).toHaveLength(1);
    expect(triggers[1]).toHaveAttribute("aria-expanded", "true");
    expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("点击子菜单项后整棵菜单关闭", async () => {
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>打开</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>更多</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>子项</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    ));

    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);

    const subItem = document.querySelector(
      '[data-slot="dropdown-menu-sub-content"] [data-slot="dropdown-menu-item"]',
    )!;
    fireEvent.click(subItem);
    await vi.advanceTimersByTimeAsync(0);

    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]'),
    ).toBeNull();
  });

  it("悬停子菜单触发器会高亮它", async () => {
    renderSubMenu();
    await waitForMount();

    fireEvent.pointerMove(subTrigger());

    expect(subTrigger()).toHaveAttribute("data-highlighted", "");
  });
});
