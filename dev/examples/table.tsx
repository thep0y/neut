import { For } from "solid-js";
import { MoreHorizontal } from "lucide-solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  NumberInput,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/index";
import type { Section } from "./shared";

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
];

function TableBasic() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead class="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={invoices.slice(0, 3)}>
          {(invoice) => (
            <TableRow>
              <TableCell class="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell class="text-right">{invoice.totalAmount}</TableCell>
            </TableRow>
          )}
        </For>
      </TableBody>
    </Table>
  );
}

function TableWithFooter() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead class="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={invoices.slice(0, 3)}>
          {(invoice) => (
            <TableRow>
              <TableCell class="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell class="text-right">{invoice.totalAmount}</TableCell>
            </TableRow>
          )}
        </For>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell class="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function TableSimple() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead class="text-right">Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell class="font-medium">Sarah Chen</TableCell>
          <TableCell>sarah.chen@acme.com</TableCell>
          <TableCell class="text-right">Admin</TableCell>
        </TableRow>
        <TableRow>
          <TableCell class="font-medium">Marc Rodriguez</TableCell>
          <TableCell>marcus.rodriguez@acme.com</TableCell>
          <TableCell class="text-right">User</TableCell>
        </TableRow>
        <TableRow>
          <TableCell class="font-medium">Emily Watson</TableCell>
          <TableCell>emily.watson@acme.com</TableCell>
          <TableCell class="text-right">User</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function TableWithBadges() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-right">Priority</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell class="font-medium">Design homepage</TableCell>
          <TableCell>
            <span class="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
              Completed
            </span>
          </TableCell>
          <TableCell class="text-right">
            <span class="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              High
            </span>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell class="font-medium">Implement API</TableCell>
          <TableCell>
            <span class="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              In Progress
            </span>
          </TableCell>
          <TableCell class="text-right">
            <span class="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
              Medium
            </span>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell class="font-medium">Write tests</TableCell>
          <TableCell>
            <span class="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
              Pending
            </span>
          </TableCell>
          <TableCell class="text-right">
            <span class="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
              Low
            </span>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        variant="ghost"
        size="xs"
        class="size-8"
        aria-label="Open menu"
        icon={<MoreHorizontal />}
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const products = [
  { product: "Wireless Mouse", price: "$29.99" },
  { product: "Mechanical Keyboard", price: "$129.99" },
  { product: "USB-C Hub", price: "$49.99" },
];

function TableWithActions() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Price</TableHead>
          <TableHead class="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={products}>
          {(product) => (
            <TableRow>
              <TableCell class="font-medium">{product.product}</TableCell>
              <TableCell>{product.price}</TableCell>
              <TableCell class="text-right">
                <RowActions />
              </TableCell>
            </TableRow>
          )}
        </For>
      </TableBody>
    </Table>
  );
}

const people = [
  { value: "sarah", label: "Sarah Chen" },
  { value: "marcus", label: "Marc Rodriguez" },
  { value: "emily", label: "Emily Watson" },
  { value: "david", label: "David Kim" },
];

const tasks = [
  { task: "Design homepage", assignee: "sarah", status: "In Progress" },
  { task: "Implement API", assignee: "marcus", status: "Pending" },
  { task: "Write tests", assignee: "emily", status: "Not Started" },
];

function TableWithSelect() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={tasks}>
          {(item) => (
            <TableRow>
              <TableCell class="font-medium">{item.task}</TableCell>
              <TableCell>
                <Select defaultValue={item.assignee}>
                  <SelectTrigger size="sm" class="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <For each={people}>
                        {(person) => (
                          <SelectItem value={person.value}>
                            {person.label}
                          </SelectItem>
                        )}
                      </For>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{item.status}</TableCell>
            </TableRow>
          )}
        </For>
      </TableBody>
    </Table>
  );
}

function TableWithInput() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell class="font-medium">Wireless Mouse</TableCell>
          <TableCell>
            <NumberInput
              defaultValue={1}
              min={0}
              class="w-24"
              aria-label="Quantity"
            />
          </TableCell>
          <TableCell>$29.99</TableCell>
        </TableRow>
        <TableRow>
          <TableCell class="font-medium">Mechanical Keyboard</TableCell>
          <TableCell>
            <NumberInput
              defaultValue={2}
              min={0}
              class="w-24"
              aria-label="Quantity"
            />
          </TableCell>
          <TableCell>$129.99</TableCell>
        </TableRow>
        <TableRow>
          <TableCell class="font-medium">USB-C Hub</TableCell>
          <TableCell>
            <NumberInput
              defaultValue={1}
              min={0}
              class="w-24"
              aria-label="Quantity"
            />
          </TableCell>
          <TableCell>$49.99</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export const tableSections: Section[] = [
  {
    id: "table-basic",
    title: "Basic",
    description: "A basic table with a caption.",
    component: TableBasic,
  },
  {
    id: "table-footer",
    title: "With Footer",
    description: "Use TableFooter to add a footer to the table.",
    component: TableWithFooter,
  },
  {
    id: "table-simple",
    title: "Simple",
    description: "A simple table without a caption.",
    component: TableSimple,
  },
  {
    id: "table-badges",
    title: "With Badges",
    description: "Status and priority rendered as pills.",
    component: TableWithBadges,
  },
  {
    id: "table-actions",
    title: "With Actions",
    description: "A table showing actions for each row using a DropdownMenu.",
    component: TableWithActions,
  },
  {
    id: "table-select",
    title: "With Select",
    description: "Editable cells rendered with Select.",
    component: TableWithSelect,
  },
  {
    id: "table-input",
    title: "With Number Input",
    description:
      "Editable quantity cells rendered with NumberInput instead of the native number input.",
    component: TableWithInput,
  },
];
