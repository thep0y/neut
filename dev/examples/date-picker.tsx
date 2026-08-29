import { Show, createSignal } from "solid-js";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-solid";
import {
  Calendar,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/index";
import {
  addDays,
  formatLongDate,
  formatPPP,
  formatShortDate,
  isValidDate,
  LanguageSwitch,
  parseNaturalDate,
  rtlTranslations,
  type DateRange,
  type Language,
  type Section,
} from "./shared";

function DatePickerDemo() {
  const [date, setDate] = createSignal<Date | undefined>();

  return (
    <Popover>
      <PopoverTrigger
        variant="outline"
        data-empty={date() ? "false" : "true"}
        class="w-53 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
      >
        <Show when={date()} fallback={<span>Pick a date</span>}>
          {formatPPP(date()!)}
        </Show>
        <ChevronDown data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date()}
          onSelect={setDate}
          defaultMonth={date()}
        />
      </PopoverContent>
    </Popover>
  );
}

function DatePickerBasic() {
  const [date, setDate] = createSignal<Date | undefined>();

  return (
    <Field class="mx-auto w-44">
      <FieldLabel for="date-picker-simple">Date</FieldLabel>
      <Popover>
        <PopoverTrigger
          variant="outline"
          id="date-picker-simple"
          class="justify-start font-normal"
        >
          <Show when={date()} fallback={<span>Pick a date</span>}>
            {formatPPP(date()!)}
          </Show>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date()}
            onSelect={setDate}
            defaultMonth={date()}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function DatePickerRange() {
  const [date, setDate] = createSignal<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });

  return (
    <Field class="mx-auto w-60">
      <FieldLabel for="date-picker-range">Date Picker Range</FieldLabel>
      <Popover>
        <PopoverTrigger
          variant="outline"
          id="date-picker-range"
          class="justify-start px-2.5 font-normal"
        >
          <CalendarIcon data-icon="inline-start" />
          <Show when={date()?.from} fallback={<span>Pick a date</span>}>
            <span>
              {formatShortDate(date()!.from!)}
              <Show when={date()!.to}> - {formatShortDate(date()!.to!)}</Show>
            </span>
          </Show>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date()?.from}
            selected={date()}
            onSelect={(value) => setDate(value as DateRange | undefined)}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function DatePickerDob() {
  const [open, setOpen] = createSignal(false);
  const [date, setDate] = createSignal<Date | undefined>();

  return (
    <Field class="mx-auto w-44">
      <FieldLabel for="date">Date of birth</FieldLabel>
      <Popover open={open()} onOpenChange={setOpen}>
        <PopoverTrigger
          variant="outline"
          id="date"
          class="justify-start font-normal"
        >
          {date() ? date()!.toLocaleDateString() : "Select date"}
        </PopoverTrigger>
        <PopoverContent class="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date()}
            defaultMonth={date()}
            captionLayout="dropdown"
            onSelect={(value) => {
              setDate(value as Date | undefined);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function DatePickerInput() {
  const [open, setOpen] = createSignal(false);
  const [date, setDate] = createSignal<Date | undefined>(
    new Date("2025-06-01"),
  );
  const [month, setMonth] = createSignal<Date | undefined>(date());
  const [value, setValue] = createSignal(formatLongDate(date()));

  return (
    <Field class="mx-auto w-48">
      <FieldLabel for="date-required">Subscription Date</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-required"
          value={value()}
          placeholder="June 01, 2025"
          onChange={(next) => {
            const text = String(next);
            setValue(text);
            const parsed = new Date(text);
            if (isValidDate(parsed)) {
              setDate(parsed);
              setMonth(parsed);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open()} onOpenChange={setOpen}>
            <PopoverTrigger
              component={InputGroupButton}
              id="date-picker"
              variant="ghost"
              size="xs"
              aria-label="Select date"
              icon={<CalendarIcon />}
            />
            <PopoverContent
              class="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date()}
                month={month()}
                onMonthChange={setMonth}
                onSelect={(value) => {
                  setDate(value as Date | undefined);
                  setValue(formatLongDate(value as Date | undefined));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

function DatePickerTime() {
  const [open, setOpen] = createSignal(false);
  const [date, setDate] = createSignal<Date | undefined>();

  return (
    <FieldGroup class="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel for="date-picker-optional">Date</FieldLabel>
        <Popover open={open()} onOpenChange={setOpen}>
          <PopoverTrigger
            variant="outline"
            id="date-picker-optional"
            class="w-32 justify-between font-normal"
          >
            {date() ? formatPPP(date()!) : "Select date"}
            <ChevronDown data-icon="inline-end" />
          </PopoverTrigger>
          <PopoverContent class="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date()}
              captionLayout="dropdown"
              defaultMonth={date()}
              onSelect={(value) => {
                setDate(value as Date | undefined);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field class="w-32">
        <FieldLabel for="time-picker-optional">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker-optional"
          step="1"
          defaultValue="10:30:00"
          class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  );
}

function DatePickerNaturalLanguage() {
  const [open, setOpen] = createSignal(false);
  const [value, setValue] = createSignal("In 2 days");
  const [date, setDate] = createSignal<Date | undefined>(
    parseNaturalDate(value()),
  );

  return (
    <Field class="mx-auto max-w-xs">
      <FieldLabel for="date-optional">Schedule Date</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-optional"
          value={value()}
          placeholder="Tomorrow or next week"
          onChange={(next) => {
            const text = String(next);
            setValue(text);
            const parsed = parseNaturalDate(text);
            if (parsed) setDate(parsed);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open()} onOpenChange={setOpen}>
            <PopoverTrigger
              component={InputGroupButton}
              id="date-picker"
              variant="ghost"
              size="xs"
              aria-label="Select date"
              icon={<CalendarIcon />}
            />
            <PopoverContent
              class="w-auto overflow-hidden p-0"
              align="end"
              sideOffset={8}
            >
              <Calendar
                mode="single"
                selected={date()}
                captionLayout="dropdown"
                defaultMonth={date()}
                onSelect={(value) => {
                  setDate(value as Date | undefined);
                  setValue(formatLongDate(value as Date | undefined));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      <div class="px-1 text-sm text-muted-foreground">
        Your post will be published on{" "}
        <span class="font-medium">{formatLongDate(date())}</span>.
      </div>
    </Field>
  );
}

function DatePickerRtl() {
  const [language, setLanguage] = createSignal<Language>("ar");
  const [date, setDate] = createSignal<Date | undefined>();

  const t = () => rtlTranslations[language()];

  return (
    <div class="mx-auto flex w-full max-w-sm flex-col gap-4">
      <LanguageSwitch
        language={language}
        onChange={(lang) => setLanguage(lang)}
      />
      <div class="flex justify-center" dir={t().dir}>
        <Popover>
          <PopoverTrigger
            variant="outline"
            data-empty={date() ? "false" : "true"}
            class="w-53 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
            dir={t().dir}
          >
            <Show when={date()} fallback={<span>{t().placeholder}</span>}>
              {formatPPP(date()!, t().locale)}
            </Show>
            <ChevronDown data-icon="inline-end" />
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start" dir={t().dir}>
            <Calendar
              mode="single"
              selected={date()}
              onSelect={setDate}
              defaultMonth={date()}
              dir={t().dir}
              locale={t().locale}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export const datePickerSections: Section[] = [
  {
    id: "usage",
    title: "Usage",
    description: "A basic date picker component.",
    component: DatePickerDemo,
  },
  {
    id: "basic",
    title: "Basic",
    description: "A basic date picker component with a field label.",
    component: DatePickerBasic,
  },
  {
    id: "range",
    title: "Range Picker",
    description: "A date picker component for selecting a range of dates.",
    component: DatePickerRange,
  },
  {
    id: "dob",
    title: "Date of Birth",
    description:
      "A date picker component for selecting a date of birth with dropdown caption layout.",
    component: DatePickerDob,
  },
  {
    id: "input",
    title: "Input",
    description:
      "A date picker component with an input field for selecting a date.",
    component: DatePickerInput,
  },
  {
    id: "time",
    title: "Time Picker",
    description:
      "A date picker component with a time input field for selecting a time.",
    component: DatePickerTime,
  },
  {
    id: "natural-language",
    title: "Natural Language Picker",
    description:
      'This component parses natural language dates like "In 2 days" or "Tomorrow".',
    component: DatePickerNaturalLanguage,
  },
  {
    id: "rtl",
    title: "RTL",
    description:
      "A date picker component with RTL support for Arabic and Hebrew.",
    component: DatePickerRtl,
  },
];
