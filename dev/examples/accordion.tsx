import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/index";
import type { Section } from "./shared";

function AccordionBasic() {
  return (
    <Accordion defaultValue={["shipping"]} class="w-full max-w-md">
      <AccordionItem value="shipping">
        <AccordionTrigger>How long does shipping take?</AccordionTrigger>
        <AccordionContent>
          Orders usually ship within 1–2 business days.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>What is your return policy?</AccordionTrigger>
        <AccordionContent>
          Returns are accepted within 30 days of delivery.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>How can I contact support?</AccordionTrigger>
        <AccordionContent>
          Email support@example.com and we will reply within one business day.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionMultiple() {
  return (
    <Accordion multiple defaultValue={["one", "two"]} class="w-full max-w-md">
      <AccordionItem value="one">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>
          Multiple panels can stay open at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Second section</AccordionTrigger>
        <AccordionContent>
          Set multiple to allow several open items.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionDisabled() {
  return (
    <Accordion defaultValue={["item"]} class="w-full max-w-md">
      <AccordionItem value="item" disabled>
        <AccordionTrigger>Disabled item</AccordionTrigger>
        <AccordionContent>This panel cannot be toggled.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const accordionSections: Section[] = [
  {
    id: "accordion-basic",
    title: "Basic",
    description: "A vertically stacked set of interactive headings.",
    component: AccordionBasic,
  },
  {
    id: "accordion-multiple",
    title: "Multiple",
    description: "Allow more than one panel to be open.",
    component: AccordionMultiple,
  },
  {
    id: "accordion-disabled",
    title: "Disabled",
    description: "An individual item can be disabled.",
    component: AccordionDisabled,
  },
];
