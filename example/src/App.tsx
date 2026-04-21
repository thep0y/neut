import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@neut/ui";
import { CornerLeftUp, MoveUp } from "lucide-solid";
import { For, type JSXElement } from "solid-js";

function App() {
  const tooltipSides = ["top", "right", "bottom", "left"] as const;
  const tooltipAligns = ["start", "center", "end"] as const;
  const arrows: Record<
    `${(typeof tooltipSides)[number]}-${(typeof tooltipAligns)[number]}`,
    JSXElement
  > = {
    "top-start": <CornerLeftUp />,
    "top-center": <MoveUp />,
    "top-end": <CornerLeftUp class="rotate-y-180" />,
    "right-start": <CornerLeftUp class="rotate-90" />,
    "right-center": <MoveUp class="rotate-90" />,
    "right-end": <CornerLeftUp class="rotate-90 rotate-y-180" />,
    "bottom-start": <CornerLeftUp class="rotate-x-180" />,
    "bottom-center": <MoveUp class="rotate-180" />,
    "bottom-end": <CornerLeftUp class="rotate-180" />,
    "left-start": <CornerLeftUp class="rotate-90 rotate-x-180" />,
    "left-center": <MoveUp class="-rotate-90" />,
    "left-end": <CornerLeftUp class="-rotate-90" />,
  };

  return (
    <div class="w-full flex flex-col items-center justify-center gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>按钮</CardTitle>
          <CardDescription>按钮变体</CardDescription>
        </CardHeader>

        <CardContent class="flex gap-3 items-center">
          <Button>Click me</Button>
          <Button variant="secondary">Click me</Button>
          <Button variant="outline">Click me</Button>
          <Button variant="ghost">Click me</Button>
          <Button variant="destructive">Click me</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>文字提示</CardTitle>
        </CardHeader>

        <CardContent>
          <div class="grid gap-2 [grid-template-areas:'._top-start_top-center_top-end_.''left-start_._._._right-start''left-center_._._._right-center''left-end_._._._right-end''._bottom-start_bottom-center_bottom-end_.']">
            <For each={tooltipSides}>
              {(side) => (
                <For each={tooltipAligns}>
                  {(align) => (
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="outline"
                          style={{ "grid-area": `${side}-${align}` }}
                          icon={arrows[`${side}-${align}`]}
                        />
                      </TooltipTrigger>

                      <TooltipContent side={side} align={align}>
                        {`This is a tooltip on the ${side} side aligned to ${align}`}
                        <TooltipArrow />
                      </TooltipContent>
                    </Tooltip>
                  )}
                </For>
              )}
            </For>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
