import { Home, Inbox, Settings } from "lucide-solid";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/index";
import type { Section } from "./shared";

function SidebarBasic() {
  return (
    <SidebarProvider class="min-h-80 w-full max-w-2xl overflow-hidden rounded-lg border">
      <Sidebar collapsible="none" class="border-r">
        <SidebarHeader>
          <div class="px-2 text-sm font-semibold">Acme Inc</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Home />
                  Home
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Inbox />
                  Inbox
                </SidebarMenuButton>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset class="p-6">
        <h3 class="text-lg font-semibold">Dashboard</h3>
        <p class="mt-2 text-sm text-muted-foreground">
          SidebarProvider + Sidebar + SidebarInset compose an app shell.
        </p>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const sidebarSections: Section[] = [
  {
    id: "sidebar-basic",
    title: "Basic",
    description: "A sidebar shell with header, menu and content.",
    component: SidebarBasic,
  },
];
