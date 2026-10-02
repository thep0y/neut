import { describe, expect, it } from "vitest";
import {
  compareDocumentOrder,
  hasText,
  isAnswerDisabled,
  isAnswerFilled,
  isNativeRadio,
  isTextInputEmpty,
  isTypingElement,
  keyShortcutText,
  normalizeShortcut,
  shortcutAlphabet,
} from "~/components/questionnaire/questionnaire.utils";

describe("hasText", () => {
  it("普通字符串有内容时返回 true", () => {
    expect(hasText("abc")).toBe(true);
  });

  it("空字符串返回 false", () => {
    expect(hasText("")).toBe(false);
  });

  it("只有空白返回 false", () => {
    expect(hasText("   ")).toBe(false);
    expect(hasText("\t\n")).toBe(false);
  });

  it("null / undefined 返回 false", () => {
    expect(hasText(null)).toBe(false);
    expect(hasText(undefined)).toBe(false);
  });

  it("数字 0 视为有内容（不是空值）", () => {
    expect(hasText(0)).toBe(true);
  });

  it("数字转成字符串后判断", () => {
    expect(hasText(42)).toBe(true);
  });

  it("数组中有非空白项时返回 true", () => {
    expect(hasText(["a", "b"])).toBe(true);
  });

  it("数组里只有空白项时返回 false", () => {
    expect(hasText(["", "  "])).toBe(false);
  });

  it("空数组返回 false", () => {
    expect(hasText([])).toBe(false);
  });

  it("数组中至少一项非空即算有内容", () => {
    expect(hasText(["", "x"])).toBe(true);
  });

  it("数组中的数字 0 算有内容", () => {
    expect(hasText([0])).toBe(true);
  });

  it("数组中的 null/undefined 会被转成字符串，因此算有内容", () => {
    // `hasText` 对数组项做 `String(item)`，而 String(null) === "null"、
    // String(undefined) === "undefined"，两者都是非空字符串。
    // 这是实现的实际语义（与上游一致），锁定它以免误判为 bug。
    expect(hasText([null])).toBe(true);
    expect(hasText([undefined])).toBe(true);
  });

  it("数组里全是空字符串才算空", () => {
    expect(hasText(["", "  ", "\t"])).toBe(false);
  });
});

describe("shortcutAlphabet", () => {
  it("letters 模式返回 A..Z 共 26 个", () => {
    const alphabet = shortcutAlphabet("letters");

    expect(alphabet).toHaveLength(26);
    expect(alphabet[0]).toBe("A");
    expect(alphabet[25]).toBe("Z");
  });

  it("numbers 模式返回 1..9 共 9 个", () => {
    const alphabet = shortcutAlphabet("numbers");

    expect(alphabet).toHaveLength(9);
    expect(alphabet[0]).toBe("1");
    expect(alphabet[8]).toBe("9");
  });

  it("null 模式返回空数组", () => {
    expect(shortcutAlphabet(null)).toEqual([]);
  });

  it("letters 不含数字，numbers 不含字母", () => {
    expect(shortcutAlphabet("letters")).not.toContain("1");
    expect(shortcutAlphabet("numbers")).not.toContain("A");
  });

  it("letters 是连续的字母表序列", () => {
    expect(shortcutAlphabet("letters").join("")).toBe(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    );
  });

  it("numbers 是连续的 1..9 序列", () => {
    expect(shortcutAlphabet("numbers").join("")).toBe("123456789");
  });
});

describe("normalizeShortcut", () => {
  it("letters 模式下小写字母被规范成大写", () => {
    expect(normalizeShortcut("a", "letters")).toBe("A");
  });

  it("letters 模式下大写字母原样返回", () => {
    expect(normalizeShortcut("B", "letters")).toBe("B");
  });

  it("letters 模式下数字不匹配", () => {
    expect(normalizeShortcut("1", "letters")).toBeNull();
  });

  it("numbers 模式下数字匹配", () => {
    expect(normalizeShortcut("5", "numbers")).toBe("5");
  });

  it("numbers 模式下字母不匹配", () => {
    expect(normalizeShortcut("a", "numbers")).toBeNull();
  });

  it("numbers 模式下 0 不匹配（只有 1..9）", () => {
    expect(normalizeShortcut("0", "numbers")).toBeNull();
  });

  it("null 模式下任何键都不匹配", () => {
    expect(normalizeShortcut("a", null)).toBeNull();
    expect(normalizeShortcut("1", null)).toBeNull();
  });

  it("多字符键（如 Enter）不匹配", () => {
    expect(normalizeShortcut("Enter", "letters")).toBeNull();
  });

  it("字母大小写不敏感（同一结果）", () => {
    expect(normalizeShortcut("z", "letters")).toBe(
      normalizeShortcut("Z", "letters"),
    );
  });
});

