import { For } from "solid-js";
import {
  A,
  Route,
  Router,
  useLocation,
  type RouteSectionProps,
} from "@solidjs/router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "~/index";
import { useSidebar } from "~/components/sidebar/SidebarProvider";
import { routes, sidebarRoutes } from "./routes";

function Brand() {
  return (
    <div class="flex items-center gap-2 px-2">
      <div class="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
        N
      </div>
      <span class="text-sm font-semibold">neut/ui</span>
    </div>
  );
}

function Navigation(props: { onNavigate?: () => void }) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Components</SidebarGroupLabel>
      <SidebarMenu>
        <For each={sidebarRoutes}>
          {(route) => (
            <SidebarMenuItem>
              <SidebarMenuButton
                component={A}
                href={route.path}
                isActive={location.pathname === route.path}
                onClick={() => {
                  setOpenMobile(false);
                  props.onNavigate?.();
                }}
              >
                {route.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </For>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function AppLayout(props: RouteSectionProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" class="border-r">
        <SidebarHeader>
          <Brand />
        </SidebarHeader>
        <SidebarContent>
          <Navigation />
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header class="sticky top-0 z-20 flex min-h-12 items-center gap-2 border-b bg-background/95 px-4 pt-safe backdrop-blur md:hidden">
          <SidebarTrigger aria-label="Toggle navigation" />
          <span class="text-sm font-semibold">neut/ui</span>
        </header>
        <div class="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 lg:px-12">
          {props.children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const App = () => {
  return (
    <Router root={AppLayout}>
      <For each={routes}>
        {(route) => <Route path={route.path} component={route.component} />}
      </For>
    </Router>
  );
};

export default App;
