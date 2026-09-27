import { For, Show, createMemo, createSignal } from "solid-js";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
  clsx,
} from "~/index";
import type {
  QuestionnaireItemStatus,
  QuestionnaireShortcutMode,
} from "~/index";
import type { Section } from "./shared";

function Result(props: { text: string | undefined }) {
  return (
    <Show when={props.text}>
      <p class="mt-3 text-xs text-muted-foreground" role="status">
        {props.text}
      </p>
    </Show>
  );
}

function readAnswers(event: SubmitEvent, onValues: (data: FormData) => void) {
  event.preventDefault();
  onValues(new FormData(event.currentTarget as HTMLFormElement));
}

/* ----------------------------------- Demo ---------------------------------- */

const demoItems = [
  {
    choices: [
      {
        description: "Show what the agent ran and what came back.",
        label: "Tool call timeline",
        value: "tool-calls",
      },
      {
        description: "Ask before sensitive or destructive actions.",
        label: "Approval checkpoints",
        value: "approvals",
      },
      {
        description: "Make delegated work and results easier to follow.",
        label: "Sub-agent handoffs",
        value: "handoffs",
      },
    ],
    description: "Choose a direction or describe another task.",
    input: {
      label: "Another agent feature",
      placeholder: "Describe another feature…",
    },
    name: "direction",
    required: true,
    title: "What should the agent build next?",
  },
  {
    choices: [
      { label: "Progress", value: "progress" },
      { label: "Decisions", value: "decisions" },
      { label: "Risks", value: "risks" },
      { label: "Next step", value: "next-step" },
    ],
    description: "Select all that apply, or skip this question.",
    multiple: true,
    name: "signals",
    required: false,
    title: "What should every progress update include?",
  },
  {
    choices: [
      { label: "Start now", value: "now" },
      { label: "Next development cycle", value: "next-cycle" },
      { label: "Add it to the backlog", value: "backlog" },
    ],
    description: "Choose when the agent should begin the work.",
    name: "timing",
    required: true,
    title: "When should work begin?",
  },
] as const;

