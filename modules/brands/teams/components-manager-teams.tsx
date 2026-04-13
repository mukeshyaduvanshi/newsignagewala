"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { ModulePermissions } from "@/lib/hooks/useManagerPermissions";
import {
  useManagerTeamMembers,
  type ManagerTeamMember,
} from "@/hooks/use-manager-team-members";
import { BulkAddManagerModal } from "@/components/(user)/brand/teams/bulk-add-manager-modal";
import { SearchInput } from "@/components/(user)/brand/teams/search-input";
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ComponentsManagerTeamsProps {
  permissions: ModulePermissions;
}

const ComponentsManagerTeams = ({ permissions }: ComponentsManagerTeamsProps) => {
  const params = useParams();
  const { accessToken } = useAuth();
  const managers = params.managers as string | undefined;
  const formattedManagers =
    typeof managers === "string"
      ? managers.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
      : "All Team Members";

  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    members: data,
    loading,
    pagination,
    fetchMembers,
    addMember,
    updateMember,
    toggleStatus,
    setMembers,
    setPagination,
  } = useManagerTeamMembers({
    uniqueKey: managers,
    status: statusFilter,
    page: currentPage,
  });

  const totalPages = pagination.totalPages;
  const totalCount = pagination.total;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamAuthorities, setTeamAuthorities] = useState<
    { uniqueKey: string; labelName: string; description: string }[]
  >([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    uniqueKey: "",
    managerType: "",
  });
  const [sendEmail, setSendEmail] = useState(false);
  const [editingMember, setEditingMember] = useState<ManagerTeamMember | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Fetch team authorities from dedicated manager API
  useEffect(() => {
    const fetchAuthorities = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch("/api/manager/teams/authorities", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const result = await res.json();
          setTeamAuthorities(result.data || []);
        }
      } catch {}
    };
    fetchAuthorities();
  }, [accessToken]);

  // Reset to page 1 when filter/search/authority changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, managers]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      fetchMembers(statusFilter, 1, query);
    },
    [statusFilter, fetchMembers]
  );

  const handleAddMember = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill all fields");
      return;
    }
    // If no specific authority selected, require role selection
    const selectedUniqueKey = managers || formData.uniqueKey;
    const selectedManagerType = managers ? formattedManagers : formData.managerType;

    if (!selectedUniqueKey || !selectedManagerType) {
      toast.error("Please select a role for this team member");
      return;
    }

    try {
      setSaving(true);
      const result = await addMember({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        uniqueKey: selectedUniqueKey,
        managerType: selectedManagerType,
        sendEmail,
      });

      if (result.isExistingUser) {
        toast.success(`Existing user added as ${selectedManagerType} successfully!`);
      } else {
        toast.success(`Team member added! Default password: Welcome@123`);
      }

      if (statusFilter === "active" && currentPage === 1) {
        const newMember: ManagerTeamMember = {
          id: result.data._id,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          uniqueKey: result.data.uniqueKey,
          managerType: result.data.managerType,
          canChangeType: result.data.canChangeType,
          status: "success",
        };
        setMembers((prev) => [newMember, ...prev].slice(0, 20));
      }

      setFormData({ name: "", email: "", phone: "", uniqueKey: "", managerType: "" });
      setSendEmail(false);
      setAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add team member");
    } finally {
      setSaving(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember || !formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      setSaving(true);
      const requestBody: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };
      if (editingMember.canChangeType && formData.uniqueKey) requestBody.uniqueKey = formData.uniqueKey;
      if (editingMember.canChangeType && formData.managerType) requestBody.managerType = formData.managerType;

      await updateMember(editingMember.id, requestBody);
      toast.success("Team member updated successfully!");

      const typeChanged = editingMember.uniqueKey !== (formData.uniqueKey || editingMember.uniqueKey);
      if (typeChanged) {
        setMembers((prev) => prev.filter((m) => m.id !== editingMember.id));
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  uniqueKey: formData.uniqueKey || m.uniqueKey,
                  managerType: formData.managerType || m.managerType,
                }
              : m
          )
        );
      }

      setFormData({ name: "", email: "", phone: "", uniqueKey: "", managerType: "" });
      setEditingMember(null);
      setEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update team member");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === "success" ? "inactive" : "active";
    try {
      await toggleStatus(memberId, newStatus as "active" | "inactive");
      toast.success(`Member ${newStatus === "active" ? "activated" : "deactivated"}!`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const openEditDialog = (member: ManagerTeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      uniqueKey: member.uniqueKey,
      managerType: member.managerType,
    });
    setEditDialogOpen(true);
  };

  const columns: ColumnDef<ManagerTeamMember>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Phone <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("phone")}</div>,
    },
    {
      accessorKey: "managerType",
      header: "Role",
      cell: ({ row }) => <div className="capitalize">{row.getValue("managerType")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="capitalize">
            {status === "success" ? "Active" : status === "failed" ? "Inactive" : status}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <Button variant="ghost">Action</Button>,
      cell: ({ row, table }) => {
        const member = row.original;
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
              <DropdownMenuItem onClick={() => component?.openEditDialog(member)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => component?.handleStatusToggle(member.id, member.status)}
              >
                {member.status === "success" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
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
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: currentPage - 1, pageSize: 20 },
    },
    meta: { component: { openEditDialog, handleStatusToggle } },
  });

  return (
    <div className="w-full">
      <div className="mx-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{formattedManagers}</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center mt-4 gap-2 overflow-x-auto pb-2">
          {permissions.canAdd && (
            <Button
              variant="outline"
              onClick={() => {
                setFormData({ name: "", email: "", phone: "", uniqueKey: managers || "", managerType: "" });
                setSendEmail(false);
                setAddDialogOpen(true);
              }}
              className="whitespace-nowrap"
            >
              Add New
            </Button>
          )}
          {permissions.canBulk && (
            <Button
              variant="outline"
              onClick={() => setBulkAddDialogOpen(true)}
              className="whitespace-nowrap"
            >
              Bulk Add
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="w-full flex items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <SearchInput
              placeholder={`Search ${formattedManagers}`}
              onSearch={handleSearch}
              debounceMs={500}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
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
              {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border">
          {loading ? (
            <div className="w-full p-4">
              <TableSkeleton rows={8} columns={7} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No team members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            Showing {data.length > 0 ? (currentPage - 1) * 20 + 1 : 0} to{" "}
            {(currentPage - 1) * 20 + data.length} of {totalCount} results
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your {managers ? formattedManagers.toLowerCase() : "team"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            {/* Show role selector only if not on a specific authority page */}
            {!managers ? (
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.uniqueKey}
                  onValueChange={(value) => {
                    const auth = teamAuthorities.find((a) => a.uniqueKey === value);
                    setFormData({ ...formData, uniqueKey: value, managerType: auth?.labelName || "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamAuthorities.map((authority) => (
                      <SelectItem key={authority.uniqueKey} value={authority.uniqueKey}>
                        {authority.labelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Role</Label>
                <Input value={formattedManagers} disabled className="bg-muted" />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <Label htmlFor="sendEmail" className="text-sm font-normal">
                Send welcome email with login credentials
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Modal */}
      <BulkAddManagerModal
        open={bulkAddDialogOpen}
        onOpenChange={setBulkAddDialogOpen}
        onSuccess={() => fetchMembers(statusFilter, 1, searchQuery)}
        managerType={formattedManagers}
        uniqueKey={managers || formData.uniqueKey}
      />

      {/* Edit Member Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update the team member details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            {editingMember?.canChangeType && teamAuthorities.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.uniqueKey}
                  onValueChange={(value) => {
                    const auth = teamAuthorities.find((a) => a.uniqueKey === value);
                    setFormData({ ...formData, uniqueKey: value, managerType: auth?.labelName || "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamAuthorities.map((authority) => (
                      <SelectItem key={authority.uniqueKey} value={authority.uniqueKey}>
                        {authority.labelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingMember && !editingMember.canChangeType && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  ⓘ Role cannot be changed for this member
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditMember} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComponentsManagerTeams;