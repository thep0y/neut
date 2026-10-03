import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import type { QuestionnaireItemHandle } from "~/components/questionnaire/questionnaire.context";
import {
  createItemView,
  resolveActiveName,
} from "~/components/questionnaire/questionnaire.item-view";
import type { QuestionnaireItemDefinition } from "~/components/questionnaire/questionnaire.types";

function handle(
  name: string,
  options: { disabled?: boolean; element?: HTMLElement } = {},
): QuestionnaireItemHandle {
  return {
    name,
    element: options.element ?? document.createElement("fieldset"),
    disabled: () => options.disabled ?? false,
    required: () => false,
    status: () => "answered",
    validate: () => true,
    focus: vi.fn(),
    focusInvalid: vi.fn(),
    skip: vi.fn(),
    reset: vi.fn(),
    getAnswerByElement: () => null,
    getAnswerByShortcut: () => null,
    moveAnswerFocus: () => false,
  } as unknown as QuestionnaireItemHandle;
}

/** 按给定顺序把元素挂进容器，用于驱动 compareDocumentOrder */
function mountInOrder(names: string[]): Record<string, HTMLElement> {
  const form = document.createElement("form");
  document.body.appendChild(form);
  const elements: Record<string, HTMLElement> = {};
  for (const name of names) {
    const fieldset = document.createElement("fieldset");
    form.appendChild(fieldset);
    elements[name] = fieldset;
  }
  return elements;
}

function setup(
  initial: {
    handles?: QuestionnaireItemHandle[];
    controlledItem?: string;
    internalName?: string | null;
    definitions?: QuestionnaireItemDefinition[];
  } = {},
) {
  const [registered, setRegistered] = createSignal<QuestionnaireItemHandle[]>(
    initial.handles ?? [],
  );
  const [domVersion, setDomVersion] = createSignal(0);
  const [controlledItem, setControlledItem] = createSignal<string | undefined>(
    initial.controlledItem,
  );
  const [internalName, setInternalName] = createSignal<string | null>(
    initial.internalName ?? null,
  );
  const [definitions, setDefinitions] = createSignal<
    readonly QuestionnaireItemDefinition[] | undefined
  >(initial.definitions);

  const hook = renderHook(() =>
    createItemView({
      registered,
      domVersion,
      controlledItem,
      internalName,
      definitions,
    }),
  );

  return {
    ...hook,
    setRegistered,
    setDomVersion,
    setControlledItem,
    setInternalName,
    setDefinitions,
  };
}

describe("createItemView 排序与过滤", () => {
  it("按 DOM 顺序重排注册顺序", () => {
    const elements = mountInOrder(["a", "b", "c"]);
    const a = handle("a", { element: elements.a });
    const b = handle("b", { element: elements.b });
    const c = handle("c", { element: elements.c });
    const { result } = setup({ handles: [c, a, b] });

    expect(result.ordered().map((item) => item.name)).toEqual(["a", "b", "c"]);
  });

  it("DOM 版本号变化后重新排序", () => {
    const form = document.createElement("form");
    document.body.appendChild(form);
    const first = document.createElement("fieldset");
    const second = document.createElement("fieldset");
    form.append(first, second);
    const a = handle("a", { element: first });
    const b = handle("b", { element: second });

    const { result, setDomVersion } = setup({ handles: [b, a] });
    expect(result.ordered().map((item) => item.name)).toEqual(["a", "b"]);

    // 把第一个元素挪到末尾，然后通知版本号变化
    form.appendChild(first);
    setDomVersion((v) => v + 1);

    expect(result.ordered().map((item) => item.name)).toEqual(["b", "a"]);
  });

  it("enabled 过滤掉 disabled 题目", () => {
    const elements = mountInOrder(["a", "b", "c"]);
    const { result } = setup({
      handles: [
        handle("a", { element: elements.a }),
        handle("b", { element: elements.b, disabled: true }),
        handle("c", { element: elements.c }),
      ],
    });

    expect(result.enabled().map((item) => item.name)).toEqual(["a", "c"]);
  });

  it("没有任何题目时列表为空", () => {
    const { result } = setup();

    expect(result.ordered()).toEqual([]);
    expect(result.enabled()).toEqual([]);
    expect(result.total()).toBe(0);
  });
});