function QuestionnaireDemo() {
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Questionnaire
        defaultItem="direction"
        items={demoItems}
        shortcuts="letters"
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Direction: ${data.get("direction") ?? "None"} · Progress signals: ${
                data.getAll("signals").join(", ") || "None"
              } · Timing: ${data.get("timing") ?? "None"}`,
            ),
          )
        }
      >
        <QuestionnaireProgress />
        <For each={demoItems}>
          {(question) => (
            <QuestionnaireItem
              name={question.name}
              required={question.required}
              multiple={"multiple" in question && question.multiple}
            >
              <QuestionnaireTitle>{question.title}</QuestionnaireTitle>
              <QuestionnaireDescription>
                {question.description}
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <For each={question.choices}>
                  {(choice) => (
                    <QuestionnaireChoice value={choice.value}>
                      <span class="font-medium">{choice.label}</span>
                      {"description" in choice ? (
                        <span class="text-muted-foreground">
                          {choice.description}
                        </span>
                      ) : null}
                    </QuestionnaireChoice>
                  )}
                </For>
                {"input" in question ? (
                  <QuestionnaireInput
                    aria-label={question.input.label}
                    placeholder={question.input.placeholder}
                  />
                ) : null}
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>
          )}
        </For>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Save plan</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ------------------------------ Multiple Selection -------------------------- */

const multipleItems = [
  {
    choices: [
      { value: "source" },
      { value: "tests" },
      { value: "docs" },
      { value: "history" },
    ],
    name: "context",
    required: true,
  },
] as const;

function QuestionnaireMultiple() {
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Questionnaire
        items={multipleItems}
        shortcuts="letters"
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(`Context: ${data.getAll("context").join(", ") || "None"}`),
          )
        }
      >
        <QuestionnaireItem name="context" multiple required>
          <QuestionnaireTitle>
            What context should the agent inspect?
          </QuestionnaireTitle>
          <QuestionnaireDescription>
            Select every source that may affect the implementation.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="source">
              Relevant source files
            </QuestionnaireChoice>
            <QuestionnaireChoice value="tests">Existing tests</QuestionnaireChoice>
            <QuestionnaireChoice value="docs">
              Architecture documentation
            </QuestionnaireChoice>
            <QuestionnaireChoice value="history">
              Recent commit history
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireSubmit>Share context</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* -------------------------------- Freeform --------------------------------- */

const freeformItems = [
  {
    choices: [
      { value: "incremental" },
      { value: "module" },
      { value: "rewrite" },
    ],
    name: "approach",
    required: true,
  },
] as const;

function QuestionnaireFreeform() {
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Questionnaire
        items={freeformItems}
        shortcuts="letters"
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(`Approach: ${data.get("approach") ?? "None"}`),
          )
        }
      >
        <QuestionnaireItem name="approach" required>
          <QuestionnaireTitle>
            How should the agent approach this refactor?
          </QuestionnaireTitle>
          <QuestionnaireDescription>
            Choose a strategy or write a more specific instruction.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="incremental">
              Make the smallest safe change
            </QuestionnaireChoice>
            <QuestionnaireChoice value="module">
              Refactor one module at a time
            </QuestionnaireChoice>
            <QuestionnaireChoice value="rewrite">
              Replace the implementation completely
            </QuestionnaireChoice>
            <QuestionnaireInput
              aria-label="Another refactoring approach"
              placeholder="Describe another approach…"
            />
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireSubmit>Use this approach</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ---------------------------------- Skip ----------------------------------- */

const skipItems = [
  { name: "task", required: true },
  { name: "constraints" },
  { name: "review", required: true },
] as const;

function QuestionnaireSkipExample() {
  const [result, setResult] = createSignal<string>();
  const [constraintStatus, setConstraintStatus] =
    createSignal<QuestionnaireItemStatus>("unanswered");

  return (
    <div class="w-full max-w-md">
      <Questionnaire
        defaultItem="task"
        items={skipItems}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Task: ${data.get("task") ?? "None"} · Constraints: ${
                constraintStatus() === "skipped"
                  ? "Skipped"
                  : (data.get("constraints") ?? "None")
              } · Review: ${data.get("review") ?? "None"}`,
            ),
          )
        }
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="task" required>
          <QuestionnaireTitle>What kind of change is this?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Choose the category that best describes the work.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="feature">New feature</QuestionnaireChoice>
            <QuestionnaireChoice value="fix">Bug fix</QuestionnaireChoice>
            <QuestionnaireChoice value="refactor">Refactor</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem
          name="constraints"
          onStatusChange={setConstraintStatus}
        >
          <QuestionnaireTitle>
            Are there any implementation constraints?
          </QuestionnaireTitle>
          <QuestionnaireDescription>
            Answer if needed, or intentionally skip this question.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="no-dependencies">
              Do not add dependencies
            </QuestionnaireChoice>
            <QuestionnaireChoice value="no-migrations">
              Do not change the database
            </QuestionnaireChoice>
            <QuestionnaireChoice value="preserve-api">
              Preserve the public API
            </QuestionnaireChoice>
            <QuestionnaireInput
              aria-label="Another implementation constraint"
              placeholder="Describe another constraint…"
            />
          </QuestionnaireChoices>
        </QuestionnaireItem>

        <QuestionnaireItem name="review" required>
          <QuestionnaireTitle>How should the work be reviewed?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Choose the checks the agent should complete before handoff.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="tests">Run the test suite</QuestionnaireChoice>
            <QuestionnaireChoice value="diff">Review the final diff</QuestionnaireChoice>
            <QuestionnaireChoice value="both">
              Tests and diff review
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Submit brief</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* -------------------------------- Shortcuts -------------------------------- */

const shortcutItems = [
  {
    choices: [{ value: "inspect" }, { value: "tests" }, { value: "patch" }],
    name: "action",
    required: true,
  },
] as const;

