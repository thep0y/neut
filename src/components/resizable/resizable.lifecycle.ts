import { constraintBounds } from "./resizable.constraints";
import type { PanelRegistry } from "./resizable.registry";
import { distributeInitialSizes } from "./resizable.resize";
import type { PanelSizes } from "./resizable.sizes";
import type { ResizableLayout, ResizablePanelMeta } from "./resizable.types";
import { normalizeSizes } from "./resizable.utils";

export interface PanelLifecycleContext {
  /** 按 DOM 顺序排列的面板 */
  metas: () => ResizablePanelMeta[];
  registry: PanelRegistry;
  sizes: PanelSizes;
  /** 读取已持久化的布局 */
  readSaved: () => ResizableLayout | undefined;
  /** props 上传入的初始布局 */
  defaultLayout: () => ResizableLayout | undefined;
  /** 通知 + 持久化 */
  commit: () => void;
  /** 注册表发生变化（挂载/卸载）时的通知，用于让消费方重算 */
  onRegistryChange: () => void;
}

export interface PanelLifecycle {
  /** 注册面板并返回注销函数；首个面板挂载会在微任务里做一次初始化 */
  registerPanel: (meta: ResizablePanelMeta) => () => void;
  /** 首次布局：分配初始尺寸并归一化（SSR 与空列表下不动作） */
  initialize: () => void;
  /** 是否已经初始化过 */
  isInitialized: () => boolean;
}

/**
 * 面板的生命周期：注册、首帧初始化、以及"初始化之后动态新增面板"的尺寸分配。
 *
 * 单一职责：决定"什么时候算初始布局""新面板该拿多少"。初始分配委托
 * `resizable.resize.distributeInitialSizes`，写入委托 `PanelSizes`。
 *
 * 为什么初始化要延后到微任务：面板是逐个挂载的，第一个面板挂载时后面几个还没注册，
 * 若立刻算布局就会给第一个面板 100%，等其余面板挂载后再推翻重排，用户会看到跳动。
 */
export function createPanelLifecycle(
  ctx: PanelLifecycleContext,
): PanelLifecycle {
  let initialized = false;

  const bounds = () => constraintBounds(ctx.metas());

  const buildInitial = (): number[] => {
    const list = ctx.metas();
    const saved = ctx.readSaved() ?? ctx.defaultLayout();
    return distributeInitialSizes(
      list.map((meta) => meta.id),
      saved,
      list.map((meta) => meta.defaultSize),
    );
  };

  const initialize = () => {
    if (initialized) return;
    // SSR 不计算布局：首屏由 Panel 的 defaultSize fallback 撑起，客户端再归一化
    if (typeof window === "undefined") return;
    if (ctx.metas().length === 0) return;

    initialized = true;
    ctx.sizes.applyAll(normalizeSizes(buildInitial(), bounds()), false);
    ctx.commit();
  };

  const scheduleInitialize = () => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      if (!initialized) initialize();
    });
  };

  /** 初始化之后新增的面板：给它默认尺寸，并把其它面板等比压回 100 */
  const adoptNewPanel = (meta: ResizablePanelMeta) => {
    const list = ctx.metas();
    const raw = list.map((item) =>
      item.id === meta.id
        ? (item.defaultSize ?? 100 / list.length)
        : ctx.sizes.sizeOf(item.id),
    );
    ctx.sizes.applyAll(normalizeSizes(raw, bounds()));
    ctx.commit();
  };

  return {
    initialize,
    isInitialized: () => initialized,
    registerPanel(meta) {
      ctx.registry.add(meta);
      ctx.onRegistryChange();

      if (!initialized) {
        scheduleInitialize();
      } else if (ctx.sizes.store[meta.id] === undefined) {
        adoptNewPanel(meta);
      }

      return () => {
        ctx.registry.remove(meta);
        ctx.onRegistryChange();
        ctx.sizes.remove(meta.id);
      };
    },
  };
}
