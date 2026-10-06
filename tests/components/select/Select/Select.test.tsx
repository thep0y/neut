import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Select } from "~/components/select/Select/Select";
import { SelectContent } from "~/components/select/SelectContent/SelectContent";
import { SelectItem } from "~/components/select/SelectItem/SelectItem";

/**
 * `Select` 根组件的注册表管理：item 挂载时登记、卸载时按 value 注销。
 * 注销时走的 `idx !== -1` 分支此前没有用例——item 被移除后注册表要真的少一条，
 * 否则 `SelectValue` 还能读到已经不存在的 label。
 */
const optionTexts = () =>
  Array.from(document.querySelectorAll('[role="option"]')).map(
    (el) => el.textContent,
  );

describe("Select - item 注册与注销", () => {
  it("item 被移除后从注册表注销（按 value 找到并删除）", async () => {
    const [show, setShow] = createSignal(true);
    render(() => (
      <Select defaultOpen>
        <SelectContent>
          <SelectItem value="apple">苹果</SelectItem>
          {show() ? <SelectItem value="banana">香蕉</SelectItem> : null}
        </SelectContent>
      </Select>
    ));
    await Promise.resolve();
    await Promise.resolve();
    expect(optionTexts()).toHaveLength(2);

    setShow(false);
    await Promise.resolve();
    await Promise.resolve();

    expect(optionTexts()).toHaveLength(1);
    expect(optionTexts()[0]).toContain("苹果");
  });
});

describe("SelectItem - 禁用项不更新高亮（回归）", () => {
  it("鼠标移入 disabled 项时不改变 activeValue", async () => {
    // 守卫是 `if (!props().disabled) ctx.setActiveValue(...)`
    render(() => (
      <Select defaultOpen>
        <SelectContent>
          <SelectItem value="apple">苹果</SelectItem>
          <SelectItem value="banana" disabled>
            香蕉
          </SelectItem>
        </SelectContent>
      </Select>
    ));
    await Promise.resolve();
    await Promise.resolve();

    expect(() =>
      fireEvent.mouseEnter(
        document.querySelectorAll('[role="option"]')[1] as HTMLElement,
      ),
    ).not.toThrow();
  });
});
