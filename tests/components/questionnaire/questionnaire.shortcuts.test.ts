import { describe, expect, it } from "vitest";
import type { QuestionnaireAnswerEntry } from "~/components/questionnaire/questionnaire.context";
import {
  buildShortcutByAnswerId,
  buildShortcutByChoiceValue,
  findAnswerByShortcut,
} from "~/components/questionnaire/questionnaire.shortcuts";

function answer(
  id: string,
  extra: Partial<QuestionnaireAnswerEntry> = {},
): QuestionnaireAnswerEntry {
  return {
    id,
    element: document.createElement("input"),
    type: "choice",
    disabled: false,
    ...extra,
  };
}

describe("buildShortcutByChoiceValue", () => {
  it("没有快捷键模式时返回 null", () => {
    expect(
      buildShortcutByChoiceValue({ choices: [{ value: "a" }] }, null),
    ).toBeNull();
  });

  it("定义里没有 choices 时返回 null", () => {
    expect(buildShortcutByChoiceValue(undefined, "letters")).toBeNull();
    expect(buildShortcutByChoiceValue({}, "letters")).toBeNull();
  });

  it("letters 模式按选项顺序分配 A/B/C", () => {
    const map = buildShortcutByChoiceValue(
      { choices: [{ value: "one" }, { value: "two" }, { value: "three" }] },
      "letters",
    );

    expect(map?.get("one")).toBe("A");
    expect(map?.get("two")).toBe("B");
    expect(map?.get("three")).toBe("C");
  });

  it("numbers 模式按 1/2/3 分配", () => {
    const map = buildShortcutByChoiceValue(
      { choices: [{ value: "one" }, { value: "two" }] },
      "numbers",
    );

    expect([...map!.values()]).toEqual(["1", "2"]);
  });

  it("跳过 disabled 的选项（不占字母）", () => {
    const map = buildShortcutByChoiceValue(
      {
        choices: [
          { value: "one" },
          { value: "two", disabled: true },
          { value: "three" },
        ],
      },
      "letters",
    );

    expect(map?.get("one")).toBe("A");
    expect(map?.has("two")).toBe(false);
    expect(map?.get("three")).toBe("B");
  });

  it("选项多于字母表时截断（letters 最多 26 个）", () => {
    const choices = Array.from({ length: 30 }, (_, index) => ({
      value: `v${index}`,
    }));

    const map = buildShortcutByChoiceValue({ choices }, "letters");

    expect(map?.size).toBe(26);
    expect(map?.get("v25")).toBe("Z");
    expect(map?.has("v26")).toBe(false);
  });
});

describe("buildShortcutByAnswerId", () => {
  it("已有声明式映射时返回空表", () => {
    const map = buildShortcutByAnswerId([answer("a")], true, "letters");

    expect(map.size).toBe(0);
  });

  it("只给 choice 类型答案分配字母", () => {
    const answers = [
      answer("a"),
      answer("input-1", { type: "input" }),
      answer("b"),
    ];

    const map = buildShortcutByAnswerId(answers, false, "letters");

    expect([...map.entries()]).toEqual([
      ["a", "A"],
      ["b", "B"],
    ]);
  });

  it("答案多于字母表时按字母数截断", () => {
    const answers = Array.from({ length: 30 }, (_, index) =>
      answer(`a${index}`),
    );

    const map = buildShortcutByAnswerId(answers, false, "numbers");

    // numbers 模式只有 1-9 共 9 个字母
    expect(map.size).toBe(9);
  });

  it("没有快捷键模式时得到空表", () => {
    expect(buildShortcutByAnswerId([answer("a")], false, null).size).toBe(0);
  });
});

describe("findAnswerByShortcut", () => {
  it("有声明式映射时按 value 反查", () => {
    const answers = [
      answer("a", { value: "one" }),
      answer("b", { value: "two" }),
    ];
    const byChoiceValue = new Map([
      ["one", "A"],
      ["two", "B"],
    ]);

    expect(
      findAnswerByShortcut("B", {
        byChoiceValue,
        byAnswerId: new Map(),
        answers,
      })?.id,
    ).toBe("b");
  });

  it("声明式映射里没有该字母时返回 null", () => {
    expect(
      findAnswerByShortcut("Z", {
        byChoiceValue: new Map([["one", "A"]]),
        byAnswerId: new Map(),
        answers: [answer("a", { value: "one" })],
      }),
    ).toBeNull();
  });

  it("没有声明式映射时按 id 反查", () => {
    const answers = [answer("a"), answer("b")];

    expect(
      findAnswerByShortcut("B", {
        byChoiceValue: null,
        byAnswerId: new Map([
          ["a", "A"],
          ["b", "B"],
        ]),
        answers,
      })?.id,
    ).toBe("b");
  });

  it("id 映射里没有该字母时返回 null", () => {
    expect(
      findAnswerByShortcut("Z", {
        byChoiceValue: null,
        byAnswerId: new Map([["a", "A"]]),
        answers: [answer("a")],
      }),
    ).toBeNull();
  });

  it("声明式映射命中但答案已卸载时返回 null", () => {
    expect(
      findAnswerByShortcut("A", {
        byChoiceValue: new Map([["one", "A"]]),
        byAnswerId: new Map(),
        answers: [],
      }),
    ).toBeNull();
  });
});
