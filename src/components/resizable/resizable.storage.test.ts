import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type PersistContext,
  persistLayout,
  readSavedLayout,
  resolveStorage,
  STORAGE_PREFIX,
  storageKey,
} from "./resizable.storage";

/** 一个内存版 Storage，用于断言读写的键值 */
function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size;
    },
    /** 测试辅助：直接读回底层值 */
    raw: map,
  } as unknown as Storage & { raw: Map<string, string> };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("storageKey", () => {
  it("有 autoSaveId 时加上前缀", () => {
    expect(storageKey("my-id")).toBe(`${STORAGE_PREFIX}my-id`);
  });

  it("空字符串视为未配置", () => {
    expect(storageKey("")).toBeUndefined();
  });

  it("undefined 返回 undefined（表示不持久化）", () => {
    expect(storageKey(undefined)).toBeUndefined();
  });

  it("前缀常量稳定", () => {
    expect(STORAGE_PREFIX).toBe("neut-resizable:");
  });
});

describe("resolveStorage", () => {
  it("显式传入时优先使用", () => {
    const storage = memoryStorage();

    expect(resolveStorage(storage)).toBe(storage);
  });

  it("未传入时回退到 localStorage", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);

    expect(resolveStorage(undefined)).toBe(storage);
  });

  it("两者都没有（SSR）时返回 undefined", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(resolveStorage(undefined)).toBeUndefined();
  });
});

describe("persistLayout", () => {
  it("把布局 JSON 序列化后写入 storage", () => {
    const storage = memoryStorage();
    const context: PersistContext = {
      autoSaveId: "my-id",
      storage,
    };

    persistLayout(context, { a: 30, b: 70 });

    expect(storage.getItem(`${STORAGE_PREFIX}my-id`)).toBe(
      JSON.stringify({ a: 30, b: 70 }),
    );
  });

  it("没有 autoSaveId 时不写入", () => {
    const storage = memoryStorage();
    const setItem = vi.spyOn(storage, "setItem");

    persistLayout({ autoSaveId: undefined, storage }, { a: 30 });

    expect(setItem).not.toHaveBeenCalled();
  });

  it("没有可用 storage 时不写入（不抛错）", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(() =>
      persistLayout({ autoSaveId: "x", storage: undefined }, { a: 30 }),
    ).not.toThrow();
  });

  it("setItem 抛错（隐私模式/配额）时静默吞掉", () => {
    const storage = memoryStorage();
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() =>
      persistLayout({ autoSaveId: "x", storage }, { a: 30 }),
    ).not.toThrow();
  });

  it("回退到 localStorage 写入", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);

    persistLayout({ autoSaveId: "fallback", storage: undefined }, { a: 100 });

    expect(storage.getItem(`${STORAGE_PREFIX}fallback`)).toBe('{"a":100}');
  });
});

describe("readSavedLayout", () => {
  it("读取并解析已保存的布局", () => {
    const storage = memoryStorage({
      [`${STORAGE_PREFIX}my-id`]: JSON.stringify({ a: 25, b: 75 }),
    });

    expect(readSavedLayout({ autoSaveId: "my-id", storage })).toEqual({
      a: 25,
      b: 75,
    });
  });

  it("没有 autoSaveId 时返回 undefined", () => {
    const storage = memoryStorage();

    expect(readSavedLayout({ autoSaveId: undefined, storage })).toBeUndefined();
  });

  it("没有可用 storage 时返回 undefined", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(
      readSavedLayout({ autoSaveId: "x", storage: undefined }),
    ).toBeUndefined();
  });

  it("key 不存在时返回 undefined", () => {
    expect(
      readSavedLayout({ autoSaveId: "missing", storage: memoryStorage() }),
    ).toBeUndefined();
  });

  it("JSON 损坏时返回 undefined（不抛错）", () => {
    const storage = memoryStorage({
      [`${STORAGE_PREFIX}bad`]: "{not json",
    });

    expect(readSavedLayout({ autoSaveId: "bad", storage })).toBeUndefined();
  });

  it("getItem 抛错时返回 undefined", () => {
    const storage = memoryStorage();
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(readSavedLayout({ autoSaveId: "x", storage })).toBeUndefined();
  });

  it("存的是字面量 null 时返回 undefined", () => {
    const storage = memoryStorage({ [`${STORAGE_PREFIX}n`]: "null" });

    expect(readSavedLayout({ autoSaveId: "n", storage })).toBeUndefined();
  });

  it("存的是数字/字符串等非对象时返回 undefined", () => {
    const storage = memoryStorage({
      [`${STORAGE_PREFIX}num`]: "42",
      [`${STORAGE_PREFIX}str`]: '"hi"',
    });

    expect(readSavedLayout({ autoSaveId: "num", storage })).toBeUndefined();
    expect(readSavedLayout({ autoSaveId: "str", storage })).toBeUndefined();
  });
});
