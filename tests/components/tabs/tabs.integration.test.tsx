import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "~/components/tabs/Tabs/Tabs";
import { TabsContent } from "~/components/tabs/TabsContent/TabsContent";
import { TabsList } from "~/components/tabs/TabsList/TabsList";
import { TabsTrigger } from "~/components/tabs/TabsTrigger/TabsTrigger";

/**
 * Tabs 的集成测试:通过真实组合验证「键盘导航 → 焦点 → 高亮 → 激活」
 * 与「受控/非受控」两条主链路。
 *
 * 键盘算法本身已在 `~/utils/roving-navigation.test.ts` 覆盖,
 * 这里关注的是**接线是否正确**(context 字段有没有接错、事件有没有挂上)。
 */
function renderTabs(
  props: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (v: string | number) => void;
    orientation?: "horizontal" | "vertical";
    loop?: boolean;
    dir?: "ltr" | "rtl" | "auto";
    disabledValues?: string[];
    listProps?: Record<string, unknown>;
  } = {},
) {
  return render(() => (
    <Tabs
      defaultValue={props.defaultValue}
      value={props.value}
      onValueChange={props.onValueChange}
      orientation={props.orientation}
      loop={props.loop}
      dir={props.dir}
    >
      <TabsList {...props.listProps}>
        {["account", "password", "profile"].map((v) => (
          <TabsTrigger value={v} disabled={props.disabledValues?.includes(v)}>
            {v}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="account">account-panel</TabsContent>
      <TabsContent value="password">password-panel</TabsContent>
      <TabsContent value="profile">profile-panel</TabsContent>
    </Tabs>
  ));
}

describe("Tabs 键盘导航（集成）", () => {
  it("ArrowRight 移动焦点但不激活（base-ui 语义）", async () => {
    const onValueChange = vi.fn();
    const { getAllByRole, queryByText } = renderTabs({
      defaultValue: "account",
      onValueChange,
    });
    const triggers = getAllByRole("tab");

    triggers[0].focus();
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");

    // 焦点移动了
    expect(document.activeElement).toBe(triggers[1]);
    // 但没有激活：content 不变、回调未触发
    expect(queryByText("account-panel")).toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("移动焦点后高亮跟随（data-highlighted 转移到新 tab）", async () => {
    const { getAllByRole } = renderTabs({ defaultValue: "account" });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(triggers[1]).toHaveAttribute("data-highlighted", "");
    expect(triggers[0]).not.toHaveAttribute("data-highlighted");
  });

  it("移动焦点后 roving tabindex 跟着走", async () => {
    const { getAllByRole } = renderTabs({ defaultValue: "account" });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    expect(triggers[0]).toHaveAttribute("tabindex", "0");

    await user.keyboard("{ArrowRight}");

    expect(triggers[1]).toHaveAttribute("tabindex", "0");
    expect(triggers[0]).toHaveAttribute("tabindex", "-1");
  });

  it("End 跳到最后一个 tab", async () => {
    const { getAllByRole } = renderTabs({ defaultValue: "account" });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{End}");

    expect(document.activeElement).toBe(triggers[2]);
  });

  it("Home 回到第一个 tab", async () => {
    const { getAllByRole } = renderTabs({ defaultValue: "profile" });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[2].focus();
    await user.keyboard("{Home}");

    expect(document.activeElement).toBe(triggers[0]);
  });

  it("loop=true 时在最后一个 tab 上按 ArrowRight 环回第一个", async () => {
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      loop: true,
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[2].focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(triggers[0]);
  });

  it("loop=false 时在最后一个 tab 上按 ArrowRight 停在原地", async () => {
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      loop: false,
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[2].focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(triggers[2]);
  });

  it("跳过 disabled 的 tab", async () => {
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      disabledValues: ["password"],
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(triggers[2]);
  });

  it("vertical 布局下方向键映射到上下", async () => {
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      orientation: "vertical",
    });
    const triggers = getAllByRole("tab");

    triggers[0].focus();
    const user = userEvent.setup();
    await user.keyboard("{ArrowDown}");

    expect(document.activeElement).toBe(triggers[1]);
  });

  it("vertical 布局下左右键不移动焦点", async () => {
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      orientation: "vertical",
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(triggers[0]);
  });

  it("dir=rtl 时左右键方向反转", async () => {
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      dir: "rtl",
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowLeft}");

    expect(document.activeElement).toBe(triggers[1]);
  });

  it("Enter 激活当前高亮的 tab", async () => {
    const onValueChange = vi.fn();
    const { getAllByRole, getByText } = renderTabs({
      defaultValue: "account",
      onValueChange,
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("password");
    expect(getByText("password-panel")).toBeInTheDocument();
  });

  it("Space 同样激活", async () => {
    const onValueChange = vi.fn();
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      onValueChange,
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard(" ");

    expect(onValueChange).toHaveBeenCalledWith("password");
  });

  it("activateOnFocus 时键盘导航会切换面板", async () => {
    const onValueChange = vi.fn();
    const { getAllByRole, getByText } = renderTabs({
      defaultValue: "account",
      onValueChange,
      listProps: { activateOnFocus: true },
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenCalledWith("password");
    expect(getByText("password-panel")).toBeInTheDocument();
  });

  it("用户自己的 onKeyDown 会被调用且不影响内部导航", async () => {
    const onKeyDown = vi.fn();
    const { getAllByRole } = renderTabs({
      defaultValue: "account",
      listProps: { onKeyDown },
    });
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(onKeyDown).toHaveBeenCalled();
    // 内部导航仍然生效
    expect(document.activeElement).toBe(triggers[1]);
  });

  describe("受控 / 非受控", () => {
    it("非受控模式下点击会写内部状态并回调", async () => {
      const onValueChange = vi.fn();
      const { getAllByRole, getByText } = renderTabs({
        defaultValue: "account",
        onValueChange,
      });
      const user = userEvent.setup();

      await user.click(getAllByRole("tab")[1]);

      expect(onValueChange).toHaveBeenCalledWith("password");
      expect(getByText("password-panel")).toBeInTheDocument();
    });

    it("受控模式下点击只回调，内部状态不变（面板不切换）", async () => {
      const onValueChange = vi.fn();
      const { getAllByRole, getByText, queryByText } = renderTabs({
        value: "account",
        onValueChange,
      });
      const user = userEvent.setup();

      await user.click(getAllByRole("tab")[1]);

      expect(onValueChange).toHaveBeenCalledWith("password");
      // 受控：UI 跟随外部值，仍是 account
      expect(getByText("account-panel")).toBeInTheDocument();
      expect(queryByText("password-panel")).not.toBeInTheDocument();
    });

    it("受控值由外部回写后 UI 跟随", async () => {
      const [value, setValue] = createSignal("account");
      const { getAllByRole, getByText } = render(() => (
        <Tabs value={value()}>
          <TabsList>
            <TabsTrigger value="account">account</TabsTrigger>
            <TabsTrigger value="password">password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">account-panel</TabsContent>
          <TabsContent value="password">password-panel</TabsContent>
        </Tabs>
      ));

      expect(getByText("account-panel")).toBeInTheDocument();

      setValue("password");

      expect(getByText("password-panel")).toBeInTheDocument();
      expect(getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    });

    it("受控模式下键盘导航只改高亮，不改激活值", async () => {
      const { getAllByRole, getByText } = renderTabs({ value: "account" });
      const triggers = getAllByRole("tab");
      const user = userEvent.setup();

      triggers[0].focus();
      await user.keyboard("{ArrowRight}");

      expect(triggers[1]).toHaveAttribute("data-highlighted", "");
      // 激活值未被改动
      expect(triggers[1]).toHaveAttribute("aria-selected", "false");
      expect(getByText("account-panel")).toBeInTheDocument();
    });
  });
});
