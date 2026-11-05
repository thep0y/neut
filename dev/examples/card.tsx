import { MoreHorizontal } from "lucide-solid";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/index";
import type { Section } from "./shared";

function CardBasic() {
  return (
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          Your project will be created with a default configuration.
        </p>
      </CardContent>
      <CardFooter class="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Create</Button>
      </CardFooter>
    </Card>
  );
}

function CardWithAction() {
  return (
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>Invite people to your workspace.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" aria-label="More options">
            <MoreHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          You have 3 members and 2 pending invitations.
        </p>
      </CardContent>
    </Card>
  );
}

function CardSmall() {
  return (
    <Card size="sm" class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Compact card</CardTitle>
        <CardDescription>Smaller padding for dense layouts.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export const cardSections: Section[] = [
  {
    id: "card-basic",
    title: "Basic",
    description: "A card with header, content and footer.",
    component: CardBasic,
  },
  {
    id: "card-action",
    title: "With Action",
    description: "Place an action in the card header.",
    component: CardWithAction,
  },
  {
    id: "card-small",
    title: "Small",
    description: "Use size sm for tighter spacing.",
    component: CardSmall,
  },
];
