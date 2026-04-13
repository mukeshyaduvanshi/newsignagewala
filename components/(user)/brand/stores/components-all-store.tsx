"use client";

import * as React from "react";
import { AddStoreModal } from "./add-store-modal";
import { EditStoreModal } from "./edit-store-modal";
import { BulkAddStoreModal } from "./bulk-add-store-modal";
import { AssignManagerModal } from "./assign-manager-modal";
import { ReplaceManagerModal } from "./replace-manager-modal";
import { RequestRaceeModal } from "./request-racee-modal";
import { useStores } from "@/lib/hooks/useStores";
import { useAuth } from "@/lib/context/AuthContext";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { Store } from "@/types/store.types";
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
  ArrowRightLeft,
  ChevronDown,
  MapPin,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

export const columns: ColumnDef<Store>[] = [
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
    cell: ({ row, table }) => {
      const store = row.original;
      const image = store.storeImage;
      const storeName = store.storeName;
      const meta = table.options.meta as any;

      return (
        <div className="flex items-center gap-3">
          {/* Store Image */}
          <div className="flex items-center justify-center shrink-0">
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
          {/* Store Name */}
          <div className="font-medium">{storeName}</div>
        </div>
      );
    },
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
    id: "assignedManagers",
    header: () => <div className="text-center">Assigned Managers</div>,
    cell: ({ row, table }) => {
      const store = row.original;
      const meta = table.options.meta as any;
      
      // Get managers from batched data instead of individual API call
      const managers = meta?.allManagersMap?.[store._id] || [];
      const isManagerLoading = meta?.isLoadingAllManagers || false;
      const fetchError = meta?.managersFetchError || false;

      const handleDelete = async (assignment: any) => {
        if (assignment.isStoreUsed) {
          toast.error(
            "Cannot remove it's currently in use as a working for a store",
          );
          return;
        }

        try {
          const response = await fetch("/api/brand/stores/assign-manager", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${meta?.accessToken}`,
            },
            body: JSON.stringify({ assignmentId: assignment._id }),
          });

          if (response.ok) {
            toast.success("Manager removed successfully");
            meta?.onRefresh?.();
          } else {
            const result = await response.json();
            toast.error(result.error || "Failed to remove manager");
          }
        } catch (error) {
          toast.error("Failed to remove manager");
        }
      };

      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-sm ${fetchError ? "text-red-600" : ""}`}
              >
                {isManagerLoading 
                  ? "Loading..." 
                  : fetchError 
                  ? "Error" 
                  : `${managers.length || 0} Manager(s)`}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="w-64">
              {isManagerLoading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : fetchError ? (
                <div className="text-center py-4">
                  <div className="text-sm text-red-600 mb-2">Failed to load managers</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => meta?.onRetryManagers?.()}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : managers.length > 0 ? (
                <div className="p-2">
                  <DropdownMenuLabel>Assigned Managers</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {managers.map((assignment: any) => (
                    <div
                      key={assignment._id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {assignment.managerUserId?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.teamId?.managerType || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            meta?.onReplaceManager(assignment);
                          }}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(assignment);
                          }}
                          // disabled={assignment.isStoreUsed}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No managers assigned
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    enableHiding: false,
    cell: ({ row, table }) => {
      const store = row.original;
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
              <DropdownMenuItem onClick={() => meta?.onAssignManager(store)}>
                Assign Manager
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => meta?.onEdit(store)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => meta?.onDelete(store._id)}
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

function ComponentsAllStore() {
  const { accessToken } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const [bulkAddModalOpen, setBulkAddModalOpen] = React.useState(false);
  const [assignManagerModalOpen, setAssignManagerModalOpen] =
    React.useState(false);
  const [singleStoreForAssignment, setSingleStoreForAssignment] =
    React.useState<Store | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingStore, setEditingStore] = React.useState<Store | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
  const [previewImageUrl, setPreviewImageUrl] = React.useState("");
  const [assignmentRefreshTrigger, setAssignmentRefreshTrigger] =
    React.useState(0);
  const [replaceManagerModalOpen, setReplaceManagerModalOpen] =
    React.useState(false);
  const [replacingAssignment, setReplacingAssignment] =
    React.useState<any>(null);
  const [requestRaceeModalOpen, setRequestRaceeModalOpen] =
    React.useState(false);
  const [storeMapOpen, setStoreMapOpen] = React.useState(false);

  // Search state with debounce
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Batch manager data - SINGLE API call for ALL stores
  const [allManagersMap, setAllManagersMap] = React.useState<Record<string, any[]>>({});
  const [isLoadingAllManagers, setIsLoadingAllManagers] = React.useState(false);
  const [managersFetchError, setManagersFetchError] = React.useState(false);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Use the hook with debounced search
  const { stores, isLoading, isError, isSearching, mutate } =
    useStores(debouncedSearch);

  const storeLocations = React.useMemo(
    () =>
      (stores || [])
        .filter(
          (store) =>
            Array.isArray(store.storeLocation?.coordinates) &&
            store.storeLocation.coordinates.length === 2,
        )
        .map((store) => ({
          storeName: store.storeName,
          coordinates: store.storeLocation!.coordinates,
        })),
    [stores],
  );

  // Fetch ALL managers for ALL stores in ONE API call - prevents overwhelming server
  const fetchAllManagers = React.useCallback(async (retryCount = 0) => {
    if (!stores || stores.length === 0) {
      setAllManagersMap({});
      return;
    }

    setIsLoadingAllManagers(true);
    setManagersFetchError(false);

    try {
      // Fetch all assignments in one call
      const response = await fetch("/api/brand/stores/assign-manager", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const assignments = result.data || [];

        // Group managers by storeId for quick lookup
        const managersMap: Record<string, any[]> = {};
        assignments.forEach((assignment: any) => {
          const storeId = assignment.storeId?._id || assignment.storeId;
          if (!managersMap[storeId]) {
            managersMap[storeId] = [];
          }
          managersMap[storeId].push(assignment);
        });

        setAllManagersMap(managersMap);
        setManagersFetchError(false);
      } else {
        console.error(`Failed to fetch managers: ${response.status}`);
        setManagersFetchError(true);

        // Auto-retry once for server errors
        if (response.status >= 500 && retryCount < 1) {
          console.log("Retrying manager fetch...");
          setTimeout(() => fetchAllManagers(retryCount + 1), 2000);
        }
      }
    } catch (error) {
      console.error("Error fetching all managers:", error);
      setManagersFetchError(true);

      // Auto-retry once for network errors
      if (retryCount < 1) {
        console.log("Retrying after network error...");
        setTimeout(() => fetchAllManagers(retryCount + 1), 2000);
      }
    } finally {
      setIsLoadingAllManagers(false);
    }
  }, [stores, accessToken]);

  // Fetch all managers when stores load or refresh trigger changes
  React.useEffect(() => {
    if (stores && stores.length > 0 && accessToken) {
      fetchAllManagers();
    }
  }, [stores, assignmentRefreshTrigger, accessToken]);

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setEditModalOpen(true);
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  const handleDelete = async (storeId: string) => {
    toast("Are you sure you want to delete this store?", {
      position: "top-center",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await fetch("/api/brand/stores/delete", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ storeId }),
            });

            if (response.ok) {
              toast.success("Store deleted successfully");
              mutate();
            } else {
              const result = await response.json();
              toast.error(result.error || "Failed to delete store");
            }
          } catch (error) {
            toast.error("Failed to delete store");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const table = useReactTable({
    data: stores || [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    meta: {
      onEdit: handleEdit,
      onDelete: handleDelete,
      onImageClick: handleImageClick,
      onAssignManager: (store: Store) => {
        // Set this single store for assignment
        setSingleStoreForAssignment(store);
        setAssignManagerModalOpen(true);
      },
      onReplaceManager: (assignment: any) => {
        setReplacingAssignment(assignment);
        setReplaceManagerModalOpen(true);
      },
      accessToken: accessToken,
      onRefresh: () => {
        mutate();
        setAssignmentRefreshTrigger((prev) => prev + 1);
      },
      assignmentRefreshTrigger: assignmentRefreshTrigger,
      // Pass batched manager data to all rows
      allManagersMap: allManagersMap,
      isLoadingAllManagers: isLoadingAllManagers,
      managersFetchError: managersFetchError,
      onRetryManagers: () => fetchAllManagers(),
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) {
    return (
      <div className="w-full p-4">
        <TableSkeleton rows={8} columns={7} />
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
        {" "}
        {/* Header with Live Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Stores</h2>
          </div>
        </div>
        <div className="flex items-center mt-4 gap-2 overflow-x-auto scrollbar-hide pb-2">
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="whitespace-nowrap"
          >
            Add New
          </Button>
          <Button
            variant="outline"
            onClick={() => setBulkAddModalOpen(true)}
            className="whitespace-nowrap"
          >
            Bulk Add
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const selectedRows = table.getFilteredSelectedRowModel().rows;
              if (selectedRows.length === 0) {
                toast.error("Please select at least one store");
                return;
              }
              setAssignManagerModalOpen(true);
            }}
            className="whitespace-nowrap"
          >
            Add Managers ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const selectedRows = table.getFilteredSelectedRowModel().rows;
              if (selectedRows.length === 0) {
                toast.error("Please select at least one store");
                return;
              }
              setRequestRaceeModalOpen(true);
            }}
            className="whitespace-nowrap"
          >
            Request Racee ({table.getFilteredSelectedRowModel().rows.length})
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
            className="whitespace-nowrap"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Map ({storeLocations.length})
          </Button>
        </div>
        <div className="w-full flex items-center ">
          <div className="relative max-w-sm">
            <Input
              placeholder="Search stores..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pr-10"
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
                              header.getContext(),
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
                          cell.getContext(),
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

      {/* Add Store Modal */}
      <AddStoreModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Bulk Add Store Modal */}
      <BulkAddStoreModal
        open={bulkAddModalOpen}
        onOpenChange={setBulkAddModalOpen}
        onSuccess={() => {
          mutate(); // Refresh the stores list
        }}
      />

      {/* Edit Store Modal */}
      <EditStoreModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        store={editingStore}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        imageUrl={previewImageUrl}
      />

      {/* Assign Manager Modal */}
      <AssignManagerModal
        open={assignManagerModalOpen}
        onOpenChange={(open) => {
          setAssignManagerModalOpen(open);
          if (!open) {
            setSingleStoreForAssignment(null);
          }
        }}
        selectedStores={
          singleStoreForAssignment
            ? [singleStoreForAssignment]
            : table
                .getFilteredSelectedRowModel()
                .rows.map((row) => row.original)
        }
        onSuccess={() => {
          table.resetRowSelection();
          setSingleStoreForAssignment(null);
          mutate();
          setAssignmentRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Replace Manager Modal */}
      <ReplaceManagerModal
        open={replaceManagerModalOpen}
        onOpenChange={(open) => {
          setReplaceManagerModalOpen(open);
          if (!open) {
            setReplacingAssignment(null);
          }
        }}
        currentAssignment={replacingAssignment}
        onSuccess={() => {
          mutate();
          setAssignmentRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Request Racee Modal */}
      <RequestRaceeModal
        open={requestRaceeModalOpen}
        onOpenChange={(open) => {
          setRequestRaceeModalOpen(open);
        }}
        selectedStores={table
          .getFilteredSelectedRowModel()
          .rows.map((row) => row.original)}
        onSuccess={() => {
          table.resetRowSelection();
          mutate();
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

export default ComponentsAllStore;
