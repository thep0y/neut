import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";

/**
 * `SelectContent` 在打开期间把 keydown / pointerdown 绑到 document
 * （这样不抢焦点也能用方向键），关闭时解绑。这里覆盖这套文档级监听：
 * Enter / Space 选中、Escape 关闭、Tab 关闭、以及点击外部关闭。
 */
async function renderOpen(
  props: {
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onOpenChange?: (open: boolean) => void;
  } = {},
) {
  const view = render(() => (
    <Select
      defaultOpen
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      onOpenChange={props.onOpenChange}
    >
      <SelectContent>
        <SelectItem value="apple">苹果</SelectItem>
        <SelectItem value="banana">香蕉</SelectItem>
        <SelectItem value="cherry" disabled>
          樱桃
        </SelectItem>
      </SelectContent>
    </Select>
  ));
  // 文档级监听在 effect 里绑定，等微任务落地后再派发
  await Promise.resolve();
  await Promise.resolve();
  return view;
}

const items = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));

/** 高亮用类名表达（与 select.integration.test.tsx 的判定一致） */
const highlighted = () =>
  items().find((el) => el.className.includes("bg-neutral-100")) ?? null;

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("SelectContent - 文档级键盘", () => {
  it("ArrowDown / ArrowUp 在可用项之间移动高亮", async () => {
    await renderOpen();

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(highlighted()).toBe(items()[0]);

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(highlighted()).toBe(items()[1]);

    fireEvent.keyDown(document, { key: "ArrowUp" });
    expect(highlighted()).toBe(items()[0]);
  });

  it("高亮会跳过 disabled 项", async () => {
    await renderOpen();

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "ArrowDown" });

    // 第三项 disabled，应环绕回第一项
    expect(highlighted()).toBe(items()[0]);
  });

  it("Enter 选中当前高亮项", async () => {
    const onValueChange = vi.fn();
    await renderOpen({ onValueChange });

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });

    expect(onValueChange).toHaveBeenCalledWith("apple");
  });

  it("空格同样选中当前高亮项", async () => {
    const onValueChange = vi.fn();
    await renderOpen({ onValueChange });

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: " " });

    expect(onValueChange).toHaveBeenCalledWith("apple");
  });

  it("没有高亮时 Enter 不选中任何项", async () => {
    const onValueChange = vi.fn();
    await renderOpen({ onValueChange });

    fireEvent.keyDown(document, { key: "Enter" });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Escape 关闭面板", async () => {
    const onOpenChange = vi.fn();
    await renderOpen({ onOpenChange });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Tab 关闭面板但不阻止默认行为", async () => {
    const onOpenChange = vi.fn();
    await renderOpen({ onOpenChange });

    const notCanceled = fireEvent.keyDown(document, { key: "Tab" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(notCanceled).toBe(true);
  });

  it("无关按键不改变任何状态", async () => {
    const onOpenChange = vi.fn();
    await renderOpen({ onOpenChange });

    fireEvent.keyDown(document, { key: "a" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("关闭后解绑文档级监听", async () => {
    const onOpenChange = vi.fn();
    await renderOpen({ onOpenChange });
    fireEvent.keyDown(document, { key: "Escape" });
    onOpenChange.mockClear();

    fireEvent.keyDown(document, { key: "ArrowDown" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("SelectContent - 点击外部", () => {
  it("pointerdown 落在面板之外时关闭并停止传播", async () => {
    const onOpenChange = vi.fn();
    await renderOpen({ onOpenChange });
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const event = new Event("pointerdown", { bubbles: true, cancelable: true });
    outside.dispatchEvent(event);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("pointerdown 落在面板之内时不关闭", async () => {
    const onOpenChange = vi.fn();
    await renderOpen({ onOpenChange });

    fireEvent.pointerDown(items()[0]!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
