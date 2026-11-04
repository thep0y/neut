import { createEffect, For } from "solid-js";
import {
  A,
  Route,
  Router,
  useLocation,
  type RouteSectionProps,
} from "@solidjs/router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
                onClick={() => props.onNavigate?.()}
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

/**
 * 移动端导航：复用 SidebarProvider 的 openMobile，默认关闭。
 * Sheet 关闭时完全不占布局，示例内容可以使用整屏宽度。
 */
function MobileSidebar() {
  const { openMobile, setOpenMobile } = useSidebar();
  const location = useLocation();

  createEffect(() => {
    // 路由变化后自动收起，避免导航后 Sheet 还盖在示例上
    location.pathname;
    setOpenMobile(false);
  });

  return (
    <Sheet open={openMobile()} onOpenChange={setOpenMobile}>
      <SheetContent side="left" class="w-[min(18rem,85vw)] p-0">
        <SheetHeader class="border-b p-4">
          <SheetTitle class="flex items-center gap-2 text-sm font-semibold">
            <span class="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              N
            </span>
            neut/ui
          </SheetTitle>
        </SheetHeader>
        <SidebarContent class="p-2">
          <Navigation onNavigate={() => setOpenMobile(false)} />
        </SidebarContent>
      </SheetContent>
    </Sheet>
  );
}

function AppLayout(props: RouteSectionProps) {
  return (
    <SidebarProvider>
      <Sidebar
        collapsible="none"
        class="sticky top-0 hidden h-svh border-r md:flex"
      >
        <SidebarHeader>
          <Brand />
        </SidebarHeader>
        <SidebarContent>
          <Navigation />
        </SidebarContent>
      </Sidebar>

      <MobileSidebar />

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
