"use client";

import * as React from "react";
import { TableSkeleton } from "@/components/ui/page-loader";
import { toast } from "sonner";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";
import { format } from "date-fns";
import {
  useVendorOrders,
  type VendorOrder,
  type OrderSite,
} from "@/hooks/use-vendor-orders";
import { useVendorOrderActions } from "@/hooks/use-vendor-order-actions";
import { useVendorEscalation } from "@/hooks/use-vendor-escalation";
import { useVendorAcceptEscalation } from "@/hooks/use-vendor-accept-escalation";
import { StoreLocationsMap } from "@/components/maps/store-locations-map";
import { JobCardPdf } from "./job-card-pdf";
import { InstallationCertificatePdf } from "./installation-certificate-pdf";
import { ReviewInstallationImages } from "./review-installation-images";
import {
  useOrderJobCards,
  type OpenJobCardData,
} from "@/hooks/use-order-jobcards";
import {
  useOrderInstallCerts,
  type InstallCertData,
} from "@/hooks/use-order-install-certs";
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
  FileSearch,
  Printer,
  Ban,
  Presentation,
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/context/AuthContext";
import { Progress } from "@/components/ui/progress";

const statusColors = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  accepted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  escalation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  installed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

export const columns: ColumnDef<VendorOrder>[] = [
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
    accessorKey: "brandId",
    header: () => <div className="text-left">Brand</div>,
    cell: ({ row }) => {
      const brand = row.getValue("brandId") as VendorOrder["brandId"];
      return (
        <div className="text-left">
          <div className="font-medium">{brand?.companyName || "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            {brand?.phone || ""}
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
                <Eye />
                View Details
              </DropdownMenuItem>
              {["new", "creativeAdapted", "creativeaddepted"].includes(
                order.orderStatus,
              ) && (
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
                    onClick={() => meta?.onAcceptOrder(order._id)}
                    disabled={meta?.accepting}
                  >
                    <CircleCheckBig />{" "}
                    {meta?.accepting ? "Accepting..." : "Accept Order"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex gap-1"
                    onClick={() => meta?.onRejectOrder(order._id)}
                    disabled={meta?.rejecting}
                  >
                    <CircleX />{" "}
                    {meta?.rejecting ? "Rejecting..." : "Reject Order"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-1">
                    <ArrowUpFromDot /> Escalation
                  </DropdownMenuItem>
                </>
              )}
              {!["new", "creativeAdapted", "creativeaddepted"].includes(
                order.orderStatus,
              ) && (
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
                    onClick={() => meta?.jobCart(order)}
                  >
                    <Printer /> Job Card
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex gap-1"
                    onClick={() => meta?.installCert(order)}
                  >
                    <Printer /> Install Certificate
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
  const { orders, isLoading, isError, mutate } = useVendorOrders();
  const { acceptOrder, rejectOrder, isAccepting, isRejecting } =
    useVendorOrderActions();
  const { raiseEscalation, isEscalating } = useVendorEscalation();
  const { acceptEscalation, isAcceptingEscalation } =
    useVendorAcceptEscalation();
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
  const [selectedOrder, setSelectedOrder] = React.useState<VendorOrder | null>(
    null,
  );
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
  const [mapOpen, setMapOpen] = React.useState(false);
  const [mapOrder, setMapOrder] = React.useState<VendorOrder | null>(null);
  const [jobCardOpen, setJobCardOpen] = React.useState(false);
  const [jobCardOrder, setJobCardOrder] = React.useState<VendorOrder | null>(
    null,
  );
  const [selectedSites, setSelectedSites] = React.useState<number[]>([]);
  const [installCertOpen, setInstallCertOpen] = React.useState(false);
  const [installCertOrder, setInstallCertOrder] =
    React.useState<VendorOrder | null>(null);
  const [viewJobCardOpen, setViewJobCardOpen] = React.useState(false);
  const [viewJobCardData, setViewJobCardData] =
    React.useState<OpenJobCardData | null>(null);
  const [viewInstallCertOpen, setViewInstallCertOpen] = React.useState(false);
  const [viewInstallCertData, setViewInstallCertData] =
    React.useState<InstallCertData | null>(null);
  const [companyLogo, setCompanyLogo] = React.useState<string | undefined>(
    undefined,
  );
  const [updatingJobCardId, setUpdatingJobCardId] = React.useState<
    string | null
  >(null);
  const [reviewImagesOpen, setReviewImagesOpen] = React.useState(false);
  const [reviewCertData, setReviewCertData] =
    React.useState<InstallCertData | null>(null);
  const [rejectionRemarksOpen, setRejectionRemarksOpen] = React.useState(false);
  const [selectedRejectionRemarks, setSelectedRejectionRemarks] =
    React.useState<string>("");
  const [isGeneratingPPT, setIsGeneratingPPT] = React.useState(false);
  const [showFinalSubmitConfirm, setShowFinalSubmitConfirm] =
    React.useState(false);
  const [selectedCertForFinalSubmit, setSelectedCertForFinalSubmit] =
    React.useState<InstallCertData | null>(null);
  const [isFinalSubmitting, setIsFinalSubmitting] = React.useState(false);
  const { user, accessToken } = useAuth();

  // Fetch job cards and installation certificates for selected order
  const { jobCards, mutate: mutateJobCards } = useOrderJobCards(
    selectedOrder?._id || null,
  );
  const { installCerts, mutate: mutateInstallCerts } = useOrderInstallCerts(
    selectedOrder?._id || null,
  );

  // console.log({installCerts: installCerts.map(cert => cert.sites.map(site => site.storeName + "-" + site.elementName)).flat()});

  const handleGeneratePPT = async (order: VendorOrder) => {
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

  const handleReviewImages = (cert: InstallCertData) => {
    setReviewCertData(cert);
    setReviewImagesOpen(true);
  };

  const getVendorVerifiedCount = (cert: InstallCertData) => {
    return cert.sites.filter((site) => site.status === "vendorVerified").length;
  };

  const handleFinalSubmitClick = (cert: InstallCertData) => {
    const verifiedCount = getVendorVerifiedCount(cert);
    if (verifiedCount === 0) {
      toast.error("No vendor verified sites to submit");
      return;
    }
    setSelectedCertForFinalSubmit(cert);
    setShowFinalSubmitConfirm(true);
  };

  const handlePPTGeneratedYes = async () => {
    if (!selectedCertForFinalSubmit) return;

    setShowFinalSubmitConfirm(false);
    setIsFinalSubmitting(true);

    try {
      const response = await fetch(
        "/api/vendor/orders/final-submit-installation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            orderId: selectedOrder?._id,
            certificateId: selectedCertForFinalSubmit._id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit installation");
      }

      toast.success(
        `✓ ${data.submittedCount} sites marked as submitted successfully!`,
      );
      mutateInstallCerts();
      mutate();
    } catch (error: any) {
      console.error("Error in final submit:", error);
      toast.error(error.message || "Failed to submit installation");
    } finally {
      setIsFinalSubmitting(false);
      setSelectedCertForFinalSubmit(null);
    }
  };

  const handlePPTGeneratedNo = () => {
    setShowFinalSubmitConfirm(false);
    setSelectedCertForFinalSubmit(null);
    toast.warning(
      "⚠️ This is the last time you can generate PPT. Please generate it now before final submission.",
    );
  };

  // Check if ALL job cards have status "printed"
  const allJobCardsPrinted =
    jobCards.length > 0 &&
    jobCards.every((jobCard) => jobCard.orderStatus === "printed");

  React.useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch orders");
    }
  }, [isError]);

  // Auto-select all selectable sites by default when modal opens
  React.useEffect(() => {
    if (selectedOrder && selectedSites.length === 0 && editedSites.length > 0) {
      const selectableIndices = getSelectableSiteIndices();
      if (selectableIndices.length > 0) {
        setSelectedSites(selectableIndices);
      }
    }
  }, [selectedOrder, jobCards, editedSites]);

  // Automatically uncheck sites that become disabled
  React.useEffect(() => {
    if (selectedSites.length > 0 && editedSites.length > 0) {
      const validSelections = selectedSites.filter(
        (index) => !shouldDisableSite(index),
      );
      if (validSelections.length !== selectedSites.length) {
        setSelectedSites(validSelections);
      }
    }
  }, [jobCards, installCerts, allJobCardsPrinted, editedSites]);

  const handleViewDetails = (order: VendorOrder) => {
    setSelectedOrder(order);
    setSelectedSites([]); // Reset selected sites

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

  const handleAcceptOrder = async (orderId: string) => {
    const success = await acceptOrder(orderId);
    if (success) {
      setDetailsOpen(false);
      mutate(); // Refresh orders list
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    toast("Are You sure you want to reject this order?", {
      position: "top-center",
      duration: 5000,
      action: {
        label: "Yes",
        onClick: () => {
          // Close modal immediately for better UX
          setDetailsOpen(false);
          // Then perform rejection asynchronously
          rejectOrder(orderId).then((success) => {
            if (success) {
              mutate(); // Refresh orders list
            }
          });
        },
      },
      cancel: {
        label: "No",
        onClick: () => {
          toast.dismiss();
          setDetailsOpen(false);
        },
      },
    });
  };

  const handleSiteRateChange = (index: number, newRate: number) => {
    const changedSite = editedSites[index];
    const elementName = changedSite.elementName;

    // Update all sites with the same elementName
    const updated = editedSites.map((site, idx) => {
      if (site.elementName === elementName) {
        return { ...site, rate: newRate };
      }
      return site;
    });

    setEditedSites(updated);
    setHasChanges(true);
  };

  const handleSiteSelection = (index: number) => {
    setSelectedSites((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleSelectAllSites = () => {
    const selectableSites = getSelectableSiteIndices();

    if (selectedSites.length === selectableSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(selectableSites);
    }
  };

  const getSelectableSiteIndices = () => {
    // When all job cards are printed, allow selecting any site not used in install certs OR rejected sites
    if (allJobCardsPrinted) {
      return editedSites
        .map((_, index) => index)
        .filter((index) => {
          const site = editedSites[index];
          // Include rejected sites for resubmission
          if (site?.rejectionStatus === "rejected") return true;
          return !isSiteUsedInInstallCert(index);
        });
    }

    // Otherwise, only allow sites not used in job cards OR rejected sites
    return editedSites
      .map((_, index) => index)
      .filter((index) => {
        const site = editedSites[index];
        // Include rejected sites for resubmission
        if (site?.rejectionStatus === "rejected") return true;
        return !isSiteUsedInJobCard(index);
      });
  };

  const shouldDisableSite = (siteIndex: number) => {
    const site = editedSites[siteIndex];
    if (!site) return false;

    // Allow selecting rejected sites again for resubmission
    if (site.rejectionStatus === "rejected") {
      return false;
    }

    // When all job cards are printed, disable sites used in install certs
    if (allJobCardsPrinted) {
      return isSiteUsedInInstallCert(siteIndex);
    }
    // Otherwise, disable sites used in job cards
    return isSiteUsedInJobCard(siteIndex);
  };

  // Check if a site is already used in any job card
  const isSiteUsedInJobCard = (siteIndex: number) => {
    if (!selectedOrder) return false;
    const site = editedSites[siteIndex];
    if (!site) return false;

    return jobCards.some((jobCard) =>
      jobCard.sites.some(
        (jcSite) =>
          jcSite.storeName === site.storeName &&
          jcSite.elementName === site.elementName,
      ),
    );
  };

  // Check if a site is already used in any installation certificate
  const isSiteUsedInInstallCert = (siteIndex: number) => {
    if (!selectedOrder) return false;
    const site = editedSites[siteIndex];
    if (!site) return false;

    return installCerts.some((cert) =>
      cert.sites.some(
        (certSite) =>
          certSite.storeName === site.storeName &&
          certSite.elementName === site.elementName,
      ),
    );
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
    const total = subtotal + editedAdditionalCharges;
    const tax = total * 0.18;
    return {
      subtotal,
      additionalCharges: editedAdditionalCharges,
      tax,
      total: total + tax,
    };
  };

  const handleRaiseEscalation = async () => {
    if (!selectedOrder || !hasChanges) return;

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

    // Calculate additional charge changes
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

    const success = await raiseEscalation({
      orderId: selectedOrder._id,
      siteChanges,
      additionalChargeChanges,
      oldTotal,
      newTotal: editedPricing.total,
    });

    if (success) {
      setDetailsOpen(false);
      mutate();
    }
  };

  const handleAcceptEscalation = async () => {
    if (!selectedOrder) return;

    const success = await acceptEscalation(
      selectedOrder._id,
      editedSites,
      editedAdditionalCharges,
    );

    if (success) {
      setDetailsOpen(false);
      mutate();
    }
  };

  const handleViewMap = (order?: VendorOrder) => {
    const orderToUse = order || selectedOrder;
    if (!orderToUse) return;
    // console.log('📍 Opening map for order:', orderToUse.orderNumber);
    // console.log('📍 Order sites:', orderToUse.sites);

    // Set the order whose map should be shown
    setMapOrder(orderToUse);
    setMapOpen(true);
  };

  const handleJobCart = async (order?: VendorOrder) => {
    const orderToUse = order || selectedOrder;
    if (!orderToUse) return;

    // Check if at least one site is selected
    if (selectedSites.length === 0) {
      toast.error("Please select at least one site for the job card");
      return;
    }

    try {
      // Get only selected sites
      const sitesToSend = orderToUse.sites.filter((_, index) =>
        selectedSites.includes(index),
      );

      // Call API to create or get existing OpenJobCards entry
      const response = await fetch("/api/vendor/orders/create-job-card", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderToUse._id,
          selectedSites: sitesToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        throw new Error(data.message || "Failed to create job card");
      }

      toast.success("Job card created successfully!");

      // Reset selected sites
      setSelectedSites([]);

      // Refresh job cards list
      mutateJobCards();

      // Refresh orders to show updated count
      mutate();
    } catch (error: any) {
      console.error("Error creating job card:", error);
      toast.error(error.message || "Failed to create job card");
    }
  };

  const handleInstallCert = async (order?: VendorOrder) => {
    const orderToUse = order || selectedOrder;
    if (!orderToUse) return;

    if (selectedSites.length === 0) {
      toast.error(
        "Please select at least one site for the installation certificate",
      );
      return;
    }

    try {
      const sitesToSend = orderToUse.sites.filter((_, index) =>
        selectedSites.includes(index),
      );

      // Call API to create Installation Certificate entry
      const response = await fetch(
        "/api/vendor/orders/create-installation-certificate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderToUse._id,
            selectedSites: sitesToSend,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        throw new Error(
          data.message || "Failed to create installation certificate",
        );
      }

      toast.success("Installation certificate created successfully!");

      // Reset selected sites
      setSelectedSites([]);

      // Refresh installation certificates list
      mutateInstallCerts();

      // Refresh orders to show updated count
      mutate();
    } catch (error: any) {
      console.error("Error creating installation certificate:", error);
      toast.error(error.message || "Failed to create installation certificate");
    }
  };

  const handleMarkJobCardReady = async (jobCardId: string) => {
    if (!accessToken) return;

    setUpdatingJobCardId(jobCardId);

    try {
      const response = await fetch(
        "/api/vendor/openjobcards/update-order-status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            jobCardId: jobCardId,
            status: "printed",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update job card status");
      }

      toast.success("Job Card marked as Ready (Printed)!");

      // Refresh job cards list
      mutateJobCards();
    } catch (error: any) {
      console.error("Error updating job card status:", error);
      toast.error(error.message || "Failed to update job card status");
    } finally {
      setUpdatingJobCardId(null);
    }
  };

  const getStoreLocations = () => {
    const orderToUse = mapOrder;
    if (!orderToUse) return [];

    // Extract unique store locations from order sites
    const locationsMap = new Map();

    orderToUse.sites.forEach((site, index) => {
      // console.log(`📍 Site ${index}:`, site.storeName, 'has storeLocation?', !!site.storeLocation);

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
          // console.log(`📍 Added location:`, site.storeName, site.storeLocation.coordinates);
        }
      }
    });

    const locations = Array.from(locationsMap.values());
    // console.log('📍 Total unique locations extracted:', locations.length);
    // console.log('📍 Locations array:', locations);
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
      onAcceptOrder: handleAcceptOrder,
      onRejectOrder: handleRejectOrder,
      accepting: isAccepting,
      rejecting: isRejecting,
      viewMap: handleViewMap,
      jobCart: handleJobCart,
      installCert: handleInstallCert,
      generatePPT: handleGeneratePPT,
      generatingPPT: isGeneratingPPT,
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
          <p className="text-muted-foreground">Manage your assigned orders</p>
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
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="escalation">Escalation</SelectItem>
            <SelectItem value="installed">Installed</SelectItem>
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
                {order.brandId && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Brand: </span>
                    <span className="font-medium">
                      {order.brandId.companyName}
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

                {/* Brand Info */}
                {selectedOrder.brandId && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Brand Information
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="font-medium">
                        {selectedOrder.brandId.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.brandId.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.brandId.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sites Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Order Sites</h3>
                    {/* {selectedOrder.orderStatus !== "new" && selectedOrder.orderStatus !== "rejected" && selectedOrder.orderStatus !== "escalation" && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all-sites"
                          checked={(() => {
                            const unusedSites = editedSites.filter((_, index) => !isSiteUsedInJobCard(index));
                            return selectedSites.length === unusedSites.length && unusedSites.length > 0;
                          })()}
                          onCheckedChange={handleSelectAllSites}
                        />
                        <label htmlFor="select-all-sites" className="text-sm font-medium cursor-pointer">
                          Select All ({selectedSites.length}/{editedSites.filter((_, index) => !isSiteUsedInJobCard(index)).length} available)
                        </label>
                      </div>
                    )} */}
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {selectedOrder.orderStatus !== "new" &&
                            selectedOrder.orderStatus !== "rejected" &&
                            selectedOrder.orderStatus !== "escalation" && (
                              <TableHead className="w-12">
                                <Checkbox
                                  id="select-all-sites"
                                  checked={(() => {
                                    const selectableSites =
                                      getSelectableSiteIndices();
                                    return (
                                      selectedSites.length ===
                                        selectableSites.length &&
                                      selectableSites.length > 0
                                    );
                                  })()}
                                  onCheckedChange={handleSelectAllSites}
                                />
                              </TableHead>
                            )}
                          <TableHead>Site</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Dimensions</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editedSites.map((site, index) => {
                          const siteTotal = priceCalculatorNumber(site);
                          const isRejected =
                            site.rejectionStatus === "rejected";

                          return (
                            <TableRow
                              key={index}
                              className={
                                isRejected ? "bg-red-50 dark:bg-red-950/20" : ""
                              }
                            >
                              {selectedOrder.orderStatus !== "new" &&
                                selectedOrder.orderStatus !== "rejected" &&
                                selectedOrder.orderStatus !== "escalation" && (
                                  <TableCell
                                    className={
                                      shouldDisableSite(index)
                                        ? "opacity-50"
                                        : ""
                                    }
                                  >
                                    <Checkbox
                                      checked={selectedSites.includes(index)}
                                      onCheckedChange={() =>
                                        handleSiteSelection(index)
                                      }
                                      disabled={shouldDisableSite(index)}
                                    />
                                  </TableCell>
                                )}
                              <TableCell
                                className={
                                  shouldDisableSite(index) ? "opacity-50" : ""
                                }
                              >
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
                                    {isSiteUsedInJobCard(index) &&
                                      !allJobCardsPrinted && (
                                        <Badge
                                          variant="secondary"
                                          className="mt-1 text-xs"
                                        >
                                          Used in Job Card
                                        </Badge>
                                      )}
                                    {isSiteUsedInInstallCert(index) && (
                                      <Badge
                                        variant="secondary"
                                        className="mt-1 text-xs"
                                      >
                                        Used in Install Cert
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell
                                className={
                                  shouldDisableSite(index) ? "opacity-50" : ""
                                }
                              >
                                {site.storeName}
                              </TableCell>
                              <TableCell
                                className={
                                  shouldDisableSite(index) ? "opacity-50" : ""
                                }
                              >
                                {site.width} x {site.height}{" "}
                                {site.measurementUnit}
                              </TableCell>
                              <TableCell
                                className={
                                  shouldDisableSite(index) ? "opacity-50" : ""
                                }
                              >
                                {selectedOrder.orderStatus === "new" ||
                                selectedOrder.orderStatus === "escalation" ? (
                                  <Input
                                    type="number"
                                    value={site.rate}
                                    onChange={(e) =>
                                      handleSiteRateChange(
                                        index,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-24"
                                  />
                                ) : (
                                  <>
                                    ₹{site.rate}
                                    {site.calculateUnit === "sqft" && "/sqft"}
                                  </>
                                )}
                              </TableCell>
                              <TableCell
                                className={
                                  shouldDisableSite(index) ? "opacity-50" : ""
                                }
                              >
                                {site.quantity}
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium ${shouldDisableSite(index) ? "opacity-50" : ""}`}
                              >
                                ₹{siteTotal.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                {isRejected && site.rejectionRemarks && (
                                  <Badge
                                    variant="destructive"
                                    className="cursor-pointer hover:bg-red-700"
                                    onClick={() => {
                                      setSelectedRejectionRemarks(
                                        site.rejectionRemarks || "",
                                      );
                                      setRejectionRemarksOpen(true);
                                    }}
                                  >
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
                      selectedOrder.orderStatus === "new" ||
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
                          {selectedOrder.orderStatus === "new" ||
                          selectedOrder.orderStatus === "escalation" ? (
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
                      <Button
                        variant={"outline"}
                        onClick={() => handleAcceptOrder(selectedOrder._id)}
                        disabled={isAccepting || hasChanges}
                      >
                        <CircleCheckBig />{" "}
                        {isAccepting ? "Accepting..." : "Accept Order"}
                      </Button>
                      <Button
                        variant={"outline"}
                        onClick={() => handleRejectOrder(selectedOrder._id)}
                        disabled={isRejecting}
                      >
                        <CircleX />{" "}
                        {isRejecting ? "Rejecting..." : "Reject Order"}
                      </Button>
                      <Button
                        variant={"outline"}
                        onClick={handleRaiseEscalation}
                        disabled={!hasChanges || isEscalating}
                      >
                        <ArrowUpFromDot />{" "}
                        {isEscalating ? "Raising..." : "Raise Escalation"}
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
                      onClick={handleRaiseEscalation}
                      disabled={!hasChanges || isEscalating}
                    >
                      <ArrowUpFromDot />{" "}
                      {isEscalating ? "Counter..." : "Counter Offer"}
                    </Button>
                  </div>
                )}
                {selectedOrder.orderStatus !== "new" &&
                  selectedOrder.orderStatus !== "rejected" &&
                  selectedOrder.orderStatus !== "escalation" && (
                    <>
                      <div className="flex gap-2">
                        <Button
                          variant={"outline"}
                          onClick={() => handleViewMap(selectedOrder)}
                        >
                          <MapPin /> View Map
                        </Button>
                        <Button
                          variant={"outline"}
                          onClick={() => handleJobCart(selectedOrder)}
                          disabled={allJobCardsPrinted}
                        >
                          <Printer /> Job Card
                        </Button>
                        <Button
                          variant={"outline"}
                          onClick={() => handleInstallCert(selectedOrder)}
                        >
                          <Printer /> Install Certificate
                        </Button>
                        <Button variant={"outline"}>
                          <Ban /> Cancel Order
                        </Button>
                        <Button
                          onClick={() => handleGeneratePPT(selectedOrder)}
                          variant={"outline"}
                          disabled={isGeneratingPPT}
                        >
                          <Presentation />{" "}
                          {isGeneratingPPT ? "Generating..." : "Generate PPT"}
                        </Button>
                        {(() => {
                          const totalVendorVerified = installCerts.reduce(
                            (total, cert) => {
                              return total + getVendorVerifiedCount(cert);
                            },
                            0,
                          );

                          if (totalVendorVerified > 0) {
                            return (
                              <Button
                                variant="default"
                                onClick={() => {
                                  // Find the first cert with vendor verified sites and use it for modal
                                  const certWithVerified = installCerts.find(
                                    (cert) => getVendorVerifiedCount(cert) > 0,
                                  );
                                  if (certWithVerified) {
                                    handleFinalSubmitClick(certWithVerified);
                                  }
                                }}
                                disabled={isFinalSubmitting}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isFinalSubmitting ? (
                                  <>
                                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <CircleCheckBig className="mr-2 h-4 w-4" />{" "}
                                    Final Submit ({totalVendorVerified})
                                  </>
                                )}
                              </Button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div
                        className={`${installCerts.length > 0 ? "grid grid-cols-2 gap-4" : "grid-cols-1 gap-4"}`}
                      >
                        {/* List of Job Cards */}
                        {jobCards.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h3 className="text-lg font-semibold">
                              Created Job Cards ({jobCards.length})
                            </h3>
                            <div className="space-y-2">
                              {jobCards.map((jobCard) => {
                                const printedSitesCount = jobCard.sites.filter(
                                  (s) => s.status === "printed",
                                ).length;
                                const totalSites = jobCard.sites.length;
                                const allSitesPrinted =
                                  printedSitesCount === totalSites;
                                const progressPercent =
                                  totalSites > 0
                                    ? (printedSitesCount / totalSites) * 100
                                    : 0;

                                return (
                                  <Card key={jobCard._id} className="p-3">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                              Job Card #{jobCard.jobCardNumber}
                                            </Badge>
                                            <Badge variant="outline">
                                              {totalSites} Site
                                              {totalSites > 1 ? "s" : ""}
                                            </Badge>
                                            <Badge
                                              variant={
                                                jobCard.orderStatus ===
                                                "completed"
                                                  ? "default"
                                                  : jobCard.orderStatus ===
                                                      "in-progress"
                                                    ? "secondary"
                                                    : jobCard.orderStatus ===
                                                        "printed"
                                                      ? "default"
                                                      : "outline"
                                              }
                                              className={
                                                jobCard.orderStatus ===
                                                "printed"
                                                  ? "bg-green-600"
                                                  : ""
                                              }
                                            >
                                              {jobCard.orderStatus}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            Created:{" "}
                                            {format(
                                              new Date(jobCard.createdAt),
                                              "dd MMM yyyy, HH:mm",
                                            )}
                                          </p>
                                          <div className="text-xs text-muted-foreground">
                                            Sites:{" "}
                                            {jobCard.sites
                                              .map((s) => s.storeName)
                                              .join(", ")}
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setViewJobCardData(jobCard);
                                              setViewJobCardOpen(true);
                                            }}
                                          >
                                            <Eye className="w-4 h-4 mr-1" />{" "}
                                            View
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Progress Bar */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-muted-foreground">
                                            Printing Progress
                                          </span>
                                          <span className="font-medium">
                                            {printedSitesCount}/{totalSites}{" "}
                                            Sites Printed
                                          </span>
                                        </div>
                                        <Progress
                                          value={progressPercent}
                                          className="h-2"
                                        />
                                      </div>

                                      {/* Ready Button - Show only when all sites are printed and status is not already "printed" */}
                                      {allSitesPrinted &&
                                        jobCard.orderStatus !== "printed" && (
                                          <Button
                                            variant="default"
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            size="sm"
                                            onClick={() =>
                                              handleMarkJobCardReady(
                                                jobCard._id,
                                              )
                                            }
                                            disabled={
                                              updatingJobCardId === jobCard._id
                                            }
                                          >
                                            {updatingJobCardId === jobCard._id
                                              ? "Marking Ready..."
                                              : "✓ Mark as Ready (Printed)"}
                                          </Button>
                                        )}
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* List of Installation Certificates */}
                        {installCerts.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h3 className="text-lg font-semibold">
                              Created Installation Certificates (
                              {installCerts.length})
                            </h3>
                            <div className="space-y-2">
                              {installCerts.map((cert) => (
                                <Card key={cert._id} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                          Installation Certificate
                                        </Badge>
                                        <Badge variant="outline">
                                          {cert.sites.length} Site
                                          {cert.sites.length > 1 ? "s" : ""}
                                        </Badge>
                                        <Badge
                                          variant={
                                            cert.orderStatus === "completed"
                                              ? "default"
                                              : cert.orderStatus ===
                                                  "in-progress"
                                                ? "secondary"
                                                : "outline"
                                          }
                                        >
                                          {cert.orderStatus}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        Created:{" "}
                                        {format(
                                          new Date(cert.createdAt),
                                          "dd MMM yyyy, HH:mm",
                                        )}
                                      </p>
                                      <div className="text-xs text-muted-foreground">
                                        Sites:{" "}
                                        {cert.sites
                                          .map((s) => s.storeName)
                                          .join(", ")}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setViewInstallCertData(cert);
                                          setViewInstallCertOpen(true);
                                        }}
                                      >
                                        <Eye className="w-4 h-4 mr-1" /> View
                                      </Button>

                                      {(() => {
                                        const sitesWithImages =
                                          cert.sites.filter(
                                            (s: any) =>
                                              s.capturedImages &&
                                              s.capturedImages.length > 0,
                                          ).length;
                                        const vendorVerifiedCount =
                                          getVendorVerifiedCount(cert);

                                        if (sitesWithImages > 0) {
                                          return (
                                            <Button
                                              variant="default"
                                              size="sm"
                                              onClick={() =>
                                                handleReviewImages(cert)
                                              }
                                              className="relative"
                                            >
                                              <FileSearch className="w-4 h-4 mr-1" />{" "}
                                              Review Images
                                              <Badge
                                                className="ml-2 bg-white text-primary hover:bg-white"
                                                variant="secondary"
                                              >
                                                {sitesWithImages}/
                                                {cert.sites.length}
                                              </Badge>
                                            </Button>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Job Card PDF Dialog */}
      <Dialog open={jobCardOpen} onOpenChange={setJobCardOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>Job Card - {jobCardOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {jobCardOrder && (
            <JobCardPdf order={jobCardOrder} companyLogo={companyLogo} />
          )}
        </DialogContent>
      </Dialog>

      {/* View Job Card Dialog */}
      <Dialog open={viewJobCardOpen} onOpenChange={setViewJobCardOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>
              View Job Card #{viewJobCardData?.jobCardNumber} -{" "}
              {viewJobCardData?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {viewJobCardData && selectedOrder && (
            <JobCardPdf
              order={{
                ...selectedOrder,
                openjobcardsId: viewJobCardData._id,
                jobCardNumber: viewJobCardData.jobCardNumber,
                sites: viewJobCardData.sites as any,
              }}
              companyLogo={user?.companyLogo}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Installation Certificate PDF Dialog */}
      <Dialog open={installCertOpen} onOpenChange={setInstallCertOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>
              Installation Certificate - {installCertOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {installCertOrder && (
            <InstallationCertificatePdf
              order={installCertOrder}
              companyLogo={companyLogo}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Installation Certificate Dialog */}
      <Dialog open={viewInstallCertOpen} onOpenChange={setViewInstallCertOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>
              View Installation Certificate - {viewInstallCertData?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {viewInstallCertData && selectedOrder && (
            <InstallationCertificatePdf
              order={{
                ...selectedOrder,
                installCertificateId: viewInstallCertData._id,
                sites: viewInstallCertData.sites as any,
              }}
              companyLogo={user?.companyLogo}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Review Installation Images Modal */}
      <ReviewInstallationImages
        open={reviewImagesOpen}
        onClose={() => setReviewImagesOpen(false)}
        certData={reviewCertData}
        mutateJobCards={mutate}
        orderId={selectedOrder?._id || ""}
        accessToken={accessToken || ""}
        orderSites={selectedOrder?.sites || []}
        onSuccess={async () => {
          await mutateInstallCerts();
          await mutate();
          // Refresh selected order to show updated submitted sites
          if (selectedOrder) {
            const updatedOrder = orders?.find(
              (o) => o._id === selectedOrder._id,
            );
            if (updatedOrder) {
              setSelectedOrder(updatedOrder);
            }
          }
        }}
      />

      {/* Rejection Remarks Dialog */}
      <Dialog
        open={rejectionRemarksOpen}
        onOpenChange={setRejectionRemarksOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <CircleX className="h-5 w-5" />
              Rejection Remarks
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-muted-foreground mb-2">
                Brand's Rejection Reason:
              </p>
              <p className="text-base font-medium whitespace-pre-wrap">
                {selectedRejectionRemarks}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setRejectionRemarksOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PPT Confirmation Modal for Final Submit */}
      <Dialog
        open={showFinalSubmitConfirm}
        onOpenChange={() => setShowFinalSubmitConfirm(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              PPT Generation Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-600 dark:text-amber-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Important Notice
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Have you generated the PPT for this installation?
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <CircleCheckBig className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p>
                  <strong>Yes:</strong> All{" "}
                  {selectedCertForFinalSubmit
                    ? getVendorVerifiedCount(selectedCertForFinalSubmit)
                    : 0}{" "}
                  vendor-verified sites will be marked as submitted and the
                  installation process will be completed.
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <FileSearch className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <p>
                  <strong>No:</strong> You will be prompted to generate the PPT
                  first. This is your last chance to generate it before final
                  submission.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-4">
                Ready to submit{" "}
                {selectedCertForFinalSubmit
                  ? getVendorVerifiedCount(selectedCertForFinalSubmit)
                  : 0}{" "}
                site
                {selectedCertForFinalSubmit &&
                getVendorVerifiedCount(selectedCertForFinalSubmit) > 1
                  ? "s"
                  : ""}
                ?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePPTGeneratedNo}
                  className="flex-1"
                  disabled={isFinalSubmitting}
                >
                  <CircleX className="h-4 w-4 mr-2" />
                  No, Generate PPT First
                </Button>
                <Button
                  variant="default"
                  onClick={handlePPTGeneratedYes}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isFinalSubmitting}
                >
                  {isFinalSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CircleCheckBig className="h-4 w-4 mr-2" />
                      Yes, Submit Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ComponentsOrders;
