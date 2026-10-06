import { describe, expect, it } from "vitest";
import { clsx } from "~/utils/clsx";

describe("clsx", () => {
  it("拼接多个 class 并用空格分隔", () => {
    expect(clsx("block", "text-sm")).toBe("block text-sm");
  });

  it("过滤 undefined 与 false", () => {
    expect(clsx("block", undefined, false, "text-sm")).toBe("block text-sm");
  });

  it("全部为空时返回空字符串", () => {
    expect(clsx(undefined, false)).toBe("");
  });

  it("用 tailwind-merge 解掉冲突的同类工具类，保留后者", () => {
    expect(clsx("p-2", "p-4")).toBe("p-4");
  });

  it("不冲突的类都被保留", () => {
    expect(clsx("flex items-center", "gap-2")).toBe("flex items-center gap-2");
  });
});
