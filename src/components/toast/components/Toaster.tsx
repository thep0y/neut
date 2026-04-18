/**
 * components/Toaster.tsx
 * Root component that renders the toast container(s) into a portal.
 * Single responsibility: layout, positioning, and orchestrating sub-components/hooks.
 * All state logic is delegated to dedicated hooks.
 */
import { createMemo, createSignal, For, Show, type Component } from "solid-js";
import { Toast } from "./Toast";
import { useTheme } from "../hooks/useTheme";
import { useToasterKeyboard } from "../hooks/useToasterKeyboard";
import { useToastSubscription } from "../hooks/useToastSubscription";
import { assignOffset, getDocumentDirection } from "../utils";
import { GAP, TOAST_WIDTH, VISIBLE_TOASTS_AMOUNT } from "../constants";
import type { HeightT, Position, ToasterProps } from "../types";
import { Portal } from "solid-js/web";

export const Toaster: Component<ToasterProps> = (props) => {
  // ─── Defaults ────────────────────────────────────────────────────────────────
  const position = () => props.position ?? "bottom-right";
  const hotkey = () => props.hotkey ?? ["altKey", "KeyT"];
  const gap = () => props.gap ?? GAP;
  const visibleToasts = () => props.visibleToasts ?? VISIBLE_TOASTS_AMOUNT;
  const dir = () => props.dir ?? getDocumentDirection();
  const containerAriaLabel = () => props.containerAriaLabel ?? "Notifications";
  const hotkeyLabel = () =>
    hotkey().join("+").replace(/Key/g, "").replace(/Digit/g, "");

  // ─── Local state ──────────────────────────────────────────────────────────────
  const [heights, setHeights] = createSignal<HeightT[]>([]);
  const [expanded, setExpanded] = createSignal(false);
  const [interacting, setInteracting] = createSignal(false);

  let listRef: HTMLOListElement | undefined;
  let lastFocusedElement: HTMLElement | null = null;
  let isFocusWithin = false;

  // ─── Composed hooks ───────────────────────────────────────────────────────────
  const actualTheme = useTheme(() => props.theme ?? "light");
  const { toasts, removeToast } = useToastSubscription();

  useToasterKeyboard({
    hotkey: hotkey(),
    listRef: () => listRef,
    setExpanded,
  });

  // ─── Derived data ─────────────────────────────────────────────────────────────
  /** Toasts that belong to this specific Toaster instance (by id) */
  const filteredToasts = createMemo(() => {
    const id = props.id;
    return id
      ? toasts().filter((t) => t.toasterId === id)
      : toasts().filter((t) => !t.toasterId);
  });

  /** All unique positions used by active toasts (plus the default position) */
  const possiblePositions = createMemo(() =>
    Array.from(
      new Set(
        [position()].concat(
          filteredToasts()
            .filter((t) => t.position)
            .map((t) => t.position as Position),
        ),
      ),
    ),
  );

  // Collapse when only one toast remains
  createMemo(() => {
    if (toasts().length <= 1) setExpanded(false);
  });

  // ─── Focus management ─────────────────────────────────────────────────────────
  const onFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.dismissible === "false") return;
    if (!isFocusWithin) {
      isFocusWithin = true;
      lastFocusedElement = e.relatedTarget as HTMLElement;
    }
  };

  const onBlur = (e: FocusEvent) => {
    const currentTarget = e.currentTarget as HTMLElement;
    if (isFocusWithin && !currentTarget.contains(e.relatedTarget as Node)) {
      isFocusWithin = false;
      if (lastFocusedElement) {
        lastFocusedElement.focus({ preventScroll: true });
        lastFocusedElement = null;
      }
    }
  };

  // ─── CSS offset vars ──────────────────────────────────────────────────────────
  const offsetVars = createMemo(() =>
    assignOffset(props.offset, props.mobileOffset),
  );

  return (
    <Portal>
      <section
        aria-label={
          props.customAriaLabel ?? `${containerAriaLabel()} ${hotkeyLabel()}`
        }
        tabIndex={-1}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
      >
        <For each={possiblePositions()}>
          {(pos) => {
            const [posY, posX] = pos.split("-");
            const toastsForPos = () =>
              filteredToasts().filter(
                (t) =>
                  (!t.position && pos === position()) || t.position === pos,
              );
            const heightsForPos = () =>
              heights().filter((h) => h.position === pos);

            return (
              <Show when={toastsForPos().length > 0}>
                <ol
                  ref={(el) => (listRef = el)}
                  dir={dir() === "auto" ? getDocumentDirection() : dir()}
                  tabIndex={-1}
                  class={props.class}
                  data-sonner-toaster
                  data-sonner-theme={actualTheme()}
                  data-y-position={posY}
                  data-x-position={posX}
                  style={{
                    "--front-toast-height": `${heights()[0]?.height ?? 0}px`,
                    "--width": `${TOAST_WIDTH}px`,
                    "--gap": `${gap()}px`,
                    ...(props.style as any),
                    ...offsetVars(),
                  }}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  onMouseEnter={() => setExpanded(true)}
                  onMouseMove={() => setExpanded(true)}
                  onMouseLeave={() => {
                    if (!interacting()) setExpanded(false);
                  }}
                  onDragEnd={() => setExpanded(false)}
                  onPointerDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.dataset.dismissible === "false") return;
                    setInteracting(true);
                  }}
                  onPointerUp={() => setInteracting(false)}
                >
                  <For each={toastsForPos()}>
                    {(toast, index) => (
                      <Toast
                        icons={props.icons}
                        index={index()}
                        toast={toast}
                        defaultRichColors={props.richColors}
                        duration={
                          props.toastOptions?.duration ?? props.duration
                        }
                        class={props.toastOptions?.class}
                        descriptionClass={props.toastOptions?.descriptionClass}
                        invert={props.invert ?? false}
                        visibleToasts={visibleToasts()}
                        closeButton={
                          props.toastOptions?.closeButton ??
                          props.closeButton ??
                          false
                        }
                        interacting={interacting()}
                        position={pos}
                        style={props.toastOptions?.style}
                        unstyled={props.toastOptions?.unstyled}
                        classes={props.toastOptions?.classes}
                        cancelButtonStyle={
                          props.toastOptions?.cancelButtonStyle
                        }
                        actionButtonStyle={
                          props.toastOptions?.actionButtonStyle
                        }
                        closeButtonAriaLabel={
                          props.toastOptions?.closeButtonAriaLabel
                        }
                        removeToast={removeToast}
                        toasts={toastsForPos()}
                        heights={heightsForPos()}
                        setHeights={setHeights}
                        expandByDefault={props.expand ?? false}
                        gap={gap()}
                        expanded={expanded()}
                        swipeDirections={props.swipeDirections}
                      />
                    )}
                  </For>
                </ol>
              </Show>
            );
          }}
        </For>
      </section>
    </Portal>
  );
};