describe("createItemView 激活项与进度", () => {
  function threeItems(controlledItem?: string, internalName?: string | null) {
    const elements = mountInOrder(["a", "b", "c"]);
    return setup({
      handles: [
        handle("a", { element: elements.a }),
        handle("b", { element: elements.b }),
        handle("c", { element: elements.c }),
      ],
      controlledItem,
      internalName,
    });
  }

  it("受控值优先于内部记录", () => {
    const { result } = threeItems("b", "c");

    expect(result.activeName()).toBe("b");
    expect(result.activeItem()?.name).toBe("b");
  });

  it("没有受控值时用内部记录", () => {
    const { result } = threeItems(undefined, "c");

    expect(result.activeName()).toBe("c");
  });

  it("激活项不在可用列表里时 activeItem 为 null 且 index 为 -1", () => {
    const { result } = threeItems("missing");

    expect(result.activeItem()).toBeNull();
    expect(result.index()).toBe(-1);
    expect(result.current()).toBe(0);
  });

  it("current 从 1 开始计数", () => {
    const { result } = threeItems("b");

    expect(result.index()).toBe(1);
    expect(result.current()).toBe(2);
    expect(result.total()).toBe(3);
  });

  it("first / last 标记首尾", () => {
    const first = threeItems("a");
    expect(first.result.first()).toBe(true);
    expect(first.result.last()).toBe(false);

    const last = threeItems("c");
    expect(last.result.first()).toBe(false);
    expect(last.result.last()).toBe(true);

    const middle = threeItems("b");
    expect(middle.result.first()).toBe(false);
    expect(middle.result.last()).toBe(false);
  });

  it("没有激活项时 first / last 都为 false", () => {
    const { result } = threeItems("missing");

    expect(result.first()).toBe(false);
    expect(result.last()).toBe(false);
  });

  it("只有 disabled 题目时 total 为 0、first/last 为 false", () => {
    const elements = mountInOrder(["a"]);
    const { result } = setup({
      handles: [handle("a", { element: elements.a, disabled: true })],
      controlledItem: "a",
    });

    expect(result.total()).toBe(0);
    expect(result.index()).toBe(-1);
    expect(result.first()).toBe(false);
    expect(result.last()).toBe(false);
  });
});

describe("createItemView itemDefinitions", () => {
  it("未提供定义时为 null", () => {
    const { result } = setup();

    expect(result.itemDefinitions()).toBeNull();
  });

  it("提供定义时按名字建索引", () => {
    const definitions: QuestionnaireItemDefinition[] = [
      { name: "a", choices: [{ value: "1" }] },
      { name: "b" },
    ];
    const { result } = setup({ definitions });

    expect(result.itemDefinitions()?.get("a")).toBe(definitions[0]);
    expect(result.itemDefinitions()?.get("b")).toBe(definitions[1]);
    expect(result.itemDefinitions()?.size).toBe(2);
  });
});

describe("resolveActiveName", () => {
  const a = handle("a");
  const b = handle("b");
  const enabled = [a, b];

  it("受控值在列表里时用它", () => {
    expect(
      resolveActiveName({ enabled, controlledItem: "b", defaultItem: "a" }),
    ).toBe("b");
  });

  it("没有受控值时用 defaultItem", () => {
    expect(
      resolveActiveName({
        enabled,
        controlledItem: undefined,
        defaultItem: "b",
      }),
    ).toBe("b");
  });

  it("候选值不在列表里时退到第一个可用题目", () => {
    expect(
      resolveActiveName({
        enabled,
        controlledItem: "missing",
        defaultItem: undefined,
      }),
    ).toBe("a");
  });

  it("没有可用题目时返回 null", () => {
    expect(
      resolveActiveName({ enabled: [], controlledItem: "a", defaultItem: "b" }),
    ).toBeNull();
  });

  it("没有候选值但有可用题目时返回第一个", () => {
    expect(
      resolveActiveName({
        enabled,
        controlledItem: undefined,
        defaultItem: undefined,
      }),
    ).toBe("a");
  });
});
