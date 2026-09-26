import type {
  TimePickerHourCycle,
  TimePickerMeridiem,
  TimePickerOptionMeta,
  TimePickerUnit,
  TimePickerUnitValue,
} from "./TimePicker.types";

/** 生成列选项所需的已解析配置 */
export interface TimePickerConfig {
  hourCycle: TimePickerHourCycle;
  showSeconds: boolean;
  hourStep: number;
  minuteStep: number;
  secondStep: number;
  locale?: string;
}

const UNIT_LABELS: Record<TimePickerUnit, string> = {
  hour: "Hour",
  minute: "Minute",
  second: "Second",
  meridiem: "AM/PM",
};

/** 列的无障碍名称(也是 aria-label 的默认值) */
export function getUnitLabel(unit: TimePickerUnit): string {
  return UNIT_LABELS[unit];
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** 闭区间 [start, end],步长至少为 1 */
function range(start: number, end: number, step: number): number[] {
  const result: number[] = [];
  const safeStep = Math.max(1, Math.floor(step));
  for (let value = start; value <= end; value += safeStep) {
    result.push(value);
  }
  return result;
}

export function getUnits(config: TimePickerConfig): TimePickerUnit[] {
  const units: TimePickerUnit[] = ["hour", "minute"];
  if (config.showSeconds) units.push("second");
  if (config.hourCycle === 12) units.push("meridiem");
  return units;
}

/**
 * AM/PM 文案走 Intl,避免硬编码英文;locale 缺失或取不到时回退 AM/PM。
 */
export function getMeridiemLabels(locale?: string): { am: string; pm: string } {
  const label = (hour: number): string | undefined =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true })
      .formatToParts(new Date(2024, 0, 1, hour))
      .find((part) => part.type === "dayPeriod")?.value;

  return { am: label(9) ?? "AM", pm: label(21) ?? "PM" };
}

export function getUnitOptions(
  unit: TimePickerUnit,
  config: TimePickerConfig,
): TimePickerOptionMeta[] {
  switch (unit) {
    case "hour": {
      // 12 小时制直接按展示值 1..12 生成,避免 24h→12h 映射后出现重复项
      if (config.hourCycle === 12) {
        return range(1, 12, config.hourStep).map((hour) => ({
          value: hour,
          label: pad2(hour),
        }));
      }
      return range(0, 23, config.hourStep).map((hour) => ({
        value: hour,
        label: pad2(hour),
      }));
    }
    case "minute":
      return range(0, 59, config.minuteStep).map((minute) => ({
        value: minute,
        label: pad2(minute),
      }));
    case "second":
      return range(0, 59, config.secondStep).map((second) => ({
        value: second,
        label: pad2(second),
      }));
    case "meridiem": {
      const { am, pm } = getMeridiemLabels(config.locale);
      return [
        { value: "AM" as TimePickerMeridiem, label: am },
        { value: "PM" as TimePickerMeridiem, label: pm },
      ];
    }
  }
}

/** 读取当前值在某个单位列上的展示值 */
export function getUnitValue(
  date: Date | undefined,
  unit: TimePickerUnit,
  hourCycle: TimePickerHourCycle,
): TimePickerUnitValue | undefined {
  if (!date) return undefined;
  switch (unit) {
    case "hour": {
      const hours = date.getHours();
      if (hourCycle === 12) return hours % 12 === 0 ? 12 : hours % 12;
      return hours;
    }
    case "minute":
      return date.getMinutes();
    case "second":
      return date.getSeconds();
    case "meridiem":
      return date.getHours() < 12 ? "AM" : "PM";
  }
}

/** 把某个单位列的选择合并回 Date,其余字段保持不变 */
export function withUnit(
  date: Date,
  unit: TimePickerUnit,
  value: TimePickerUnitValue,
  hourCycle: TimePickerHourCycle,
): Date {
  const next = new Date(date.getTime());
  switch (unit) {
    case "hour": {
      const display = Number(value);
      if (hourCycle === 12) {
        const isPm = next.getHours() >= 12;
        next.setHours((display % 12) + (isPm ? 12 : 0));
      } else {
        next.setHours(display);
      }
      return next;
    }
    case "minute":
      next.setMinutes(Number(value));
      return next;
    case "second":
      next.setSeconds(Number(value));
      return next;
    case "meridiem": {
      const isPm = value === "PM";
      next.setHours((next.getHours() % 12) + (isPm ? 12 : 0));
      return next;
    }
  }
}

/** 触发器默认的时间格式化 */
export function formatTime(date: Date, config: TimePickerConfig): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const secondsPart = config.showSeconds ? `:${pad2(seconds)}` : "";

  if (config.hourCycle === 12) {
    const { am, pm } = getMeridiemLabels(config.locale);
    const display = hours % 12 === 0 ? 12 : hours % 12;
    return `${display}:${pad2(minutes)}${secondsPart} ${hours < 12 ? am : pm}`;
  }

  return `${pad2(hours)}:${pad2(minutes)}${secondsPart}`;
}
