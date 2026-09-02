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
} from "~/index";
import { routes, sidebarRoutes } from "./routes";

function AppLayout(props: RouteSectionProps) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar collapsible="none" class="sticky top-0 h-svh border-r">
        <SidebarHeader>
          <div class="flex items-center gap-2 px-2">
            <div class="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              N
            </div>
            <span class="text-sm font-semibold">neut/ui</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
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
                    >
                      {route.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </For>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
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
