import { fireEvent, render } from "@solidjs/testing-library";
import { For } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimePickerContext } from "~/components/time-picker/TimePicker/TimePicker.context";
import type { TimePickerUnit } from "~/components/time-picker/TimePicker/TimePicker.types";
import { useTimePickerColumn } from "~/components/time-picker/TimePickerColumn/useTimePickerColumn";
import {
  createFakeTimePickerContext,
  type FakeTimePickerContextOptions,
  smallOptions,
} from "~tests/components/time-picker/test-utils";

/**
 * `useTimePickerColumn` 的交互算法测试。
 *
 * 按 TESTING.md §4.5 的做法给它一份**假的 TimePickerContextValue**，
 * 这样能构造真组件里难以出现的边界（空选项列、当前值不在选项里、单位不在 units 中），
 * 同时不断言 hook 内部实现，而是断言它写回的提交与焦点。
 */

/** 直接把 hook 的返回值渲染成可查询的 listbox 探针 */
function ColumnProbe(props: { unit: TimePickerUnit }) {
  const hook = useTimePickerColumn(() => ({ unit: props.unit }));

  return (
    <div
      ref={hook.attachList}
      role="listbox"
      data-unit={props.unit}
      aria-activedescendant={hook.activeOptionId()}
      tabIndex={0}
    >
      <For each={hook.options()}>
        {(option) => (
          <div
            data-value={String(option.value)}
            id={hook.optionId(option.value)}
          >
            {option.label}
          </div>
        )}
      </For>
    </div>
  );
}

function mountColumns(
  options: Partial<FakeTimePickerContextOptions> & {
    units?: TimePickerUnit[];
    initialValues?: Partial<Record<TimePickerUnit, number | "AM" | "PM">>;
  } = {},
) {
  const fake = createFakeTimePickerContext({
    units: options.units ?? ["hour", "minute"],
    options: options.options ?? smallOptions(),
    dir: options.dir,
    disabled: options.disabled,
    readOnly: options.readOnly,
  });

  for (const [unit, value] of Object.entries(options.initialValues ?? {})) {
    fake.setSelected(unit as TimePickerUnit, value);
  }

  const view = render(() => (
    <TimePickerContext.Provider value={fake.ctx}>
      <For each={fake.ctx.units()}>{(unit) => <ColumnProbe unit={unit} />}</For>
    </TimePickerContext.Provider>
  ));

  const list = (unit: TimePickerUnit): HTMLElement =>
    view.container.querySelector(`[data-unit="${unit}"]`) as HTMLElement;

  return { fake, list, ...view };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTimePickerColumn - 选项与高亮", () => {
  it("选项来自 ctx.getOptions，并按 unit 渲染", () => {
    const { list } = mountColumns();

    expect(
      Array.from(list("hour").querySelectorAll("[data-value]")).map((el) =>
        el.getAttribute("data-value"),
      ),
    ).toEqual(["0", "1", "2"]);
  });

  it("aria-activedescendant 指向选中项的 id（交叉引用成立）", () => {
    const { list } = mountColumns({ initialValues: { hour: 1 } });
    const selected = list("hour").querySelector('[data-value="1"]')!;

    expect(list("hour")).toHaveAttribute("aria-activedescendant", selected.id);
  });

  it("无值时不做悬空的高亮", () => {
    const { list } = mountColumns();

    expect(list("hour")).not.toHaveAttribute("aria-activedescendant");
  });

  it("当前值不在步长上时也不做悬空高亮（minuteStep=15 而值为 7）", () => {
    const { list } = mountColumns({
      options: {
        minute: [
          { value: 0, label: "00" },
          { value: 15, label: "15" },
        ],
      },
      initialValues: { minute: 7 },
    });

    expect(list("minute")).not.toHaveAttribute("aria-activedescendant");
  });
});

