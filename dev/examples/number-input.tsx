import { createSignal } from "solid-js";
import { Field, FieldDescription, FieldLabel, NumberInput } from "~/index";
import type { Section } from "./shared";

function NumberInputBasic() {
  const [value, setValue] = createSignal<number | null>(1);

  return (
    <NumberInput
      value={value()}
      onValueChange={(next) => setValue(next)}
      aria-label="Quantity"
    />
  );
}

function NumberInputRange() {
  const [value, setValue] = createSignal<number | null>(50);

  return (
    <div class="flex flex-col items-center gap-3">
      <NumberInput
        value={value()}
        onValueChange={(next) => setValue(next)}
        min={0}
        max={100}
        step={5}
        aria-label="Percent"
      />
      <p class="text-sm text-muted-foreground">
        Value: <span class="font-medium">{value() ?? "empty"}</span>
      </p>
    </div>
  );
}

function NumberInputDecimal() {
  const [value, setValue] = createSignal<number | null>(1.5);

  return (
    <NumberInput
      value={value()}
      onValueChange={(next) => setValue(next)}
      min={0}
      step={0.1}
      format={(number) => number.toFixed(1)}
      aria-label="Amount"
    />
  );
}

function NumberInputField() {
  const [value, setValue] = createSignal<number | null>(3);

  return (
    <Field class="mx-auto w-56">
      <FieldLabel for="number-input-seats">Seats</FieldLabel>
      <NumberInput
        id="number-input-seats"
        class="w-full"
        value={value()}
        onValueChange={(next) => setValue(next)}
        min={1}
        max={12}
      />
      <FieldDescription>Between 1 and 12 seats.</FieldDescription>
    </Field>
  );
}

function NumberInputDisabled() {
  return (
    <NumberInput
      defaultValue={8}
      min={0}
      max={10}
      disabled
      aria-label="Quantity"
    />
  );
}

export const numberInputSections: Section[] = [
  {
    id: "number-input-basic",
    title: "Basic",
    description:
      "A controlled number input with custom decrement/increment buttons.",
    component: NumberInputBasic,
  },
  {
    id: "number-input-range",
    title: "Min, Max and Step",
    description:
      "Buttons disable at the bounds; PageUp/PageDown use a larger step.",
    component: NumberInputRange,
  },
  {
    id: "number-input-decimal",
    title: "Decimal",
    description: "Use a fractional step and a custom format for display.",
    component: NumberInputDecimal,
  },
  {
    id: "number-input-field",
    title: "With Field",
    description:
      "Compose with Field so the label is associated with the input.",
    component: NumberInputField,
  },
  {
    id: "number-input-disabled",
    title: "Disabled",
    description: "Disabled number input ignores interaction.",
    component: NumberInputDisabled,
  },
];