describe("keyShortcutText", () => {
  it("有快捷键且启用 Enter 时两者都出现", () => {
    expect(keyShortcutText("A", true)).toBe("A Enter");
  });

  it("有快捷键但未启用 Enter 时只有快捷键", () => {
    expect(keyShortcutText("A", false)).toBe("A");
  });

  it("无快捷键但启用 Enter 时只有 Enter", () => {
    expect(keyShortcutText(null, true)).toBe("Enter");
  });

  it("两者都没有时返回 undefined", () => {
    expect(keyShortcutText(null, false)).toBeUndefined();
  });
});

describe("isAnswerFilled", () => {
  it("choice：checked 为 true 时算有值", () => {
    const input = document.createElement("input");
    input.type = "radio";
    input.checked = true;

    expect(isAnswerFilled({ type: "choice", element: input })).toBe(true);
  });

  it("choice：checked 为 false 时算空", () => {
    const input = document.createElement("input");
    input.type = "radio";
    input.checked = false;

    expect(isAnswerFilled({ type: "choice", element: input })).toBe(false);
  });

  it("input：有 name 且有值时算有值", () => {
    const input = document.createElement("input");
    input.setAttribute("name", "q1");
    input.value = "答案";

    expect(isAnswerFilled({ type: "input", element: input })).toBe(true);
  });

  it("input：没有 name 时算空（即使有值）", () => {
    const input = document.createElement("input");
    input.value = "答案";

    expect(isAnswerFilled({ type: "input", element: input })).toBe(false);
  });

  it("input：有 name 但值为空时算空", () => {
    const input = document.createElement("input");
    input.setAttribute("name", "q1");
    input.value = "";

    expect(isAnswerFilled({ type: "input", element: input })).toBe(false);
  });

  it("input：有 name 但值只有空白时算空", () => {
    const input = document.createElement("input");
    input.setAttribute("name", "q1");
    input.value = "   ";

    expect(isAnswerFilled({ type: "input", element: input })).toBe(false);
  });

  it("textarea 同样按 name + value 判断", () => {
    const textarea = document.createElement("textarea");
    textarea.setAttribute("name", "q1");
    textarea.value = "多行答案";

    expect(isAnswerFilled({ type: "input", element: textarea })).toBe(true);
  });
});

describe("isTextInputEmpty", () => {
  it.each(["text", "email", "password", "search", "tel", "url"])(
    "%s 类型为空时返回 true",
    (type) => {
      const input = document.createElement("input");
      input.type = type;

      expect(isTextInputEmpty({ type: "input", element: input })).toBe(true);
    },
  );

  it("文本输入有值时返回 false", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "abc";

    expect(isTextInputEmpty({ type: "input", element: input })).toBe(false);
  });

  it("只有空白视为空", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "  ";

    expect(isTextInputEmpty({ type: "input", element: input })).toBe(true);
  });

  it("非文本类型（checkbox）不算文本输入", () => {
    const input = document.createElement("input");
    input.type = "checkbox";

    expect(isTextInputEmpty({ type: "input", element: input })).toBe(false);
  });

  it("number 类型不算文本输入（不在白名单里）", () => {
    const input = document.createElement("input");
    input.type = "number";

    expect(isTextInputEmpty({ type: "input", element: input })).toBe(false);
  });

  it("choice 类型永远返回 false", () => {
    const input = document.createElement("input");
    input.type = "text";

    expect(isTextInputEmpty({ type: "choice", element: input })).toBe(false);
  });
});

