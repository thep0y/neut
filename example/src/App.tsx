import { Button } from "@neut/ui";

function App() {
  return (
    <div class="w-full flex items-center justify-center gap-3 p-4">
      <Button>Click me</Button>
      <Button variant="secondary">Click me</Button>
      <Button variant="outline">Click me</Button>
      <Button variant="ghost">Click me</Button>
      <Button variant="destructive">Click me</Button>
    </div>
  );
}

export default App;