function QuestionnaireShortcuts() {
  const [shortcuts, setShortcuts] = createSignal<
    QuestionnaireShortcutMode | undefined
  >("letters");
  const [result, setResult] = createSignal<string>();

  return (
    <div class="relative mx-auto flex w-full max-w-md flex-col">
      <label class="absolute end-0 top-0 flex items-center gap-2 text-xs text-muted-foreground">
        <span class="sr-only">Shortcut style</span>
        <select
          aria-label="Shortcut style"
          class="h-8 rounded-md border bg-transparent px-2 text-xs"
          value={shortcuts() ?? "none"}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setShortcuts(
              value === "letters" || value === "numbers" ? value : undefined,
            );
          }}
        >
          <option value="none">No shortcuts</option>
          <option value="letters">Letters</option>
          <option value="numbers">Numbers</option>
        </select>
      </label>

      <Questionnaire
        class="mt-12"
        items={shortcutItems}
        shortcuts={shortcuts()}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Action: ${data.get("action") ?? "None"} · Shortcuts: ${shortcuts() ?? "none"}`,
            ),
          )
        }
      >
        <QuestionnaireItem name="action" required>
          <QuestionnaireTitle>What should the agent do next?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Use the displayed shortcut or navigate with the keyboard.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="inspect">
              Inspect the implementation
            </QuestionnaireChoice>
            <QuestionnaireChoice value="tests">
              Run the relevant tests
            </QuestionnaireChoice>
            <QuestionnaireChoice value="patch">Prepare the patch</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnaireSubmit>Confirm action</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ----------------------------- Custom Validation --------------------------- */

const validationItems = [
  { name: "detail", required: true },
  { name: "audience", required: true },
] as const;

type ValidationErrors = Partial<Record<"detail" | "audience", string>>;

function QuestionnaireValidation() {
  const [item, setItem] = createSignal("detail");
  const [errors, setErrors] = createSignal<ValidationErrors>({});
  const [result, setResult] = createSignal<string>();

  const clearError = (name: "detail" | "audience") =>
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

  return (
    <div class="w-full max-w-md">
      <Questionnaire
        item={item()}
        items={validationItems}
        onItemChange={setItem}
        onSubmit={(event) =>
          readAnswers(event, (data) => {
            const detail = data.get("detail");
            const audience = data.get("audience");
            const nextErrors: ValidationErrors = {};
            if (detail !== "summary" && detail !== "complete") {
              nextErrors.detail = "Choose an answer to continue.";
            }
            if (audience !== "team" && audience !== "public") {
              nextErrors.audience = "Choose an answer to continue.";
            }
            if (audience === "public" && detail === "summary") {
              nextErrors.detail =
                "Public answers need enough context. Choose a complete answer.";
            }
            if (Object.keys(nextErrors).length > 0) {
              setErrors(nextErrors);
              setItem(nextErrors.detail ? "detail" : "audience");
              return;
            }
            setErrors({});
            setResult(`Detail: ${detail} · Audience: ${audience}`);
          })
        }
      >
        <Card class="w-full gap-0">
          <QuestionnaireItem
            name="detail"
            required
            invalid={Boolean(errors().detail)}
          >
            <CardHeader class="border-b">
              <QuestionnaireTitle>How much detail should the answer include?</QuestionnaireTitle>
              <QuestionnaireDescription>
                Choose the response depth.
              </QuestionnaireDescription>
              <CardAction>
                <QuestionnaireProgress class="min-w-0">
                  {(state) => (
                    <div>
                      {state.current} / {state.total}
                    </div>
                  )}
                </QuestionnaireProgress>
              </CardAction>
            </CardHeader>
            <CardContent>
              <QuestionnaireChoices>
                <QuestionnaireChoice
                  value="summary"
                  onChange={() => clearError("detail")}
                >
                  Concise summary
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="complete"
                  onChange={() => clearError("detail")}
                >
                  Complete answer
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError>{errors().detail}</QuestionnaireError>
            </CardContent>
          </QuestionnaireItem>

          <QuestionnaireItem
            name="audience"
            required
            invalid={Boolean(errors().audience)}
          >
            <CardHeader class="border-b">
              <QuestionnaireTitle>Who will read the answer?</QuestionnaireTitle>
              <QuestionnaireDescription>
                Public answers require complete context.
              </QuestionnaireDescription>
              <CardAction>
                <QuestionnaireProgress class="min-w-0">
                  {(state) => (
                    <div>
                      {state.current} / {state.total}
                    </div>
                  )}
                </QuestionnaireProgress>
              </CardAction>
            </CardHeader>
            <CardContent>
              <QuestionnaireChoices>
                <QuestionnaireChoice
                  value="team"
                  onChange={() => clearError("audience")}
                >
                  My team
                </QuestionnaireChoice>
                <QuestionnaireChoice
                  value="public"
                  onChange={() => clearError("audience")}
                >
                  Public audience
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError>{errors().audience}</QuestionnaireError>
            </CardContent>
          </QuestionnaireItem>

          <CardFooter>
            <QuestionnaireActions>
              <QuestionnairePrevious />
              <QuestionnaireNext>Next</QuestionnaireNext>
              <QuestionnaireSubmit>Validate answers</QuestionnaireSubmit>
            </QuestionnaireActions>
          </CardFooter>
        </Card>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* -------------------------------- Controlled ------------------------------- */

const controlledItems = [
  { name: "scope", required: true },
  { name: "checks", required: true },
  { name: "output", required: true },
] as const;

const itemLabels: Record<string, string> = {
  scope: "Change scope",
  checks: "Verification",
  output: "Final output",
};

function QuestionnaireControlled() {
  const [item, setItem] = createSignal("scope");
  const [result, setResult] = createSignal<string>();
  return (
    <div class="relative mx-auto flex w-full max-w-md flex-col">
      <p class="absolute end-0 top-0 text-sm text-muted-foreground" role="status">
        Current checkpoint: {itemLabels[item()]}
      </p>
      <Questionnaire
        class="mt-8"
        item={item()}
        items={controlledItems}
        onItemChange={setItem}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Scope: ${data.get("scope") ?? "None"} · Verification: ${
                data.get("checks") ?? "None"
              } · Output: ${data.get("output") ?? "None"}`,
            ),
          )
        }
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="scope" required>
          <QuestionnaireTitle>What may the agent change?</QuestionnaireTitle>
          <QuestionnaireDescription>
            The host stores the active checkpoint while Questionnaire navigates.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="component">
              Only the target component
            </QuestionnaireChoice>
            <QuestionnaireChoice value="tests">
              Component and related tests
            </QuestionnaireChoice>
            <QuestionnaireChoice value="feature">
              The complete feature area
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="checks" required>
          <QuestionnaireTitle>
            Which verification level should it use?
          </QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="targeted">Targeted tests</QuestionnaireChoice>
            <QuestionnaireChoice value="package">
              Package tests and typecheck
            </QuestionnaireChoice>
            <QuestionnaireChoice value="full">
              Full workspace verification
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="output" required>
          <QuestionnaireTitle>
            What should the agent return when finished?
          </QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="summary">Concise summary</QuestionnaireChoice>
            <QuestionnaireChoice value="diff">
              Summary with changed files
            </QuestionnaireChoice>
            <QuestionnaireChoice value="handoff">
              Detailed implementation handoff
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Save workflow</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ---------------------------------- Resume --------------------------------- */

