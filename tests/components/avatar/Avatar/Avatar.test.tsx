import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Avatar } from "~/components/avatar/Avatar/Avatar";
import { useAvatarContext } from "~/components/avatar/Avatar/Avatar.context";

/** 读回 context 的探针 */
function Probe() {
  const ctx = useAvatarContext();
  return (
    <button
      type="button"
      data-testid="fail"
      onClick={() => ctx.setImageLoadFailed(true)}
    >
      标记失败
    </button>
  );
}

function avatarOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="avatar"]');
}

describe("Avatar - 结构与属性", () => {
  it("渲染 span，默认 size=md 并写到 data-size", () => {
    const { container } = render(() => <Avatar />);
    const element = avatarOf(container)!;

    expect(element.tagName).toBe("SPAN");
    expect(element.getAttribute("data-size")).toBe("md");
    expect(element.className).toContain("group/avatar");
  });

  it("size 可覆盖（sm / lg 影响尺寸类）", () => {
    const small = render(() => <Avatar size="sm" />);
    expect(avatarOf(small.container)?.getAttribute("data-size")).toBe("sm");

    const large = render(() => <Avatar size="lg" />);
    expect(avatarOf(large.container)?.getAttribute("data-size")).toBe("lg");
    expect(avatarOf(large.container)?.className).toContain(
      "data-[size=lg]:size-10",
    );
  });

  it("合并 class / classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Avatar class="my-avatar" classList={{ "is-round": true }} id="a" />
    ));
    const element = avatarOf(container)!;

    expect(element.className).toContain("my-avatar");
    expect(element.className).toContain("is-round");
    expect(element.id).toBe("a");
  });

  it("渲染 children 并提供 context", () => {
    const { getByTestId, container } = render(() => (
      <Avatar>
        <Probe />
      </Avatar>
    ));

    expect(getByTestId("fail")).toBeInTheDocument();
    expect(avatarOf(container)).not.toBeNull();
  });
});

describe("Avatar - context", () => {
  it("初始 imageLoadFailed=false、imagePresent=false，setter 可用", () => {
    let ctx!: ReturnType<typeof useAvatarContext>;
    const Capture = () => {
      ctx = useAvatarContext();
      return null;
    };
    render(() => (
      <Avatar>
        <Capture />
      </Avatar>
    ));

    expect(ctx.imageLoadFailed()).toBe(false);
    expect(ctx.imagePresent()).toBe(false);

    ctx.setImageLoadFailed(true);
    ctx.setImagePresent(true);
    expect(ctx.imageLoadFailed()).toBe(true);
    expect(ctx.imagePresent()).toBe(true);
  });

  it("脱离 Avatar 使用时抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <Probe />)).toThrow(
      /useAvatarContext 必须用在 <Avatar> 内部/,
    );

    error.mockRestore();
  });
});
