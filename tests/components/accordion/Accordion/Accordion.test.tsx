import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Accordion } from "~/components/accordion/Accordion/Accordion";
import { useAccordionContext } from "~/components/accordion/Accordion/Accordion.context";

/** 读回 context 的探针 */
function Probe() {
  const ctx = useAccordionContext();
  return (
    <div>
      <span data-testid="orientation">{ctx.orientation}</span>
      <span data-testid="open-a">{String(ctx.isOpen("a"))}</span>
    </div>
  );
}

function rootOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="accordion"]');
}

describe("Accordion - 结构与属性", () => {
  it("渲染 section[data-slot=accordion]，默认竖向、ltr", () => {
    const { container } = render(() => (
      <Accordion>
        <Probe />
      </Accordion>
    ));
    const root = rootOf(container)!;

    expect(root.tagName).toBe("SECTION");
    expect(root.getAttribute("data-orientation")).toBe("vertical");
    expect(root.getAttribute("dir")).toBe("ltr");
    expect(
      container.querySelector('[data-testid="orientation"]')?.textContent,
    ).toBe("vertical");
  });

  it("orientation / dir / class / classList / 其余属性都可覆盖", () => {
    const { container } = render(() => (
      <Accordion
        orientation="horizontal"
        dir="rtl"
        class="my-acc"
        classList={{ "is-compact": true }}
        id="acc"
        aria-label="常见问题"
      >
        <Probe />
      </Accordion>
    ));
    const root = rootOf(container)!;

    expect(root.getAttribute("data-orientation")).toBe("horizontal");
    expect(root.getAttribute("dir")).toBe("rtl");
    expect(root.className).toContain("my-acc");
    expect(root.className).toContain("is-compact");
    expect(root.id).toBe("acc");
    expect(root.getAttribute("aria-label")).toBe("常见问题");
    expect(
      container.querySelector('[data-testid="orientation"]')?.textContent,
    ).toBe("horizontal");
  });

  it("defaultValue 让对应项一开始就是打开的", () => {
    const { getByTestId } = render(() => (
      <Accordion defaultValue={["a"]}>
        <Probe />
      </Accordion>
    ));

    expect(getByTestId("open-a").textContent).toBe("true");
  });
});

describe("Accordion - 键盘导航", () => {
  /** 三个 trigger，其中一个禁用 */
  function renderTriggers(disabledMiddle = true) {
    const view = render(() => (
      <Accordion>
        <div>
          <button type="button" data-accordion-trigger="" data-testid="t1">
            一
          </button>
          <button
            type="button"
            data-accordion-trigger=""
            data-testid="t2"
            disabled={disabledMiddle}
          >
            二
          </button>
          <button type="button" data-accordion-trigger="" data-testid="t3">
            三
          </button>
        </div>
      </Accordion>
    ));
    return view;
  }

  it("ArrowDown / ArrowUp 在可用 trigger 之间循环（跳过 disabled）", () => {
    const { getByTestId, container } = renderTriggers();
    const root = rootOf(container)!;
    const t1 = getByTestId("t1");
    const t3 = getByTestId("t3");

    t1.focus();
    expect(fireEvent.keyDown(root, { key: "ArrowDown" })).toBe(false);
    expect(document.activeElement).toBe(t3); // 中间的 t2 被禁用 → 直接到 t3

    expect(fireEvent.keyDown(root, { key: "ArrowDown" })).toBe(false);
    expect(document.activeElement).toBe(t1); // 循环回第一个

    expect(fireEvent.keyDown(root, { key: "ArrowUp" })).toBe(false);
    expect(document.activeElement).toBe(t3);
  });

  it("Home / End 跳到第一个 / 最后一个", () => {
    const { getByTestId, container } = renderTriggers();
    const root = rootOf(container)!;

    getByTestId("t3").focus();
    fireEvent.keyDown(root, { key: "Home" });
    expect(document.activeElement).toBe(getByTestId("t1"));

    fireEvent.keyDown(root, { key: "End" });
    expect(document.activeElement).toBe(getByTestId("t3"));
  });

  it("焦点不在 trigger 上时不处理（不阻止默认行为）", () => {
    const { container } = renderTriggers();
    const root = rootOf(container)!;

    document.body.focus();
    expect(fireEvent.keyDown(root, { key: "ArrowDown" })).toBe(true);
  });

  it("焦点在 trigger 上但没有 data-accordion-trigger 属性时不处理", () => {
    const { container } = render(() => (
      <Accordion>
        <button type="button" data-testid="plain">
          普通按钮
        </button>
      </Accordion>
    ));
    const plain = container.querySelector(
      '[data-testid="plain"]',
    ) as HTMLElement;
    plain.focus();

    expect(fireEvent.keyDown(rootOf(container)!, { key: "ArrowDown" })).toBe(
      true,
    );
  });

  it("其它按键不处理", () => {
    const { getByTestId, container } = renderTriggers();
    getByTestId("t1").focus();

    expect(fireEvent.keyDown(rootOf(container)!, { key: "a" })).toBe(true);
    expect(fireEvent.keyDown(rootOf(container)!, { key: "Enter" })).toBe(true);
  });

  it("容器里没有可用 trigger 时安全退出", () => {
    const { container } = render(() => <Accordion />);
    const root = rootOf(container)!;

    expect(() => fireEvent.keyDown(root, { key: "ArrowDown" })).not.toThrow();
  });

  it("焦点元素带 trigger 标记但不在当前容器里：已阻止默认行为但不移动焦点", () => {
    const { container } = render(() => (
      <Accordion>
        <button type="button" data-accordion-trigger="" data-testid="inside">
          内部
        </button>
      </Accordion>
    ));
    const outside = document.createElement("button");
    outside.setAttribute("data-accordion-trigger", "");
    document.body.appendChild(outside);
    outside.focus();

    // preventDefault 在索引校验之前调用，因此这里返回 false（事件已被阻止）
    expect(fireEvent.keyDown(rootOf(container)!, { key: "ArrowDown" })).toBe(
      false,
    );
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
