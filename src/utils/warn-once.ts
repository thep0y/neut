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