describe("isTypingElement", () => {
  it("textarea 是输入控件", () => {
    expect(isTypingElement(document.createElement("textarea"))).toBe(true);
  });

  it("select 是输入控件", () => {
    expect(isTypingElement(document.createElement("select"))).toBe(true);
  });

  it("text input 是输入控件", () => {
    const input = document.createElement("input");
    input.type = "text";

    expect(isTypingElement(input)).toBe(true);
  });

  it.each(["button", "checkbox", "radio", "reset", "submit"])(
    "%s input 不是输入控件（方向键应导航）",
    (type) => {
      const input = document.createElement("input");
      input.type = type;

      expect(isTypingElement(input)).toBe(false);
    },
  );

  it("search input 是输入控件", () => {
    const input = document.createElement("input");
    input.type = "search";

    expect(isTypingElement(input)).toBe(true);
  });

  it("contenteditable 元素是输入控件", () => {
    const div = document.createElement("div");
    Object.defineProperty(div, "isContentEditable", { value: true });

    expect(isTypingElement(div)).toBe(true);
  });

  it("普通 div 不是输入控件（jsdom 下 isContentEditable 为 undefined）", () => {
    // jsdom 不实现 `isContentEditable`（返回 undefined），因此表达式
    // `element instanceof HTMLElement && element.isContentEditable`
    // 的结果是 undefined 而不是 false —— 都是 falsy，调用方按真值使用没问题。
    expect(isTypingElement(document.createElement("div"))).toBeFalsy();
  });

  it("null 返回 false", () => {
    expect(isTypingElement(null)).toBe(false);
  });
});

describe("isNativeRadio", () => {
  it("radio input 返回 true", () => {
    const input = document.createElement("input");
    input.type = "radio";

    expect(isNativeRadio(input)).toBe(true);
  });

  it("checkbox input 返回 false", () => {
    const input = document.createElement("input");
    input.type = "checkbox";

    expect(isNativeRadio(input)).toBe(false);
  });

  it("非 input 元素返回 false", () => {
    expect(isNativeRadio(document.createElement("div"))).toBe(false);
  });
});

describe("compareDocumentOrder", () => {
  it("同一元素返回 0", () => {
    const el = document.createElement("div");

    expect(compareDocumentOrder(el, el)).toBe(0);
  });

  it("文档中靠前的元素返回 -1", () => {
    const parent = document.createElement("div");
    const first = document.createElement("div");
    const second = document.createElement("div");
    parent.append(first, second);

    expect(compareDocumentOrder(first, second)).toBe(-1);
  });

  it("文档中靠后的元素返回 1", () => {
    const parent = document.createElement("div");
    const first = document.createElement("div");
    const second = document.createElement("div");
    parent.append(first, second);

    expect(compareDocumentOrder(second, first)).toBe(1);
  });

  it("分离的节点之间：引擎会置 FOLLOWING 位，因此返回 -1 而非兜底 0", () => {
    // 测试能力缺口：`compareDocumentOrder` 的 `return 0` 兜底分支需要
    // `compareDocumentPosition` 既不含 FOLLOWING 也不含 PRECEDING 位，
    // 但 jsdom（以及 Chromium）对任何两个不同节点都会置其中一位，
    // 因此该分支不可达。已登记于 TESTING.md §8。
    const a = document.createElement("div");
    const b = document.createElement("div");
    const detachedRoot = document.createElement("div");
    detachedRoot.appendChild(b);

    expect(compareDocumentOrder(a, b)).toBe(-1);
  });

  it("可用于排序：结果符合文档顺序", () => {
    const parent = document.createElement("div");
    const ids = ["c", "a", "b"];
    const els = ids.map((id) => {
      const el = document.createElement("div");
      el.id = id;
      parent.append(el);
      return el;
    });

    const shuffled = [els[1], els[2], els[0]];
    const sorted = [...shuffled].sort(compareDocumentOrder);

    expect(sorted.map((el) => el.id)).toEqual(["c", "a", "b"]);
  });
});

describe("isAnswerDisabled", () => {
  it("组件层标记禁用时为 true", () => {
    expect(
      isAnswerDisabled({
        disabled: true,
        element: document.createElement("input"),
      }),
    ).toBe(true);
  });

  it("原生控件禁用时为 true", () => {
    const element = document.createElement("input");
    element.disabled = true;

    expect(isAnswerDisabled({ disabled: false, element })).toBe(true);
  });

  it("两者都不禁用时为 false", () => {
    expect(
      isAnswerDisabled({
        disabled: false,
        element: document.createElement("input"),
      }),
    ).toBe(false);
  });
});
