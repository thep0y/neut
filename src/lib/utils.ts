import { twMerge } from "tailwind-merge";

export const clsx = (...classes: (string | undefined | false)[]): string => {
  return twMerge(classes.filter(Boolean));
};

let warnOnce = (_: string) => {};
if (!import.meta.env.PROD) {
  const warnings = new Set<string>();
  warnOnce = (msg: string) => {
    if (!warnings.has(msg)) {
      console.warn(msg);
    }
    warnings.add(msg);
  };
}

export { warnOnce };
