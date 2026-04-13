"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { SearchInput } from "./search-input";
import { useVendors, Vendor } from "@/hooks/use-vendors";
import { VerificationModal } from "./verification-modal";

export type User = Vendor;

export const columns: ColumnDef<User>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("phone")}</div>,
  },
  {
    accessorKey: "userType",
    header: "User Type",
    cell: ({ row }) => {
      const userType = row.getValue("userType") as string;
      return (
        <Badge variant={userType === "brand" ? "default" : "secondary"}>
          {userType === "brand" ? "Brand" : "Vendor"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "businessName",
    header: "Business Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("businessName") || "-"}</div>
    ),
  },
  {
    accessorKey: "adminApproval",
    header: "Status",
    cell: ({ row }) => {
      const approved = row.getValue("adminApproval") as boolean;
      return (
        <Badge variant={approved ? "default" : "destructive"}>
          {approved ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => {
      return <Button variant="ghost">Action</Button>;
    },
    cell: ({ row, table }) => {
      const user = row.original;
      const component = (table.options.meta as any)?.component;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => component?.openViewDialog(user)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => component?.openVerificationModal(user)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Documents
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!user.adminApproval && (
              <DropdownMenuItem
                onClick={() => component?.handleApproval(user.id, true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
            )}
            {user.adminApproval && (
              <DropdownMenuItem
                onClick={() => component?.handleApproval(user.id, false)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const ComponentsVendors = () => {
  const { accessToken } = useAuth();
  const [approvalFilter, setApprovalFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [userToVerify, setUserToVerify] = useState<User | null>(null);

  // Use SWR hook for data fetching with SSE
  const { data, isLoading, error, mutate } = useVendors({
    approvalStatus: approvalFilter,
    search: searchQuery,
    page: currentPage,
    limit: 10,
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [approvalFilter, searchQuery]);

  // Handle approval/rejection
  const handleApproval = async (userId: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          adminApproval: approve,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update approval status");
      }

      toast.success(
        `User ${approve ? "approved" : "rejected"} successfully!`
      );

      // Mutate to refresh data (SSE will also update in real-time)
      mutate();
    } catch (error: any) {
      console.error("Error updating approval:", error);
      toast.error(error.message || "Failed to update approval status");
    }
  };

  // Open view dialog
  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  // Open verification modal
  const openVerificationModal = (user: User) => {
    setUserToVerify(user);
    setVerificationModalOpen(true);
  };

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle page navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (data && currentPage < data.pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const table = useReactTable({
    data: data?.users || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: data?.pagination.totalPages || 1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: 10,
      },
    },
    meta: {
      component: {
        openViewDialog,
        handleApproval,
        openVerificationModal,
      },
    },
  });

  return (
    <>
      <div className="w-full flex flex-col my-4">
        <div className="mx-4">
          <div className="flex items-center py-4 gap-4">
            <SearchInput
              placeholder="Search vendors..."
              onSearch={handleSearch}
              debounceMs={500}
              className="max-w-sm"
            />
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-destructive">
                <p>Error loading users. Please try again.</p>
              </div>
            ) : (
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
                        className={
                          !row.original.adminApproval
                            ? "opacity-70 bg-muted/30"
                            : ""
                        }
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
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-muted-foreground flex-1 text-sm">
              Showing{" "}
              {data && data.users.length > 0
                ? (currentPage - 1) * 10 + 1
                : 0}{" "}
              to {(currentPage - 1) * 10 + (data?.users.length || 0)} of{" "}
              {data?.pagination.total || 0} results
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Page {currentPage} of {data?.pagination.totalPages || 1}
              </span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={
                    !data ||
                    currentPage >= data.pagination.totalPages ||
                    isLoading
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View User Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">User Type</Label>
                  <Badge
                    variant="default"
                    className="w-fit"
                  >
                    Vendor
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
              </div>
              {selectedUser.businessName && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{selectedUser.businessName}</p>
                </div>
              )}
              {selectedUser.gstNumber && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">GST Number</Label>
                  <p className="font-medium">{selectedUser.gstNumber}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant={
                      selectedUser.adminApproval ? "default" : "destructive"
                    }
                    className="w-fit"
                  >
                    {selectedUser.adminApproval ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            {selectedUser && !selectedUser.adminApproval && (
              <Button
                onClick={() => {
                  handleApproval(selectedUser.id, true);
                  setViewDialogOpen(false);
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve User
              </Button>
            )}
            {selectedUser && selectedUser.adminApproval && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleApproval(selectedUser.id, false);
                  setViewDialogOpen(false);
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Modal */}
      {userToVerify && (
        <VerificationModal
          open={verificationModalOpen}
          onOpenChange={setVerificationModalOpen}
          user={{
            id: userToVerify.id,
            name: userToVerify.name,
            email: userToVerify.email,
            userType: userToVerify.userType,
          }}
          accessToken={accessToken || ""}
          onVerificationComplete={() => {
            mutate(); // Refresh the users list
            setVerificationModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default ComponentsVendors;
