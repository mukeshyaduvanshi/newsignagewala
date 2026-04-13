"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ModulePermissions } from "@/lib/hooks/useManagerPermissions";
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
  Eye,
  Calendar,
  Package,
  IndianRupee,
  MapPin,
  Send,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface OrderSite {
  _id?: string;
  siteId: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId: string;
  photo?: string;
  oldPhoto?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
  referenceStatus?: "pending" | "modified" | "verified";
  status?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
}

interface Order {
  _id: string;
  brandId: {
    _id: string;
    companyName: string;
    email: string;
    phone: string;
  };
  vendorId: {
    _id: string;
    companyName: string;
    email: string;
    phone: string;
  };
  orderNumber: string;
  poNumber?: string;
  orderDate: Date;
  deadlineDate: Date;
  orderType: "order" | "tender";
  globalCreativeLink?: string;
  notes?: string;
  sites: OrderSite[];
  subtotal: number;
  additionalChargesTotal: number;
  tax: number;
  total: number;
  orderStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const statusColors: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  accepted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  creativeaddepted: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  escalation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  installed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

interface ComponentsManagerOrdersProps {
  permissions: ModulePermissions;
}

export default function ComponentsManagerOrders({
  permissions,
}: ComponentsManagerOrdersProps) {
  const { accessToken } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [uploadingStates, setUploadingStates] = React.useState<Record<string, boolean>>({});
  const [submittingOrders, setSubmittingOrders] = React.useState<Record<string, boolean>>({});
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  React.useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/manager/orders", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      // Filter to only show orders with creativeaddepted status
      const filteredOrders = (data.orders || []).filter(
        (order: Order) => order.orderStatus === "creativeaddepted"
      );
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCreative = async (orderId: string, siteId: string, file: File) => {
    const uploadKey = `${orderId}-${siteId}`;
    const toastId = toast.loading("Uploading PDF...");
    
    try {
      setUploadingStates((prev) => ({ ...prev, [uploadKey]: true }));

      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("siteId", siteId);
      formData.append("file", file);

      const response = await fetch("/api/manager/orders/upload-creative", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to upload creative");
      }

      const data = await response.json();
      toast.success("Creative uploaded successfully!", { id: toastId });

      // Refresh orders list
      const ordersResponse = await fetch("/api/manager/orders", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const filteredOrders = (ordersData.orders || []).filter(
          (order: Order) => order.orderStatus === "creativeaddepted"
        );
        setOrders(filteredOrders);
        
        // Update selected order
        if (selectedOrder && selectedOrder._id === orderId) {
          const updatedOrder = filteredOrders.find((o: Order) => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
          }
        }
      }
    } catch (error) {
      console.error("Error uploading creative:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload creative", { id: toastId });
    } finally {
      setUploadingStates((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleFinalSubmit = async (orderId: string) => {
    const toastId = toast.loading("Submitting order...");
    
    try {
      setSubmittingOrders((prev) => ({ ...prev, [orderId]: true }));

      const response = await fetch("/api/manager/orders/final-submit", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit order");
      }

      const data = await response.json();
      toast.success("Order submitted successfully! Status changed to 'new'", { id: toastId });

      // Close details dialog first
      setDetailsOpen(false);
      
      // Refresh orders to show updated status (order will be removed from list)
      await fetchOrders();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit order", { id: toastId });
    } finally {
      setSubmittingOrders((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const checkAllSitesUploaded = (order: Order) => {
    // Check if all sites have uploaded creatives (oldPhoto exists means they uploaded a new one)
    return order.sites.every((site) => site.oldPhoto);
  };

  const columns: ColumnDef<Order>[] = [
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
      accessorKey: "orderNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("orderNumber")}</div>
      ),
    },
    // {
    //   accessorKey: "brandId",
    //   header: () => <div className="text-left">Brand</div>,
    //   cell: ({ row }) => {
    //     const brand = row.getValue("brandId") as Order["brandId"];
    //     return (
    //       <div className="text-left">
    //         <div className="font-medium">{brand?.companyName || "N/A"}</div>
    //         <div className="text-xs text-muted-foreground">
    //           {brand?.phone || ""}
    //         </div>
    //       </div>
    //     );
    //   },
    // },
    // {
    //   accessorKey: "vendorId",
    //   header: () => <div className="text-left">Vendor</div>,
    //   cell: ({ row }) => {
    //     const vendor = row.getValue("vendorId") as Order["vendorId"];
    //     return (
    //       <div className="text-left">
    //         <div className="font-medium">{vendor?.companyName || "N/A"}</div>
    //         <div className="text-xs text-muted-foreground">
    //           {vendor?.phone || ""}
    //         </div>
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "sites",
      header: () => <div className="text-center">Sites</div>,
      cell: ({ row }) => {
        const sites = row.getValue("sites") as OrderSite[];
        return (
          <div className="flex justify-center">
            <Badge variant="secondary">
              <Package className="mr-1 h-3 w-3" />
              {sites?.length || 0}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "orderDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("orderDate"));
        return format(date, "dd MMM yyyy");
      },
    },
    {
      accessorKey: "deadlineDate",
      header: () => <div className="text-left">Deadline</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue("deadlineDate"));
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {format(date, "dd MMM yyyy")}
          </div>
        );
      },
    },
    // {
    //   accessorKey: "total",
    //   header: () => <div className="text-right">Total Amount</div>,
    //   cell: ({ row }) => {
    //     const amount = parseFloat(row.getValue("total"));
    //     return (
    //       <div className="text-right font-medium">
    //         ₹{amount.toLocaleString('en-IN')}
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "orderStatus",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("orderStatus") as string;
        return (
          <div className="flex justify-center">
            <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedOrder(order);
                setDetailsOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleFinalSubmit(order._id)}
              disabled={submittingOrders[order._id] || !checkAllSitesUploaded(order)}
              title={!checkAllSitesUploaded(order) ? "Upload creatives for all sites before submitting" : ""}
            >
              <Send className="mr-2 h-4 w-4" />
              {submittingOrders[order._id] ? "Submitting..." : "Final Submit"}
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="w-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage orders assigned to you as Creative Manager (Status: Creative Accepted)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by order number..."
          value={(table.getColumn("orderNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("orderNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
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

      <div className="rounded-md border">
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
                  No orders with "creativeaddepted" status assigned to you.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
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

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Order Number
                        </p>
                        <p className="text-sm">{selectedOrder.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Order Date
                        </p>
                        <p className="text-sm">
                          {format(new Date(selectedOrder.orderDate), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Deadline
                        </p>
                        <p className="text-sm">
                          {format(new Date(selectedOrder.deadlineDate), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Status
                        </p>
                        <Badge className={statusColors[selectedOrder.orderStatus]}>
                          {selectedOrder.orderStatus}
                        </Badge>
                      </div>
                      {/* <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Amount
                        </p>
                        <p className="text-sm font-semibold">
                          ₹{selectedOrder.total.toLocaleString('en-IN')}
                        </p>
                      </div> */}
                    </div>
                    {selectedOrder.globalCreativeLink && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Creative Link
                        </p>
                        <a
                          href={selectedOrder.globalCreativeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedOrder.globalCreativeLink}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sites Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Sites ({selectedOrder.sites.length})</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {selectedOrder.sites.filter((s) => s.oldPhoto).length} / {selectedOrder.sites.length} Uploaded
                        </Badge>
                        {!checkAllSitesUploaded(selectedOrder) && (
                          <Badge variant="destructive">
                            Upload required for all sites
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.sites.map((site, index) => (
                        <div key={index} className="border rounded-lg p-4 relative">
                          {site.oldPhoto && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="default" className="bg-green-600">
                                ✓ Uploaded
                              </Badge>
                            </div>
                          )}
                          {!site.oldPhoto && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="destructive">
                                Pending Upload
                              </Badge>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Store Name
                              </p>
                              <p className="text-sm">{site.storeName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Element
                              </p>
                              <p className="text-sm">{site.elementName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Dimensions
                              </p>
                              <p className="text-sm">
                                {site.width} x {site.height} {site.measurementUnit}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Quantity
                              </p>
                              <p className="text-sm">{site.quantity}</p>
                            </div>
                            {site.creativeLink && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Creative Link
                                </p>
                                <a
                                  href={site.creativeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {site.creativeLink}
                                </a>
                              </div>
                            )}
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Current Photo
                              </p>
                              <a
                                href={site.photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline break-all"
                              >
                                {site.photo}
                              </a>
                            </div>
                            {site.oldPhoto && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Previous Photo
                                </p>
                                <a
                                  href={site.oldPhoto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-gray-500 hover:underline break-all"
                                >
                                  {site.oldPhoto}
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex justify-end gap-2">
                            <input
                              type="file"
                              ref={(el) => {
                                fileInputRefs.current[`${selectedOrder._id}-${index}`] = el;
                              }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Use site._id if available, otherwise use siteId
                                  const siteIdentifier = site._id || site.siteId;
                                  handleUploadCreative(selectedOrder._id, siteIdentifier, file);
                                  // Reset input
                                  e.target.value = "";
                                }
                              }}
                              accept="application/pdf"
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                fileInputRefs.current[
                                  `${selectedOrder._id}-${index}`
                                ]?.click();
                              }}
                              disabled={uploadingStates[`${selectedOrder._id}-${index}`]}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {uploadingStates[`${selectedOrder._id}-${index}`]
                                ? "Uploading..."
                                : site.oldPhoto 
                                  ? "Re-upload PDF" 
                                  : "Upload PDF"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
