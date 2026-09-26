import { ComponentPage } from "../examples/shared";
import { dropdownMenuSections } from "../examples/dropdown-menu";

export default function DropdownMenuPage() {
  return (
    <ComponentPage
      id="dropdown-menu"
      title="Dropdown Menu"
      description="Displays a menu to the user, triggered by a button."
      sections={dropdownMenuSections}
    />
  );
}
