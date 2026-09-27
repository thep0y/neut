import type { JSX, ParentProps, ValidComponent } from "solid-js";
import type { ButtonProps } from "~/components/button";
import type { BaseProps, PolymorphicProps } from "~/types";

export type QuestionnaireItemStatus = "unanswered" | "answered" | "skipped";
export type QuestionnaireShortcutMode = "letters" | "numbers";

export interface QuestionnaireChoiceDefinition {
  disabled?: boolean;
  value: string;
}

export interface QuestionnaireItemDefinition {
  choices?: readonly QuestionnaireChoiceDefinition[];
  disabled?: boolean;
  name: string;
  required?: boolean;
}

export interface QuestionnaireRootState {
  current: number;
  first: boolean;
  last: boolean;
  total: number;
}

interface BaseQuestionnaireProps extends BaseProps, ParentProps {
  /** 初始激活项 */
  defaultItem?: string;
  /** 受控激活项;不传则由内部导航 */
  item?: string;
  /** 题目定义:提供后用于按定义顺序分配快捷键、校验名/required 一致性 */
  items?: readonly QuestionnaireItemDefinition[];
  onItemChange?: (item: string) => void;
  /** 答案快捷键模式 */
  shortcuts?: QuestionnaireShortcutMode;
  /** 默认 true,关闭浏览器原生校验并走组件校验 */
  noValidate?: boolean;
  onReset?: (event: Event) => void;
  onSubmit?: (event: SubmitEvent) => void;
}

export type QuestionnaireProps = PolymorphicProps<
  "form",
  BaseQuestionnaireProps,
  false
>;

export type QuestionnaireProgressProps = PolymorphicProps<
  "div",
  BaseProps & {
    children?: JSX.Element | ((state: QuestionnaireRootState) => JSX.Element);
  },
  false
>;

export type QuestionnaireItemProps = PolymorphicProps<
  "fieldset",
  BaseProps & {
    name: string;
    required?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    onStatusChange?: (status: QuestionnaireItemStatus) => void;
    "aria-labelledby"?: string;
  },
  false
>;

export type QuestionnaireTitleProps<T extends ValidComponent = "legend"> =
  PolymorphicProps<T, BaseProps & { id?: string; children?: JSX.Element }>;
export type QuestionnaireDescriptionProps<T extends ValidComponent = "p"> =
  PolymorphicProps<T, BaseProps & { id?: string; children?: JSX.Element }>;
export type QuestionnaireChoicesProps = PolymorphicProps<
  "div",
  BaseProps,
  false
>;

export type QuestionnaireChoiceProps = PolymorphicProps<
  "label",
  BaseProps & {
    value: string;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (event: Event) => void;
  },
  false
>;

export type QuestionnaireInputType =
  | "date"
  | "datetime-local"
  | "email"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

export type QuestionnaireInputProps = PolymorphicProps<
  "input",
  BaseProps & {
    type?: QuestionnaireInputType;
    defaultValue?: string;
    value?: string;
    disabled?: boolean;
    onChange?: (event: Event) => void;
  },
  false
>;

export type QuestionnaireErrorProps<T extends ValidComponent = "p"> =
  PolymorphicProps<T, BaseProps & { id?: string; children?: JSX.Element }>;

export type QuestionnaireNavigationProps = PolymorphicProps<
  "button",
  BaseProps & {
    variant?: ButtonProps<"button">["variant"];
    size?: ButtonProps<"button">["size"];
  },
  false
>;