const resumeItems = [
  { name: "change", required: true },
  { name: "verification", required: true },
  { name: "notes" },
] as const;

function QuestionnaireResume() {
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Questionnaire
        defaultItem="verification"
        items={resumeItems}
        onReset={() => setResult("Saved answers restored")}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Migration: ${data.get("change") ?? "None"} · Verification: ${
                data.getAll("verification").join(", ") || "None"
              } · Notes: ${data.get("notes") || "None"}`,
            ),
          )
        }
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="change" required>
          <QuestionnaireTitle>What kind of migration is this?</QuestionnaireTitle>
          <QuestionnaireDescription>
            This answer was saved during the previous session.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="incremental" defaultChecked>
              Incremental migration
            </QuestionnaireChoice>
            <QuestionnaireChoice value="cutover">Single cutover</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name="verification" multiple required>
          <QuestionnaireTitle>How should the migration be verified?</QuestionnaireTitle>
          <QuestionnaireDescription>
            These checks were selected during the previous session.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="tests" defaultChecked>
              Run migration tests
            </QuestionnaireChoice>
            <QuestionnaireChoice value="typecheck" defaultChecked>
              Run the typecheck
            </QuestionnaireChoice>
            <QuestionnaireChoice value="manual">
              Perform a manual smoke test
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name="notes">
          <QuestionnaireTitle>
            Anything else the agent should remember?
          </QuestionnaireTitle>
          <QuestionnaireDescription>
            This note was saved with the draft.
          </QuestionnaireDescription>
          <QuestionnaireInput
            aria-label="Saved migration note"
            defaultValue="Keep the existing public API stable."
          />
        </QuestionnaireItem>

        <QuestionnaireActions>
          <Button type="reset" variant="outline">
            Reset changes
          </Button>
          <QuestionnairePrevious />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Update draft</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ------------------------------- Conditional ------------------------------- */

function QuestionnaireConditional() {
  const [runtime, setRuntime] = createSignal("local");
  const [result, setResult] = createSignal<string>();
  const items = createMemo(() => [
    { name: "runtime", required: true },
    { disabled: runtime() !== "cloud", name: "environment", required: true },
    { name: "approval", required: true },
  ]);

  return (
    <div class="w-full max-w-md">
      <Questionnaire
        defaultItem="runtime"
        items={items()}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Runtime: ${data.get("runtime") ?? "None"} · Environment: ${
                data.get("environment") ?? "Not applicable"
              } · Approval: ${data.get("approval") ?? "None"}`,
            ),
          )
        }
      >
        <QuestionnaireProgress />
        <QuestionnaireItem name="runtime" required>
          <QuestionnaireTitle>Where should the agent run?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Cloud runs add an environment question to this flow.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice
              value="local"
              checked={runtime() === "local"}
              onChange={() => setRuntime("local")}
            >
              Local workspace
            </QuestionnaireChoice>
            <QuestionnaireChoice
              value="cloud"
              checked={runtime() === "cloud"}
              onChange={() => setRuntime("cloud")}
            >
              Cloud workspace
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem
          name="environment"
          required
          disabled={runtime() !== "cloud"}
        >
          <QuestionnaireTitle>Which cloud environment should it use?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="preview">Preview</QuestionnaireChoice>
            <QuestionnaireChoice value="staging">Staging</QuestionnaireChoice>
            <QuestionnaireChoice value="isolated">Isolated sandbox</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name="approval" required>
          <QuestionnaireTitle>When should the agent request approval?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="writes">Before writing files</QuestionnaireChoice>
            <QuestionnaireChoice value="commands">Before running commands</QuestionnaireChoice>
            <QuestionnaireChoice value="sensitive">
              Only for sensitive actions
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Save execution plan</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ----------------------------- Navigation State ---------------------------- */

