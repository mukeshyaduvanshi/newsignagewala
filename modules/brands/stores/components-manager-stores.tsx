"use client";

import * as React from "react";
import { useManagerStores } from "@/lib/hooks/useManagerStores";
import { useAuth } from "@/lib/context/AuthContext";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { Store } from "@/types/store.types";
import type { ModulePermissions } from "@/lib/hooks/useManagerPermissions";
import { AddStoreModal } from "./add-store-modal";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MapPin,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { EditStoreModal } from "./edit-store-modal";
import { BulkAddStoreModal } from "./bulk-add-store-modal";
import { UnmappedStoresModal } from "./unmapped-stores-modal";
import { StoreLocationsMap } from "@/components/maps/store-locations-map";

// Image Preview Modal Component
function ImagePreviewModal({
  open,
  onOpenChange,
  imageUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <img
          src={imageUrl}
          alt="Store Preview"
          className="w-full h-auto rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}

const createColumns = (permissions: ModulePermissions): ColumnDef<Store>[] => {
  const columns: ColumnDef<Store>[] = [
    {
      accessorKey: "storeImage",
      header: () => <div className="text-center">Image</div>,
      cell: ({ row, table }) => {
        const image = row.getValue("storeImage") as string;
        const meta = table.options.meta as any;
        return (
          <div className="flex justify-center">
            {image ? (
              <div
                className="h-12 w-12 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => meta?.onImageClick(image)}
              >
                <img
                  src={image}
                  alt="Store"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-400">No Image</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Store Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("storeName")}</div>
      ),
    },
    {
      accessorKey: "storePhone",
      header: () => <div className="text-center">Phone</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("storePhone")}</div>
      ),
    },
    {
      id: "address",
      header: () => <div className="text-left">Address</div>,
      cell: ({ row }) => {
        const store = row.original;
        return (
          <div className="text-left max-w-md">
            <div className="font-medium">{store.storeAddress}</div>
            <div className="text-sm text-gray-600">
              {store.storeCity}, {store.storeState} - {store.storePincode}
            </div>
            <div className="text-xs text-gray-500">{store.storeCountry}</div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: true,
      cell: ({ row, table }) => {
        const store = row.original;
        const meta = table.options.meta as any;
        return (
          <div className="text-right">
            {permissions.canEdit || permissions.canDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {permissions.canEdit && (
                    // <DropdownMenuItem onClick={() => meta?.onEdit(store)}>
                    <DropdownMenuItem onClick={() => meta?.onEdit(store)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {permissions.canDelete && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => meta?.onDelete(store._id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        );
      },
    },
  ];

  return columns;
};

interface ComponentsManagerStoresProps {
  permissions: ModulePermissions;
}

function ComponentsManagerStores({
  permissions,
}: ComponentsManagerStoresProps) {
  const { accessToken } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
  const [previewImageUrl, setPreviewImageUrl] = React.useState("");
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingStore, setEditingStore] = React.useState<Store | null>(null);
  const [bulkAddModalOpen, setBulkAddModalOpen] = React.useState(false);
  const [unmappedModalOpen, setUnmappedModalOpen] = React.useState(false);
  const [storeMapOpen, setStoreMapOpen] = React.useState(false);

  // Search state with debounce
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { stores, isLoading, isError, isSearching, mutate } =
    useManagerStores(debouncedSearch);

  const storeLocations = React.useMemo(
    () =>
      (stores || [])
        .filter(
          (store) =>
            Array.isArray(store.storeLocation?.coordinates) &&
            store.storeLocation.coordinates.length === 2
        )
        .map((store) => ({
          storeName: store.storeName,
          coordinates: store.storeLocation!.coordinates,
        })),
    [stores]
  );

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setEditModalOpen(true);
  };

  const handleDelete = async (storeId: string) => {
    toast("Are you sure you want to delete this store?", {
      position: "top-center",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await fetch("/api/manager/stores/delete", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ storeId }),
            });
            if (response.ok) {
              toast.success("Store deleted successfully.");
              mutate();
            }
          } catch (error) {
            toast.error("Failed to delete store.");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const columns = React.useMemo(
    () => createColumns(permissions),
    [permissions]
  );

  const table = useReactTable({
    data: stores || [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      onImageClick: handleImageClick,
      accessToken: accessToken,
      onEdit: handleEdit,
      onDelete: handleDelete,
    },
    state: {
      sorting,
      columnVisibility,
    },
  });

  if (isLoading) {
    return (
      <div className="w-full p-4">
        <TableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Failed to load stores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-4 flex flex-col gap-4">
        {/* Header with Live Indicator */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Stores</h2>
          </div>
        </div>

        {/* Add Store Button */}
        <div className="flex items-center gap-2">
          {permissions.canAdd && (
            <Button variant="outline" onClick={() => setAddModalOpen(true)}>
              Add New
            </Button>
          )}
          {permissions.canBulk && (
            <Button variant="outline" onClick={() => setBulkAddModalOpen(true)}>
              Bulk Add
            </Button>
          )}
          <Button variant="outline" onClick={() => setUnmappedModalOpen(true)}>
            UnMapped Stores
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (storeLocations.length === 0) {
                toast.error("No captured store locations available to show on the map");
                return;
              }
              setStoreMapOpen(true);
            }}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Map ({storeLocations.length})
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="w-full flex items-center">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search stores..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pr-8 pl-8"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              </div>
            )}
          </div>
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

        {/* Permissions Info */}
        <div className="text-xs text-gray-600 dark:text-gray-400 flex gap-3">
          <span>Permissions:</span>
          {permissions.canView && (
            <span className="text-green-600">✓ View</span>
          )}
          {permissions.canAdd && <span className="text-green-600">✓ Add</span>}
          {permissions.canEdit && (
            <span className="text-green-600">✓ Edit</span>
          )}
          {permissions.canDelete && (
            <span className="text-green-600">✓ Delete</span>
          )}
          {permissions.canBulk && (
            <span className="text-green-600">✓ Bulk</span>
          )}
          {permissions.canRequest && (
            <span className="text-green-600">✓ Request</span>
          )}
        </div>

        {/* Table */}
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
                  <TableRow key={row.id}>
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
                    No stores found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredRowModel().rows.length} store(s) found
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        imageUrl={previewImageUrl}
      />

      {/* Add Store Modal */}
      {permissions.canAdd && (
        <AddStoreModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      )}
      {/* Edit Store Modal */}
      {permissions.canEdit && editingStore && (
        <EditStoreModal
          store={editingStore}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
        />
      )}
      {/* Bulk Add Store Modal */}
      {permissions.canBulk && (
        <BulkAddStoreModal
          open={bulkAddModalOpen}
          onOpenChange={setBulkAddModalOpen}
          onSuccess={() => {
            mutate(); // Refresh the stores list
          }}
        />
      )}
      {/* Unmapped Stores Modal */}
      <UnmappedStoresModal
        open={unmappedModalOpen}
        onOpenChange={setUnmappedModalOpen}
        onSuccess={() => {
          mutate(); // Refresh the stores list
        }}
      />

      <StoreLocationsMap
        locations={storeLocations}
        open={storeMapOpen}
        onOpenChange={setStoreMapOpen}
      />
    </div>
  );
}

export default ComponentsManagerStores;
