import { TooltipProvider } from "~/index";
import { ComponentPage } from "../examples/shared";
import { tooltipSections } from "../examples/tooltip";

export default function TooltipPage() {
  return (
    <TooltipProvider delay={0} closeDelay={150}>
      <ComponentPage
        id="tooltip"
        title="Tooltip"
        description="A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it."
        sections={tooltipSections}
      />
    </TooltipProvider>
  );
}
