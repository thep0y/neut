import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/index";
import type { Section } from "./shared";

function TabsBasic() {
  return (
    <Tabs defaultValue="account" class="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" class="pt-3 text-sm">
        Update your account details here.
      </TabsContent>
      <TabsContent value="password" class="pt-3 text-sm">
        Change your password here.
      </TabsContent>
    </Tabs>
  );
}

function TabsLine() {
  return (
    <Tabs defaultValue="overview" class="w-full max-w-sm">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" class="pt-3 text-sm">
        Overview content.
      </TabsContent>
      <TabsContent value="analytics" class="pt-3 text-sm">
        Analytics content.
      </TabsContent>
      <TabsContent value="settings" class="pt-3 text-sm">
        Settings content.
      </TabsContent>
    </Tabs>
  );
}

export const tabsSections: Section[] = [
  {
    id: "tabs-basic",
    title: "Basic",
    description: "Switch between related panels.",
    component: TabsBasic,
  },
  {
    id: "tabs-line",
    title: "Line",
    description: "Use the line variant for understated tabs.",
    component: TabsLine,
  },
];
