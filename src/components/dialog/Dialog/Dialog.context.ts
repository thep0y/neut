import {
  type Accessor,
  createContext,
  type Setter,
  useContext,
} from "solid-js";
import type { DialogChangeEventReason } from "./Dialog.types";

interface DialogContextValue {
  show: Accessor<boolean>;
  setShow: Setter<boolean>;
  open: Accessor<boolean>;
  /** 打开/关闭 Dialog；内部会同时处理受控与非受控模式 */
  setOpen: (
    open: boolean,
    reason?: DialogChangeEventReason,
    event?: Event,
  ) => void;
}

export const DialogContext = createContext<DialogContextValue>();

export const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialogContext 必须用在 <Dialog> 内部");
  }
  return context;
};
