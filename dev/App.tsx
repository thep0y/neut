import {
  ArrowUp,
  BadgeCheck,
  Check,
  ChevronRight,
  Copy,
  CornerDownLeft,
  CornerLeftUp,
  CreditCard,
  GitBranch,
  GitFork,
  Inbox,
  Info,
  Loader,
  Mail,
  Minus,
  Moon,
  MoveUp,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldAlert,
  Star,
  Sun,
} from "lucide-solid";
import {
  type Component,
  createEffect,
  createSignal,
  For,
  type JSXElement,
  type ParentProps,
} from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AspectRatio,
  Badge,
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Image,
  Separator,
  Spinner,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
  Kbd,
  Input,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Textarea,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  ScrollArea,
  Label,
  Switch,
  toast,
  Toaster,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Skeleton,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "~/index";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupAction>
            <Plus /> <span class="sr-only">Add Project</span>
          </SidebarGroupAction>
          <SidebarGroupContent></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

const Layout = (props: ParentProps) => {
  return (
    <SidebarProvider class="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-300">
      <AppSidebar />
      <main class="flex-1">
        <SidebarTrigger />
        {props.children}
      </main>
    </SidebarProvider>
  );
};

const App: Component = () => {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  const tooltipSides = ["top", "right", "bottom", "left"] as const;
  const tooltipAligns = ["start", "center", "end"] as const;
  const arrows: Record<
    `${(typeof tooltipSides)[number]}-${(typeof tooltipAligns)[number]}`,
    JSXElement
  > = {
    "top-start": <CornerLeftUp />,
    "top-center": <MoveUp />,
    "top-end": <CornerLeftUp class="rotate-y-180" />,
    "right-start": <CornerLeftUp class="rotate-90" />,
    "right-center": <MoveUp class="rotate-90" />,
    "right-end": <CornerLeftUp class="rotate-90 rotate-y-180" />,
    "bottom-start": <CornerLeftUp class="rotate-x-180" />,
    "bottom-center": <MoveUp class="rotate-180" />,
    "bottom-end": <CornerLeftUp class="rotate-180" />,
    "left-start": <CornerLeftUp class="rotate-90 rotate-x-180" />,
    "left-center": <MoveUp class="-rotate-90" />,
    "left-end": <CornerLeftUp class="-rotate-90" />,
  };

  createEffect(() => {
    document.documentElement.setAttribute("data-theme", theme());
  });

  return (
    <Layout>
      <div class="py-4 flex flex-col items-center justify-center gap-3 overflow-y-auto">
        <Button
          class="fixed right-4 top-4"
          icon={theme() === "light" ? <Moon /> : <Sun />}
          onClick={() =>
            setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
        />

        <div class="flex items-center justify-center gap-3">
          <Button>Button</Button>
          <Button icon={<ArrowUp />} />
        </div>

        <div class="flex items-center justify-center gap-3">
          <Button variant="outline">Button</Button>
          <Button variant="outline" icon={<ArrowUp />} />
        </div>

        <div class="flex items-center justify-center gap-3">
          <Button variant="secondary">Button</Button>
          <Button variant="secondary" icon={<ArrowUp />} />
        </div>

        <div class="flex items-center justify-center gap-3">
          <Button variant="ghost">Button</Button>
          <Button variant="ghost" icon={<ArrowUp />} />
        </div>

        <div class="flex items-center justify-center gap-3">
          <Button variant="destructive">Button</Button>
          <Button variant="destructive" icon={<ArrowUp />} />
        </div>

        <div
          class="flex items-center justify-center gap-3"
          dir="rtl"
          data-lang="ar"
        >
          <Button variant="primary">زر</Button>
          <Button variant="secondary" type="submit">
            إرسال
          </Button>
          <Button variant="destructive">حذف</Button>
          <Button variant="destructive">جاري التحميل</Button>
        </div>

        <div class="flex items-center justify-center gap-3">
          <Button variant="link">Button</Button>
          <Button variant="link" icon={<ArrowUp />} />
        </div>

        <div class="flex items-center justify-center gap-3">
          <Button variant="outline" icon={<GitBranch />}>
            New Branch
          </Button>
          <Button variant="outline" icon={<GitFork />} iconPosition="right">
            Fork
          </Button>
        </div>

        <div class="flex items-center justify-center gap-3">
          <Button variant="outline" disabled icon={<Spinner />}>
            Generating
          </Button>
          <Button
            variant="secondary"
            disabled
            icon={<Spinner />}
            iconPosition="right"
          >
            Downloading
          </Button>
        </div>

        <div class="flex w-full justify-center p-10">
          <Accordion
            defaultValue={["shipping"]}
            class="max-w-lg"
            onValueChange={(value) => console.log(value)}
            multiple
          >
            <AccordionItem value="shipping">
              <AccordionTrigger>
                What are your shipping options?
              </AccordionTrigger>
              <AccordionContent>
                We offer standard (5-7 days), express (2-3 days), and overnight
                shipping. Free shipping on international orders.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns" disabled>
              <AccordionTrigger>What is your return policy?</AccordionTrigger>
              <AccordionContent>
                Returns accepted within 30 days. Items must be unused and in
                original packaging. Refunds processed within 5-7 business days.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support">
              <AccordionTrigger>
                How can I contact customer support?
              </AccordionTrigger>
              <AccordionContent>
                Reach us via email, live chat, or phone. We respond within 24
                hours during business days.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div class="preview relative flex h-72 w-96 justify-center p-10 ">
          <AspectRatio
            ratio={1 / 1}
            class="w-full max-w-48 rounded-lg bg-muted"
          >
            <Image
              src="https://avatar.vercel.sh/shadcn1"
              alt="Photo"
              fill
              class="w-full rounded-lg object-cover grayscale dark:brightness-20"
            />
          </AspectRatio>
        </div>

        <div class="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </div>

        <div class="flex h-5 items-center gap-4 text-sm">
          <div>Blog</div>
          <Separator orientation="vertical" />
          <div>Docs</div>
          <Separator orientation="vertical" />
          <div>Source</div>
        </div>

        <div class="flex w-full max-w-sm flex-col gap-2 text-sm">
          <dl class="flex items-center justify-between">
            <dt>Item 1</dt>
            <dd class="text-neutral-500 dark:text-neutral-400">Value 1</dd>
          </dl>
          <Separator />
          <dl class="flex items-center justify-between">
            <dt>Item 2</dt>
            <dd class="text-neutral-500 dark:text-neutral-400">Value 2</dd>
          </dl>
          <Separator />
          <dl class="flex items-center justify-between">
            <dt>Item 3</dt>
            <dd class="text-neutral-500 dark:text-neutral-400">Value 3</dd>
          </dl>
        </div>

        <ButtonGroup
          orientation="vertical"
          aria-label="Media controls"
          class="h-fit"
        >
          <Button variant="outline" icon={<Plus />} />

          <Button variant="outline" icon={<Minus />} />
        </ButtonGroup>

        <div class="flex flex-col items-start gap-8">
          <ButtonGroup>
            <Button variant="outline" size="sm">
              Small
            </Button>
            <Button variant="outline" size="sm">
              Button
            </Button>
            <Button variant="outline" size="sm">
              Group
            </Button>
            <Button variant="outline" size="sm" icon={<Plus />} />
          </ButtonGroup>
          <ButtonGroup>
            <Button variant="outline">Default</Button>
            <Button variant="outline">Button</Button>
            <Button variant="outline">Group</Button>
            <Button variant="outline" icon={<Plus />} />
          </ButtonGroup>
          <ButtonGroup>
            <Button variant="outline" size="lg">
              Large
            </Button>
            <Button variant="outline" size="lg">
              Button
            </Button>
            <Button variant="outline" size="lg">
              Group
            </Button>
            <Button variant="outline" size="lg" icon={<Plus />} />
          </ButtonGroup>
        </div>

        <ButtonGroup>
          <Button variant="secondary">Button</Button>
          <ButtonGroupSeparator />
          <Button icon={<Plus />} variant="secondary" />
        </ButtonGroup>

        <Card class="mx-auto w-full max-w-xs">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Card Action</CardAction>
          </CardHeader>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>

        <Card size="sm" class="mx-auto w-full max-w-xs">
          <CardHeader>
            <CardTitle>Scheduled reports</CardTitle>
            <CardDescription>
              Weekly snapshots. No more manual exports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul class="grid gap-2 py-2 text-sm">
              <li class="flex gap-2">
                <ChevronRight class="mt-0.5 size-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                <span>Choose a schedule (daily, or weekly).</span>
              </li>
              <li class="flex gap-2">
                <ChevronRight class="mt-0.5 size-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                <span>Send to channels or specific teammates.</span>
              </li>
              <li class="flex gap-2">
                <ChevronRight class="mt-0.5 size-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                <span>Include charts, tables, and key metrics.</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter class="flex-col gap-2">
            <Button size="sm" class="w-full">
              Set up scheduled reports
            </Button>
            <Button variant="outline" size="sm" class="w-full">
              See what&apos;s new
            </Button>
          </CardFooter>
        </Card>

        <Card class="relative mx-auto w-full max-w-sm pt-0">
          <div class="absolute inset-0 z-30 aspect-video bg-black/35" />
          <img
            src="https://avatar.vercel.sh/shadcn1"
            alt="Event cover"
            class="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
          />
          <CardHeader>
            <CardAction>
              <Badge variant="secondary">Featured</Badge>
            </CardAction>
            <CardTitle>Design systems meetup</CardTitle>
            <CardDescription>
              A practical talk on component APIs, accessibility, and shipping
              faster.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button class="w-full">View Event</Button>
          </CardFooter>
        </Card>

        <Carousel class="w-full max-w-48 sm:max-w-xs">
          <CarouselContent>
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem>
                <div class="p-1">
                  <Card>
                    <CardContent class="flex aspect-square items-center justify-center p-6">
                      <span class="text-4xl font-semibold">{index + 1}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <Carousel class="w-full max-w-48 sm:max-w-xs md:max-w-sm">
          <CarouselContent class="-ml-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem class="basis-1/2 pl-1 lg:basis-1/3">
                <div class="p-1">
                  <Card>
                    <CardContent class="flex aspect-square items-center justify-center p-6">
                      <span class="text-2xl font-semibold">{index + 1}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <Carousel orientation="vertical" class="w-full max-w-xs my-24">
          <CarouselContent class="-mt-1 h-67.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem class="basis-1/2 pt-1">
                <div class="p-1">
                  <Card>
                    <CardContent class="flex items-center justify-center p-6">
                      <span class="text-3xl font-semibold">{index + 1}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div class="p-24 flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline">Left</Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Tooltip content
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline">Top</Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Tooltip content
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline">Bottom</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Tooltip content
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline">Right</Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Tooltip content
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
        </div>

        <div>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" size="sm" icon={<Save />} />
            </TooltipTrigger>
            <TooltipContent>
              Save Changes <Kbd>S</Kbd>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" size="sm" disabled>
                Disabled
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <TooltipArrow />
              <p>This feature is currently unavailable</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <span class="inline-block w-fit">
                <Button variant="outline" size="sm" disabled>
                  Disabled
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <TooltipArrow />
              <p>This feature is currently unavailable</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>文字提示</CardTitle>
          </CardHeader>

          <CardContent>
            <div class="grid gap-2 [grid-template-areas:'._top-start_top-center_top-end_.''left-start_._._._right-start''left-center_._._._right-center''left-end_._._._right-end''._bottom-start_bottom-center_bottom-end_.']">
              <For each={tooltipSides}>
                {(side) => (
                  <For each={tooltipAligns}>
                    {(align) => (
                      <Tooltip closeDelay={10000000000}>
                        <TooltipTrigger>
                          <Button
                            variant="outline"
                            style={{ "grid-area": `${side}-${align}` }}
                            icon={arrows[`${side}-${align}`]}
                          />
                        </TooltipTrigger>

                        <TooltipContent side={side} align={align}>
                          {`This is a tooltip on the ${side} side aligned to ${align}`}
                          <TooltipArrow />
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </For>
                )}
              </For>
            </div>
          </CardContent>
        </Card>

        <div class="flex flex-col gap-3">
          <Input
            type="number"
            onInput={(v) => console.log(v + 1)}
            placeholder="Enter a number"
          />

          <Input onInput={(v) => console.log(v)} placeholder="Enter text" />

          <Input
            onInput={(v) => console.log(v)}
            placeholder="Disabled"
            disabled
          />
        </div>

        <FieldSet class="w-full max-w-xs">
          <FieldGroup>
            <Field>
              <FieldLabel for="username">Username</FieldLabel>
              <Input id="username" type="text" placeholder="Max Leiter" />
              <FieldDescription>
                Choose a unique username for your account.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel for="password">Password</FieldLabel>
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
              <Input id="password" type="password" placeholder="••••••••" />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet class="w-full max-w-xs">
          <FieldGroup>
            <Field>
              <FieldLabel for="feedback">Feedback</FieldLabel>
              <Textarea
                id="feedback"
                placeholder="Your feedback helps us improve..."
                rows={4}
              />
              <FieldDescription>
                Share your thoughts about our service.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet class="w-full max-w-sm">
          <FieldLegend>Address Information</FieldLegend>
          <FieldDescription>
            We need your address to deliver your order.
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel for="street">Street Address</FieldLabel>
              <Input id="street" type="text" placeholder="123 Main St" />
            </Field>
            <div class="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel for="city">City</FieldLabel>
                <Input id="city" type="text" placeholder="New York" />
              </Field>
              <Field>
                <FieldLabel for="zip">Postal Code</FieldLabel>
                <Input id="zip" type="text" placeholder="90502" />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <div class="grid w-full max-w-sm gap-6">
          <InputGroup>
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput type="email" placeholder="Enter your email" />
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="Card number" />
            <InputGroupAddon>
              <CreditCard />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Check />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="Card number" />
            <InputGroupAddon align="inline-end">
              <Star />
              <Info />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div class="grid w-full max-w-sm gap-6">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="0.00" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>USD</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="example.com" class="pl-0.5!" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="Enter your username" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>@company.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupTextarea placeholder="Enter your message" />
            <InputGroupAddon align="block-end">
              <InputGroupText class="text-xs text-muted-foreground">
                120 characters left
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <InputGroup class="max-w-sm">
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <div class="grid w-full max-w-sm gap-4">
          <InputGroup>
            <InputGroupInput placeholder="Searching..." />
            <InputGroupAddon align="inline-end">
              <Spinner />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="Processing..." />
            <InputGroupAddon>
              <Spinner />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="Saving changes..." />
            <InputGroupAddon align="inline-end">
              <InputGroupText>Saving...</InputGroupText>
              <Spinner />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="Refreshing data..." />
            <InputGroupAddon>
              <Loader class="animate-spin" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupText class="text-muted-foreground">
                Please wait...
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div class="grid w-full max-w-md gap-4">
          <InputGroup>
            <InputGroupTextarea
              id="textarea-code-32"
              placeholder="console.log('Hello, world!');"
              class="min-h-50"
            />
            <InputGroupAddon align="block-end" class="border-t">
              <InputGroupText>Line 1, Column 1</InputGroupText>
              <InputGroupButton size="sm" class="ml-auto" variant="primary">
                Run <CornerDownLeft />
              </InputGroupButton>
            </InputGroupAddon>
            <InputGroupAddon align="block-start" class="border-b">
              <InputGroupText class="font-mono font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="tabler-icon tabler-icon-brand-javascript "
                >
                  <title>JavaScript</title>
                  <path d="M20 4l-2 14.5l-6 2l-6 -2l-2 -14.5z"></path>
                  <path d="M7.5 8h3v8l-2 -1"></path>
                  <path d="M16.5 8h-2.5a.5 .5 0 0 0 -.5 .5v3a.5 .5 0 0 0 .5 .5h1.423a.5 .5 0 0 1 .495 .57l-.418 2.93l-2 .5"></path>
                </svg>
                script.js
              </InputGroupText>
              <InputGroupButton
                class="ml-auto"
                size="xs"
                icon={<RefreshCcw />}
              />
              <InputGroupButton variant="ghost" size="xs" icon={<Copy />} />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" page={1} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive page={2} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" page={3} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" page={4} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" page={5} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" page={1} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive page={2} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" page={3} />
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <ScrollArea class="h-72 w-48 rounded-md border">
          <div class="p-4">
            <h4 class="mb-4 text-sm leading-none font-medium">Tags</h4>
            {Array.from({ length: 50 }).map((_, idx) => (
              <>
                <div class="text-sm">{`v1.2.0-beta.${idx + 1}`}</div>
                <Separator class="my-2" />
              </>
            ))}
          </div>
        </ScrollArea>

        <ScrollArea
          orientation="horizontal"
          class="w-96 rounded-md border whitespace-nowrap"
        >
          <div class="flex w-max space-x-4 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card>
                <CardContent class="flex w-32 items-center justify-center p-6">
                  <span class="text-2xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          {/*<ScrollBar orientation="horizontal" />*/}
        </ScrollArea>

        <div class="flex items-center space-x-2">
          <Switch id="airplane-mode" onChange={(v) => console.log(v)} />
          <Label for="airplane-mode">Airplane Mode</Label>
        </div>

        <Field orientation="horizontal" class="max-w-sm">
          <FieldContent>
            <FieldLabel for="switch-focus-mode">
              Share across devices
            </FieldLabel>
            <FieldDescription>
              Focus is shared across devices, and turns off when you leave the
              app.
            </FieldDescription>
          </FieldContent>
          <Switch id="switch-focus-mode" />
        </Field>

        <FieldGroup class="w-full max-w-sm">
          <FieldLabel for="switch-share">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Share across devices</FieldTitle>
                <FieldDescription>
                  Focus is shared across devices, and turns off when you leave
                  the app.
                </FieldDescription>
              </FieldContent>
              <Switch id="switch-share" />
            </Field>
          </FieldLabel>
          <FieldLabel for="switch-notifications">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Enable notifications</FieldTitle>
                <FieldDescription>
                  Receive notifications when focus mode is enabled or disabled.
                </FieldDescription>
              </FieldContent>
              <Switch id="switch-notifications" defaultChecked />
            </Field>
          </FieldLabel>
        </FieldGroup>

        <Field orientation="horizontal" data-disabled class="w-fit">
          <Switch id="switch-disabled-unchecked" disabled />
          <FieldLabel for="switch-disabled-unchecked">Disabled</FieldLabel>
        </Field>

        <Field orientation="horizontal" class="max-w-sm" data-invalid>
          <FieldContent>
            <FieldLabel for="switch-terms">
              Accept terms and conditions
            </FieldLabel>
            <FieldDescription>
              You must accept the terms and conditions to continue.
            </FieldDescription>
          </FieldContent>
          <Switch id="switch-terms" aria-invalid />
        </Field>

        <FieldGroup class="w-full max-w-40">
          <Field orientation="horizontal">
            <Switch id="switch-size-sm" size="sm" />
            <FieldLabel for="switch-size-sm">Small</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Switch id="switch-size-default" size="md" />
            <FieldLabel for="switch-size-default">Default</FieldLabel>
          </Field>
        </FieldGroup>

        <Toaster />

        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toast("Event has been created", {
                duration: 100000000,
                cancel: "取消",
              })
            }
          >
            Default
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Event has been created", { position: "top-right" })
            }
          >
            Success
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Be at the area 10 minutes before the event time")
            }
          >
            Info
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.warning("Event start time cannot be earlier than 8am")
            }
          >
            Warning
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error("Event has not been created")}
          >
            Error
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              toast.promise<{ name: string }>(
                () =>
                  new Promise((resolve) =>
                    setTimeout(() => resolve({ name: "Event" }), 2000),
                  ),
                {
                  loading: "Loading...",
                  success: (data) => `${data.name} has been created`,
                  error: "Error",
                },
              );
            }}
          >
            Promise
          </Button>
        </div>

        <div class="flex flex-row flex-wrap items-center gap-6 md:gap-12">
          <Avatar>
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt="@shadcn"
              class="grayscale"
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              src="https://github.com/shadcn.png1"
              alt="@shadcn"
              class="grayscale"
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              src="https://github.com/evilrabbit.png"
              alt="@evilrabbit"
            />
            <AvatarFallback>ER</AvatarFallback>
            <AvatarBadge class="bg-green-600 dark:bg-green-800" />
          </Avatar>
          <AvatarGroup class="grayscale">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/maxleiter.png"
                alt="@maxleiter"
              />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/evilrabbit.png"
                alt="@evilrabbit"
              />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>

          <AvatarGroup class="grayscale">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/maxleiter.png"
                alt="@maxleiter"
              />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/evilrabbit.png"
                alt="@evilrabbit"
              />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>
              <Plus />
            </AvatarGroupCount>
          </AvatarGroup>

          <Avatar class="grayscale">
            <AvatarImage
              src="https://github.com/pranathip.png"
              alt="@pranathip"
            />
            <AvatarFallback>PP</AvatarFallback>
            <AvatarBadge>
              <Plus />
            </AvatarBadge>
          </Avatar>

          <Avatar size="sm">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>

        <div class="flex w-full max-w-md flex-col gap-6">
          <Item>
            <ItemMedia variant="icon">
              <Inbox />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Default Variant</ItemTitle>
              <ItemDescription>
                Transparent background with no border.
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <Inbox />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Outline Variant</ItemTitle>
              <ItemDescription>
                Outlined style with a visible border.
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted">
            <ItemMedia variant="icon">
              <Inbox />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Muted Variant</ItemTitle>
              <ItemDescription>
                Muted background for secondary content.
              </ItemDescription>
            </ItemContent>
          </Item>
        </div>

        <div class="flex w-full max-w-md flex-col gap-6">
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Basic Item</ItemTitle>
              <ItemDescription>
                A simple item with title and description.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline" size="sm">
                Action
              </Button>
            </ItemActions>
          </Item>

          <Item as="a" href="#" variant="outline" size="sm">
            <ItemMedia>
              <BadgeCheck class="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Your profile has been verified.</ItemTitle>
            </ItemContent>
            <ItemActions>
              <ChevronRight class="size-4" />
            </ItemActions>
          </Item>

          <Item variant="outline">
            <ItemMedia variant="icon">
              <ShieldAlert />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Security Alert</ItemTitle>
              <ItemDescription>
                New login detected from unknown device.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </ItemActions>
          </Item>
        </div>

        <div class="flex w-full max-w-lg flex-col gap-6">
          <Item variant="outline">
            <ItemMedia>
              <Avatar class="size-10">
                <AvatarImage src="https://github.com/evilrabbit.png" />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Evil Rabbit</ItemTitle>
              <ItemDescription>Last seen 5 months ago</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button
                size="sm"
                variant="outline"
                class="rounded-full"
                aria-label="Invite"
                icon={<Plus />}
              />
            </ItemActions>
          </Item>
          <Item variant="outline">
            <ItemMedia>
              <div class="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-white dark:*:data-[slot=avatar]:ring-neutral-950 *:data-[slot=avatar]:grayscale">
                <Avatar class="hidden sm:flex">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar class="hidden sm:flex">
                  <AvatarImage
                    src="https://github.com/maxleiter.png"
                    alt="@maxleiter"
                  />
                  <AvatarFallback>LR</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage
                    src="https://github.com/evilrabbit.png"
                    alt="@evilrabbit"
                  />
                  <AvatarFallback>ER</AvatarFallback>
                </Avatar>
              </div>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>No Team Members</ItemTitle>
              <ItemDescription>
                Invite your team to collaborate on this project.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline">
                Invite
              </Button>
            </ItemActions>
          </Item>
        </div>

        <div class="flex items-center gap-4">
          <Skeleton class="h-12 w-12 rounded-full" />
          <div class="space-y-2">
            <Skeleton class="h-4 w-62.5" />
            <Skeleton class="h-4 w-50" />
          </div>
        </div>

        <div class="flex w-fit items-center gap-4">
          <Skeleton class="size-10 shrink-0 rounded-full" />
          <div class="grid gap-2">
            <Skeleton class="h-4 w-37.5" />
            <Skeleton class="h-4 w-25" />
          </div>
        </div>

        <Card class="w-full max-w-xs">
          <CardHeader>
            <Skeleton class="h-4 w-2/3" />
            <Skeleton class="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton class="aspect-video w-full" />
          </CardContent>
        </Card>

        <div class="flex w-full max-w-xs flex-col gap-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
        </div>

        <div class="flex w-full max-w-xs flex-col gap-7">
          <div class="flex flex-col gap-3">
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-8 w-full" />
          </div>
          <div class="flex flex-col gap-3">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-8 w-full" />
          </div>
          <Skeleton class="h-8 w-24" />
        </div>

        <div class="flex w-full max-w-sm flex-col gap-2">
          {Array.from({ length: 5 }).map(() => (
            <div class="flex gap-4">
              <Skeleton class="h-4 flex-1" />
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default App;
