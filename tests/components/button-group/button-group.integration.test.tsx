import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ButtonGroup } from "~/components/button-group/ButtonGroup/ButtonGroup";
import { ButtonGroupSeparator } from "~/components/button-group/ButtonGroupSeparator/ButtonGroupSeparator";
import { ButtonGroupText } from "~/components/button-group/ButtonGroupText/ButtonGroupText";

/**
 * ButtonGroup 集成测试：真实组合「fieldset → 文本槽 + 按钮 + 分隔线」。
 * 分隔线不依赖上下文，方向由各自 props 决定；这里验证结构、role 与点击互不串扰。
 */
function toolbar(orientation?: "horizontal" | "vertical") {
  return render(() => (
    <ButtonGroup orientation={orientation} aria-label="文本格式">
      <ButtonGroupText aria-hidden="true">格式</ButtonGroupText>
      <button type="button" data-testid="bold">
        加粗
      </button>
      <ButtonGroupSeparator />
      <button type="button" data-testid="italic">
        斜体
      </button>
      <ButtonGroupSeparator orientation="horizontal" />
      <button type="button" data-testid="underline">
        下划线
      </button>
    </ButtonGroup>
  ));
}

describe("ButtonGroup 集成 - 结构", () => {
  it("fieldset 以 role=group 暴露名称，内部按「文本 → 按钮 → 分隔线」排布", () => {
    const { container, getByRole } = toolbar();

    const group = getByRole("group", { name: "文本格式" });
    expect(group.getAttribute("data-slot")).toBe("button-group");
    expect(
      Array.from(group.children).map(
        (child) => child.getAttribute("data-slot") ?? child.tagName,
      ),
    ).toEqual([
      "button-group-text",
      "BUTTON",
      "button-group-separator",
      "BUTTON",
      "button-group-separator",
      "BUTTON",
    ]);
    expect(
      container.querySelectorAll('[data-slot="button-group-separator"]'),
    ).toHaveLength(2);
  });

  it("每个分隔线各自决定方向：默认纵向，显式 horizontal 的不会跟着组的方向变", () => {
    const { container } = toolbar("vertical");
    const [verticalSep, horizontalSep] = Array.from(
      container.querySelectorAll('[data-slot="button-group-separator"]'),
    );

    expect(verticalSep.getAttribute("data-orientation")).toBe("vertical");
    expect(horizontalSep.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("组的方向只体现在自己的 data-orientation 与类名上", () => {
    const { getByRole } = toolbar("vertical");
    const group = getByRole("group", { name: "文本格式" });

    expect(group.getAttribute("data-orientation")).toBe("vertical");
    expect(group.classList.contains("flex-col")).toBe(true);
  });
});

describe("ButtonGroup 集成 - 交互", () => {
  it("点击某个按钮只触发它自己的回调，不连带相邻按钮", async () => {
    const user = userEvent.setup();
    const onBold = vi.fn();
    const onItalic = vi.fn();
    const { getByRole } = render(() => (
      <ButtonGroup aria-label="文本格式">
        <button type="button" onClick={onBold}>
          加粗
        </button>
        <ButtonGroupSeparator />
        <button type="button" onClick={onItalic}>
          斜体
        </button>
      </ButtonGroup>
    ));

    await user.click(getByRole("button", { name: "斜体" }));

    expect(onItalic).toHaveBeenCalledTimes(1);
    expect(onBold).not.toHaveBeenCalled();
  });

  it("文本槽与分隔线不会抢走按钮的键盘焦点", async () => {
    const user = userEvent.setup();
    const { getByTestId } = toolbar();

    await user.tab();
    expect(document.activeElement).toBe(getByTestId("bold"));
  });
});
