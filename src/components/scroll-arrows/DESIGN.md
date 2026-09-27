# ScrollArrows 设计说明

> 状态:P1(装饰性默认 + 可选的悬停滚动)
> 关联代码:`src/components/scroll-arrows/`、`src/hooks/useScrollEdges.ts`

## 1. 背景

Select / Combobox / ContextMenu / TimePicker 把原生滚动条隐藏后用上下箭头提示
"该方向还有内容"。箭头是绝对定位浮层,贴在滚动容器的上/下沿。

## 2. 生产事故:箭头可交互导致列表持续滚动

早期实现(把箭头做成可交互浮层)在 TimePicker 里出现"无限滚动、分钟选不中":

1. 箭头是**满宽、可命中**的浮层(`absolute inset-x-0 h-6 z-10`,pointer events auto),
   与列表首/尾选项在边缘处重叠,于是**抢走了列表项的指针事件**——想点边缘的分钟,
   实际命中的是箭头。
2. `pointerenter` 触发 rAF **持续滚动**。指针停在箭头上不动时,列表会一直滚,
   指针下方的选项每帧都在变 → "数字不停变动、点不中"。
3. 滚到边界时 `useScrollEdges` 把箭头置为不可见,`<Show>` 卸载箭头;
   浏览器在 DOM 变化后会重算 hover 并把 `pointerenter` 派发给新的目标;
   加上原来的 1px 阈值没有迟滞,`canScroll*` 会在边界反复翻转,箭头反复出现/消失,
   于是"显示 → pointerenter → 滚动 → 消失 → 再显示"形成**反馈循环**。
   同时旧的 rAF 循环没有检查箭头是否可见,可能在上一个循环里继续滚动。

## 3. 现在的做法

- **默认装饰性**:`interactive` 默认 `false`,箭头 `pointer-events-none`、`aria-hidden`,
  只做视觉提示,不再抢指针、也不会与滚动互相触发。滚动交给滚轮/键盘/拖拽,
  与 shadcn/Radix 的做法一致。
- **可选交互**:显式传 `interactive` 时,保留悬停/按住滚动,但补上防护:
  - 悬停后延时 150ms 才滚动,避免只是掠过或点击时误触发;
  - rAF 每帧检查 `visible`,箭头不可见立即停止;
  - 指针离开/抬起/取消都停止。
- **迟滞阈值**:`useScrollEdges` 进入阈值 4px、退出阈值 1px,消除边界处每帧抖动。

## 4. 使用

```tsx
<ScrollArrows target={listElement} />                 // 装饰性(推荐)
<ScrollArrows target={listElement} interactive />     // 悬停/按住持续滚动(会覆盖边缘)
```

`interactive` 时箭头会参与指针命中,列表项不应依赖被覆盖的边缘区域做点击。
