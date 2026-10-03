import type { JSXElement } from "solid-js";
import type { PromiseData, PromiseT } from "../Toast/Toast.types";
import type { CreateToastInput } from "./store";

/** promise 编排需要的最小写入能力；测试可注入假实现，不必碰全局 store */
export interface PromiseToastPorts {
  show(data: CreateToastInput): string;
  dismiss(id: string): void;
}

type PromiseOutcome = "success" | "error";

async function resolveValue(resolver: unknown, value: unknown) {
  return typeof resolver === "function"
    ? await (resolver as (input: unknown) => JSXElement | string)(value)
    : resolver;
}

/**
 * `toast.promise` 的编排：先按需挂一条 loading，再根据 settle 结果替换成
 * success/error；resolver 返回 `undefined` 表示"不想留提示"，此时收起 loading。
 *
 * 成功与失败除"用哪个 resolver、报哪种 type"外完全一致，因此共用 `settle`。
 *
 * 返回 loading 那条 toast 的 id（没有 loading 时为 `undefined`；公开 API 的
 * 返回类型仍按历史约定标成 `string`，故调用方做了断言）。
 */
export function createPromiseToast<Data = any>(
  promise: PromiseT<Data>,
  data: PromiseData<Data> | undefined,
  ports: PromiseToastPorts,
): string | undefined {
  if (!data) return undefined;

  let id: string | undefined;
  if (data.loading !== undefined) {
    id = ports.show({
      ...data,
      type: "loading",
      message: data.loading,
    } as CreateToastInput);
  }

  const settle = async (type: PromiseOutcome, outcome: unknown) => {
    const message = await resolveValue(
      type === "success" ? data.success : data.error,
      outcome,
    );

    if (message === undefined) {
      if (id !== undefined) ports.dismiss(id);
      return;
    }

    ports.show({
      id,
      type,
      message: message as JSXElement,
      description: (await resolveValue(
        data.description,
        outcome,
      )) as JSXElement,
    });
  };

  Promise.resolve(typeof promise === "function" ? promise() : promise)
    .then((result) => settle("success", result))
    .catch((error) => settle("error", error))
    .finally(() => {
      data.finally?.();
    });

  return id;
}
