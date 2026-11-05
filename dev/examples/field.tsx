import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Input,
} from "~/index";
import type { Section } from "./shared";

function FieldBasic() {
  return (
    <FieldSet class="w-full max-w-sm">
      <FieldLegend>Profile</FieldLegend>
      <FieldDescription>
        This info will be displayed on your profile.
      </FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel for="field-name">Name</FieldLabel>
          <Input id="field-name" placeholder="Ada Lovelace" />
          <FieldDescription>Use your real name.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel for="field-email">Email</FieldLabel>
          <Input id="field-email" type="email" placeholder="ada@example.com" />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

function FieldHorizontal() {
  return (
    <FieldSet class="w-full max-w-sm">
      <FieldLegend>Notifications</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox id="field-marketing" defaultChecked />
          <FieldContent>
            <FieldTitle>Marketing emails</FieldTitle>
            <FieldDescription>
              Receive updates about new products.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

function FieldWithError() {
  return (
    <FieldSet class="w-full max-w-sm">
      <FieldGroup>
        <Field data-invalid={true}>
          <FieldLabel for="field-error">Username</FieldLabel>
          <Input id="field-error" aria-invalid={true} value="ad" />
          <FieldError
            errors={[{ message: "Username must be at least 3 characters." }]}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

export const fieldSections: Section[] = [
  {
    id: "field-basic",
    title: "Basic",
    description: "Labels, descriptions and grouped form fields.",
    component: FieldBasic,
  },
  {
    id: "field-horizontal",
    title: "Horizontal",
    description: "Arrange a checkbox and its content horizontally.",
    component: FieldHorizontal,
  },
  {
    id: "field-error",
    title: "With Error",
    description: "Show a validation error below a field.",
    component: FieldWithError,
  },
];
