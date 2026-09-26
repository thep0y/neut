import { createSignal } from "solid-js";
import {
  Field,
  FieldDescription,
  FieldLabel,
  TimePicker,
  TimePickerContent,
  TimePickerTrigger,
} from "~/index";
import type { Section } from "./shared";

function TimePickerDemo() {
  const [time, setTime] = createSignal<Date | undefined>();

  return (
    <TimePicker
      value={time()}
      onValueChange={(value) => setTime(value)}
      placeholder="Pick a time"
    />
  );
}

function TimePickerWithField() {
  const [time, setTime] = createSignal<Date | undefined>(
    new Date(2026, 0, 1, 9, 30),
  );

  // 组合式用法:自己提供触发器,方便接 FieldLabel 的 for / 自定义 id
  return (
    <Field class="mx-auto w-56">
      <FieldLabel for="time-picker-meeting">Meeting time</FieldLabel>
      <TimePicker value={time()} onValueChange={(value) => setTime(value)}>
        <TimePickerTrigger id="time-picker-meeting" class="w-full" />
        <TimePickerContent />
      </TimePicker>
      <FieldDescription>Hours and minutes in 24-hour format.</FieldDescription>
    </Field>
  );
}

function TimePickerWithSeconds() {
  const [time, setTime] = createSignal<Date | undefined>(
    new Date(2026, 0, 1, 14, 5, 20),
  );

  return (
    <TimePicker
      value={time()}
      onValueChange={(value) => setTime(value)}
      showSeconds
    />
  );
}

function TimePickerTwelveHour() {
  const [time, setTime] = createSignal<Date | undefined>(
    new Date(2026, 0, 1, 14, 30),
  );

  return (
    <TimePicker
      value={time()}
      onValueChange={(value) => setTime(value)}
      hourCycle={12}
    />
  );
}

function TimePickerStep() {
  const [time, setTime] = createSignal<Date | undefined>(
    new Date(2026, 0, 1, 0, 0),
  );

  return (
    <TimePicker
      value={time()}
      onValueChange={(value) => setTime(value)}
      minuteStep={15}
    />
  );
}

function TimePickerDisabled() {
  return (
    <TimePicker
      value={new Date(2026, 0, 1, 8, 45)}
      disabled
      placeholder="Pick a time"
    />
  );
}

export const timePickerSections: Section[] = [
  {
    id: "usage",
    title: "Usage",
    description: "A basic time picker with hour and minute columns.",
    component: TimePickerDemo,
  },
  {
    id: "field",
    title: "With Field",
    description:
      "A time picker composed with Field so the label is associated with the trigger.",
    component: TimePickerWithField,
  },
  {
    id: "seconds",
    title: "With Seconds",
    description: "A time picker that also exposes a seconds column.",
    component: TimePickerWithSeconds,
  },
  {
    id: "twelve-hour",
    title: "12-hour",
    description: "A time picker in 12-hour format with an AM/PM column.",
    component: TimePickerTwelveHour,
  },
  {
    id: "step",
    title: "Step",
    description: "A time picker whose minutes are limited to 15-minute steps.",
    component: TimePickerStep,
  },
  {
    id: "disabled",
    title: "Disabled",
    description: "A disabled time picker.",
    component: TimePickerDisabled,
  },
];
