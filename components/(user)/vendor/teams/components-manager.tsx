"use client";
import { useParams } from "next/navigation";
import { TableSkeleton } from "@/components/ui/page-loader";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { BulkAddManagerModal } from "./bulk-add-manager-modal";
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
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { SearchInput } from "./search-input";
import { Button as Buttond } from "@/components/animate-ui/primitives/buttons/button";

const data: teamMember[] = [
  {
    id: "1",
    status: "success",
    email: "ken99@example.com",
    phone: "9817672656",
    name: "Kenneth",
    uniqueKey: "storeManager",
    managerType: "Store Manager",
    canChangeType: true,
  },
  {
    id: "2",
    status: "success",
    email: "Abe45@example.com",
    phone: "7676543210",
    name: "Ramon",
    uniqueKey: "storeManager",
    managerType: "Store Manager",
    canChangeType: true,
  },
  {
    id: "3",
    status: "processing",
    email: "Monserrat44@example.com",
    phone: "4456789123",
    name: "Stephanie",
    uniqueKey: "storeManager",
    managerType: "Store Manager",
    canChangeType: false,
  },
  {
    id: "4",
    status: "success",
    email: "Silas22@example.com",
    phone: "9881234567",
    name: "Felix",
    uniqueKey: "storeManager",
    managerType: "Store Manager",
    canChangeType: true,
  },
  {
    id: "5",
    status: "failed",
    email: "carmella@example.com",
    phone: "7765432190",
    name: "Rebecca",
    uniqueKey: "storeManager",
    managerType: "Store Manager",
    canChangeType: true,
  },
];

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "deleted";
  managerType: string;
  uniqueKey: string;
  canChangeType: boolean;
  createdAt: string;
}

export type teamMember = {
  id: string;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
  name: string;
  phone: string;
  uniqueKey: string;
  managerType: string;
  canChangeType: boolean;
};

