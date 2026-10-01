import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `logger.ts` 的 `isDev` 在**模块加载时**读取 `import.meta.env.DEV`,
 * 所以要测两个分支必须 `vi.resetModules()` + `vi.stubEnv()` 后重新 import。
 *
 * 另一个关键点:`Logger` 构造时就把 `console.debug/info/warn/error` **bind 好了**
 * (为了保住调用方的真实行号),之后再 spy console 是抓不到的。
 * 因此必须在 `importLogger()` **之前**装 spy —— 这本身是实现的契约之一,
 * 改动实现把 bind 换成包装函数时,这里会立刻暴露。
 */
async function importLogger(dev: boolean) {
  vi.resetModules();
  vi.stubEnv("DEV", dev);
  vi.stubEnv("PROD", !dev);
  return import("~/utils/logger");
}

/** 在 import 之前装好全部 console spy，并返回它们 */
function spyConsoleBeforeImport() {
  return {
    debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
    info: vi.spyOn(console, "info").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
  };
}

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("DEV 环境", () => {
    it("debug/info/warn/error 分别转发到对应的 console 方法", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(true);

      logger.debug("d");
      logger.info("i");
      logger.warn("w");
      logger.error("e");

      expect(spies.debug).toHaveBeenCalledTimes(1);
      expect(spies.info).toHaveBeenCalledTimes(1);
      expect(spies.warn).toHaveBeenCalledTimes(1);
      expect(spies.error).toHaveBeenCalledTimes(1);
      // 首参是 %c 样式串，末参是调用方自己的参数
      expect(spies.debug.mock.calls[0].at(-1)).toBe("d");
      expect(spies.error.mock.calls[0].at(-1)).toBe("e");
    });

    it("日志前缀包含级别名与自定义 prefix", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);

      new Logger({ prefix: "auth" }).info("hello");

      expect(String(spies.info.mock.calls[0][0])).toContain("INFO");
      expect(String(spies.info.mock.calls[0][0])).toContain("[auth]");
    });

    it("未传 prefix 时前缀里不含方括号模块名", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);

      new Logger().info("hello");

      expect(String(spies.info.mock.calls[0][0])).not.toContain("[");
    });

    it("level 过滤：低于配置级别的日志变成空操作", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);
      const log = new Logger({ level: "warn" });

      log.debug("d");
      log.info("i");
      log.warn("w");

      expect(spies.debug).not.toHaveBeenCalled();
      expect(spies.info).not.toHaveBeenCalled();
      expect(spies.warn).toHaveBeenCalledTimes(1);
    });

    it("level=error 时只保留 error", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);
      const log = new Logger({ level: "error" });

      log.warn("w");
      log.error("e");

      expect(spies.warn).not.toHaveBeenCalled();
      expect(spies.error).toHaveBeenCalledTimes(1);
    });

    it("child() 拼接子前缀，并继承父级的 level", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);
      const log = new Logger({ prefix: "app", level: "info" });

      const child = log.child("db");
      child.info("oops");
      child.debug("ignored");

      expect(String(spies.info.mock.calls[0][0])).toContain("[app:db]");
      // level 被继承，debug 被过滤
      expect(spies.debug).not.toHaveBeenCalled();
    });

    it("无父前缀时 child() 直接用子前缀", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);

      new Logger().child("db").info("x");

      expect(String(spies.info.mock.calls[0][0])).toContain("[db]");
    });
  });

  describe("PROD 环境", () => {
    it("debug/info 变成空操作", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(false);

      logger.debug("d");
      logger.info("i");

      expect(spies.debug).not.toHaveBeenCalled();
      expect(spies.info).not.toHaveBeenCalled();
    });

    it("warn 仍然输出（保留线上告警，见源码注释）", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(false);

      logger.warn("线上告警");

      expect(spies.warn).toHaveBeenCalledTimes(1);
      expect(spies.warn.mock.calls[0].at(-1)).toBe("线上告警");
    });

    it("error 仍然输出（便于线上排查）", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(false);

      logger.error("线上异常");

      expect(spies.error).toHaveBeenCalledTimes(1);
      expect(spies.error.mock.calls[0].at(-1)).toBe("线上异常");
    });

    it("hot() 返回空操作", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(false);

      logger.hot("render")("x");

      expect(spies.log).not.toHaveBeenCalled();
    });
  });

  describe("hot() 节流（DEV）", () => {
    it("窗口内输出不超过 maxPerWindow 条", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(true);
      const hot = logger.hot("t", "debug", { maxPerWindow: 3 });

      for (let i = 0; i < 10; i++) hot(`m${i}`);

      expect(spies.log).toHaveBeenCalledTimes(3);
    });

    it("超出上限的调用不执行惰性参数求值", async () => {
      spyConsoleBeforeImport();
      const { logger } = await importLogger(true);
      const hot = logger.hot("t", "debug", { maxPerWindow: 1 });
      const expensive = vi.fn(() => "computed");

      hot(expensive); // 第 1 条：求值
      hot(expensive); // 第 2 条：被丢弃，不求值
      hot(expensive); // 第 3 条：被丢弃，不求值

      expect(expensive).toHaveBeenCalledTimes(1);
    });

    it("不同 tag 各自独立计数", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(true);
      const a = logger.hot("a", "debug", { maxPerWindow: 1 });
      const b = logger.hot("b", "debug", { maxPerWindow: 1 });

      a("1");
      a("2");
      b("1");

      expect(spies.log).toHaveBeenCalledTimes(2);
    });

    it("窗口结束后重置计数，并汇总被跳过的条数", async () => {
      const spies = spyConsoleBeforeImport();
      // performance.now 必须在 logger 使用它之前可被替换，这里用 spy 覆盖即可
      const now = vi.spyOn(performance, "now").mockReturnValue(0);
      const { logger } = await importLogger(true);
      const hot = logger.hot("t", "debug", {
        windowMs: 100,
        maxPerWindow: 1,
      });

      hot("first");
      hot("dropped-1");
      hot("dropped-2");

      // 推进性能时钟越过窗口
      now.mockReturnValue(1000);
      hot("second");

      const texts = spies.log.mock.calls.map((c) => String(c[0]));
      const summary = texts.find((t) => t.includes("跳过"));
      expect(summary).toContain("2");
      expect(summary).toContain("100ms");
    });

    it("新窗口内没有跳过记录时不输出汇总", async () => {
      const spies = spyConsoleBeforeImport();
      const now = vi.spyOn(performance, "now").mockReturnValue(0);
      const { logger } = await importLogger(true);
      const hot = logger.hot("t", "debug", {
        windowMs: 100,
        maxPerWindow: 5,
      });

      hot("first");
      now.mockReturnValue(1000);
      hot("second");

      const texts = spies.log.mock.calls.map((c) => String(c[0]));
      expect(texts.some((t) => t.includes("跳过"))).toBe(false);
      expect(spies.log).toHaveBeenCalledTimes(2);
    });

    it("level 低于配置时 hot() 也是空操作", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);
      const log = new Logger({ level: "error" });

      log.hot("t", "debug")("x");

      expect(spies.log).not.toHaveBeenCalled();
    });

    it("hot 用 console.log 输出 debug 级别，用对应方法输出其他级别", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(true);

      logger.hot("dbg", "debug")("a");
      logger.hot("wn", "warn")("b");

      expect(spies.log).toHaveBeenCalledTimes(1);
      expect(spies.warn).toHaveBeenCalledTimes(1);
    });

    it("带 prefix 的 logger 在 hot 前缀里带上模块名", async () => {
      const spies = spyConsoleBeforeImport();
      const { Logger } = await importLogger(true);
      const withPrefix = new Logger({ prefix: "app" });

      withPrefix.hot("net")("x");

      expect(String(spies.log.mock.calls[0][0])).toContain("[app:net]");
    });

    it("非函数参数按原值传入，函数参数求值后再传入", async () => {
      const spies = spyConsoleBeforeImport();
      const { logger } = await importLogger(true);
      const hot = logger.hot("t", "debug");

      hot("plain", () => 42);

      const args = spies.log.mock.calls[0];
      expect(args.at(-2)).toBe("plain");
      expect(args.at(-1)).toBe(42);
    });
  });
});
