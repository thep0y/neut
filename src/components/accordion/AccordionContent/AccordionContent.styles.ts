const classes = {
  content:
    "overflow-hidden text-sm data-[open=true]:animate-accordion-down data-[open=false]:animate-accordion-up",
  wrapper:
    "pb-2.5 pt-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
} as const;

export default classes;
