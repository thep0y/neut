import { createSignal } from "solid-js";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
} from "~/index";
import { LanguageSwitch, type Language, type Section } from "./shared";

function RadioGroupUsage() {
  return (
    <RadioGroup defaultValue="comfortable" class="w-fit">
      <div class="flex items-center gap-3">
        <RadioGroupItem value="default" id="r1" />
        <Label for="r1">Default</Label>
      </div>
      <div class="flex items-center gap-3">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label for="r2">Comfortable</Label>
      </div>
      <div class="flex items-center gap-3">
        <RadioGroupItem value="compact" id="r3" />
        <Label for="r3">Compact</Label>
      </div>
    </RadioGroup>
  );
}

function RadioGroupDescription() {
  return (
    <RadioGroup defaultValue="comfortable" class="w-fit">
      <Field orientation="horizontal">
        <RadioGroupItem value="default" id="desc-r1" />
        <FieldContent>
          <FieldLabel for="desc-r1">Default</FieldLabel>
          <FieldDescription>
            Standard spacing for most use cases.
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="comfortable" id="desc-r2" />
        <FieldContent>
          <FieldLabel for="desc-r2">Comfortable</FieldLabel>
          <FieldDescription>More space between elements.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="compact" id="desc-r3" />
        <FieldContent>
          <FieldLabel for="desc-r3">Compact</FieldLabel>
          <FieldDescription>
            Minimal spacing for dense layouts.
          </FieldDescription>
        </FieldContent>
      </Field>
    </RadioGroup>
  );
}

function RadioGroupChoiceCard() {
  return (
    <RadioGroup defaultValue="plus" class="max-w-sm">
      <FieldLabel for="plus-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Plus</FieldTitle>
            <FieldDescription>
              For individuals and small teams.
            </FieldDescription>
          </FieldContent>
          <RadioGroupItem value="plus" id="plus-plan" />
        </Field>
      </FieldLabel>
      <FieldLabel for="pro-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Pro</FieldTitle>
            <FieldDescription>For growing businesses.</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="pro" id="pro-plan" />
        </Field>
      </FieldLabel>
      <FieldLabel for="enterprise-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Enterprise</FieldTitle>
            <FieldDescription>
              For large teams and enterprises.
            </FieldDescription>
          </FieldContent>
          <RadioGroupItem value="enterprise" id="enterprise-plan" />
        </Field>
      </FieldLabel>
    </RadioGroup>
  );
}

function RadioGroupFieldset() {
  return (
    <FieldSet class="w-full max-w-xs">
      <FieldLegend variant="label">Subscription Plan</FieldLegend>
      <FieldDescription>
        Yearly and lifetime plans offer significant savings.
      </FieldDescription>
      <RadioGroup defaultValue="monthly">
        <Field orientation="horizontal">
          <RadioGroupItem value="monthly" id="plan-monthly" />
          <FieldLabel for="plan-monthly" class="font-normal">
            Monthly ($9.99/month)
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="yearly" id="plan-yearly" />
          <FieldLabel for="plan-yearly" class="font-normal">
            Yearly ($99.99/year)
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="lifetime" id="plan-lifetime" />
          <FieldLabel for="plan-lifetime" class="font-normal">
            Lifetime ($299.99)
          </FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  );
}

function RadioGroupDisabled() {
  return (
    <RadioGroup defaultValue="option2" class="w-fit">
      <Field orientation="horizontal" data-disabled>
        <RadioGroupItem value="option1" id="disabled-1" disabled />
        <FieldLabel for="disabled-1" class="font-normal">
          Disabled
        </FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="option2" id="disabled-2" />
        <FieldLabel for="disabled-2" class="font-normal">
          Option 2
        </FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="option3" id="disabled-3" />
        <FieldLabel for="disabled-3" class="font-normal">
          Option 3
        </FieldLabel>
      </Field>
    </RadioGroup>
  );
}

function RadioGroupInvalid() {
  return (
    <FieldSet class="w-full max-w-xs">
      <FieldLegend variant="label">Notification Preferences</FieldLegend>
      <FieldDescription>
        Choose how you want to receive notifications.
      </FieldDescription>
      <RadioGroup defaultValue="email">
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem
            value="email"
            id="invalid-email"
            aria-invalid="true"
          />
          <FieldLabel for="invalid-email" class="font-normal">
            Email only
          </FieldLabel>
        </Field>
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem value="sms" id="invalid-sms" aria-invalid="true" />
          <FieldLabel for="invalid-sms" class="font-normal">
            SMS only
          </FieldLabel>
        </Field>
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem value="both" id="invalid-both" aria-invalid="true" />
          <FieldLabel for="invalid-both" class="font-normal">
            Both Email & SMS
          </FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  );
}

