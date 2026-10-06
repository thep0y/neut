import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Tabs } from "~/components/tabs/Tabs/Tabs";
import { TabsContent } from "~/components/tabs/TabsContent/TabsContent";
import { TabsList } from "~/components/tabs/TabsList/TabsList";
import { TabsTrigger } from "~/components/tabs/TabsTrigger/TabsTrigger";
import { useTabsContext } from "~/components/tabs/Tabs/Tabs.context";
import { useTabsListContext } from "~/components/tabs/TabsList/TabsList.context";

/**
 * 上下文约束:子组件脱离父组件渲染时必须抛出中文错误,
 * 帮助使用者快速定位误用(TESTING.md §5.3「上下文约束」)。
 */
describe("Tabs 上下文约束", () => {
  it("TabsTrigger 脱离 Tabs 渲染时抛出中文错误", () => {
    expect(() => render(() => <TabsTrigger value="a">a</TabsTrigger>)).toThrow(
      "useTabsContext 必须用在 <Tabs> 内部",
    );
  });

  it("TabsContent 脱离 Tabs 渲染时抛出中文错误", () => {
    expect(() => render(() => <TabsContent value="a">a</TabsContent>)).toThrow(
      "useTabsContext 必须用在 <Tabs> 内部",
    );
  });

  it("TabsList 脱离 Tabs 渲染时抛出中文错误", () => {
    expect(() =>
      render(() => (
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
        </TabsList>
      )),
    ).toThrow("useTabsContext 必须用在 <Tabs> 内部");
  });

  it("TabsTrigger 脱离 TabsList 渲染时抛出中文错误", () => {
    expect(() =>
      render(() => (
        <Tabs>
          <TabsTrigger value="a">a</TabsTrigger>
        </Tabs>
      )),
    ).toThrow("useTabsListContext 必须用在 <TabsList> 内部");
  });

  it("useTabsContext 在 Provider 之外返回时抛错", () => {
    expect(() => render(() => <Probe />)).toThrow(
      "useTabsContext 必须用在 <Tabs> 内部",
    );
  });

  it("useTabsListContext 在 Provider 之外返回时抛错", () => {
    expect(() => render(() => <ListProbe />)).toThrow(
      "useTabsListContext 必须用在 <TabsList> 内部",
    );
  });

  function Probe() {
    useTabsContext();
    return <div />;
  }

  function ListProbe() {
    useTabsListContext();
    return <div />;
  }
});

describe("TabsContent 渲染语义", () => {
  it("未激活的 content 默认不挂载", () => {
    const { queryByText } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b">b</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));

    expect(queryByText("panel-a")).toBeInTheDocument();
    expect(queryByText("panel-b")).not.toBeInTheDocument();
  });

  it("forceMount 时挂载但隐藏（hidden + 内联 display:none）", () => {
    const { queryByText } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b">b</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b" forceMount>
          panel-b
        </TabsContent>
      </Tabs>
    ));

    const panelB = queryByText("panel-b");
    expect(panelB).toBeInTheDocument();
    expect(panelB).toHaveAttribute("hidden");
    // flex-1 的 display:flex 会覆盖 UA 的 [hidden]，必须显式 display:none
    expect((panelB as HTMLElement).style.display).toBe("none");
  });

  it("forceMount 且已激活时正常显示", () => {
    const { getByText } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
        </TabsList>
        <TabsContent value="a" forceMount>
          panel-a
        </TabsContent>
      </Tabs>
    ));

    const panel = getByText("panel-a");
    expect(panel).not.toHaveAttribute("hidden");
    expect((panel as HTMLElement).style.display).not.toBe("none");
  });

  it("用户 style 在 forceMount 隐藏时被合并且不丢失", () => {
    const { getByText } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b">b</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b" forceMount style={{ color: "red" }}>
          panel-b
        </TabsContent>
      </Tabs>
    ));

    const panel = getByText("panel-b") as HTMLElement;
    expect(panel.style.display).toBe("none");
    expect(panel.style.color).toBe("red");
  });

  it("forceMount 未隐藏时保留用户 style 原样", () => {
    const { getByText } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
        </TabsList>
        <TabsContent value="a" forceMount style={{ color: "blue" }}>
          panel-a
        </TabsContent>
      </Tabs>
    ));

    const panel = getByText("panel-a") as HTMLElement;
    expect(panel.style.color).toBe("blue");
    expect(panel.style.display).not.toBe("none");
  });

  it("tabpanel 有 role / tabindex / aria-labelledby", () => {
    const { getByRole } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
      </Tabs>
    ));

    const panel = getByRole("tabpanel");
    expect(panel).toHaveAttribute("tabindex", "0");
    expect(panel.getAttribute("aria-labelledby")).toBeTruthy();
  });
});