export const columns: ColumnDef<teamMember>[] = [
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
    cell: ({ row }) => <div className="lowercase">{row.getValue("phone")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="capitalize">
          {status === "success"
            ? "Active"
            : status === "failed"
            ? "Inactive"
            : status}
        </div>
      );
    },
  },

  {
    id: "actions",
    enableHiding: false,
    header: ({ column }) => {
      return <Button variant="ghost">Action</Button>;
    },
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
            {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
            <DropdownMenuItem onClick={() => component?.openEditDialog(member)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                component?.handleStatusToggle(member.id, member.status)
              }
            >
              {member.status === "success" ? "Inactive" : "Active"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const ComponentsManager = () => {
  const params = useParams();
  const { accessToken } = useAuth();
  const managers = params.managers;
  const formattedManagers =
    typeof managers === "string"
      ? managers
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
      : "";

  const [data, setData] = useState<teamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
  const [editingMember, setEditingMember] = useState<teamMember | null>(null);

  // Fetch team members
  const fetchTeamMembers = async (
    status: string = "active",
    page: number = 1,
    search: string = ""
  ) => {
    try {
      setLoading(true);
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const url = `/api/teams/members?uniqueKey=${managers}&page=${page}&limit=20&status=${status}${searchParam}`;
      console.log("Fetching team members from:", url);
      console.log("Access Token:", accessToken ? "Present" : "Missing");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error("Failed to fetch team members");
      }

      const result = await response.json();
      console.log("API Response:", result);

      // Transform API data to match table format
      const transformedData: teamMember[] = result.data.map(
        (member: TeamMember) => ({
          id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          uniqueKey: member.uniqueKey,
          managerType: member.managerType,
          canChangeType: member.canChangeType ?? true,
          status: member.status === "active" ? "success" : "failed",
        })
      );

      console.log("Transformed data:", transformedData);
      setData(transformedData);

      // Update pagination info from API response
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages || 1);
        setTotalCount(result.pagination.total || 0);
        setCurrentPage(result.pagination.page || page);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
      setData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Load data when page, filter, or search changes
  useEffect(() => {
    if (accessToken && managers) {
      fetchTeamMembers(statusFilter, currentPage, searchQuery);
    }
  }, [accessToken, managers, statusFilter, currentPage, searchQuery]);

  // Fetch team authorities for dropdown
  useEffect(() => {
    const fetchTeamAuthorities = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch("/api/teams/authorities", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setTeamAuthorities(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching team authorities:", error);
      }
    };

    fetchTeamAuthorities();
  }, [accessToken]);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Handle form submission
  const handleAddMember = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/teams/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          uniqueKey: managers,
          managerType: formattedManagers,
          canChangeType: true,
          sendEmail: sendEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add team member");
      }

      toast.success(
        `Manager added successfully! Default password is: Welcome@123`
      );

      // Only optimistically add if on page 1 and active filter
      if (statusFilter === "active" && currentPage === 1) {
        const newMember: teamMember = {
          id: result.data._id,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          uniqueKey: result.data.uniqueKey,
          managerType: result.data.managerType,
          canChangeType: result.data.canChangeType,
          status: "success",
        };
        setData((prevData) => [newMember, ...prevData].slice(0, 20)); // Keep only 20 items
        setTotalCount((prev) => prev + 1);
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        uniqueKey: "",
        managerType: "",
      });
      setSendEmail(false);
      setAddDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding team member:", error);
      toast.error(error.message || "Failed to add team member");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit member
  const handleEditMember = async () => {
    if (
      !editingMember ||
      !formData.name ||
      !formData.email ||
      !formData.phone
    ) {
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

      // Only include uniqueKey and managerType if member canChangeType
      if (editingMember.canChangeType && formData.uniqueKey) {
        requestBody.uniqueKey = formData.uniqueKey;
      }
      if (editingMember.canChangeType && formData.managerType) {
        requestBody.managerType = formData.managerType;
      }

      const response = await fetch(`/api/teams/members/${editingMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update team member");
      }

      toast.success("Manager updated successfully!");

      // Check if type was changed - if yes, remove from current filter view
      const typeChanged =
        editingMember.uniqueKey !==
        (formData.uniqueKey || editingMember.uniqueKey);

      if (typeChanged) {
        // Remove member from list (no refresh needed - just mutate)
        setData((prevData) =>
          prevData.filter((member) => member.id !== editingMember.id)
        );
        setTotalCount((prev) => prev - 1);
      } else {
        // Optimistically update member in list for non-type changes
        setData((prevData) =>
          prevData.map((member) =>
            member.id === editingMember.id
              ? {
                  ...member,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  uniqueKey: formData.uniqueKey || member.uniqueKey,
                  managerType: formData.managerType || member.managerType,
                }
              : member
          )
        );
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        uniqueKey: "",
        managerType: "",
      });
      setEditingMember(null);
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating team member:", error);
      toast.error(error.message || "Failed to update team member");
    } finally {
      setSaving(false);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (
    memberId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "success" ? "inactive" : "active";

    try {
      const response = await fetch(`/api/teams/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update status");
      }

      toast.success(
        `Manager ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );

      // Remove member from current list as it no longer matches the filter
      setData((prevData) =>
        prevData.filter((member) => member.id !== memberId)
      );
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  // Open edit dialog
  const openEditDialog = (member: teamMember) => {
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

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle page navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      console.log(
        "Previous clicked - Current page:",
        currentPage,
        "Going to:",
        currentPage - 1
      );
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      console.log(
        "Next clicked - Current page:",
        currentPage,
        "Going to:",
        currentPage + 1
      );
      setCurrentPage(currentPage + 1);
    }
  };

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
    manualPagination: true, // Use manual pagination from API
    pageCount: totalPages, // Total pages from API
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1, // TanStack uses 0-based index
        pageSize: 20,
      },
    },
    meta: {
      component: {
        openEditDialog,
        handleStatusToggle,
      },
    },
  });

  return (
    <>
      <div className="w-full flex flex-col my-4">
        <div className=" flex mx-4 gap-4">
          {/*add a new member button */}
          <Dialog
            open={addDialogOpen}
            onOpenChange={(open) => {
              setAddDialogOpen(open);
              if (open) {
                // Clean form when opening Add dialog
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  uniqueKey: "",
                  managerType: "",
                });
                setSendEmail(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Buttond
                hoverScale={1.05}
                tapScale={0.9}
                className="border-brand-foreground border-2 px-3 text-xl rounded-sm hover:bg-brand-foreground text-brand-foreground hover:text-foreground"
              >
                Add New
              </Buttond>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add {formattedManagers}</DialogTitle>
                <DialogDescription>
                  Fill out the form to add a new{" "}
                  {formattedManagers.toLowerCase()}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter manager name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="managerType">Manager Type</Label>
                  <Input
                    id="managerType"
                    value={formattedManagers}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(checked) =>
                      setSendEmail(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="sendEmail"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Notify the User by email
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleAddMember} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk Add Manager Modal */}
          <Buttond
            hoverScale={1.05}
            tapScale={0.9}
            className="border-brand-foreground border-2 px-3 text-xl rounded-sm hover:bg-brand-foreground text-brand-foreground hover:text-foreground"
            onClick={() => setBulkAddDialogOpen(true)}
          >
            Bulk Add
          </Buttond>

          <BulkAddManagerModal
            open={bulkAddDialogOpen}
            onOpenChange={setBulkAddDialogOpen}
            onSuccess={() => {
              fetchTeamMembers(statusFilter, 1, searchQuery);
            }}
            managerType={formattedManagers}
            uniqueKey={managers as string}
          />

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Manager</DialogTitle>
                <DialogDescription>
                  Update the manager details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter manager name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                {editingMember?.canChangeType && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-managerType">Manager Type</Label>
                    <Select
                      value={formData.uniqueKey}
                      onValueChange={(value) => {
                        const selected = teamAuthorities.find(
                          (auth) => auth.uniqueKey === value
                        );
                        setFormData({
                          ...formData,
                          uniqueKey: value,
                          managerType: selected?.labelName || "",
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select manager type" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamAuthorities.map((authority) => (
                          <SelectItem
                            key={authority.uniqueKey}
                            value={authority.uniqueKey}
                          >
                            {authority.labelName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Change the manager's role/type
                    </p>
                  </div>
                )}
                {!editingMember?.canChangeType && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm text-muted-foreground">
                      ⓘ Manager type cannot be changed for this member
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleEditMember} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className=" mx-4">
          <div className="flex items-center py-4 gap-4">
            <SearchInput
              placeholder={`Search ${formattedManagers}`}
              onSearch={handleSearch}
              debounceMs={500}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            {loading ? (
              <TableSkeleton rows={8} columns={6} />
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
                          row.original.status === "failed"
                            ? "opacity-50 bg-muted/50"
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
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-muted-foreground flex-1 text-sm">
              Showing {data.length > 0 ? (currentPage - 1) * 20 + 1 : 0} to{" "}
              {(currentPage - 1) * 20 + data.length} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComponentsManager;
