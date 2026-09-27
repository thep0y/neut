import { createContext, useContext, type Accessor } from "solid-js";
import type {
  QuestionnaireItemDefinition,
  QuestionnaireItemStatus,
  QuestionnaireRootState,
  QuestionnaireShortcutMode,
} from "./questionnaire.types";

export interface QuestionnaireAnswerEntry {
  id: string;
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  type: "choice" | "input";
  value?: string;
  disabled: boolean;
  ownDisabled?: boolean;
}

export interface QuestionnaireItemHandle {
  name: string;
  element: HTMLElement;
  disabled: Accessor<boolean>;
  required: Accessor<boolean>;
  status: Accessor<QuestionnaireItemStatus>;
  validate: () => boolean;
  focus: () => void;
  focusInvalid: () => void;
  skip: () => void;
  reset: () => void;
  getAnswerByElement: (element: Element) => QuestionnaireAnswerEntry | null;
  getAnswerByShortcut: (shortcut: string) => QuestionnaireAnswerEntry | null;
  moveAnswerFocus: (target: Element, direction: "next" | "previous") => boolean;
}

export interface QuestionnaireRootContextValue {
  state: Accessor<QuestionnaireRootState>;
  activeItemName: Accessor<string | null>;
  activeItemRequired: Accessor<boolean | null>;
  activeItemStatus: Accessor<QuestionnaireItemStatus | null>;
  shortcuts: Accessor<QuestionnaireShortcutMode | null>;
  nativeValidation: Accessor<boolean>;
  itemDefinitions: Accessor<Map<string, QuestionnaireItemDefinition> | null>;
  registerItem: (item: QuestionnaireItemHandle) => () => void;
  goNext: () => void;
  goPrevious: () => void;
  skipCurrent: () => void;
  requestSubmit: () => void;
}

export interface QuestionnaireItemContextValue {
  name: string;
  active: Accessor<boolean>;
  disabled: Accessor<boolean>;
  invalid: Accessor<boolean>;
  multiple: Accessor<boolean>;
  required: Accessor<boolean>;
  status: Accessor<QuestionnaireItemStatus>;
  hasInputAnswer: Accessor<boolean>;
  selectedAnswerIds: Accessor<string[]>;
  resetVersion: Accessor<number>;
  shortcutByAnswerId: Accessor<Map<string, string>>;
  shortcutByChoiceValue: Accessor<Map<string, string> | null>;
  shortcuts: Accessor<QuestionnaireShortcutMode | null>;
  registerAnswerControl: (entry: QuestionnaireAnswerEntry) => () => void;
  registerAnswerSelection: (id: string, initialSelected: boolean) => () => void;
  registerDescription: (id: string) => () => void;
  registerError: (id: string) => () => void;
  setAnswerDefault: (id: string, selected: boolean) => void;
  setAnswerSelectionFromInteraction: (id: string, selected: boolean) => void;
  syncControlledAnswerSelection: (id: string, selected: boolean) => void;
}

export const QuestionnaireRootContext =
  createContext<QuestionnaireRootContextValue>();

export function useQuestionnaireRootContext(
  component: string,
): QuestionnaireRootContextValue {
  const ctx = useContext(QuestionnaireRootContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <Questionnaire> 内部`);
  }
  return ctx;
}

export const QuestionnaireItemContext =
  createContext<QuestionnaireItemContextValue>();

export function useQuestionnaireItemContext(
  component: string,
): QuestionnaireItemContextValue {
  const ctx = useContext(QuestionnaireItemContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <QuestionnaireItem> 内部`);
  }
  return ctx;
}
