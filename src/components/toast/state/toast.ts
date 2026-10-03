import { createUniqueId, type JSXElement } from "solid-js";
import type {
  ExternalToast,
  PromiseData,
  PromiseT,
} from "../Toast/Toast.types";
import { createPromiseToast } from "./promise-toast";
import {
  createToast,
  dismissToast,
  getHistory,
  getToasts,
  removeToast,
  useSonner,
} from "./store";

const toastFunction = (message: JSXElement, data?: ExternalToast) =>
  createToast({ ...data, message });

/**
 * 公开 API：把 store 原语包装成"一条 toast 怎么发出去"的语义化入口。
 * 这里只做参数装配，状态变更全部委托给 `store`，promise 编排委托给
 * `promise-toast`。
 */
export const toast = Object.assign(toastFunction, {
  success: (message: JSXElement, data?: ExternalToast) =>
    createToast({ ...data, type: "success", message }),
  info: (message: JSXElement, data?: ExternalToast) =>
    createToast({ ...data, type: "info", message }),
  warning: (message: JSXElement, data?: ExternalToast) =>
    createToast({ ...data, type: "warning", message }),
  error: (message: JSXElement, data?: ExternalToast) =>
    createToast({ ...data, type: "error", message }),
  loading: (message: JSXElement, data?: ExternalToast) =>
    createToast({ ...data, type: "loading", message }),
  message: (message: JSXElement, data?: ExternalToast) =>
    createToast({ ...data, message }),
  custom: (jsx: (id: string) => JSXElement, data?: ExternalToast) => {
    const id = data?.id ?? createUniqueId();
    return createToast({ ...data, id, jsx: jsx(id) });
  },
  dismiss: dismissToast,
  promise: <Data = any>(promise: PromiseT<Data>, data?: PromiseData<Data>) =>
    createPromiseToast(promise, data, {
      show: createToast,
      dismiss: dismissToast,
    }) as string,
  getToasts,
  getHistory,
  remove: removeToast,
});

export { dismissToast, getHistory, getToasts, removeToast, useSonner };
