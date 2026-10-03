import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { SheetContent } from "~/components/sheet/SheetContent/SheetContent";
import type { SheetSide } from "~/components/sheet/sheet.types";
import {
  dialogContextWrapper,
  fakeDialogContext,
} from "~tests/components/sheet/test-utils";

function renderIn(
  ui: () => JSX.Element,
  overrides: Parameters<typeof fakeDialogContext>[0] = {},
) {
  return render(ui, {
    wrapper: dialogContextWrapper(fakeDialogContext(overrides)),
  });
}

function surface(): HTMLElement {
  return document.querySelector('[data-slot="sheet-content"]') as HTMLElement;
}

function overlay(): HTMLElement {
  return document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
}

describe("SheetContent - 渲染与 side 变体", () => {
  it("默认贴右边：role=dialog、data-side=right、data-slot=sheet-content", () => {
    renderIn(() => <SheetContent>正文</SheetContent>, {
      show: true,
      open: true,
    });

    expect(surface().tagName).toBe("DIV");
    expect(surface()).toHaveAttribute("role", "dialog");
    expect(surface()).toHaveAttribute("data-slot", "sheet-content");
    expect(surface()).toHaveAttribute("data-side", "right");
    expect(surface()).toHaveTextContent("正文");
  });

  it("四个 side 都写进 data-side 并各自带上滑入方向类", () => {
    const cases: Array<[SheetSide, string]> = [
      ["top", "data-[open=true]:slide-in-from-top"],
      ["bottom", "data-[open=true]:slide-in-from-bottom"],
      ["left", "data-[open=true]:slide-in-from-left"],
      ["right", "data-[open=true]:slide-in-from-right"],
    ];

    for (const [side, directionClass] of cases) {
      const { unmount } = renderIn(
        () => <SheetContent side={side}>正文</SheetContent>,
        {
          show: true,
          open: true,
        },
      );

      expect(surface()).toHaveAttribute("data-side", side);
      expect(surface()).toHaveClass(directionClass);
      unmount();
    }
  });

  it("data-open 跟随开关：打开 true、关闭 false", () => {
    const { unmount } = renderIn(() => <SheetContent>正文</SheetContent>, {
      show: true,
      open: true,
    });
    expect(surface()).toHaveAttribute("data-open", "true");

    unmount();
    renderIn(() => <SheetContent>正文</SheetContent>, {
      show: true,
      open: false,
    });
    expect(surface()).toHaveAttribute("data-open", "false");
  });

  it("合并外部 class 与 classList", () => {
    renderIn(
      () => (
        <SheetContent class="my-sheet-content" classList={{ "is-wide": true }}>
          正文
        </SheetContent>
      ),
      { show: true, open: true },
    );

    expect(surface()).toHaveClass("my-sheet-content");
    expect(surface()).toHaveClass("is-wide");
  });

  it("showCloseButton=false 时不渲染关闭按钮", () => {
    renderIn(() => <SheetContent showCloseButton={false}>正文</SheetContent>, {
      show: true,
      open: true,
    });

    expect(document.querySelector('[data-slot="sheet-close"]')).toBeNull();
  });
});

describe("SheetContent - 关闭按钮", () => {
  it("默认渲染右上角关闭按钮，位置类跟随 closeClasses", () => {
    renderIn(() => <SheetContent>正文</SheetContent>, {
      show: true,
      open: true,
    });

    const close = document.querySelector(
      '[data-slot="sheet-close"]',
    ) as HTMLElement;
    expect(close).not.toBeNull();
    expect(close).toHaveClass("absolute");
    expect(close).toHaveClass("top-4");
    expect(close).toHaveClass("right-4");
    // surface 内的关闭按钮不参与面板内容
    expect(surface().contains(close)).toBe(true);
  });

  it("点击关闭按钮请求关闭面板", () => {
    const setOpen = vi.fn();
    renderIn(() => <SheetContent>正文</SheetContent>, {
      show: true,
      open: true,
      setOpen,
    });

    fireEvent.click(
      document.querySelector('[data-slot="sheet-close"]') as HTMLElement,
    );

    expect(setOpen).toHaveBeenCalledWith(false);
  });
});

describe("SheetContent - 遮罩与语义", () => {
  it("点击遮罩关闭面板（默认 dismissOnOverlayClick=true）", () => {
    const setOpen = vi.fn();
    renderIn(() => <SheetContent>正文</SheetContent>, {
      show: true,
      open: true,
      setOpen,
    });

    fireEvent.click(overlay());

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("dismissOnOverlayClick=false 时点击遮罩不关闭", () => {
    const setOpen = vi.fn();
    renderIn(
      () => <SheetContent dismissOnOverlayClick={false}>正文</SheetContent>,
      { show: true, open: true, setOpen },
    );

    fireEvent.click(overlay());

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("overlayClass 被转发到遮罩上", () => {
    renderIn(
      () => <SheetContent overlayClass="my-overlay">正文</SheetContent>,
      {
        show: true,
        open: true,
      },
    );

    expect(overlay()).toHaveClass("my-overlay");
  });
});
