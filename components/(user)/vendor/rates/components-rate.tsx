"use client";

import * as React from "react";
import { AddRateModal } from "./add-rate-modal";
import { EditRateModal } from "./edit-rate-modal";
import { useVendorRate } from "@/lib/hooks/useVendorRate";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/page-loader";
import type { VendorRate } from "@/types/vendor-rate.types";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const columns: ColumnDef<VendorRate>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "elementName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Element Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-left">{row.getValue("elementName")}</div>
    ),
  },
  {
    id: "description",
    header: () => <div className="w-full">Description</div>,
    cell: ({ row }) => {
      const desc = row.original.description;
      return <div className="font-medium">{desc}</div>;
    },
  },
  {
    accessorKey: "rateType",
    header: () => <div className="text-center">Rate Type</div>,
    cell: ({ row }) => (
      <div className="text-center capitalize">{row.getValue("rateType")}</div>
    ),
  },
  {
    id: "size",
    header: () => <div className="text-center">Size</div>,
    cell: ({ row }) => {
      const width = row.original.width;
      const height = row.original.height;
      
      if (width && height) {
        return (
          <div className="text-center font-medium">
            {width} x {height}
          </div>
        );
      }
      return <div className="text-center text-gray-400">-</div>;
    },
  },
  {
    accessorKey: "measurementUnit",
    header: ({ column }) => {
      return (
        <Button className="w-full" variant="ghost">
          Measurement Unit
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase text-center">{row.getValue("measurementUnit")}</div>
    ),
  },
  {
    accessorKey: "calculateUnit",
    header: ({ column }) => {
      return (
        <Button className="w-full" variant="ghost">
          Calculate Unit
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase text-center">{row.getValue("calculateUnit")}</div>
    ),
  },
  {
    accessorKey: "rate",
    header: ({ column }) => {
      return (
        <Button className="w-full" variant="ghost">
          Rate
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase text-center">{row.getValue("rate")}</div>
    ),
  },
  {
    accessorKey: "instruction",
    header: () => <div className="text-left">Instruction</div>,
    cell: ({ row }) => {
      const instruction = row.original.instruction;
      return (
        <div className="text-left text-sm text-muted-foreground">
          {instruction || "-"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    enableHiding: false,
    cell: ({ row, table }) => {
      const rate = row.original;
      const meta = table.options.meta as any;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(rate._id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => meta?.onEdit(rate)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => meta?.onDelete(rate._id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
function ComponentsRate() {
  const { rates, isLoading, isError, mutate } = useVendorRate();
  const { accessToken } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<VendorRate | null>(null);

  const handleEdit = (rate: VendorRate) => {
    setEditingRate(rate);
    setEditModalOpen(true);
  };

  const handleDelete = async (rateId: string) => {
    toast('Are you sure you want to delete this rate?', {
      // description: 'This action cannot be undone.',
      position: 'top-center',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const response = await fetch('/api/vendor/rates/delete', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ rateId }),
            });

            if (response.ok) {
              toast.success('Rate deleted successfully');
              mutate();
            } else {
              const result = await response.json();
              toast.error(result.error || 'Failed to delete rate');
            }
          } catch (error) {
            toast.error('Failed to delete rate');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };
  
  const table = useReactTable({
    data: rates || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    meta: {
      onEdit: handleEdit,
      onDelete: handleDelete,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  if (isLoading) {
    return (
      <div className="w-full p-4">
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Failed to load rates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-4 flex flex-col gap-4">
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={() => setModalOpen(true)}>Add New</Button>
        </div>
        <div className="w-full flex items-center ">
          <Input
            placeholder="Filter by element name..."
            value={(table.getColumn("elementName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("elementName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Rate Modal */}
      <AddRateModal open={modalOpen} onOpenChange={setModalOpen} />
      
      {/* Edit Rate Modal */}
      <EditRateModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen} 
        rate={editingRate}
      />
    </div>
  );
}

export default ComponentsRate;