const radioGroupRtlTranslations: Record<
  Language,
  { dir: "ltr" | "rtl"; labels: Record<string, string> }
> = {
  en: {
    dir: "ltr",
    labels: {
      default: "Default",
      defaultDescription: "Standard spacing for most use cases.",
      comfortable: "Comfortable",
      comfortableDescription: "More space between elements.",
      compact: "Compact",
      compactDescription: "Minimal spacing for dense layouts.",
    },
  },
  ar: {
    dir: "rtl",
    labels: {
      default: "افتراضي",
      defaultDescription: "تباعد قياسي لمعظم حالات الاستخدام.",
      comfortable: "مريح",
      comfortableDescription: "مساحة أكبر بين العناصر.",
      compact: "مضغوط",
      compactDescription: "تباعد أدنى للتخطيطات الكثيفة.",
    },
  },
  he: {
    dir: "rtl",
    labels: {
      default: "ברירת מחדל",
      defaultDescription: "ריווח סטנדרטי לרוב מקרי השימוש.",
      comfortable: "נוח",
      comfortableDescription: "יותר מקום בין האלמנטים.",
      compact: "קומפקטי",
      compactDescription: "ריווח מינימלי לפריסות צפופות.",
    },
  },
};

function RadioGroupRtl() {
  const [language, setLanguage] = createSignal<Language>("ar");
  const t = () => radioGroupRtlTranslations[language()];

  return (
    <div class="mx-auto flex w-full max-w-sm flex-col gap-4">
      <LanguageSwitch language={language} onChange={setLanguage} />
      <RadioGroup defaultValue="comfortable" class="w-fit" dir={t().dir}>
        <Field orientation="horizontal">
          <RadioGroupItem value="default" id="r1-rtl" dir={t().dir} />
          <FieldContent>
            <FieldLabel for="r1-rtl" dir={t().dir}>
              {t().labels.default}
            </FieldLabel>
            <FieldDescription dir={t().dir}>
              {t().labels.defaultDescription}
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="comfortable" id="r2-rtl" dir={t().dir} />
          <FieldContent>
            <FieldLabel for="r2-rtl" dir={t().dir}>
              {t().labels.comfortable}
            </FieldLabel>
            <FieldDescription dir={t().dir}>
              {t().labels.comfortableDescription}
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="compact" id="r3-rtl" dir={t().dir} />
          <FieldContent>
            <FieldLabel for="r3-rtl" dir={t().dir}>
              {t().labels.compact}
            </FieldLabel>
            <FieldDescription dir={t().dir}>
              {t().labels.compactDescription}
            </FieldDescription>
          </FieldContent>
        </Field>
      </RadioGroup>
    </div>
  );
}

export const radioGroupSections: Section[] = [
  {
    id: "radio-group-usage",
    title: "Usage",
    description:
      "A set of checkable buttons where no more than one can be checked at a time.",
    component: RadioGroupUsage,
  },
  {
    id: "radio-group-description",
    title: "Description",
    description:
      "Radio group items with a description using the Field component.",
    component: RadioGroupDescription,
  },
  {
    id: "radio-group-choice-card",
    title: "Choice Card",
    description:
      "Use FieldLabel to wrap the entire Field for a clickable card-style selection.",
    component: RadioGroupChoiceCard,
  },
  {
    id: "radio-group-fieldset",
    title: "Fieldset",
    description:
      "Use FieldSet and FieldLegend to group radio items with a label and description.",
    component: RadioGroupFieldset,
  },
  {
    id: "radio-group-disabled",
    title: "Disabled",
    description: "Use the disabled prop on RadioGroup or RadioGroupItem.",
    component: RadioGroupDisabled,
  },
  {
    id: "radio-group-invalid",
    title: "Invalid",
    description:
      "Use aria-invalid on RadioGroupItem and data-invalid on Field.",
    component: RadioGroupInvalid,
  },
  {
    id: "radio-group-rtl",
    title: "RTL",
    description: "Radio group with RTL support for Arabic and Hebrew.",
    component: RadioGroupRtl,
  },
];
