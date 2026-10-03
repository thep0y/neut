/**
 * camelCase -> kebab-case(CSS 属性名归一化)。
 *
 * 处理三类特殊情况:
 *
 * 1. CSS 自定义属性(`--foo`)原样保留,否则 `--foo` 会被改成 `---foo`。
 * 2. `float` / `cssFloat` 都归一成 `float`:`getComputedStyle().getPropertyValue()`
 *    只认 `float`(JS 里 `cssFloat` 是访问 `el.style` 时的别名)。
 * 3. **厂商前缀**(`WebkitTransform` → `-webkit-transform`、`msTransform` → `-ms-transform`):
 *    连字符必须加在**前缀和后续单词之间**,并且 `ms` 前缀自己是带连字符的。
 *    之前的两份重复实现一个把 `WebkitTransform` 变成 `webkit-transform`
 *    (少了前缀连字符)、另一个把 `msTransform` 变成 `ms-transform`
 *    (少了 ms 自带的前缀连字符),各自都错了一半。
 *    归一为:`^[A-Z]` 开头且含小写字母段时,首字母转小写并前置 `-`;
 *    `ms`(全小写前缀)单独补上前缀连字符。
 */
export function toKebabCase(key: string): string {
  if (key.startsWith("--")) return key;
  if (key === "float" || key === "cssFloat") return "float";

  // 首字母大写 => 带厂商前缀(WebkitTransform),先降为小写,避免被当成单词边界加分隔连字符
  const normalized = /^[A-Z]/.test(key)
    ? `-${key[0].toLowerCase()}${key.slice(1)}`
    : key;
  // 其余大写字母是单词边界:msTransform -> ms-transform
  const kebab = normalized.replace(
    /[A-Z]/g,
    (char) => `-${char.toLowerCase()}`,
  );
  // ms 前缀是唯一全小写的厂商前缀,自带前置连字符:ms-transform -> -ms-transform
  return kebab.startsWith("ms-") ? `-${kebab}` : kebab;
}
