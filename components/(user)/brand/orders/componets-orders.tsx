"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";
import { format } from "date-fns";
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
  Package,
  IndianRupee,
  Eye,
  Calendar,
  CircleCheckBig,
  CircleX,
  ArrowUpFromDot,
  Ban,
  EyeIcon,
  Trash,
  RefreshCw,
  XCircle,
  Presentation,
  FileText,
  CheckCircle2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SetSiteReferenceImage } from "./set-site-reference-image";
import { StoreLocationsMap } from "@/components/maps/store-locations-map";

interface OrderSite {
  siteId: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  storeId: string;
  photo?: string;
  creativeAdaptive?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  creativeLink?: string;
  instructions?: string;
  rejectionStatus?: string;
  rejectionReason?: string;
  capturedImages?: string[];
  referenceStatus?: "pending" | "modified" | "verified";
  status?: "pending" | "vendorVerified" | "submitted" | "completed";
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
}

interface SiteChange {
  siteIndex: number;
  elementName: string;
  oldRate: number;
  newRate: number;
  storeName: string;
}

interface AdditionalChargeChange {
  chargeIndex: number;
  chargeName: string;
  oldAmount: number;
  newAmount: number;
}

interface PriceEscalation {
  raisedAt: Date;
  raisedBy: string;
  userType: "vendor" | "brand";
  siteChanges: SiteChange[];
  additionalChargeChanges: AdditionalChargeChange[];
  oldTotal: number;
  newTotal: number;
  totalDifference: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
}

interface Order {
  _id: string;
  brandId: string;
  vendorId: {
    _id: string;
    companyName: string;
    email: string;
    phone: string;
  };
  storeId?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
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
  orderStatus:
    | "new"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "accepted"
    | "installed"
    | "escalation"
    | "creativeaddepted"
    | "creativeAdapted";
  priceEscalation?: PriceEscalation[];
  createdAt: Date;
  updatedAt: Date;
}

const statusColors: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  accepted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  escalation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  installed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  creativeaddepted:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  creativeAdapted:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

