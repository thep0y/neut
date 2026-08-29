import { For, lazy } from "solid-js";
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

const DatePickerPage = lazy(() => import("./pages/date-picker-page"));
const CalendarPage = lazy(() => import("./pages/calendar-page"));
const PopoverPage = lazy(() => import("./pages/popover-page"));
const RadioGroupPage = lazy(() => import("./pages/radio-group-page"));
const TogglePage = lazy(() => import("./pages/toggle-page"));
const ToggleGroupPage = lazy(() => import("./pages/toggle-group-page"));
const EmptyPage = lazy(() => import("./pages/empty-page"));
const TooltipPage = lazy(() => import("./pages/tooltip-page"));
const ToastPage = lazy(() => import("./pages/toast-page"));

const componentLinks = [
  { href: "/date-picker", title: "Date Picker" },
  { href: "/calendar", title: "Calendar" },
  { href: "/popover", title: "Popover" },
  { href: "/radio-group", title: "Radio Group" },
  { href: "/tooltip", title: "Tooltip" },
  { href: "/toggle", title: "Toggle" },
  { href: "/toggle-group", title: "Toggle Group" },
  { href: "/empty", title: "Empty" },
  { href: "/toast", title: "Toast" },
];

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
              <For each={componentLinks}>
                {(link) => (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      component={A}
                      href={link.href}
                      isActive={location.pathname === link.href}
                    >
                      {link.title}
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
      <Route path="/" component={DatePickerPage} />
      <Route path="/date-picker" component={DatePickerPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/popover" component={PopoverPage} />
      <Route path="/radio-group" component={RadioGroupPage} />
      <Route path="/tooltip" component={TooltipPage} />
      <Route path="/toggle" component={TogglePage} />
      <Route path="/toggle-group" component={ToggleGroupPage} />
      <Route path="/empty" component={EmptyPage} />
      <Route path="/toast" component={ToastPage} />
    </Router>
  );
};

export default App;
