import { fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "~/components/tabs/Tabs/Tabs";
import { TabsContent } from "~/components/tabs/TabsContent/TabsContent";
import { TabsList } from "~/components/tabs/TabsList/TabsList";
import { TabsTrigger } from "~/components/tabs/TabsTrigger/TabsTrigger";

/**
 * 用户事件处理器不丢:组件内部事件与用户 `onClick` / `onKeyDown` / `onFocus`
 * 互不覆盖(TESTING.md §5.3「多态 component」一栏要求)。
 */
describe("Tabs 用户事件处理器", () => {
  it("用户的 onClick 被调用，且内部激活同时生效", async () => {
    const onClick = vi.fn();
    const { getAllByRole, getByText } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b" onClick={onClick}>
            b
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));
    const user = userEvent.setup();

    await user.click(getAllByRole("tab")[1]);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getByText("panel-b")).toBeInTheDocument();
  });

  it("用户的 onClick 传 bound 形式时按 (data, event) 调用", async () => {
    // Solid 的 EventHandlerUnion 里，数组是 **bound handler**：
    // `{ 0: (data, event) => void, 1: data }`，约定 data 在前、event 在后。
    // （旧实现把它当成"多个处理器逐个调用"，与 Solid 的类型契约不符。）
    const handler = vi.fn();
    const { getAllByRole } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b" onClick={[handler, { id: 7 }] as never}>
            b
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));
    const user = userEvent.setup();

    await user.click(getAllByRole("tab")[1]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual({ id: 7 });
    expect(handler.mock.calls[0][1]).toBeInstanceOf(MouseEvent);
  });

  it("用户的 onFocus 被调用，且高亮仍然更新", () => {
    const onFocus = vi.fn();
    const { getAllByRole } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b" onFocus={onFocus}>
            b
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));

    getAllByRole("tab")[1].focus();

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(getAllByRole("tab")[1]).toHaveAttribute("data-highlighted", "");
  });

  it("disabled 的 trigger 被点击时不激活", () => {
    const onValueChange = vi.fn();
    const { getAllByRole } = render(() => (
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b" disabled>
            b
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));

    fireEvent.click(getAllByRole("tab")[1]);

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disabled 的 trigger 聚焦时不更新高亮", () => {
    const { getAllByRole } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b" disabled>
            b
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));

    fireEvent.focus(getAllByRole("tab")[1]);

    expect(getAllByRole("tab")[1]).not.toHaveAttribute("data-highlighted");
  });

  it("用户的 onKeyDown 在列表上被调用且内部导航仍生效", async () => {
    const onKeyDown = vi.fn();
    const { getAllByRole } = render(() => (
      <Tabs defaultValue="a">
        <TabsList onKeyDown={onKeyDown}>
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b">b</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));
    const triggers = getAllByRole("tab");
    const user = userEvent.setup();

    triggers[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(onKeyDown).toHaveBeenCalled();
    expect(document.activeElement).toBe(triggers[1]);
  });

  it("用户 onKeyDown 里 preventDefault 后内部导航不再接管", () => {
    const { getAllByRole } = render(() => (
      <Tabs defaultValue="a">
        <TabsList
          onKeyDown={(e: KeyboardEvent) => {
            e.preventDefault();
          }}
        >
          <TabsTrigger value="a">a</TabsTrigger>
          <TabsTrigger value="b">b</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
        <TabsContent value="b">panel-b</TabsContent>
      </Tabs>
    ));
    const triggers = getAllByRole("tab");

    triggers[0].focus();
    fireEvent.keyDown(triggers[0], { key: "ArrowRight" });

    expect(document.activeElement).toBe(triggers[0]);
  });

  it("Tabs 禁用多态 component（EnableAs=false）", () => {
    // 这是有意的类型设计：TabsProps 第三个类型参数是 `false`，
    // 即不暴露 `component`，避免使用者把 root 换成语义不合适的标签。
    const { container } = render(() => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
      </Tabs>
    ));

    const root = container.querySelector('[data-slot="tabs"]');
    expect(root?.tagName).toBe("DIV");
  });

  it("class / classList 被合并到根元素", () => {
    const { container } = render(() => (
      <Tabs
        defaultValue="a"
        class="my-tabs"
        classList={{ extra: true, missing: false }}
      >
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
        </TabsList>
        <TabsContent value="a">panel-a</TabsContent>
      </Tabs>
    ));

    const root = container.querySelector('[data-slot="tabs"]');
    expect(root).toHaveClass("my-tabs");
    expect(root).toHaveClass("extra");
    expect(root).not.toHaveClass("missing");
  });
});
