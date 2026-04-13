"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Calendar,
  Package,
  IndianRupee,
  Eye,
  MapPin,
  FileSearch,
} from "lucide-react";
import { toast } from "sonner";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";
import { useAuth } from "@/lib/context/AuthContext";

interface TenderSite {
  siteId: string;
  elementName: string;
  siteDescription?: string;
  storeName: string;
  photo?: string;
  width: number;
  height: number;
  measurementUnit: string;
  rate: number;
  calculateUnit: string;
  quantity: number;
  storeAddress?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  storeCity?: string;
  storeState?: string;
  storePincode?: string;
}

interface VendorInfo {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Bidding {
  vendorId: string;
  amount?: number;
  customRates?: Array<{
    siteId: string;
    elementName: string;
    vendorRate: number;
  }>;
  vendorCharges?: Array<{
    label: string;
    amount: string;
  }>;
  status: "submitted" | "rejected";
  submittedAt: Date;
  vendorInfo: VendorInfo | null;
}

interface Tender {
  _id: string;
  tenderNumber: string;
  poNumber?: string;
  tenderDate: Date;
  deadlineDate: Date;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  sites: TenderSite[];
  subtotal: number;
  additionalChargesTotal: number;
  tax: number;
  total: number;
  originalSubtotal?: number;
  originalTax?: number;
  originalTotal?: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  notes?: string;
  biddings?: Bidding[];
  acceptedVendorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ComponentsTenders() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [tenders, setTenders] = React.useState<Tender[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTender, setSelectedTender] = React.useState<Tender | null>(
    null,
  );  const [viewBidModalOpen, setViewBidModalOpen] = React.useState(false);
  const [selectedBid, setSelectedBid] = React.useState<Bidding | null>(null);
  const [selectedTenderForBid, setSelectedTenderForBid] = React.useState<Tender | null>(null);
  React.useEffect(() => {
    if (accessToken) {
      fetchTenders();
    }
  }, [accessToken]);

  const fetchTenders = async () => {
    try {
      const response = await fetch("/api/brand/tenders", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tenders");
      }

      const data = await response.json();
      setTenders(data.tenders || []);
    } catch (error: any) {
      console.error("Error fetching tenders:", error);
      toast.error("Failed to load tenders");
    } finally {
      setIsLoading(false);
    }
  };

  const acceptBid = async (tenderId: string, vendorId: string) => {
    try {
      const response = await fetch("/api/brand/tenders/accept-bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tenderId, vendorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept bid");
      }

      toast.success("Vendor bid accepted successfully");
      await fetchTenders(); // Refresh tenders
    } catch (error: any) {
      console.error("Error accepting bid:", error);
      toast.error(error.message || "Failed to accept bid");
    }
  };

