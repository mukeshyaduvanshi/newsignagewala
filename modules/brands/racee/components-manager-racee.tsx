"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { Racee } from "@/types/racee.types";
import { useManagerRacees } from "@/lib/hooks/useManagerRacees";
import {
  useManagerPermissions,
  type ModulePermissions,
} from "@/lib/hooks/useManagerPermissions";
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
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  LayoutGrid,
  List,
  MapPin,
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StartRaceeModal } from "@/modules/create-sites/start-racee-modal";
import { ViewRaceeModal } from "@/modules/create-sites/view-racee-modal";
import { StorePhotoModal } from "@/modules/create-sites/store-photo-modal";
import { StoreLocationModal } from "@/modules/create-sites/store-location-modal";
import { LocationFilter } from "@/components/ui/location-filter";
import { sortByDistance } from "@/lib/utils/location";

const statusColors = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const createColumns = (
  permissions: ModulePermissions,
  storePermissions: ModulePermissions,
  siteCreatePermissions: ModulePermissions,
): ColumnDef<Racee>[] => {
  const columns: ColumnDef<Racee>[] = [
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
      accessorKey: "storeImage",
      header: () => <div className="text-center">Image</div>,
      cell: ({ row, table }) => {
        const racee = row.original;
        const image =
          racee.newStorePhoto ||
          (typeof racee.storeId === "object" && racee.storeId?.storeImage
            ? racee.storeId.storeImage
            : "");
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
      accessorKey: "managerName",
      header: () => <div className="text-left">Manager</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("managerName")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusColors;
        const racee = row.original;
        return (
          <div className="text-center space-y-1">
            <Badge className={statusColors[status]} variant="outline">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            {status === "rejected" && racee.rejectionReason && (
              <div className="text-xs text-red-600 dark:text-red-400 max-w-xs">
                <span className="font-semibold">Reason:</span>{" "}
                {racee.rejectionReason}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "requestedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Requested Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("requestedAt"));
        return (
          <div className="text-left">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        );
      },
    },
    {
      accessorKey: "notes",
      header: () => <div className="text-left">Notes</div>,
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string;
        return (
          <div className="text-left text-sm text-muted-foreground max-w-xs truncate">
            {notes || "-"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row, table }) => {
        const racee = row.original;
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
                  <DropdownMenuItem onClick={() => meta?.onViewDetails(racee)}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {siteCreatePermissions.canAdd &&
                    racee.status === "pending" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => meta?.onStartRacee(racee)}
                        >
                          Add Sites
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                  {siteCreatePermissions.canAdd &&
                    racee.status === "pending" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => meta?.onViewRacee(racee)}
                        >
                          View Sites
                          {racee.sites && racee.sites.length > 0 && (
                            <Badge
                              variant="default"
                              className="ml-2 h-5 px-1.5 text-xs"
                            >
                              {racee.sites.length}
                            </Badge>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                  {siteCreatePermissions.canAdd &&
                    racee.status === "pending" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => meta?.onStorePhoto(racee)}
                        >
                          Take Store Photo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                  {siteCreatePermissions.canAdd &&
                    racee.status === "pending" &&
                    (!racee.storeLocation ||
                      !racee.storeLocation.coordinates ||
                      racee.storeLocation.coordinates.length === 0) && (
                      <>
                        <DropdownMenuItem
                          onClick={() => meta?.onStoreLocation(racee)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Store Location
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                  {permissions.canDelete && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => meta?.onDelete(racee._id)}
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

interface ComponentsManagerRaceeProps {
  permissions: ModulePermissions;
}

function ComponentsManagerRacee({ permissions }: ComponentsManagerRaceeProps) {
  const { accessToken } = useAuth();
  const storePermissions = useManagerPermissions("Stores");
  const siteCreatePermissions = useManagerPermissions("Created-Sites");
  // console.log({siteCreatePermissions});
  
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const { racees, isLoading, isError, mutate } = useManagerRacees(statusFilter);
  // console.log({racees, isError});

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
  const [previewImageUrl, setPreviewImageUrl] = React.useState("");
  const [startRaceeOpen, setStartRaceeOpen] = React.useState(false);
  const [viewRaceeOpen, setViewRaceeOpen] = React.useState(false);
  const [storePhotoOpen, setStorePhotoOpen] = React.useState(false);
  const [storeLocationOpen, setStoreLocationOpen] = React.useState(false);
  const [selectedRacee, setSelectedRacee] = React.useState<Racee | null>(null);
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [userLocation, setUserLocation] = React.useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  // console.log(selectedRacee);

  const handleViewDetails = (racee: Racee) => {
    // TODO: Implement view details modal
    toast.info("View details - Coming soon");
  };

  const handleStartRacee = (racee: Racee) => {
    setSelectedRacee(racee);
    setStartRaceeOpen(true);
  };

  const handleViewRacee = (racee: Racee) => {
    setSelectedRacee(racee);
    setViewRaceeOpen(true);
  };

  const handleStorePhoto = (racee: Racee) => {
    setSelectedRacee(racee);
    setStorePhotoOpen(true);
  };

  const handleStoreLocation = (racee: Racee) => {
    setSelectedRacee(racee);
    setStoreLocationOpen(true);
  };

  const handleUpdateStatus = async (raceeId: string, newStatus: string) => {
    if (!permissions.canEdit) {
      toast.error("You do not have permission to update status");
      return;
    }

    toast("Are you sure you want to complete this racee?", {
      position: "top-center",
      action: {
        label: "Yes",
        onClick: async () => {
          try {
            const response = await fetch("/api/manager/racee/update-status", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ raceeId, status: newStatus }),
            });

            if (response.ok) {
              toast.success(`Racee ${newStatus} successfully`);
              mutate();
            } else {
              const result = await response.json();
              toast.error(result.error || "Failed to update status");
            }
          } catch (error) {
            toast.error("Failed to update status");
          }
        },
      },
      cancel: {
        label: "No",
        onClick: () => {},
      },
    });
  };

  const handleDelete = async (raceeId: string) => {
    if (!permissions.canDelete) {
      toast.error("You do not have permission to delete");
      return;
    }

    toast("Are you sure you want to delete this racee?", {
      position: "top-center",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await fetch("/api/manager/racee/delete", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ raceeId }),
            });

            if (response.ok) {
              toast.success("Racee deleted successfully");
              mutate();
            } else {
              const result = await response.json();
              toast.error(result.error || "Failed to delete racee");
            }
          } catch (error) {
            toast.error("Failed to delete racee");
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
    () => createColumns(permissions, storePermissions, siteCreatePermissions),
    [permissions, storePermissions, siteCreatePermissions],
  );

  // Handle location filter change
  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value);
    if (value === "nearest" || value.includes(",")) {
      // If value contains coordinates, parse them
      if (value.includes(",")) {
        const [lat, lon] = value.split(",").map(Number);
        setUserLocation({ lat, lon });
      }
    } else {
      setUserLocation(null);
    }
  };

  // Sort racees by distance if location filter is active
  const sortedRacees = React.useMemo(() => {
    if (!racees) return [];

    if (userLocation && locationFilter !== "all") {
      return sortByDistance(
        racees,
        userLocation.lat,
        userLocation.lon,
        (racee) => {
          if (
            racee.storeLocation &&
            racee.storeLocation.coordinates &&
            racee.storeLocation.coordinates.length === 2
          ) {
            return {
              lon: racee.storeLocation.coordinates[0],
              lat: racee.storeLocation.coordinates[1],
            };
          }
          return null;
        },
      );
    }

    return racees;
  }, [racees, userLocation, locationFilter]);

  const table = useReactTable({
    data: sortedRacees || [],
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
      onViewDetails: handleViewDetails,
      onUpdateStatus: handleUpdateStatus,
      onDelete: handleDelete,
      onImageClick: handleImageClick,
      onStartRacee: handleStartRacee,
      onViewRacee: handleViewRacee,
      onStorePhoto: handleStorePhoto,
      onStoreLocation: handleStoreLocation,
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
        <TableSkeleton rows={8} columns={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Failed to load racees</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-4 flex flex-col gap-4">
        {/* Header with Live Indicator */}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Racee Requested</h2>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex items-center gap-2 min-w-fit pb-2">
            <Input
              placeholder="Search by store or manager..."
              value={
                (table.getColumn("storeName")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("storeName")?.setFilterValue(event.target.value)
              }
              className="w-48 shrink-0"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 shrink-0">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                {/* <SelectItem value="approved">Approved</SelectItem> */}
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <LocationFilter
              value={locationFilter}
              onValueChange={handleLocationFilterChange}
            />

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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
          </div>
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

        {viewMode === "list" ? (
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
                      No racees assigned yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const racee = row.original;
                return (
                  <div
                    key={racee._id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Full Width Image */}
                    {racee.newStorePhoto ||
                    (typeof racee.storeId === "object" &&
                      racee.storeId?.storeImage) ? (
                      <div
                        className="w-full h-48 overflow-hidden cursor-pointer hover:opacity-90 transition-all"
                        onClick={() => {
                          const imageToShow =
                            racee.newStorePhoto ||
                            (typeof racee.storeId === "object" &&
                            racee.storeId.storeImage
                              ? racee.storeId.storeImage
                              : "");
                          if (imageToShow) {
                            handleImageClick(imageToShow);
                          }
                        }}
                      >
                        <img
                          src={
                            racee.newStorePhoto ||
                            (typeof racee.storeId === "object" &&
                            racee.storeId.storeImage
                              ? racee.storeId.storeImage
                              : "")
                          }
                          alt="Store"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-sm text-gray-400">No Image</span>
                      </div>
                    )}

                    {/* Content Section */}
                    <div className="p-4">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={rowSelection[racee._id] || false}
                          onCheckedChange={(checked) => {
                            setRowSelection((prev) => ({
                              ...prev,
                              [racee._id]: !!checked,
                            }));
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate text-center">
                            {typeof racee.storeId === "object"
                              ? racee.storeId?.storeName
                              : "Unknown Store"}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-center">
                            <div className="flex items-center gap-1">
                              <p className="text-gray-600 truncate flex-1">
                                {typeof racee.storeId === "object"
                                  ? racee.storeId?.storeAddress
                                  : ""}
                              </p>
                              {racee.storeLocation &&
                                racee.storeLocation.coordinates &&
                                racee.storeLocation.coordinates.length > 0 && (
                                  <a
                                    href={`https://www.google.com/maps?q=${racee.storeLocation.coordinates[1]},${racee.storeLocation.coordinates[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 hover:scale-110 transition-transform"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MapPin className="h-4 w-4 text-blue-500 cursor-pointer" />
                                  </a>
                                )}
                            </div>
                            <p className="text-gray-600">
                              {typeof racee.storeId === "object"
                                ? `${racee.storeId?.storeCity}, ${racee.storeId?.storeState} - ${racee.storeId?.storePincode}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t space-y-2">
                        {/* <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Manager:
                        </span>
                        <span className="text-sm font-semibold">
                          {typeof racee.teamId === "object"
                            ? racee.teamId?.name
                            : typeof racee.managerUserId === "object"
                            ? racee.managerUserId?.name
                            : "Unknown"}
                        </span>
                      </div>
                      {typeof racee.managerUserId === "object" &&
                        racee.managerUserId?.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Phone:
                            </span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={`tel:${racee.managerUserId.phone}`}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    {racee.managerUserId.phone}
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{racee.managerUserId.phone}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      {typeof racee.managerUserId === "object" &&
                        racee.managerUserId?.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Email:
                            </span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={`mailto:${racee.managerUserId.email}`}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    {(() => {
                                      const email = racee.managerUserId
                                        .email as string;
                                      const [local, domain] = email.split("@");
                                      if (!domain) return email;
                                      const firstFive = local.slice(0, 5);
                                      const displayLocal =
                                        local.length > 5
                                          ? `${firstFive}...`
                                          : local;
                                      return `${displayLocal}@${domain}`;
                                    })()}
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{racee.managerUserId.email}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )} */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Status:
                          </span>
                          <Badge
                            className={
                              statusColors[
                                racee.status as keyof typeof statusColors
                              ]
                            }
                            variant="outline"
                          >
                            {racee.status.charAt(0).toUpperCase() +
                              racee.status.slice(1)}
                          </Badge>
                        </div>
                        {racee.status === "rejected" &&
                          racee.rejectionReason && (
                            <div className="pt-2 pb-2 px-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                                Rejection Reason:
                              </p>
                              <p className="text-sm text-red-600 dark:text-red-400">
                                {racee.rejectionReason}
                              </p>
                            </div>
                          )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Requested on:
                          </span>
                          <span className="text-sm">
                            {new Date(racee.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {racee.notes && (
                          <div className="pt-2">
                            <span className="text-sm font-medium text-gray-600">
                              Notes:
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              {racee.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t space-y-3">
                        {/* Action Buttons Row */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center gap-2 w-full">
                            {siteCreatePermissions.canAdd &&
                              (racee.status === "pending" ||
                                racee.status === "rejected") && (
                                <Button
                                  size="sm"
                                  className="w-6/12"
                                  variant="outline"
                                  onClick={() => handleStorePhoto(racee)}
                                >
                                  Take Store Photo
                                </Button>
                              )}
                            {siteCreatePermissions.canAdd &&
                              racee.status === "pending" &&
                              (!racee.storeLocation ||
                                !racee.storeLocation.coordinates ||
                                racee.storeLocation.coordinates.length ===
                                  0) && (
                                <Button
                                  className="w-6/12"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStoreLocation(racee)}
                                >
                                  <MapPin className="h-4 w-4 mr-1" />
                                  Location
                                </Button>
                              )}
                            {racee.storeLocation &&
                              racee.storeLocation.coordinates &&
                              racee.storeLocation.coordinates.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 cursor-default w-6/12"
                                  disabled
                                >
                                  <MapPin className="h-4 w-4 mr-1" />
                                  Saved
                                </Button>
                              )}
                          </div>
                          <div className="flex gap-2 justify-between items-center">
                            {siteCreatePermissions.canAdd &&
                              (racee.status === "pending" ||
                                racee.status === "rejected") && (
                                <Button
                                  size="sm"
                                  className="w-6/12"
                                  variant="outline"
                                  onClick={() => handleStartRacee(racee)}
                                >
                                  Add Site
                                </Button>
                              )}
                            {siteCreatePermissions.canAdd &&
                              (racee.status === "pending" ||
                                racee.status === "rejected") && (
                                <Button
                                  size="sm"
                                  className="w-6/12 relative"
                                  variant="outline"
                                  onClick={() => handleViewRacee(racee)}
                                >
                                  View Sites
                                  {racee.sites && racee.sites.length > 0 && (
                                    <Badge
                                      variant="default"
                                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                    >
                                      {racee.sites.length}
                                    </Badge>
                                  )}
                                </Button>
                              )}
                          </div>
                        </div>
                        {/* Horizontal Break */}
                        <hr className="my-4 bg-gray-600" />

                        {/* Redo Button */}
                        <div>
                          {siteCreatePermissions.canAdd &&
                            racee.status === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  handleUpdateStatus(racee._id, "pending")
                                }
                              >
                                Redo Racee
                              </Button>
                            )}
                        </div>

                        {/* Complete Button Row */}
                        <div className="flex justify-stretch w-full">
                          {siteCreatePermissions.canAdd &&
                            (racee.status === "pending" ||
                              racee.status === "rejected") && (
                              <div className="flex items-center justify-between w-[97%]">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className=" w-full"
                                  onClick={() =>
                                    handleUpdateStatus(racee._id, "completed")
                                  }
                                >
                                  Complete Racee
                                </Button>
                                {(permissions.canEdit ||
                                  permissions.canDelete) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => handleViewDetails(racee)}
                                      >
                                        View Details
                                      </DropdownMenuItem>
                                      {permissions.canDelete && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() =>
                                              handleDelete(racee._id)
                                            }
                                          >
                                            Delete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No racees assigned yet.
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {viewMode === "list" ? (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            ) : (
              <>
                {
                  Object.keys(rowSelection).filter((k) => rowSelection[k])
                    .length
                }{" "}
                of {table.getFilteredRowModel().rows.length} racee(s) selected.
              </>
            )}
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
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="w-full">
          <img
            src={previewImageUrl}
            alt="Store Preview"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>

      {/* Start Racee Modal */}
      {selectedRacee && (
        <StartRaceeModal
          open={startRaceeOpen}
          onOpenChange={setStartRaceeOpen}
          raceeId={selectedRacee._id}
          storeId={
            typeof selectedRacee.storeId === "object"
              ? selectedRacee.storeId._id
              : selectedRacee.storeId
          }
          // parentId={typeof selectedRacee.storeId === 'object' && selectedRacee.storeId.parentId ? selectedRacee.storeId.parentId : ''}
          parentId={selectedRacee.parentId ? selectedRacee.parentId : ""}
          storeDetails={selectedRacee.storeId}
          onSuccess={mutate}
        />
      )}

      {/* View Racee Modal */}
      {selectedRacee && (
        <ViewRaceeModal
          open={viewRaceeOpen}
          onOpenChange={setViewRaceeOpen}
          sites={selectedRacee.sites || []}
          raceeStatus={selectedRacee.status}
          raceeId={selectedRacee._id}
          onSuccess={mutate}
        />
      )}

      {/* Store Photo Modal */}
      {selectedRacee && (
        <StorePhotoModal
          open={storePhotoOpen}
          onOpenChange={setStorePhotoOpen}
          raceeId={selectedRacee._id}
          onSuccess={mutate}
        />
      )}

      {/* Store Location Modal */}
      {selectedRacee && (
        <StoreLocationModal
          open={storeLocationOpen}
          onOpenChange={setStoreLocationOpen}
          raceeId={selectedRacee._id}
          onSuccess={mutate}
        />
      )}
    </div>
  );
}

export default ComponentsManagerRacee;
