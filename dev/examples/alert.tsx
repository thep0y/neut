import { CircleAlert, Terminal } from "lucide-solid";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
} from "~/index";
import type { Section } from "./shared";

function AlertBasic() {
  return (
    <Alert class="max-w-md">
      <Terminal />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  );
}

function AlertDestructive() {
  return (
    <Alert variant="destructive" class="max-w-md">
      <CircleAlert />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        Your session has expired. Please sign in again.
      </AlertDescription>
    </Alert>
  );
}

function AlertWithAction() {
  return (
    <Alert class="max-w-md">
      <Terminal />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>A new version is ready to install.</AlertDescription>
      <AlertAction>
        <Button size="xs">Update</Button>
      </AlertAction>
    </Alert>
  );
}

export const alertSections: Section[] = [
  {
    id: "alert-basic",
    title: "Basic",
    description: "Displays a callout for user attention.",
    component: AlertBasic,
  },
  {
    id: "alert-destructive",
    title: "Destructive",
    description: "Use the destructive variant for errors.",
    component: AlertDestructive,
  },
  {
    id: "alert-action",
    title: "With Action",
    description: "Place a button on the right side of the alert.",
    component: AlertWithAction,
  },
];
