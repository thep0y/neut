import {
  ArrowUp,
  ChevronRight,
  GitBranch,
  GitFork,
  Minus,
  Moon,
  Plus,
  Save,
  Sun,
} from "lucide-solid";
import { type Component, createEffect, createSignal } from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/accordion";
import { AspectRatio } from "./components/aspect-ratio";
import { Badge } from "./components/badge/Badge";
import { Button } from "./components/button/Button";
import { ButtonGroup, ButtonGroupSeparator } from "./components/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./components/carousel";
import { Image } from "./components/image";
import { Separator } from "./components/separator/Separator";
import { Spinner } from "./components/spinner";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "./components/tooltip";
import { Kbd } from "./components/kbd";
import { Input } from "./components/input";

const App: Component = () => {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  createEffect(() => {
    document.documentElement.setAttribute("data-theme", theme());
  });

  return (
    <div class="py-4 flex flex-col items-center justify-center gap-3 bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-300 overflow-y-auto">
      <Button
        class="fixed right-4 top-4"
        icon={theme() === "light" ? <Moon /> : <Sun />}
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
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
            <AccordionTrigger>What are your shipping options?</AccordionTrigger>
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
        <AspectRatio ratio={1 / 1} class="w-full max-w-48 rounded-lg bg-muted">
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
    </div>
  );
};

export default App;
