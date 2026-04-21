export const useAccordion = () => {
  // 键盘无障碍导航
  const handleKeyDown = (e: KeyboardEvent) => {
    // 只有这四个键需要处理
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;

    // 确保当前焦点是在一个 Accordion Trigger 上
    const activeEl = document.activeElement as HTMLElement;
    if (!activeEl || activeEl.getAttribute("data-accordion-trigger") === null)
      return;

    e.preventDefault(); // 阻止页面的默认滚动

    const container = e.currentTarget as HTMLElement;
    // 获取当前 Accordion 下所有未被禁用的 Trigger
    const triggers = Array.from(
      container.querySelectorAll("[data-accordion-trigger]:not([disabled])"),
    ) as HTMLElement[];

    const currentIndex = triggers.indexOf(activeEl);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % triggers.length; // 循环向下
        break;
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + triggers.length) % triggers.length; // 循环向上
        break;
      case "Home":
        nextIndex = 0; // 跳到第一个
        break;
      case "End":
        nextIndex = triggers.length - 1; // 跳到最后一个
        break;
    }

    // 聚焦到下一个元素
    triggers[nextIndex]?.focus();
  };

  return { handleKeyDown };
};
