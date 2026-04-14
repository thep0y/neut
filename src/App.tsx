import { createEffect, createSignal, type Component } from "solid-js";
import { Button } from "./components/button/Button";
import { ArrowUp, GitBranch, GitFork, Sun } from "lucide-solid";

const App: Component = () => {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  createEffect(() => {
    document.documentElement.setAttribute("data-theme", theme());
  });

  return (
    <div class="w-screen h-screen flex flex-col items-center justify-center gap-3 bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-300">
      <Button
        icon={<Sun />}
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
    </div>
  );
};

export default App;
