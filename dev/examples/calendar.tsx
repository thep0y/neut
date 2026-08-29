import { For, createSignal } from "solid-js";
import { Clock2Icon } from "lucide-solid";
import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardFooter,
  Field,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/index";
import {
  addDays,
  LanguageSwitch,
  rtlTranslations,
  type DateRange,
  type Language,
  type Section,
} from "./shared";

function CalendarDemo() {
  const [date, setDate] = createSignal<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date()}
      onSelect={setDate}
      class="rounded-lg border"
      captionLayout="dropdown"
    />
  );
}

function CalendarBasic() {
  return <Calendar mode="single" class="rounded-lg border" />;
}

function CalendarRangeExample() {
  const [range, setRange] = createSignal<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
  });

  return (
    <Calendar
      mode="range"
      defaultMonth={range()?.from}
      selected={range()}
      onSelect={(value) => setRange(value as DateRange | undefined)}
      numberOfMonths={2}
      class="rounded-lg border"
    />
  );
}

function CalendarCaption() {
  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      class="rounded-lg border"
    />
  );
}

function CalendarPresets() {
  const [date, setDate] = createSignal<Date | undefined>(
    new Date(new Date().getFullYear(), 1, 12),
  );
  const [currentMonth, setCurrentMonth] = createSignal<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const presets = [
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 1 },
    { label: "In 3 days", value: 3 },
    { label: "In a week", value: 7 },
    { label: "In 2 weeks", value: 14 },
  ];

  return (
    <Card class="mx-auto w-fit max-w-75" size="sm">
      <CardContent>
        <Calendar
          mode="single"
          selected={date()}
          onSelect={setDate}
          month={currentMonth()}
          onMonthChange={setCurrentMonth}
          class="p-0 [--cell-size:--spacing(9.5)]"
        />
      </CardContent>
      <CardFooter class="flex flex-wrap gap-2 border-t">
        <For each={presets}>
          {(preset) => (
            <Button
              variant="outline"
              size="sm"
              class="flex-1"
              onClick={() => {
                const next = addDays(new Date(), preset.value);
                setDate(next);
                setCurrentMonth(
                  new Date(next.getFullYear(), next.getMonth(), 1),
                );
              }}
            >
              {preset.label}
            </Button>
          )}
        </For>
      </CardFooter>
    </Card>
  );
}

function CalendarWithTime() {
  const [date, setDate] = createSignal<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 12),
  );

  return (
    <Card size="sm" class="mx-auto w-fit">
      <CardContent>
        <Calendar
          mode="single"
          selected={date()}
          onSelect={setDate}
          class="p-0"
        />
      </CardContent>
      <CardFooter class="border-t bg-card">
        <FieldGroup>
          <Field>
            <FieldLabel for="time-from">Start Time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="time-from"
                type="time"
                step="1"
                defaultValue="10:30:00"
                class="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon align="inline-end">
                <Clock2Icon class="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel for="time-to">End Time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="time-to"
                type="time"
                step="1"
                defaultValue="12:30:00"
                class="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon align="inline-end">
                <Clock2Icon class="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </CardFooter>
    </Card>
  );
}

function CalendarWeekNumbers() {
  const [date, setDate] = createSignal<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 12),
  );

  return (
    <Card class="mx-auto w-fit p-0">
      <CardContent class="p-0">
        <Calendar
          mode="single"
          defaultMonth={date()}
          selected={date()}
          onSelect={setDate}
          showWeekNumber
        />
      </CardContent>
    </Card>
  );
}

function CalendarRtl() {
  const [language, setLanguage] = createSignal<Language>("ar");
  const [date, setDate] = createSignal<Date | undefined>(new Date());
  const t = () => rtlTranslations[language()];

  return (
    <div class="mx-auto flex w-full max-w-sm flex-col gap-4">
      <LanguageSwitch
        language={language}
        onChange={(lang) => setLanguage(lang)}
      />
      <div class="flex justify-center" dir={t().dir}>
        <Calendar
          mode="single"
          selected={date()}
          onSelect={setDate}
          class="rounded-lg border [--cell-size:--spacing(9)]"
          captionLayout="dropdown"
          dir={t().dir}
          locale={t().locale}
        />
      </div>
    </div>
  );
}



export const calendarSections: Section[] = [
  {
    id: "calendar-usage",
    title: "Usage",
    description:
      "A calendar component with dropdown month and year selectors.",
    component: CalendarDemo,
  },
  {
    id: "calendar-basic",
    title: "Basic",
    description: "A basic calendar component.",
    component: CalendarBasic,
  },
  {
    id: "calendar-range",
    title: "Range Calendar",
    description: "Use mode=\"range\" to enable range selection.",
    component: CalendarRangeExample,
  },
  {
    id: "calendar-caption",
    title: "Month and Year Selector",
    description:
      "Use captionLayout=\"dropdown\" to show month and year dropdowns.",
    component: CalendarCaption,
  },
  {
    id: "calendar-presets",
    title: "Presets",
    description: "A calendar with preset date shortcuts.",
    component: CalendarPresets,
  },
  {
    id: "calendar-time",
    title: "Date and Time Picker",
    description: "A calendar combined with start and end time inputs.",
    component: CalendarWithTime,
  },
  {
    id: "calendar-week-numbers",
    title: "Week Numbers",
    description: "Use showWeekNumber to show week numbers.",
    component: CalendarWeekNumbers,
  },
  {
    id: "calendar-rtl",
    title: "RTL",
    description:
      "A calendar component with RTL support for Arabic and Hebrew.",
    component: CalendarRtl,
  },
];