type NavItemName = "permission" | "verification";

function QuestionnaireNavigationState() {
  const [item, setItem] = createSignal<NavItemName>("permission");
  const [statuses, setStatuses] = createSignal<
    Record<NavItemName, QuestionnaireItemStatus>
  >({ permission: "unanswered", verification: "unanswered" });
  const [result, setResult] = createSignal<string>();
  const unanswered = () => statuses()[item()] === "unanswered";
  const setStatus = (name: NavItemName, status: QuestionnaireItemStatus) =>
    setStatuses((current) => ({ ...current, [name]: status }));

  return (
    <div class="w-full max-w-md">
      <Questionnaire
        item={item()}
        items={[
          { name: "permission", required: true },
          { name: "verification", required: true },
        ]}
        onItemChange={(next) => setItem(next as NavItemName)}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Permission: ${data.get("permission") ?? "None"} · Verification: ${
                data.get("verification") ?? "None"
              }`,
            ),
          )
        }
      >
        <QuestionnaireProgress />
        <QuestionnaireItem
          name="permission"
          required
          onStatusChange={(status) => setStatus("permission", status)}
        >
          <QuestionnaireTitle>What may the agent modify?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Next is intentionally disabled until an answer is selected.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="files">Project files</QuestionnaireChoice>
            <QuestionnaireChoice value="tests">
              Project files and tests
            </QuestionnaireChoice>
            <QuestionnaireChoice value="config">
              Files, tests, and configuration
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem
          name="verification"
          required
          onStatusChange={(status) => setStatus("verification", status)}
        >
          <QuestionnaireTitle>What must pass before completion?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="tests">Tests</QuestionnaireChoice>
            <QuestionnaireChoice value="types">Tests and types</QuestionnaireChoice>
            <QuestionnaireChoice value="all">
              Tests, types, and visual QA
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireNext
            class="data-[status=unanswered]:opacity-50"
            disabled={unanswered()}
            variant="secondary"
          >
            Next
          </QuestionnaireNext>
          <QuestionnaireSubmit disabled={unanswered()}>
            Save permissions
          </QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ------------------------------- Custom Progress --------------------------- */

const progressItems = [
  { name: "scope", required: true },
  { name: "strategy", required: true },
  { name: "tests", required: true },
  { name: "delivery", required: true },
] as const;

function QuestionnaireCustomProgress() {
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Questionnaire
        defaultItem="scope"
        items={progressItems}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Scope: ${data.get("scope") ?? "None"} · Commits: ${
                data.get("strategy") ?? "None"
              } · Tests: ${data.get("tests") ?? "None"} · Delivery: ${
                data.get("delivery") ?? "None"
              }`,
            ),
          )
        }
      >
        <QuestionnaireProgress class="w-full">
          {(state) => (
            <div>
              <div class="mb-2 flex gap-1.5" aria-hidden="true">
                <For each={Array.from({ length: state.total })}>
                  {(_, index) => (
                    <span
                      class={clsx(
                        "h-1.5 flex-1 rounded-full",
                        index() < state.current ? "bg-primary" : "bg-muted",
                      )}
                    />
                  )}
                </For>
              </div>
              <span>
                Checkpoint {state.current} of {state.total}
              </span>
            </div>
          )}
        </QuestionnaireProgress>

        <QuestionnaireItem name="scope" required>
          <QuestionnaireTitle>How large is the change?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="small">Small patch</QuestionnaireChoice>
            <QuestionnaireChoice value="medium">Feature-sized change</QuestionnaireChoice>
            <QuestionnaireChoice value="large">Cross-package change</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="strategy" required>
          <QuestionnaireTitle>How should commits be organized?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="single">Single commit</QuestionnaireChoice>
            <QuestionnaireChoice value="logical">Logical commits</QuestionnaireChoice>
            <QuestionnaireChoice value="squash">Squash before review</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="tests" required>
          <QuestionnaireTitle>Which tests should run?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="targeted">Targeted tests</QuestionnaireChoice>
            <QuestionnaireChoice value="package">Package suite</QuestionnaireChoice>
            <QuestionnaireChoice value="workspace">Full workspace</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="delivery" required>
          <QuestionnaireTitle>How should the work be delivered?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="patch">Patch only</QuestionnaireChoice>
            <QuestionnaireChoice value="commit">Committed locally</QuestionnaireChoice>
            <QuestionnaireChoice value="branch">Push a review branch</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Finish plan</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* --------------------------------- Animated -------------------------------- */

