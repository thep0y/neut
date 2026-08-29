import { createSignal } from "solid-js";
import {
  ArrowUpRight,
  Bell,
  Cloud,
  Folder,
  RefreshCcw,
  Search,
} from "lucide-solid";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
} from "~/index";
import { LanguageSwitch, type Language, type Section } from "./shared";

function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Folder />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven't created any projects yet. Get started by creating your
          first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent class="flex-row justify-center gap-2">
        <Button>Create Project</Button>
        <Button variant="outline">Import Project</Button>
      </EmptyContent>
      <Button
        variant="link"
        component="a"
        href="#"
        size="sm"
        class="text-muted-foreground"
      >
        Learn More <ArrowUpRight data-icon="inline-end" />
      </Button>
    </Empty>
  );
}

function EmptyOutline() {
  return (
    <Empty class="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Cloud />
        </EmptyMedia>
        <EmptyTitle>Cloud Storage Empty</EmptyTitle>
        <EmptyDescription>
          Upload files to your cloud storage to access them anywhere.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Upload Files
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function EmptyMuted() {
  return (
    <Empty class="h-full bg-muted/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Bell />
        </EmptyMedia>
        <EmptyTitle>No Notifications</EmptyTitle>
        <EmptyDescription class="max-w-xs text-pretty">
          You're all caught up. New notifications will appear here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">
          <RefreshCcw data-icon="inline-start" />
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function EmptyAvatar() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <Avatar class="size-12">
            <AvatarImage
              src="https://github.com/shadcn.png"
              class="grayscale"
            />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
        </EmptyMedia>
        <EmptyTitle>User Offline</EmptyTitle>
        <EmptyDescription>
          This user is currently offline. You can leave a message to notify them
          or try again later.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Leave Message</Button>
      </EmptyContent>
    </Empty>
  );
}

function EmptyInputGroup() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>404 - Not Found</EmptyTitle>
        <EmptyDescription>
          The page you're looking for doesn't exist. Try searching for what you
          need below.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <InputGroup class="sm:w-3/4">
          <InputGroupInput placeholder="Try searching for pages..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Kbd>/</Kbd>
          </InputGroupAddon>
        </InputGroup>
        <EmptyDescription>
          Need help? <a href="#">Contact support</a>
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  );
}

const emptyTranslations: Record<
  Language,
  { dir: "ltr" | "rtl"; values: Record<string, string> }
> = {
  en: {
    dir: "ltr",
    values: {
      title: "No Projects Yet",
      description:
        "You haven't created any projects yet. Get started by creating your first project.",
      createProject: "Create Project",
      importProject: "Import Project",
      learnMore: "Learn More",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      title: "لا توجد مشاريع بعد",
      description: "لم تقم بإنشاء أي مشاريع بعد. ابدأ بإنشاء مشروعك الأول.",
      createProject: "إنشاء مشروع",
      importProject: "استيراد مشروع",
      learnMore: "تعرف على المزيد",
    },
  },
  he: {
    dir: "rtl",
    values: {
      title: "אין פרויקטים עדיין",
      description:
        "עדיין לא יצרת פרויקטים. התחל על ידי יצירת הפרויקט הראשון שלך.",
      createProject: "צור פרויקט",
      importProject: "ייבא פרויקט",
      learnMore: "למד עוד",
    },
  },
};

function EmptyRtl() {
  const [language, setLanguage] = createSignal<Language>("ar");
  const t = () => emptyTranslations[language()];

  return (
    <div class="mx-auto flex w-full max-w-sm flex-col gap-4">
      <LanguageSwitch language={language} onChange={setLanguage} />
      <Empty dir={t().dir}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Folder />
          </EmptyMedia>
          <EmptyTitle>{t().values.title}</EmptyTitle>
          <EmptyDescription>{t().values.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent class="flex-row justify-center gap-2">
          <Button>{t().values.createProject}</Button>
          <Button variant="outline">{t().values.importProject}</Button>
        </EmptyContent>
        <Button
          variant="link"
          component="a"
          href="#"
          class="text-muted-foreground"
          size="sm"
        >
          {t().values.learnMore} <ArrowUpRight data-icon="inline-end" />
        </Button>
      </Empty>
    </div>
  );
}

export const emptySections: Section[] = [
  {
    id: "empty-usage",
    title: "Usage",
    description: "A basic empty state with header, content, and actions.",
    component: EmptyDemo,
  },
  {
    id: "empty-outline",
    title: "Outline",
    description: "Use border utilities to create an outlined empty state.",
    component: EmptyOutline,
  },
  {
    id: "empty-background",
    title: "Background",
    description: "Use background utilities to create a muted empty state.",
    component: EmptyMuted,
  },
  {
    id: "empty-avatar",
    title: "Avatar",
    description: "Use EmptyMedia to display an avatar in the empty state.",
    component: EmptyAvatar,
  },
  {
    id: "empty-input-group",
    title: "InputGroup",
    description: "Add an InputGroup to the EmptyContent component.",
    component: EmptyInputGroup,
  },
  {
    id: "empty-rtl",
    title: "RTL",
    description: "Empty state with RTL support for Arabic and Hebrew.",
    component: EmptyRtl,
  },
];
