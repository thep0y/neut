import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs } from "~/components/tabs/Tabs/Tabs";
import { TabsContent } from "~/components/tabs/TabsContent/TabsContent";
import { TabsList } from "~/components/tabs/TabsList/TabsList";
import { TabsTrigger } from "~/components/tabs/TabsTrigger/TabsTrigger";

const renderTabs = (
  props: {
    defaultValue?: string;
    listProps?: Record<string, unknown>;
    triggerProps?: Record<string, unknown>;
  } = {},
) =>
  render(() => (
    <Tabs defaultValue={props.defaultValue}>
      <TabsList {...props.listProps}>
        <TabsTrigger value="account" {...props.triggerProps}>
          账号
        </TabsTrigger>
        <TabsTrigger value="password" {...props.triggerProps}>
          密码
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">账号设置</TabsContent>
      <TabsContent value="password">密码设置</TabsContent>
    </Tabs>
  ));

describe("TabsTrigger", () => {
  it("渲染为 role=tab 的按钮，并带 data-slot", () => {
    const { getAllByRole } = renderTabs();
    const trigger = getAllByRole("tab")[0];

    expect(trigger).toHaveAttribute("data-slot", "tabs-trigger");
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("激活的 trigger 输出 data-active 与 aria-selected=true，非激活的不输出", () => {
    const { getAllByRole } = renderTabs({ defaultValue: "account" });
    const [account, password] = getAllByRole("tab");

    expect(account).toHaveAttribute("data-active", "");
    expect(account).toHaveAttribute("aria-selected", "true");
    expect(password).not.toHaveAttribute("data-active");
    expect(password).toHaveAttribute("aria-selected", "false");
  });

  it("aria-controls 指向的 tabpanel 存在，且 tabpanel 反向 aria-labelledby 指回", () => {
    const { getAllByRole } = renderTabs({ defaultValue: "account" });
    const [account] = getAllByRole("tab");
    const panel = getAllByRole("tabpanel")[0];

    expect(account.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(account.id);
  });

  it("defaultValue 缺失时首个可用 trigger 持 tabindex=0 作为键盘起点", () => {
    const { getAllByRole } = renderTabs();
    const triggers = getAllByRole("tab");

    expect(triggers[0]).toHaveAttribute("tabindex", "0");
    expect(triggers[1]).toHaveAttribute("tabindex", "-1");
  });

  it("disabled 的 trigger 不会成为键盘起点", () => {
    const { getAllByRole } = render(() => (
      <Tabs>
        <TabsList>
          <TabsTrigger value="account" disabled>
            账号
          </TabsTrigger>
          <TabsTrigger value="password">密码</TabsTrigger>
        </TabsList>
        <TabsContent value="account">账号设置</TabsContent>
        <TabsContent value="password">密码设置</TabsContent>
      </Tabs>
    ));

    const [account, password] = getAllByRole("tab");
    expect(account).toHaveAttribute("tabindex", "-1");
    expect(password).toHaveAttribute("tabindex", "0");
  });

  it("点击 trigger 激活对应 tab 并切换可见面板", async () => {
    const { getAllByRole, getByText, queryByText } = renderTabs({
      defaultValue: "account",
    });

    expect(getByText("账号设置")).toBeInTheDocument();
    expect(queryByText("密码设置")).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(getAllByRole("tab")[1]);

    expect(queryByText("账号设置")).not.toBeInTheDocument();
    expect(getByText("密码设置")).toBeInTheDocument();
  });

  it("点击 disabled 的 trigger 不激活", async () => {
    const { getAllByRole, getByText, queryByText } = render(() => (
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">账号</TabsTrigger>
          <TabsTrigger value="password" disabled>
            密码
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">账号设置</TabsContent>
        <TabsContent value="password">密码设置</TabsContent>
      </Tabs>
    ));

    const user = userEvent.setup();
    await user.click(getAllByRole("tab")[1]);

    expect(getByText("账号设置")).toBeInTheDocument();
    expect(queryByText("密码设置")).not.toBeInTheDocument();
  });
});