const animatedItemClass =
  "data-active:animate-in data-active:fade-in-0 data-active:slide-in-from-bottom-2 data-active:duration-300 motion-reduce:animate-none";

function QuestionnaireAnimated() {
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Questionnaire
        defaultItem="task"
        items={[
          { name: "task", required: true },
          { name: "review", required: true },
          { name: "delivery", required: true },
        ]}
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Task: ${data.get("task") ?? "None"} · Review: ${
                data.get("review") ?? "None"
              } · Delivery: ${data.get("delivery") ?? "None"}`,
            ),
          )
        }
      >
        <QuestionnaireProgress />
        <QuestionnaireItem class={animatedItemClass} name="task" required>
          <QuestionnaireTitle>What should the agent do?</QuestionnaireTitle>
          <QuestionnaireDescription>Choose the task for this run.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="implement">
              Implement the requested change
            </QuestionnaireChoice>
            <QuestionnaireChoice value="debug">Debug the current behavior</QuestionnaireChoice>
            <QuestionnaireChoice value="review">Review the implementation</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem class={animatedItemClass} name="review" required>
          <QuestionnaireTitle>How should the work be reviewed?</QuestionnaireTitle>
          <QuestionnaireDescription>Select the verification depth.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="targeted">Targeted checks</QuestionnaireChoice>
            <QuestionnaireChoice value="complete">Complete test suite</QuestionnaireChoice>
            <QuestionnaireChoice value="manual">Tests and manual QA</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem class={animatedItemClass} name="delivery" required>
          <QuestionnaireTitle>How should the result be delivered?</QuestionnaireTitle>
          <QuestionnaireDescription>Choose the final handoff format.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="summary">Concise summary</QuestionnaireChoice>
            <QuestionnaireChoice value="diff">Summary and changed files</QuestionnaireChoice>
            <QuestionnaireChoice value="handoff">Detailed review handoff</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireNext>Next</QuestionnaireNext>
          <QuestionnaireSubmit>Save workflow</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ----------------------------------- Card ---------------------------------- */

const cardItems = [
  {
    choices: [{ value: "fix" }, { value: "refactor" }, { value: "docs" }],
    name: "task",
    required: true,
  },
  {
    choices: [{ value: "summary" }, { value: "files" }, { value: "review" }],
    name: "output",
    required: true,
  },
] as const;

function QuestionnaireCard() {
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Questionnaire
        defaultItem="task"
        items={cardItems}
        shortcuts="numbers"
        onSubmit={(event) =>
          readAnswers(event, (data) =>
            setResult(
              `Task: ${data.get("task") ?? "None"} · Handoff: ${data.get("output") ?? "None"}`,
            ),
          )
        }
      >
        <Card class="gap-0">
          <QuestionnaireItem name="task" required>
            <CardHeader class="border-b">
              <QuestionnaireTitle component={CardTitle}>
                What should the agent work on?
              </QuestionnaireTitle>
              <QuestionnaireDescription component={CardDescription}>
                Choose the task that should be handled next.
              </QuestionnaireDescription>
              <CardAction>
                <QuestionnaireProgress />
              </CardAction>
            </CardHeader>
            <CardContent>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="fix">Fix the failing tests</QuestionnaireChoice>
                <QuestionnaireChoice value="refactor">Refactor the data layer</QuestionnaireChoice>
                <QuestionnaireChoice value="docs">Update the integration guide</QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </CardContent>
          </QuestionnaireItem>

          <QuestionnaireItem name="output" required>
            <CardHeader class="border-b">
              <QuestionnaireTitle component={CardTitle}>
                What should the final handoff include?
              </QuestionnaireTitle>
              <QuestionnaireDescription component={CardDescription}>
                Pick the level of detail needed for review.
              </QuestionnaireDescription>
              <CardAction>
                <QuestionnaireProgress />
              </CardAction>
            </CardHeader>
            <CardContent>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="summary">Summary only</QuestionnaireChoice>
                <QuestionnaireChoice value="files">Summary and changed files</QuestionnaireChoice>
                <QuestionnaireChoice value="review">Full review handoff</QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </CardContent>
          </QuestionnaireItem>

          <CardFooter>
            <QuestionnaireActions class="w-full">
              <QuestionnairePrevious />
              <QuestionnaireNext>Next</QuestionnaireNext>
              <QuestionnaireSubmit>Create task</QuestionnaireSubmit>
            </QuestionnaireActions>
          </CardFooter>
        </Card>
      </Questionnaire>
      <Result text={result()} />
    </div>
  );
}

/* ---------------------------------- Dialog --------------------------------- */

const dialogItems = [
  { name: "scope", required: true },
  { name: "tests", required: true },
] as const;

function QuestionnaireDialog() {
  const [open, setOpen] = createSignal(false);
  const [result, setResult] = createSignal<string>();
  return (
    <div class="w-full max-w-md">
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogTrigger variant="outline">Open clarification</DialogTrigger>
        <DialogContent>
          <Questionnaire
            defaultItem="scope"
            items={dialogItems}
            onSubmit={(event) =>
              readAnswers(event, (data) => {
                setOpen(false);
                setResult(
                  `Scope: ${data.get("scope") ?? "None"} · Verification: ${
                    data.get("tests") ?? "None"
                  }`,
                );
              })
            }
          >
            <QuestionnaireItem name="scope" required>
              <DialogHeader>
                <QuestionnaireProgress />
                <QuestionnaireTitle component={DialogTitle}>
                  Which files are in scope?
                </QuestionnaireTitle>
                <QuestionnaireDescription component={DialogDescription}>
                  Choose how broadly the agent can update the workspace.
                </QuestionnaireDescription>
              </DialogHeader>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="component">Component only</QuestionnaireChoice>
                <QuestionnaireChoice value="feature">Complete feature directory</QuestionnaireChoice>
                <QuestionnaireChoice value="workspace">
                  Any related workspace file
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireItem name="tests" required>
              <DialogHeader>
                <QuestionnaireProgress />
                <QuestionnaireTitle component={DialogTitle}>
                  How much verification is needed?
                </QuestionnaireTitle>
                <QuestionnaireDescription component={DialogDescription}>
                  Choose the checks the agent should run before handoff.
                </QuestionnaireDescription>
              </DialogHeader>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="targeted">Targeted tests</QuestionnaireChoice>
                <QuestionnaireChoice value="package">Package tests</QuestionnaireChoice>
                <QuestionnaireChoice value="full">
                  Full workspace verification
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <DialogFooter>
              <DialogClose variant="outline">Cancel</DialogClose>
              <QuestionnaireActions>
                <QuestionnairePrevious />
                <QuestionnaireNext>Next</QuestionnaireNext>
                <QuestionnaireSubmit>Send answer</QuestionnaireSubmit>
              </QuestionnaireActions>
            </DialogFooter>
          </Questionnaire>
        </DialogContent>
      </Dialog>
      <Result text={result()} />
    </div>
  );
}

export const questionnaireSections: Section[] = [
  {
    id: "questionnaire-demo",
    title: "Demo",
    description:
      "A multi-step questionnaire with single-choice, multiple-choice and freeform items.",
    component: QuestionnaireDemo,
  },
  {
    id: "questionnaire-multiple",
    title: "Multiple Selection",
    description: "Use multiple for an item that accepts more than one answer.",
    component: QuestionnaireMultiple,
  },
  {
    id: "questionnaire-freeform",
    title: "Freeform Answer",
    description: "Compose an input with fixed choices.",
    component: QuestionnaireFreeform,
  },
  {
    id: "questionnaire-skip",
    title: "Explicit Skip",
    description: "Add a skip action for optional items.",
    component: QuestionnaireSkipExample,
  },
  {
    id: "questionnaire-shortcuts",
    title: "Shortcuts",
    description: "Assign a letter or number key to each answer.",
    component: QuestionnaireShortcuts,
  },
  {
    id: "questionnaire-validation",
    title: "Custom Validation",
    description: "Return to an invalid item and present its error.",
    component: QuestionnaireValidation,
  },
  {
    id: "questionnaire-controlled",
    title: "Controlled",
    description: "Control the active item from host state.",
    component: QuestionnaireControlled,
  },
  {
    id: "questionnaire-resume",
    title: "Resume",
    description: "Restore saved answers and reset back to them.",
    component: QuestionnaireResume,
  },
  {
    id: "questionnaire-conditional",
    title: "Conditional Items",
    description: "Disable items that do not apply to earlier answers.",
    component: QuestionnaireConditional,
  },
  {
    id: "questionnaire-navigation-state",
    title: "Navigation State",
    description: "Read item status to opt into disabled navigation.",
    component: QuestionnaireNavigationState,
  },
  {
    id: "questionnaire-progress",
    title: "Custom Progress",
    description: "Use the progress render state to build a custom indicator.",
    component: QuestionnaireCustomProgress,
  },
  {
    id: "questionnaire-animated",
    title: "Animated Items",
    description: "Animate the active item while progress stays stationary.",
    component: QuestionnaireAnimated,
  },
  {
    id: "questionnaire-card",
    title: "Card",
    description: "Compose Questionnaire with Card slots.",
    component: QuestionnaireCard,
  },
  {
    id: "questionnaire-dialog",
    title: "Dialog",
    description: "Compose Questionnaire inside a Dialog.",
    component: QuestionnaireDialog,
  },
];
