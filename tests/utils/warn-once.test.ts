import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("warnOnce", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("DEV 下同一消息只警告一次，不同消息各自警告", async () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { warnOnce } = await import("~/utils/warn-once");

    warnOnce("重复消息");
    warnOnce("重复消息");
    warnOnce("另一条消息");

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenNthCalledWith(1, "重复消息");
    expect(warn).toHaveBeenNthCalledWith(2, "另一条消息");
  });

  it("PROD 下是空函数，不输出任何警告", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { warnOnce } = await import("~/utils/warn-once");

    warnOnce("不该出现");

    expect(warn).not.toHaveBeenCalled();
  });
});