describe("useTimePickerColumn - 方向键", () => {
  it("ArrowDown：当前值不在选项里时从第一项开始，并提交", () => {
    const { fake, list } = mountColumns();

    const notPrevented = fireEvent.keyDown(list("hour"), {
      key: "ArrowDown",
    });

    expect(notPrevented).toBe(false);
    expect(fake.commits).toHaveLength(1);
    expect(fake.commits[0]!.unit).toBe("hour");
    expect(fake.commits[0]!.value).toBe(0);
    expect(fake.commits[0]!.options?.reason).toBe("keyboard");
    expect(fake.commits[0]!.options?.trigger).toBe(list("hour"));
  });

  it("ArrowDown：从当前选中项向后推进", () => {
    const { fake, list } = mountColumns({ initialValues: { hour: 1 } });

    fireEvent.keyDown(list("hour"), { key: "ArrowDown" });

    expect(fake.commits[0]!.value).toBe(2);
  });

  it("ArrowDown 在最后一项回绕到第一项", () => {
    const { fake, list } = mountColumns({ initialValues: { hour: 2 } });

    fireEvent.keyDown(list("hour"), { key: "ArrowDown" });

    expect(fake.commits[0]!.value).toBe(0);
  });

  it("ArrowUp：当前值不在选项里时从最后一项开始", () => {
    const { fake, list } = mountColumns();

    fireEvent.keyDown(list("hour"), { key: "ArrowUp" });

    expect(fake.commits[0]!.value).toBe(2);
  });

  it("ArrowUp 在第一项回绕到最后一项", () => {
    const { fake, list } = mountColumns({ initialValues: { hour: 0 } });

    fireEvent.keyDown(list("hour"), { key: "ArrowUp" });

    expect(fake.commits[0]!.value).toBe(2);
  });

  it("空选项列时方向键放弃提交（不产生越界访问）", () => {
    const { fake, list } = mountColumns({
      options: { hour: [] },
      units: ["hour"],
    });

    fireEvent.keyDown(list("hour"), { key: "ArrowDown" });

    expect(fake.commits).toHaveLength(0);
  });

  it("空选项列时 Home / End 放弃提交", () => {
    const { fake, list } = mountColumns({
      options: { hour: [] },
      units: ["hour"],
    });

    fireEvent.keyDown(list("hour"), { key: "Home" });
    fireEvent.keyDown(list("hour"), { key: "End" });

    expect(fake.commits).toHaveLength(0);
  });

  it("Home 提交第一项、End 提交最后一项", () => {
    const { fake, list } = mountColumns({ initialValues: { hour: 1 } });

    fireEvent.keyDown(list("hour"), { key: "Home" });
    fireEvent.keyDown(list("hour"), { key: "End" });

    expect(fake.commits.map((c) => c.value)).toEqual([0, 2]);
  });

  it("Enter / Space 只阻止默认滚动，不重复提交", () => {
    const { fake, list } = mountColumns({ initialValues: { hour: 1 } });

    expect(fireEvent.keyDown(list("hour"), { key: "Enter" })).toBe(false);
    expect(fireEvent.keyDown(list("hour"), { key: " " })).toBe(false);
    expect(fake.commits).toHaveLength(0);
  });

  it("无法识别的按键不拦截也不提交", () => {
    const { fake, list } = mountColumns({ initialValues: { hour: 1 } });

    expect(fireEvent.keyDown(list("hour"), { key: "a" })).toBe(true);
    expect(fake.commits).toHaveLength(0);
  });

  it("disabled 时键盘完全不响应", () => {
    const { fake, list } = mountColumns({
      disabled: true,
      initialValues: { hour: 1 },
    });

    expect(fireEvent.keyDown(list("hour"), { key: "ArrowDown" })).toBe(true);
    expect(fake.commits).toHaveLength(0);
  });

  it("readOnly 时键盘完全不响应", () => {
    const { fake, list } = mountColumns({
      readOnly: true,
      initialValues: { hour: 1 },
    });

    expect(fireEvent.keyDown(list("hour"), { key: "ArrowDown" })).toBe(true);
    expect(fake.commits).toHaveLength(0);
  });
});

describe("useTimePickerColumn - 跨列移动", () => {
  it("ArrowRight 把焦点与 activeUnit 移到下一列", () => {
    const { fake, list } = mountColumns({
      units: ["hour", "minute"],
    });

    fireEvent.keyDown(list("hour"), { key: "ArrowRight" });

    expect(fake.ctx.activeUnit()).toBe("minute");
    expect(document.activeElement).toBe(list("minute"));
  });

  it("ArrowLeft 回绕到最后一列", () => {
    const { fake, list } = mountColumns({
      units: ["hour", "minute", "second"],
      initialValues: { hour: 1 },
    });

    fireEvent.keyDown(list("hour"), { key: "ArrowLeft" });

    expect(fake.ctx.activeUnit()).toBe("second");
    expect(document.activeElement).toBe(list("second"));
  });

  it("RTL 下左右方向语义取反", () => {
    const { fake, list } = mountColumns({
      units: ["hour", "minute", "second"],
      dir: "rtl",
    });

    fireEvent.keyDown(list("hour"), { key: "ArrowRight" });

    expect(fake.ctx.activeUnit()).toBe("second");
    expect(document.activeElement).toBe(list("second"));
  });

  it("当前列不在 units 中时不动焦点", () => {
    const fake = createFakeTimePickerContext({
      units: ["hour"],
      options: smallOptions(),
    });
    const view = render(() => (
      <TimePickerContext.Provider value={fake.ctx}>
        <ColumnProbe unit="meridiem" />
      </TimePickerContext.Provider>
    ));
    const list = view.container.querySelector(
      '[data-unit="meridiem"]',
    ) as HTMLElement;

    fireEvent.keyDown(list, { key: "ArrowRight" });

    expect(fake.ctx.activeUnit()).toBeUndefined();
    expect(document.activeElement).not.toBe(list);
  });

  it("列获得焦点时把 activeUnit 同步为自身", () => {
    const { fake, list } = mountColumns({ units: ["hour", "minute"] });

    fireEvent.focus(list("minute"));

    expect(fake.ctx.activeUnit()).toBe("minute");
  });
});

describe("useTimePickerColumn - 滚动入视与注册", () => {
  it("挂载后选中值对应的选项会被滚入视野", () => {
    const spy = vi.spyOn(Element.prototype, "scrollIntoView");

    mountColumns({ initialValues: { hour: 2 } });

    expect(spy).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("选中值变化时重新滚入视野", () => {
    const spy = vi.spyOn(Element.prototype, "scrollIntoView");
    const { fake } = mountColumns({ initialValues: { hour: 0 } });

    spy.mockClear();
    fake.setSelected("hour", 1);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("选中值没有对应选项时不滚动（可选链兜底）", () => {
    const spy = vi.spyOn(Element.prototype, "scrollIntoView");
    const { fake } = mountColumns({ initialValues: { hour: 0 } });

    spy.mockClear();
    fake.setSelected("hour", 99);

    expect(spy).not.toHaveBeenCalled();
  });

  it("无值时不做滚动查询", () => {
    const spy = vi.spyOn(Element.prototype, "scrollIntoView");

    mountColumns();

    expect(spy).not.toHaveBeenCalled();
  });

  it("卸载时注销列元素", () => {
    const { fake, unmount } = mountColumns({ units: ["hour"] });

    expect(fake.ctx.getColumnElement("hour")).toBeDefined();

    unmount();

    expect(fake.ctx.getColumnElement("hour")).toBeUndefined();
  });
});