export const columns: ColumnDef<Order>[] = [
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
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("orderNumber")}</div>
    ),
  },
  {
    accessorKey: "vendorId",
    header: () => <div className="text-left">Vendor</div>,
    cell: ({ row }) => {
      const vendor = row.getValue("vendorId") as Order["vendorId"];
      return (
        <div className="text-left">
          <div className="font-medium">{vendor?.companyName || "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            {vendor?.phone || ""}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "sites",
    header: () => <div className="text-center">Sites</div>,
    cell: ({ row }) => {
      const sites = row.getValue("sites") as OrderSite[];
      return (
        <div className="text-center">
          <Badge variant="outline">{sites?.length || 0} sites</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Total Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"));
      return <div className="text-right font-medium">₹{amount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "orderStatus",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue("orderStatus") as keyof typeof statusColors;
      return (
        <div className="text-center">
          <Badge className={statusColors[status]} variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "deadlineDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Deadline
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("deadlineDate"));
      return <div className="text-left">{format(date, "dd/MM/yyyy")}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    enableHiding: false,
    cell: ({ row, table }) => {
      const order = row.original;
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
                className="flex gap-1"
                onClick={() => meta?.onViewDetails(order)}
              >
                <EyeIcon />
                View Details
              </DropdownMenuItem>
              {order.orderStatus !== "accepted" &&
                order.orderStatus === "new" && (
                  <>
                    <DropdownMenuItem
                      className="flex gap-1"
                      onClick={() => meta?.viewMap(order)}
                    >
                      <MapPin />
                      View Map
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex gap-1"
                      onClick={() => meta?.generatePPT(order)}
                      disabled={meta?.generatingPPT}
                    >
                      <Presentation />{" "}
                      {meta?.generatingPPT ? "Generating..." : "Generate PPT"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex gap-1">
                      <CircleX /> Rejected Order
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex gap-1">
                      <Ban /> Cancel Order
                    </DropdownMenuItem>
                  </>
                )}
              {order.orderStatus !== "new" && (
                <>
                  <DropdownMenuItem
                    className="flex gap-1"
                    onClick={() => meta?.viewMap(order)}
                  >
                    <MapPin />
                    View Map
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex gap-1"
                    onClick={() => meta?.generatePPT(order)}
                    disabled={meta?.generatingPPT}
                  >
                    <Presentation />{" "}
                    {meta?.generatingPPT ? "Generating..." : "Generate PPT"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-1">
                    <CircleX /> Rejected Order
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-1">
                    <Ban /> Cancel Order
                  </DropdownMenuItem>
                </>
              )}
              {/* {order.storeLocation?.coordinates && (
                <DropdownMenuItem
                  onClick={() => {
                    const [lng, lat] = order.storeLocation!.coordinates;
                    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  View Location
                </DropdownMenuItem>
              )} */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

function ComponentsOrders() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
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
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [editedSites, setEditedSites] = React.useState<OrderSite[]>([]);
  const [initialEditedSites, setInitialEditedSites] = React.useState<
    OrderSite[]
  >([]);
  const [editedAdditionalCharges, setEditedAdditionalCharges] =
    React.useState<number>(0);
  const [initialAdditionalCharges, setInitialAdditionalCharges] =
    React.useState<number>(0);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isRespondingEscalation, setIsRespondingEscalation] =
    React.useState(false);
  const [isAcceptingEscalation, setIsAcceptingEscalation] =
    React.useState(false);
  const [setReferenceOpen, setSetReferenceOpen] = React.useState(false);
  const [selectedSiteData, setSelectedSiteData] = React.useState<{
    site: OrderSite;
    index: number;
  } | null>(null);
  const [isVerifyingOrder, setIsVerifyingOrder] = React.useState(false);
  const [isGeneratingPPT, setIsGeneratingPPT] = React.useState(false);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [mapOrder, setMapOrder] = React.useState<Order | null>(null);
  const [reviewingCreative, setReviewingCreative] = React.useState<
    Record<string, boolean>
  >({});

  React.useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/brand/orders", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        let filteredOrders = result.orders || [];

        if (statusFilter !== "all") {
          filteredOrders = filteredOrders.filter(
            (order: Order) => order.orderStatus === statusFilter,
          );
        }

        setOrders(filteredOrders);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);

    // If order is in escalation status and has escalations, apply ALL escalations cumulatively
    if (
      order.orderStatus === "escalation" &&
      order.priceEscalation &&
      order.priceEscalation.length > 0
    ) {
      // Start with original order sites
      let updatedSites = order.sites.map((site) => ({ ...site }));
      let updatedAdditionalCharges = order.additionalChargesTotal || 0;

      // Apply ALL escalations in sequence to get cumulative effect
      order.priceEscalation.forEach((escalation: any) => {
        // Apply site rate changes from this escalation
        escalation.siteChanges.forEach((change: any) => {
          if (updatedSites[change.siteIndex]) {
            updatedSites[change.siteIndex].rate = change.newRate;
          }
        });

        // Apply additional charges changes from this escalation
        if (
          escalation.additionalChargeChanges &&
          escalation.additionalChargeChanges.length > 0
        ) {
          const latestChargeChange =
            escalation.additionalChargeChanges[
              escalation.additionalChargeChanges.length - 1
            ];
          updatedAdditionalCharges = latestChargeChange.newAmount;
        }
      });

      console.log(
        "🔵 BRAND: Cumulative rates after applying all escalations:",
        updatedSites.map((s) => ({ name: s.elementName, rate: s.rate })),
      );

      setEditedSites(updatedSites);
      setInitialEditedSites(updatedSites);
      setEditedAdditionalCharges(updatedAdditionalCharges);
      setInitialAdditionalCharges(updatedAdditionalCharges);
    } else {
      setEditedSites(order.sites);
      setInitialEditedSites(order.sites);
      setEditedAdditionalCharges(order.additionalChargesTotal || 0);
      setInitialAdditionalCharges(order.additionalChargesTotal || 0);
    }

    setHasChanges(false);
    setDetailsOpen(true);
  };

  const handleSiteRateChange = (index: number, newRate: number) => {
    const site = editedSites[index];
    const elementName = site.elementName;

    const updatedSites = editedSites.map((s) => {
      if (s.elementName === elementName) {
        return { ...s, rate: newRate };
      }
      return s;
    });

    setEditedSites(updatedSites);
    setHasChanges(true);
  };

  const handleAdditionalChargesChange = (newAmount: number) => {
    setEditedAdditionalCharges(newAmount);
    setHasChanges(true);
  };

  const calculateEditedTotal = () => {
    const subtotal = editedSites.reduce(
      (sum, site) => sum + priceCalculatorNumber(site),
      0,
    );
    const totalBeforeTax = subtotal + editedAdditionalCharges;
    const tax = totalBeforeTax * 0.18;
    const total = totalBeforeTax + tax;

    return { subtotal, additionalCharges: editedAdditionalCharges, tax, total };
  };

  const handleRespondEscalation = async () => {
    if (!selectedOrder) return;

    // Calculate site changes - compare against initial loaded rates, not original order rates
    const siteChanges = editedSites
      .map((editedSite, index) => {
        const initialSite = initialEditedSites[index];
        if (editedSite.rate !== initialSite.rate) {
          return {
            siteIndex: index,
            elementName: editedSite.elementName,
            oldRate: initialSite.rate,
            newRate: editedSite.rate,
            storeName: editedSite.storeName,
          };
        }
        return null;
      })
      .filter(
        (change): change is NonNullable<typeof change> => change !== null,
      );

    const additionalChargeChanges = [];
    if (editedAdditionalCharges !== initialAdditionalCharges) {
      additionalChargeChanges.push({
        chargeIndex: 0,
        chargeName: "Additional Charges",
        oldAmount: initialAdditionalCharges,
        newAmount: editedAdditionalCharges,
      });
    }

    const editedPricing = calculateEditedTotal();

    // Use latest escalation's newTotal as oldTotal if escalations exist
    const oldTotal =
      selectedOrder.priceEscalation && selectedOrder.priceEscalation.length > 0
        ? selectedOrder.priceEscalation[
            selectedOrder.priceEscalation.length - 1
          ].newTotal
        : selectedOrder.total;

    setIsRespondingEscalation(true);
    try {
      const response = await fetch("/api/brand/orders/respond-escalation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          siteChanges,
          additionalChargeChanges,
          oldTotal,
          newTotal: editedPricing.total,
          reason: "Brand counter-offer",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Counter-offer sent to vendor");
        setDetailsOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to respond to escalation");
      }
    } catch (error) {
      console.error("Error responding to escalation:", error);
      toast.error("An error occurred");
    } finally {
      setIsRespondingEscalation(false);
    }
  };

  const handleAcceptEscalation = async () => {
    if (!selectedOrder) return;

    const editedPricing = calculateEditedTotal();

    console.log(
      "🔵 BRAND ACCEPT: Sending finalSites:",
      editedSites.map((s) => ({ name: s.elementName, rate: s.rate })),
    );
    console.log("🔵 BRAND ACCEPT: Sending finalTotal:", editedPricing.total);

    setIsAcceptingEscalation(true);
    try {
      const response = await fetch("/api/brand/orders/accept-escalation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          finalSites: editedSites,
          finalAdditionalCharges: editedAdditionalCharges,
          finalTotal: editedPricing.total,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const diff = data.order.difference;
        const diffText =
          diff > 0
            ? `(+₹${diff.toFixed(2)})`
            : diff < 0
              ? `(-₹${Math.abs(diff).toFixed(2)})`
              : "(No change)";

        toast.success(`Escalation accepted ${diffText}`);
        setDetailsOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to accept escalation");
      }
    } catch (error) {
      console.error("Error accepting escalation:", error);
      toast.error("An error occurred");
    } finally {
      setIsAcceptingEscalation(false);
    }
  };

  const handleVerifyOrder = async () => {
    if (!selectedOrder) return;

    setIsVerifyingOrder(true);
    try {
      const response = await fetch("/api/brand/orders/verify-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Order verified and completed successfully!");
        setDetailsOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to verify order");
      }
    } catch (error) {
      console.error("Error verifying order:", error);
      toast.error("An error occurred");
    } finally {
      setIsVerifyingOrder(false);
    }
  };

  const handleGeneratePPT = async (order: Order) => {
    try {
      setIsGeneratingPPT(true);
      toast.info("Preparing PPT data... Please wait");

      const response = await fetch("/api/vendor/orders/prepare-ppt-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId: order._id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to prepare PPT data");
        setIsGeneratingPPT(false);
        return;
      }

      // Open PPT generation page in new tab
      const pptUrl = `/pptgen/${data.tempId}`;
      window.open(pptUrl, "_blank");

      setIsGeneratingPPT(false);
      toast.success("PPT generation page opened in new tab!");
    } catch (error) {
      console.error("Error preparing PPT:", error);
      toast.error("Failed to prepare PPT");
      setIsGeneratingPPT(false);
    }
  };

  const handleReviewCreative = async (
    orderId: string,
    action: "accept" | "reject",
  ) => {
    const key = `${orderId}-${action}`;
    setReviewingCreative((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await fetch("/api/brand/orders/review-creative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(
          action === "accept"
            ? "Creative accepted! Order status set to new."
            : "Creative rejected.",
        );
        setDetailsOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to review creative");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setReviewingCreative((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleViewMap = (order?: Order) => {
    const orderToUse = order || selectedOrder;
    if (!orderToUse) return;

    // Set the order whose map should be shown
    setMapOrder(orderToUse);
    setMapOpen(true);
  };

  const getStoreLocations = () => {
    const orderToUse = mapOrder;
    if (!orderToUse) return [];

    // Extract unique store locations from order sites
    const locationsMap = new Map();

    orderToUse.sites.forEach((site, index) => {
      if (
        site.storeLocation?.coordinates &&
        Array.isArray(site.storeLocation.coordinates)
      ) {
        const key = `${site.storeLocation.coordinates[0]}-${site.storeLocation.coordinates[1]}`;
        if (!locationsMap.has(key)) {
          locationsMap.set(key, {
            storeName: site.storeName,
            coordinates: site.storeLocation.coordinates,
            elementName: site.elementName,
          });
        }
      }
    });

    const locations = Array.from(locationsMap.values());
    return locations;
  };

  const filteredOrders = React.useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.orderStatus === statusFilter);
  }, [orders, statusFilter]);

  const table = useReactTable({
    data: filteredOrders,
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
    meta: {
      onViewDetails: handleViewDetails,
      generatePPT: handleGeneratePPT,
      generatingPPT: isGeneratingPPT,
      viewMap: handleViewMap,
    },
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="w-full space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">Manage and track your orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter orders..."
          value={
            (table.getColumn("orderNumber")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("orderNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="installed">Installed</SelectItem>
            <SelectItem value="escalation">Escalation</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
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

      {/* Table or Grid View */}
      {viewMode === "list" ? (
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
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <Card
              key={order._id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {order.orderNumber}
                    </CardTitle>
                    {order.poNumber && (
                      <CardDescription className="text-sm mt-1">
                        PO: {order.poNumber}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    className={statusColors[order.orderStatus]}
                    variant="outline"
                  >
                    {order.orderStatus.charAt(0).toUpperCase() +
                      order.orderStatus.slice(1).replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {order.sites.length} Sites
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">₹{order.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Deadline:{" "}
                    {format(new Date(order.deadlineDate), "dd/MM/yyyy")}
                  </span>
                </div>
                {order.vendorId && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Vendor: </span>
                    <span className="font-medium">
                      {order.vendorId.companyName}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(order)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  {order.storeLocation?.coordinates && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const [lng, lat] = order.storeLocation!.coordinates;
                        window.open(
                          `https://www.google.com/maps?q=${lat},${lng}`,
                          "_blank",
                        );
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredOrders.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No orders found.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {viewMode === "list" && (
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
      )}

      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Order Date
                    </p>
                    <p className="text-sm">
                      {format(new Date(selectedOrder.orderDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Deadline
                    </p>
                    <p className="text-sm">
                      {format(
                        new Date(selectedOrder.deadlineDate),
                        "dd/MM/yyyy",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <Badge
                      className={statusColors[selectedOrder.orderStatus]}
                      variant="outline"
                    >
                      {selectedOrder.orderStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Sites
                    </p>
                    <p className="text-sm">{selectedOrder.sites.length}</p>
                  </div>
                </div>

                {/* Vendor Info */}
                {selectedOrder.vendorId && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Vendor Information
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="font-medium">
                        {selectedOrder.vendorId.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.vendorId.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.vendorId.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {selectedOrder.storeLocation?.coordinates && (
                  <div>
                    <button
                      onClick={() => {
                        const [lng, lat] =
                          selectedOrder.storeLocation!.coordinates;
                        window.open(
                          `https://www.google.com/maps?q=${lat},${lng}`,
                          "_blank",
                        );
                      }}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <div className="flex justify-center items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <h3 className="text-lg font-semibold">
                          Store Location
                        </h3>
                      </div>
                      {/* {selectedOrder.storeLocation.coordinates[1].toFixed(6)},{" "}
                      {selectedOrder.storeLocation.coordinates[0].toFixed(6)} */}
                    </button>
                  </div>
                )}

                {/* Sites Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Sites</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Site</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Dimensions</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editedSites.map((site, index) => {
                          const siteTotal = priceCalculatorNumber(site);

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {site.photo && (
                                    <img
                                      src={site.photo}
                                      alt={site.elementName}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">
                                      {site.elementName}
                                    </p>
                                    {site.siteDescription && (
                                      <p className="text-xs text-muted-foreground">
                                        {site.siteDescription}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{site.storeName}</TableCell>
                              <TableCell>
                                {site.width} x {site.height}{" "}
                                {site.measurementUnit}
                              </TableCell>
                              <TableCell>
                                {selectedOrder.orderStatus === "escalation" ? (
                                  <Input
                                    type="number"
                                    value={site.rate}
                                    onChange={(e) =>
                                      handleSiteRateChange(
                                        index,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-24 h-8"
                                  />
                                ) : (
                                  <>
                                    ₹{site.rate}
                                    {site.calculateUnit === "sqft" && "/sqft"}
                                  </>
                                )}
                              </TableCell>
                              <TableCell>{site.quantity}</TableCell>
                              <TableCell className="text-right font-medium">
                                ₹{siteTotal.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right flex flex-row justify-end gap-1">
                                {site.creativeAdaptive && (
                                  <div className="flex flex-col gap-2 items-end mb-1">
                                    <a
                                      href={site.creativeAdaptive}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                    >
                                      <FileText className="h-3 w-3" />
                                      View PDF
                                    </a>
                                    {(selectedOrder.orderStatus ===
                                      "creativeAdapted" ||
                                      selectedOrder.orderStatus ===
                                        "creativeaddepted") && (
                                      <div className="flex gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 border-green-500 text-green-700 hover:bg-green-50"
                                          onClick={() =>
                                            handleReviewCreative(
                                              selectedOrder._id,
                                              "accept",
                                            )
                                          }
                                          disabled={
                                            reviewingCreative[
                                              `${selectedOrder._id}-accept`
                                            ] ||
                                            reviewingCreative[
                                              `${selectedOrder._id}-reject`
                                            ]
                                          }
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 border-red-500 text-red-700 hover:bg-red-50"
                                          onClick={() =>
                                            handleReviewCreative(
                                              selectedOrder._id,
                                              "reject",
                                            )
                                          }
                                          disabled={
                                            reviewingCreative[
                                              `${selectedOrder._id}-accept`
                                            ] ||
                                            reviewingCreative[
                                              `${selectedOrder._id}-reject`
                                            ]
                                          }
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {selectedOrder.orderStatus !== "completed" &&
                                  site.capturedImages &&
                                  site.capturedImages.length > 0 &&
                                  site.referenceStatus !== "verified" &&
                                  site.status === "submitted" && (
                                    <div className="flex flex-col gap-1 items-end">
                                      <Button
                                        variant={
                                          site.referenceStatus === "modified"
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSiteData({ site, index });
                                          setSetReferenceOpen(true);
                                        }}
                                        className="relative"
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Set
                                        {site.referenceStatus ===
                                          "modified" && (
                                          <Badge
                                            variant="secondary"
                                            className="ml-2 bg-green-100 text-green-800 text-xs"
                                          >
                                            Modified
                                          </Badge>
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                {site.referenceStatus === "verified" && (
                                  <Badge
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-600"
                                  >
                                    <CircleCheckBig className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                {site.rejectionStatus === "rejected" && (
                                  <Badge
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-600"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Rejected
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 max-w-sm ml-auto">
                  {(() => {
                    const pricing =
                      selectedOrder.orderStatus === "escalation"
                        ? calculateEditedTotal()
                        : {
                            subtotal: selectedOrder.subtotal,
                            additionalCharges:
                              selectedOrder.additionalChargesTotal,
                            tax: selectedOrder.tax,
                            total: selectedOrder.total,
                          };
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span>₹{pricing.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Additional Charges
                          </span>
                          {selectedOrder.orderStatus === "escalation" ? (
                            <Input
                              type="number"
                              value={editedAdditionalCharges}
                              onChange={(e) =>
                                handleAdditionalChargesChange(
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-32 h-8 text-right"
                            />
                          ) : (
                            <span>₹{pricing.additionalCharges.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Tax (GST 18%)
                          </span>
                          <span>₹{pricing.tax.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>₹{pricing.total.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Escalation History */}
                {selectedOrder.priceEscalation &&
                  selectedOrder.priceEscalation.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        Escalation History
                      </h3>
                      <div className="space-y-4">
                        {selectedOrder.priceEscalation.map(
                          (escalation: any, index: number) => (
                            <div
                              key={index}
                              className="border rounded-lg p-4 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {escalation.userType === "vendor"
                                      ? "Vendor"
                                      : "Brand"}{" "}
                                    Escalation #{index + 1}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      escalation.userType === "vendor"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}
                                  >
                                    {escalation.userType}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(escalation.raisedAt),
                                    "MMM dd, yyyy HH:mm",
                                  )}
                                </span>
                              </div>

                              {escalation.reason && (
                                <p className="text-sm text-muted-foreground">
                                  {escalation.reason}
                                </p>
                              )}

                              {escalation.siteChanges &&
                                escalation.siteChanges.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                      Site Rate Changes:
                                    </p>
                                    {escalation.siteChanges.map(
                                      (change: any, i: number) => (
                                        <div key={i} className="text-sm pl-4">
                                          <span className="text-muted-foreground">
                                            {change.storeName} -{" "}
                                            {change.elementName}:
                                          </span>{" "}
                                          <span className="line-through text-red-600">
                                            ₹{change.oldRate}
                                          </span>
                                          {" → "}
                                          <span className="text-green-600 font-medium">
                                            ₹{change.newRate}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}

                              {escalation.additionalChargeChanges &&
                                escalation.additionalChargeChanges.length >
                                  0 && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                      Additional Charges:
                                    </p>
                                    {escalation.additionalChargeChanges.map(
                                      (change: any, i: number) => (
                                        <div key={i} className="text-sm pl-4">
                                          <span className="line-through text-red-600">
                                            ₹{change.oldAmount}
                                          </span>
                                          {" → "}
                                          <span className="text-green-600 font-medium">
                                            ₹{change.newAmount}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}

                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm font-medium">
                                  Total Change:
                                </span>
                                <span
                                  className={`font-bold ${
                                    escalation.totalDifference > 0
                                      ? "text-green-600"
                                      : escalation.totalDifference < 0
                                        ? "text-red-600"
                                        : ""
                                  }`}
                                >
                                  {escalation.totalDifference > 0 ? "+" : ""}₹
                                  {escalation.totalDifference?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Buttons */}
                {selectedOrder.orderStatus !== "accepted" &&
                  selectedOrder.orderStatus === "new" && (
                    <div className="flex gap-2">
                      <Button
                        variant={"outline"}
                        onClick={() => handleViewMap()}
                      >
                        <MapPin /> View Map
                      </Button>
                      <Button variant={"outline"}>
                        <Trash /> Delete
                      </Button>
                    </div>
                  )}
                {selectedOrder.orderStatus === "escalation" && (
                  <div className="flex gap-2">
                    <Button variant={"outline"} onClick={() => handleViewMap()}>
                      <MapPin /> View Map
                    </Button>
                    <Button
                      variant={"default"}
                      onClick={handleAcceptEscalation}
                      disabled={isAcceptingEscalation || hasChanges}
                    >
                      <CircleCheckBig />{" "}
                      {isAcceptingEscalation
                        ? "Accepting..."
                        : "Accept Escalation"}
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={handleRespondEscalation}
                      disabled={!hasChanges || isRespondingEscalation}
                    >
                      <ArrowUpFromDot />{" "}
                      {isRespondingEscalation ? "Sending..." : "Counter Offer"}
                    </Button>
                  </div>
                )}
                {selectedOrder.orderStatus !== "new" &&
                  selectedOrder.orderStatus !== "escalation" &&
                  selectedOrder.orderStatus !== "completed" &&
                  (() => {
                    // Check if all sites with capturedImages have been modified
                    const sitesWithImages = selectedOrder.sites.filter(
                      (site) =>
                        site.capturedImages && site.capturedImages.length > 0,
                    );
                    const allSitesModified = sitesWithImages.every(
                      (site) => site.referenceStatus === "modified",
                    );

                    return (
                      <div className="flex gap-2">
                        <Button
                          variant={"outline"}
                          onClick={() => handleViewMap()}
                        >
                          <MapPin /> View Map
                        </Button>
                        <Button
                          variant={"outline"}
                          onClick={() => handleGeneratePPT(selectedOrder)}
                          disabled={isGeneratingPPT}
                        >
                          <Presentation />{" "}
                          {isGeneratingPPT ? "Generating..." : "Generate PPT"}
                        </Button>
                        <Button variant={"outline"}>
                          <Ban /> Cancel Order
                        </Button>
                        {allSitesModified && sitesWithImages.length > 0 && (
                          <Button
                            variant={"default"}
                            onClick={handleVerifyOrder}
                            disabled={isVerifyingOrder}
                          >
                            <CircleCheckBig className="mr-1" />
                            {isVerifyingOrder ? "Verifying..." : "Verify Order"}
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                {selectedOrder.orderStatus === "completed" && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CircleCheckBig className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">
                      Order Completed & Verified
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Set Site Reference Image Modal */}
      <SetSiteReferenceImage
        open={setReferenceOpen}
        onClose={() => setSetReferenceOpen(false)}
        site={selectedSiteData?.site || null}
        siteIndex={selectedSiteData?.index || 0}
        orderId={selectedOrder?._id || ""}
        accessToken={accessToken || ""}
        onSuccess={async () => {
          await fetchOrders();
          // Wait for state to update then refresh selected order
          setTimeout(() => {
            if (selectedOrder) {
              fetch("/api/brand/orders", {
                headers: { Authorization: `Bearer ${accessToken}` },
              })
                .then((res) => res.json())
                .then((result) => {
                  const updatedOrder = result.orders?.find(
                    (o: Order) => o._id === selectedOrder._id,
                  );
                  if (updatedOrder) {
                    setSelectedOrder(updatedOrder);
                    setEditedSites(updatedOrder.sites);
                  }
                })
                .catch((err) => console.error("Error refreshing order:", err));
            }
          }, 500);
        }}
      />

      {/* Store Locations Map */}
      <StoreLocationsMap
        locations={getStoreLocations()}
        open={mapOpen}
        onOpenChange={(open) => {
          setMapOpen(open);
          if (!open) {
            setMapOrder(null); // Clear map order when closing
          }
        }}
      />
    </div>
  );
}

export default ComponentsOrders;
