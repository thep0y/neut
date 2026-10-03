import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Attachment } from "~/components/attachment/Attachment/Attachment";
import { AttachmentAction } from "~/components/attachment/AttachmentAction/AttachmentAction";
import { AttachmentActions } from "~/components/attachment/AttachmentActions/AttachmentActions";
import { AttachmentContent } from "~/components/attachment/AttachmentContent/AttachmentContent";
import { AttachmentDescription } from "~/components/attachment/AttachmentDescription/AttachmentDescription";
import { AttachmentGroup } from "~/components/attachment/AttachmentGroup/AttachmentGroup";
import { AttachmentMedia } from "~/components/attachment/AttachmentMedia/AttachmentMedia";
import { AttachmentTitle } from "~/components/attachment/AttachmentTitle/AttachmentTitle";
import { AttachmentTrigger } from "~/components/attachment/AttachmentTrigger/AttachmentTrigger";

/**
 * Attachment 集成测试：用真实组合验证「行容器 → 卡片 → 部件」的接线，
 * 以及操作按钮与整卡触发器在同一张卡片上的分工。
 * 各部件自身的类名/透传已在各自的单测里覆盖，这里只关注跨部件行为。
 */
describe("Attachment 集成 - 组合结构", () => {
  it("AttachmentGroup 内每张卡片都渲染出完整部件链", () => {
    const { container } = render(() => (
      <AttachmentGroup aria-label="待发送附件">
        <Attachment>
          <AttachmentMedia />
          <AttachmentContent>
            <AttachmentTitle>briefing-notes.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 1.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions />
        </Attachment>
        <Attachment>
          <AttachmentMedia variant="image">
            <img src="/workspace.png" alt="工作台" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>workspace.png</AttachmentTitle>
            <AttachmentDescription>PNG · 820 KB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions />
        </Attachment>
      </AttachmentGroup>
    ));

    expect(container.querySelectorAll('[data-slot="attachment"]')).toHaveLength(
      2,
    );
    expect(
      container.querySelectorAll('[data-slot="attachment-media"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-slot="attachment-content"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-slot="attachment-actions"]'),
    ).toHaveLength(2);
    expect(
      container.querySelector('[data-slot="attachment-title"]')?.textContent,
    ).toBe("briefing-notes.pdf");
    expect(
      container.querySelector('[data-slot="attachment-description"]')
        ?.textContent,
    ).toBe("PDF · 1.4 MB");
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("根上的 state/size/orientation 被子部件选择器关联（同一张卡片内一致）", () => {
    const { container } = render(() => (
      <Attachment state="error" size="xs" orientation="vertical">
        <AttachmentMedia variant="image" />
        <AttachmentContent>
          <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
          <AttachmentDescription>
            上传失败：文件超过 25 MB
          </AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions />
      </Attachment>
    ));
    const root = container.querySelector('[data-slot="attachment"]')!;

    expect(root.getAttribute("data-state")).toBe("error");
    expect(root.getAttribute("data-size")).toBe("xs");
    expect(root.getAttribute("data-orientation")).toBe("vertical");
    // 描述里的失败原因必须始终可见，不能只靠 error 颜色表达
    expect(
      container.querySelector('[data-slot="attachment-description"]')
        ?.textContent,
    ).toContain("文件超过 25 MB");
    expect(
      container
        .querySelector('[data-slot="attachment-media"]')!
        .getAttribute("data-variant"),
    ).toBe("image");
  });
});

describe("Attachment 集成 - 操作按钮与整卡触发器", () => {
  function renderTriggerCard(handlers: {
    onAction: () => void;
    onTrigger: () => void;
  }) {
    return render(() => (
      <Attachment>
        <AttachmentMedia />
        <AttachmentContent>
          <AttachmentTitle>research-summary.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="复制链接" onClick={handlers.onAction} />
        </AttachmentActions>
        <AttachmentTrigger
          aria-label="打开 research-summary.pdf"
          onClick={handlers.onTrigger}
        />
      </Attachment>
    ));
  }

  it("点击操作按钮只触发它自己，不会连带打开整卡", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onTrigger = vi.fn();
    const { getByRole } = renderTriggerCard({ onAction, onTrigger });

    await user.click(getByRole("button", { name: "复制链接" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("点击整卡触发器只触发它自己，不会连带触发操作", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onTrigger = vi.fn();
    const { getByRole } = renderTriggerCard({ onAction, onTrigger });

    await user.click(
      getByRole("button", { name: "打开 research-summary.pdf" }),
    );

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("两者都能被键盘到达：Tab 顺序为操作按钮 → 整卡触发器", async () => {
    const user = userEvent.setup();
    const { getByRole } = renderTriggerCard({
      onAction: vi.fn(),
      onTrigger: vi.fn(),
    });
    const action = getByRole("button", { name: "复制链接" });
    const trigger = getByRole("button", { name: "打开 research-summary.pdf" });

    await user.tab();
    expect(document.activeElement).toBe(action);

    await user.tab();
    expect(document.activeElement).toBe(trigger);
  });

  it("整卡触发器支持 Enter 键激活", async () => {
    const user = userEvent.setup();
    const onTrigger = vi.fn();
    const { getByRole } = renderTriggerCard({
      onAction: vi.fn(),
      onTrigger,
    });
    const trigger = getByRole("button", { name: "打开 research-summary.pdf" });

    trigger.focus();
    await user.keyboard("{Enter}");

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("多态触发器用 a 时仍是可访问链接，操作按钮保持独立", () => {
    const { getByRole } = render(() => (
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>roadmap.docx</AttachmentTitle>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="移除 roadmap.docx" />
        </AttachmentActions>
        <AttachmentTrigger
          component="a"
          href="/files/roadmap.docx"
          aria-label="打开 roadmap.docx"
        />
      </Attachment>
    ));

    const link = getByRole("link", { name: "打开 roadmap.docx" });
    expect(link.getAttribute("href")).toBe("/files/roadmap.docx");
    expect(
      getByRole("button", { name: "移除 roadmap.docx" }),
    ).toBeInTheDocument();
  });
});
