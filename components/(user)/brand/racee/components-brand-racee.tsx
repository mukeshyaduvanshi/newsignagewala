"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { Racee } from "@/types/racee.types";
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
import { ViewSitesModal } from "./view-sites-modal";
import { RejectReasonModal } from "./reject-reason-modal";

const statusColors = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export const columns: ColumnDef<Racee>[] = [
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
      return (
        <div className="text-center">
          <Badge className={statusColors[status]} variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
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
              {racee.sites && racee.sites.length > 0 && (
                <>
                  <DropdownMenuItem onClick={() => meta?.onViewSites(racee)}>
                    View Sites
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {racee.status === "pending" && (
                <>
                  <DropdownMenuItem
                    onClick={() => meta?.onUpdateStatus(racee._id, "approved")}
                  >
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => meta?.onUpdateStatus(racee._id, "rejected")}
                  >
                    Reject
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => meta?.onDelete(racee._id)}
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

function ComponentsBrandRacee() {
  const { accessToken } = useAuth();
  const [racees, setRacees] = React.useState<Racee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("grid");
  const [imagePreviewOpen, setImagePreviewOpen] = React.useState(false);
  const [previewImageUrl, setPreviewImageUrl] = React.useState("");
  const [viewSitesOpen, setViewSitesOpen] = React.useState(false);
  const [selectedRacee, setSelectedRacee] = React.useState<Racee | null>(null);
  const [rejectReasonOpen, setRejectReasonOpen] = React.useState(false);
  const [raceeToReject, setRaceeToReject] = React.useState<string | null>(null);
  const [isRejecting, setIsRejecting] = React.useState(false);

  React.useEffect(() => {
    if (accessToken) {
      fetchRacees();
    }
  }, [accessToken, statusFilter]);

  const fetchRacees = async () => {
    // setIsLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/brand/racee"
          : `/api/brand/racee?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setRacees(result.data || []);
      } else {
        toast.error("Failed to fetch racees");
      }
    } catch (error) {
      console.error("Error fetching racees:", error);
      toast.error("Failed to fetch racees");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setImagePreviewOpen(true);
  };

  const handleViewDetails = (racee: Racee) => {
    // TODO: Implement view details modal
    toast.info("View details - Coming soon");
  };

  const handleViewSites = (racee: Racee) => {
    setSelectedRacee(racee);
    setViewSitesOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!raceeToReject) return;

    setIsRejecting(true);
    try {
      const response = await fetch("/api/brand/racee/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          raceeId: raceeToReject,
          rejectionReason: reason,
        }),
      });

      if (response.ok) {
        toast.success("Racee rejected successfully");
        setRejectReasonOpen(false);
        setRaceeToReject(null);
        fetchRacees();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to reject racee");
      }
    } catch (error) {
      toast.error("Failed to reject racee");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleUpdateStatus = async (raceeId: string, newStatus: string) => {
    // If rejecting, open the reason modal
    if (newStatus === "rejected") {
      setRaceeToReject(raceeId);
      setRejectReasonOpen(true);
      return;
    }

    // If approving, use the approve endpoint which creates sites
    if (newStatus === "approved") {
      try {
        const response = await fetch("/api/brand/racee/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ raceeId }),
        });

        if (response.ok) {
          const result = await response.json();
          toast.success(
            result.message || "Racee approved and sites created successfully",
          );
          fetchRacees();
        } else {
          const result = await response.json();
          toast.error(result.error || "Failed to approve racee");
        }
      } catch (error) {
        toast.error("Failed to approve racee");
      }
      return;
    }

    // For other status updates, use the regular update endpoint
    try {
      const response = await fetch("/api/brand/racee/update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ raceeId, status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Racee ${newStatus} successfully`);
        fetchRacees();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (raceeId: string) => {
    toast("Are you sure you want to delete this racee?", {
      position: "top-center",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const response = await fetch("/api/brand/racee/delete", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ raceeId }),
            });

            if (response.ok) {
              toast.success("Racee deleted successfully");
              fetchRacees();
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

  const table = useReactTable({
    data: racees || [],
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
      onViewSites: handleViewSites,
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
        <TableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Racee Requests</h2>
          </div>
        </div>

        <div className="w-full flex items-center gap-2">
          <Input
            placeholder="Search by store or manager..."
            value={
              (table.getColumn("storeName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("storeName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
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
                      No racee requests found.
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
                        <div className="flex items-center justify-between">
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
                                        const [local, domain] =
                                          email.split("@");
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
                          )}
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

                      <div className="mt-4 flex items-center justify-between pt-4 border-t">
                        <div className="flex gap-2">
                          {racee.sites && racee.sites.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewSites(racee)}
                            >
                              View Sites
                            </Button>
                          )}
                          {racee.status === "completed" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateStatus(racee._id, "approved")
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateStatus(racee._id, "rejected")
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(racee)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(racee._id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No racee requests found.
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
        <DialogContent className="max-w-3xl">
          <img
            src={previewImageUrl}
            alt="Store Preview"
            className="max-h-[90vh] rounded mx-auto object-contain"
          />
        </DialogContent>
      </Dialog>

      {/* View Sites Modal */}
      {selectedRacee && (
        <ViewSitesModal
          open={viewSitesOpen}
          onOpenChange={setViewSitesOpen}
          sites={selectedRacee.sites || []}
          newStorePhoto={selectedRacee.newStorePhoto}
          storeLocation={selectedRacee.storeLocation}
          storeName={
            typeof selectedRacee.storeId === "object"
              ? selectedRacee.storeId?.storeName
              : "Unknown Store"
          }
        />
      )}

      {/* Reject Reason Modal */}
      <RejectReasonModal
        open={rejectReasonOpen}
        onOpenChange={setRejectReasonOpen}
        onConfirm={handleRejectConfirm}
        isLoading={isRejecting}
      />
    </div>
  );
}

export default ComponentsBrandRacee;
