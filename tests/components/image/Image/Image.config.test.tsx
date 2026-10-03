import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  ImageConfigContext,
  imageConfigDefault,
  resolveConfig,
  useImageConfig,
} from "~/components/image/Image.config";
import type { ImageConfigComplete } from "~/components/image/Image.types";

/** 读回 context 的探针 */
function Probe(props: { capture: (config: ImageConfigComplete) => void }) {
  props.capture(useImageConfig());
  return null;
}

describe("useImageConfig / ImageConfigContext", () => {
  it("没有 Provider 时给出默认配置", () => {
    let config!: ImageConfigComplete;
    render(() => <Probe capture={(value) => (config = value)} />);

    expect(config.loader).toBe("default");
    expect(config.path).toBe("/_next/image");
    expect(config.deviceSizes).toEqual(imageConfigDefault.deviceSizes);
  });

  it("Provider 传入的配置会被读到", () => {
    const custom = { ...imageConfigDefault, path: "/custom/image" };
    let config!: ImageConfigComplete;
    render(() => (
      <ImageConfigContext.Provider value={custom}>
        <Probe capture={(value) => (config = value)} />
      </ImageConfigContext.Provider>
    ));

    expect(config.path).toBe("/custom/image");
  });
});

describe("resolveConfig", () => {
  it("envConfig 覆盖 contextConfig，并预计算 allSizes / deviceSizes", () => {
    const resolved = resolveConfig(imageConfigDefault, {
      deviceSizes: [1080, 640],
      imageSizes: [64, 16],
    });

    expect(resolved.deviceSizes).toEqual([640, 1080]);
    expect(resolved.allSizes).toEqual([16, 64, 640, 1080]);
  });

  it("没有 envConfig 时用 contextConfig，并按升序整理尺寸", () => {
    const resolved = resolveConfig({
      ...imageConfigDefault,
      deviceSizes: [1000, 500],
      imageSizes: [50, 10],
    });

    expect(resolved.deviceSizes).toEqual([500, 1000]);
    expect(resolved.allSizes).toEqual([10, 50, 500, 1000]);
  });

  it("qualities 存在时排序，不存在时保持 undefined", () => {
    const withQualities = resolveConfig(imageConfigDefault, {
      qualities: [90, 50, 75],
    });
    expect(withQualities.qualities).toEqual([50, 75, 90]);

    const without = resolveConfig(imageConfigDefault);
    expect(without.qualities).toBeUndefined();
  });
});
