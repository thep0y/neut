import { For, type Accessor, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Button, Separator, clsx } from "~/index";

// ---------------------------------------------------------------
// 日期格式化和自然语言解析工具
// 为避免给 dev 引入 date-fns / chrono-node，这里用 Intl + 简单规则代替。
// ---------------------------------------------------------------

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function isValidDate(date: Date | undefined): date is Date {
  return !!date && !Number.isNaN(date.getTime());
}

function ordinal(day: number): string {
  const rem100 = day % 100;
  if (rem100 >= 11 && rem100 <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** 近似 date-fns 的 PPP 格式，例如 April 29th, 2025 */
export function formatPPP(date: Date, locale = "en-US"): string {
  if (locale === "en" || locale === "en-US") {
    const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
      date,
    );
    return `${month} ${date.getDate()}${ordinal(date.getDate())}, ${date.getFullYear()}`;
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** 近似 date-fns 的 LLL dd, y 格式，例如 Jan 20, 2025 */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** 近似 date-fns 的 toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) */
export function formatLongDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** 只覆盖示例需要的几个自然语言表达，便于在没有 chrono-node 的情况下演示 */
export function parseNaturalDate(input: string): Date | undefined {
  const text = input.trim().toLowerCase();
  const now = new Date();

  if (text === "today" || text === "now") return now;
  if (text === "tomorrow") return addDays(now, 1);
  if (text === "next week") return addDays(now, 7);

  const inDays = text.match(/^in (\d+) days?$/);
  if (inDays) return addDays(now, Number(inDays[1]));

  const inWeeks = text.match(/^in (\d+) weeks?$/);
  if (inWeeks) return addDays(now, Number(inWeeks[1]) * 7);

  const parsed = new Date(text);
  return isValidDate(parsed) ? parsed : undefined;
}

// ---------------------------------------------------------------
// 共享类型
// ---------------------------------------------------------------

export type Language = "en" | "ar" | "he";

export const rtlTranslations: Record<
  Language,
  { dir: "ltr" | "rtl"; placeholder: string; locale: string }
> = {
  en: { dir: "ltr", placeholder: "Pick a date", locale: "en-US" },
  ar: { dir: "rtl", placeholder: "اختر تاريخًا", locale: "ar" },
  he: { dir: "rtl", placeholder: "בחר תאריך", locale: "he" },
};

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  component: Component;
}

export interface ComponentPageData {
  id: string;
  title: string;
  description: string;
  sections: Section[];
}

// ---------------------------------------------------------------
// 共享 UI
// ---------------------------------------------------------------

export function LanguageSwitch(props: {
  language: Accessor<Language>;
  onChange: (language: Language) => void;
}) {
  return (
    <div class="flex justify-center gap-2">
      <For each={["en", "ar", "he"] as Language[]}>
        {(lang) => (
          <Button
            variant={props.language() === lang ? "primary" : "outline"}
            size="xs"
            onClick={() => props.onChange(lang)}
          >
            {lang.toUpperCase()}
          </Button>
        )}
      </For>
    </div>
  );
}

export function PreviewCard(props: { children: JSX.Element; class?: string }) {
  return (
    <div class="group relative mt-4 mb-12 flex flex-col overflow-hidden rounded-2xl border bg-background">
      <div
        class={clsx(
          "flex min-h-105 w-full items-center justify-center p-10",
          props.class,
        )}
      >
        {props.children}
      </div>
    </div>
  );
}

export function SectionBlock(props: {
  id: string;
  title: string;
  description: string;
  component: Component;
}) {
  return (
    <section id={props.id} class="scroll-mt-24">
      <h2 class="text-xl font-semibold tracking-tight">{props.title}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{props.description}</p>
      <PreviewCard>
        <Dynamic component={props.component} />
      </PreviewCard>
    </section>
  );
}

export function ComponentPage(props: ComponentPageData) {
  return (
    <div id={props.id} class="scroll-mt-24">
      <div class="flex flex-col gap-2">
        <h1 class="scroll-m-24 text-3xl font-semibold tracking-tight">
          {props.title}
        </h1>
        <p class="text-base text-muted-foreground">{props.description}</p>
      </div>
      <Separator class="my-8" />
      <For each={props.sections}>
        {(section) => (
          <SectionBlock
            id={section.id}
            title={section.title}
            description={section.description}
            component={section.component}
          />
        )}
      </For>
    </div>
  );
}
