import { createEffect, createSignal, type Component } from "solid-js";
import { Button } from "./components/button/Button";
import { ArrowUp, GitBranch, GitFork, Moon, Sun } from "lucide-solid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/accordion";
import { Spinner } from "./components/spinner";
import { AspectRatio } from "./components/aspect-ratio";
import { Image } from "./components/image";
import { Badge } from "./components/badge/Badge";

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
    </div>
  );
};

export default App;
