import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "~/components/checkbox/Checkbox";
import { Label } from "~/components/label/Label";

/**
 * Label 测试。
 *
 * 实现要点（决定了断言该怎么写）：
 * - 渲染原生 `<label data-slot="label">`；`class` 走 clsx 合并，`classList` 原样透传；
 * - 点击转发是**手动**的：`for` 存在时用 `[aria-labelledby="<for>"]` 找关联控件并
 *   `click()`；没有 `for` 时在自身子树里找 `[aria-labelledby]`，先 `preventDefault()`
 *   再手动 `click()`——把原生的 label 转发取消掉，避免叠加成两次。
 */

function label(): HTMLElement {
  return document.querySelector('[data-slot="label"]') as HTMLElement;
}

describe("Label - 渲染与属性", () => {
  it("渲染原生 label 且带 data-slot=label", () => {
    render(() => <Label>用户名</Label>);

    expect(label().tagName).toBe("LABEL");
    expect(label()).toHaveAttribute("data-slot", "label");
    expect(label()).toHaveTextContent("用户名");
  });

  it("class 与默认样式合并，classList 按 true/false 生效", () => {
    render(() => (
      <Label
        class="my-label"
        classList={{ "is-required": true, "is-off": false }}
      >
        用户名
      </Label>
    ));

    expect(label()).toHaveClass("my-label");
    expect(label()).toHaveClass("text-sm");
    expect(label()).toHaveClass("is-required");
    expect(label()).not.toHaveClass("is-off");
  });

  it("for 与其余属性原样透传", () => {
    render(() => (
      <Label for="name" title="提示" data-testid="lbl">
        用户名
      </Label>
    ));

    expect(label()).toHaveAttribute("for", "name");
    expect(label()).toHaveAttribute("title", "提示");
    expect(label()).toHaveAttribute("data-testid", "lbl");
  });

  it("不传 for 时不渲染 for 属性", () => {
    render(() => <Label>用户名</Label>);

    expect(label()).not.toHaveAttribute("for");
  });
});

describe("Label - for 关联的点击转发", () => {
  it("点击 label 转发到 for 指向的关联控件（一次）", () => {
    const onClick = vi.fn();
    render(() => (
      <>
        <Label for="terms">同意条款</Label>
        <div
          id="terms"
          role="checkbox"
          aria-checked="false"
          tabIndex="0"
          aria-labelledby="terms"
          onClick={onClick}
        />
      </>
    ));

    fireEvent.click(label());

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("点击 label 内部的子元素同样转发", () => {
    const onClick = vi.fn();
    render(() => (
      <>
        <Label for="terms">
          <span data-testid="label-text">同意</span>
        </Label>
        <div
          id="terms"
          role="checkbox"
          aria-checked="false"
          tabIndex="0"
          aria-labelledby="terms"
          onClick={onClick}
        />
      </>
    ));

    fireEvent.click(document.querySelector('[data-testid="label-text"]')!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("for 指向的关联控件不存在时点击静默返回", () => {
    const onClick = vi.fn();
    render(() => (
      <>
        <Label for="missing">同意</Label>
        <div
          role="checkbox"
          aria-checked="false"
          tabIndex="0"
          aria-labelledby="other"
          onClick={onClick}
        />
      </>
    ));

    fireEvent.click(label());

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Label - 无 for 时在子树里转发", () => {
  it("点击 label 阻止原生转发并手动点击子树里的关联控件（只触发一次）", () => {
    const onClick = vi.fn();
    // 嵌套的可聚焦控件会被浏览器（jsdom 同样实现了）按原生 label 行为转发一次，
    // 实现又手动 click 一次；preventDefault 取消掉原生那次，用户因此只看到一次。
    // 这里同时断言事件确实被 preventDefault——它才是"只转发一次"的保证。
    const seen: MouseEvent[] = [];
    const record = (event: MouseEvent) => {
      if (event.target === label()) seen.push(event);
    };
    document.addEventListener("click", record);

    render(() => (
      <Label>
        同意
        <input type="checkbox" id="cb" aria-labelledby="cb" onClick={onClick} />
      </Label>
    ));

    try {
      fireEvent.click(label());
    } finally {
      document.removeEventListener("click", record);
    }

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(seen).toHaveLength(1);
    expect(seen[0].defaultPrevented).toBe(true);
  });

  it("点击落在关联控件自身时不重复转发", () => {
    const onClick = vi.fn();
    render(() => (
      <Label>
        <div
          data-testid="cb"
          role="checkbox"
          aria-checked="false"
          tabIndex="0"
          aria-labelledby="cb"
          onClick={onClick}
        />
      </Label>
    ));

    const control = document.querySelector('[data-testid="cb"]')!;
    const seen: MouseEvent[] = [];
    const record = (event: MouseEvent) => seen.push(event);
    document.addEventListener("click", record);

    try {
      fireEvent.click(control);
    } finally {
      document.removeEventListener("click", record);
    }

    expect(onClick).toHaveBeenCalledTimes(1);
    // 点在控件自身：不需要手动转发，也不应阻止默认行为
    expect(seen).toHaveLength(1);
    expect(seen[0].defaultPrevented).toBe(false);
  });

  it("子树里没有关联控件时点击不做转发", () => {
    const onClick = vi.fn();
    render(() => (
      <Label>
        <div data-testid="plain" onClick={onClick} />
      </Label>
    ));

    fireEvent.click(label());

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Label - 与自定义控件的双重激活（回归）", () => {
  it("点 label 一次只勾选一次，且可见状态与表单值一致", () => {
    // 此前 Label 的 for 分支会手动 target.click()，而浏览器对 <label for>
    // 本来就会转发一次原生点击到 for 指向的控件；两者叠加会让隐藏 input
    // 被点两次（状态翻回原值、onChange 触发两次），
    // 出现"可见 span 显示已勾选、input.checked 仍是 false"的脱节。
    const onChange = vi.fn();
    render(() => (
      <>
        <Label for="cb-consent">同意</Label>
        <Checkbox id="cb-consent" onChange={onChange} />
      </>
    ));

    fireEvent.click(document.querySelector('[data-slot="label"]')!);

    const input = document.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(input.checked).toBe(true);
    expect(
      document
        .querySelector('[data-slot="checkbox"]')
        ?.getAttribute("aria-checked"),
    ).toBe("true");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("标准 label for + 原生 checkbox 仍能正常转发一次", () => {
    render(() => (
      <>
        <Label for="native-cb">标签</Label>
        <input id="native-cb" type="checkbox" />
      </>
    ));

    fireEvent.click(document.querySelector('[data-slot="label"]')!);

    expect(
      (document.getElementById("native-cb") as HTMLInputElement).checked,
    ).toBe(true);
  });

  it("连点两次 label 回到未勾选（每次只翻一次）", () => {
    render(() => (
      <>
        <Label for="cb-twice">同意</Label>
        <Checkbox id="cb-twice" />
      </>
    ));
    const label = document.querySelector('[data-slot="label"]')!;

    fireEvent.click(label);
    fireEvent.click(label);

    expect(
      (document.querySelector('input[type="checkbox"]') as HTMLInputElement)
        .checked,
    ).toBe(false);
  });
});