  const generateOrder = async (tenderId: string) => {
    try {
      const response = await fetch("/api/brand/tenders/generate-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ tenderId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate order");
      }

      const data = await response.json();
      toast.success(`Order ${data.order.orderNumber} generated successfully!`);
      await fetchTenders(); // Refresh tenders
    } catch (error: any) {
      console.error("Error generating order:", error);
      toast.error(error.message || "Failed to generate order");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "cancelled":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tenders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tenders</h1>
          <p className="text-muted-foreground">
            View and manage your tender submissions
          </p>
        </div>
        <Button onClick={() => router.push("/brand/checkout")}>
          <FileText className="mr-2 h-4 w-4" />
          New Tender
        </Button>
      </div>

      {/* Tenders List */}
      {tenders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FileText className="h-24 w-24 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No tenders found</h2>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t submitted any tenders yet.
            </p>
            <Button onClick={() => router.push("/brand/checkout")}>
              Submit Your First Tender
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tenders.map((tender) => (
            <Card key={tender._id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">
                        {tender.tenderNumber}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={getStatusColor(tender.status)}
                      >
                        {tender.status.toUpperCase()}
                      </Badge>
                    </div>
                    {tender.poNumber && (
                      <CardDescription>
                        PO Number: {tender.poNumber}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedTender(
                        selectedTender?._id === tender._id ? null : tender,
                      )
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {selectedTender?._id === tender._id
                      ? "Hide Details"
                      : "View Details"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tender Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tender.tenderDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Deadline</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tender.deadlineDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Total Sites</p>
                      <p className="text-sm text-muted-foreground">
                        {tender.sites.length} sites
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <IndianRupee className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Total Amount</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{tender.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                {/* {tender.storeLocation?.coordinates && (
                  <div className="flex items-start gap-2 mb-4 pb-4 border-b">
                    <button
                      onClick={() => {
                        const [lng, lat] = tender.storeLocation!.coordinates;
                        window.open(
                          `https://www.google.com/maps?q=${lat},${lng}`,
                          "_blank",
                        );
                      }}
                      className="text-sm text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Store Location</p>
                      </div>
                    </button>
                  </div>
                )} */}

                {/* Vendor Biddings */}
                {tender.biddings && tender.biddings.length > 0 && (
                  <div className="mb-4 pb-4 border-b">
                    <h3 className="text-sm font-semibold mb-3">
                      Vendor Bids ({tender.acceptedVendorId 
                        ? "1" 
                        : tender.biddings.filter((b) => b.status === "submitted").length})
                    </h3>
                    <div className="space-y-3">
                      {tender.biddings
                        .filter((bid) => bid.status === "submitted")
                        .filter((bid) => {
                          // If acceptedVendorId exists, show only that vendor
                          if (tender.acceptedVendorId) {
                            return bid.vendorId === tender.acceptedVendorId;
                          }
                          // Otherwise show all submitted bids
                          return true;
                        })
                        .map((bid, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              tender.acceptedVendorId === bid.vendorId
                                ? "bg-muted/30 border-green-700"
                                : "bg-muted/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">
                                    {bid.vendorInfo?.name || "Unknown Vendor"}
                                  </p>
                                  {tender.acceptedVendorId === bid.vendorId && (
                                    <Badge className="bg-green-500">
                                      Accepted
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {bid.vendorInfo?.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {bid.vendorInfo?.phone}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />
                                    <span className="text-sm font-semibold">
                                      {bid.amount
                                        ? `₹${bid.amount.toFixed(2)}`
                                        : `₹${tender.total.toFixed(2)}`}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(
                                      new Date(bid.submittedAt),
                                      "dd MMM yyyy, hh:mm a"
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBid(bid);
                                    setSelectedTenderForBid(tender);
                                    setViewBidModalOpen(true);
                                  }}
                                >
                                  <FileSearch className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {!tender.acceptedVendorId ? (
                                  <Button
                                    size="sm"
                                    onClick={() => acceptBid(tender._id, bid.vendorId)}
                                  >
                                    Accept
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => generateOrder(tender._id)}
                                  >
                                    Generate Order
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {selectedTender?._id === tender._id && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Tender Sites</h3>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Site</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Dimensions</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tender.sites.map((site, index) => {
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
                                  {site.storeAddress && (
                                    <div className="text-xs">
                                      <p className="font-medium">{site.storeAddress}</p>
                                      <p className="text-muted-foreground">
                                        {site.storeCity}, {site.storeState}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {site.storePincode}
                                      </p>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {site.width} x {site.height}{" "}
                                  {site.measurementUnit}
                                </TableCell>
                                <TableCell>
                                  ₹{site.rate}
                                  {site.calculateUnit === "sqft" && "/sqft"}
                                </TableCell>
                                <TableCell>{site.quantity}</TableCell>
                                <TableCell>
                                  {site.storeLocation?.coordinates && (
                                    <button
                                      onClick={() => {
                                        const [lng, lat] = site.storeLocation!.coordinates;
                                        window.open(
                                          `https://www.google.com/maps?q=${lat},${lng}`,
                                          "_blank"
                                        );
                                      }}
                                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                    >
                                      <MapPin className="h-4 w-4" />
                                    </button>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  ₹{siteTotal.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {/* Pricing Breakdown */}
                    <div className="mt-6 max-w-sm ml-auto space-y-2">
                      {tender.acceptedVendorId && tender.originalTotal && (
                        <>
                          <h4 className="text-sm font-semibold mb-3">Old Rates</h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="line-through">₹{tender.originalSubtotal?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tax (GST 18%)</span>
                            <span className="line-through">₹{tender.originalTax?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-medium mb-4">
                            <span className="text-muted-foreground">Total</span>
                            <span className="line-through">₹{tender.originalTotal?.toFixed(2)}</span>
                          </div>
                          <h4 className="text-sm font-semibold mb-3 pt-2 border-t">New Rates (Accepted Bid)</h4>
                        </>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{tender.subtotal.toFixed(2)}</span>
                      </div>
                      {tender.additionalChargesTotal > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Additional Charges
                          </span>
                          <span>
                            ₹{tender.additionalChargesTotal.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tax (GST 18%)
                        </span>
                        <span>₹{tender.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>₹{tender.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {tender.notes && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="text-sm font-semibold mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {tender.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Bid Details Modal */}
      <Dialog open={viewBidModalOpen} onOpenChange={setViewBidModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Bid Details</DialogTitle>
            <DialogDescription>
              {selectedBid?.vendorInfo?.name} ka bid details - {selectedTenderForBid?.tenderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Vendor Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Vendor Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{selectedBid?.vendorInfo?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedBid?.vendorInfo?.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{selectedBid?.vendorInfo?.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bid Amount:</span>
                  <p className="font-medium">
                    ₹{selectedBid?.amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Rates */}
            {selectedBid?.customRates && selectedBid.customRates.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold pt-3 border-t">Vendor's Custom Rates</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site/Element</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Vendor Rate</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBid.customRates.map((customRate, index) => {
                      // Find the corresponding site from tender
                      const site = selectedTenderForBid?.sites.find(
                        s => s.siteId === customRate.siteId
                      );
                      
                      // Calculate amount using vendor's rate
                      let amount = 0;
                      if (site) {
                        if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
                          amount = customRate.vendorRate * site.width * site.height * site.quantity;
                        } else if (site.calculateUnit === "sqft" && site.measurementUnit === "inch") {
                          amount = customRate.vendorRate * (site.width / 12) * (site.height / 12) * site.quantity;
                        } else if (site.calculateUnit === "sqin" && site.measurementUnit === "feet") {
                          amount = customRate.vendorRate * (site.width * 12) * (site.height * 12) * site.quantity;
                        } else if (site.calculateUnit === "sqin" && site.measurementUnit === "inch") {
                          amount = customRate.vendorRate * site.width * site.height * site.quantity;
                        } else {
                          amount = customRate.vendorRate * site.quantity;
                        }
                      }

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customRate.elementName}</p>
                              {site?.siteDescription && (
                                <p className="text-xs text-muted-foreground">
                                  {site.siteDescription}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{site?.storeName}</TableCell>
                          <TableCell className="text-sm">
                            {site && `${site.width} x ${site.height} ${site.measurementUnit}`}
                          </TableCell>
                          <TableCell className="text-sm">
                            ₹{customRate.vendorRate}
                            {site?.calculateUnit === "sqft" && "/sqft"}
                            {site?.calculateUnit === "sqin" && "/sqin"}
                          </TableCell>
                          <TableCell className="text-sm">{site?.quantity}</TableCell>
                          <TableCell className="text-sm text-right font-medium">
                            ₹{amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Vendor Charges */}
            {selectedBid?.vendorCharges && selectedBid.vendorCharges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold pt-3 border-t">Vendor's Additional Charges</h4>
                <div className="space-y-2">
                  {selectedBid.vendorCharges.map((charge, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{charge.label}</span>
                      <span className="font-medium">₹{parseFloat(charge.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculation Summary */}
            <div className="space-y-2 pt-3 border-t">
              <h4 className="text-sm font-semibold">Bid Calculation</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (Vendor Rates)</span>
                  <span>₹{(() => {
                    let subtotal = 0;
                    selectedBid?.customRates?.forEach(customRate => {
                      const site = selectedTenderForBid?.sites.find(
                        s => s.siteId === customRate.siteId
                      );
                      if (site) {
                        if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
                          subtotal += customRate.vendorRate * site.width * site.height * site.quantity;
                        } else if (site.calculateUnit === "sqft" && site.measurementUnit === "inch") {
                          subtotal += customRate.vendorRate * (site.width / 12) * (site.height / 12) * site.quantity;
                        } else if (site.calculateUnit === "sqin" && site.measurementUnit === "feet") {
                          subtotal += customRate.vendorRate * (site.width * 12) * (site.height * 12) * site.quantity;
                        } else if (site.calculateUnit === "sqin" && site.measurementUnit === "inch") {
                          subtotal += customRate.vendorRate * site.width * site.height * site.quantity;
                        } else {
                          subtotal += customRate.vendorRate * site.quantity;
                        }
                      }
                    });
                    return subtotal.toFixed(2);
                  })()}</span>
                </div>
                {selectedBid?.vendorCharges && selectedBid.vendorCharges.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Additional Charges</span>
                    <span>₹{selectedBid.vendorCharges.reduce((sum, c) => sum + parseFloat(c.amount), 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax (GST 18%)</span>
                  <span>₹{(() => {
                    let subtotal = 0;
                    selectedBid?.customRates?.forEach(customRate => {
                      const site = selectedTenderForBid?.sites.find(
                        s => s.siteId === customRate.siteId
                      );
                      if (site) {
                        if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
                          subtotal += customRate.vendorRate * site.width * site.height * site.quantity;
                        } else if (site.calculateUnit === "sqft" && site.measurementUnit === "inch") {
                          subtotal += customRate.vendorRate * (site.width / 12) * (site.height / 12) * site.quantity;
                        } else if (site.calculateUnit === "sqin" && site.measurementUnit === "feet") {
                          subtotal += customRate.vendorRate * (site.width * 12) * (site.height * 12) * site.quantity;
                        } else if (site.calculateUnit === "sqin" && site.measurementUnit === "inch") {
                          subtotal += customRate.vendorRate * site.width * site.height * site.quantity;
                        } else {
                          subtotal += customRate.vendorRate * site.quantity;
                        }
                      }
                    });
                    const chargesTotal = selectedBid?.vendorCharges?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
                    const tax = (subtotal + chargesTotal) * 0.18;
                    return tax.toFixed(2);
                  })()}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{selectedBid?.amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
