"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Calendar,
  Package,
  IndianRupee,
  HandCoins,
  X,
  Check,
  MapPin,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { priceCalculatorNumber } from "@/lib/utils/priceCalculator";
import { useVendorTenders, type VendorTender } from "@/hooks/use-vendor-tenders";

const ComponentsTenders = () => {
  const { tenders, isLoading, submitBid, rejectBid } = useVendorTenders();
  const [selectedTender, setSelectedTender] = React.useState<VendorTender | null>(null);
  const [detailTender, setDetailTender] = React.useState<VendorTender | null>(null);
  const [filterStatus, setFilterStatus] = React.useState("all");
  
  // Custom rates state - stores edited rates for each site
  const [customRates, setCustomRates] = React.useState<Record<string, number>>({});
  
  // Vendor charges state
  const [vendorCharges, setVendorCharges] = React.useState<Array<{label: string, amount: string}>>([]);
  
  // Modal states
  const [bidModalOpen, setBidModalOpen] = React.useState(false);
  const [bidAmount, setBidAmount] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log("Tenders in component:", tenders);
    console.log("Loading state:", isLoading);
  }, [tenders, isLoading]);

  // Initialize vendor charges and custom rates when detail tender changes
  React.useEffect(() => {
    if (detailTender) {
      // Initialize vendor charges if additionalCharges exist
      if (detailTender.additionalCharges && detailTender.additionalCharges.length > 0) {
        // Check if this vendor already submitted a bid with charges
        if (detailTender.vendorBidding?.vendorCharges && detailTender.vendorBidding.vendorCharges.length > 0) {
          // Use vendor's submitted charges
          setVendorCharges(detailTender.vendorBidding.vendorCharges.map(vc => ({
            label: vc.label,
            amount: vc.amount
          })));
        } else {
          // Initialize with empty amounts
          const initialCharges = detailTender.additionalCharges.map(charge => ({
            label: charge.label,
            amount: ""
          }));
          setVendorCharges(initialCharges);
        }
      } else {
        setVendorCharges([]);
      }
      
      // ALWAYS Initialize customRates when detailTender changes
      if (detailTender.vendorBidding?.customRates && detailTender.vendorBidding.customRates.length > 0) {
        // Load vendor's submitted customRates if bid already submitted
        const ratesMap: Record<string, number> = {};
        detailTender.vendorBidding.customRates.forEach(cr => {
          ratesMap[cr.siteId] = cr.vendorRate;
        });
        setCustomRates(ratesMap);
      } else if (detailTender.sites) {
        // Initialize customRates with default vendor rates for all sites
        const ratesMap: Record<string, number> = {};
        detailTender.sites.forEach(site => {
          const siteId = site.siteId || site._id || "";
          if (siteId && site.vendorRate !== undefined) {
            ratesMap[siteId] = site.vendorRate;
          }
        });
        setCustomRates(ratesMap);
        console.log("Initialized customRates:", ratesMap);
      }
    } else {
      // Reset when detail view is closed
      setVendorCharges([]);
      setCustomRates({});
    }
  }, [detailTender]);

  // Filter tenders based on selected filter
  const filteredTenders = React.useMemo(() => {
    if (filterStatus === "all") return tenders;
    if (filterStatus === "submitted") {
      return tenders.filter(t => t.vendorBidding?.status === "submitted");
    }
    if (filterStatus === "rejected") {
      return tenders.filter(t => t.vendorBidding?.status === "rejected");
    }
    if (filterStatus === "pending") {
      return tenders.filter(t => !t.vendorBidding);
    }
    return tenders;
  }, [tenders, filterStatus]);

  // console.log({tenders});
  

  const handleSubmitBid = (tender: VendorTender) => {
    setSelectedTender(tender);
    
    // Initialize customRates with vendor rates if not already set
    const updatedCustomRates = { ...customRates };
    let needsUpdate = false;
    
    tender.sites?.forEach(site => {
      const siteId = site.siteId || site._id || "";
      if (siteId && updatedCustomRates[siteId] === undefined && site.vendorRate !== undefined) {
        updatedCustomRates[siteId] = site.vendorRate;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      setCustomRates(updatedCustomRates);
      console.log("Auto-initialized customRates in handleSubmitBid:", updatedCustomRates);
    }
    
    // Calculate vendor's total based on vendor rates or custom rates
    let vendorSubtotal = 0;
    tender.sites?.forEach(site => {
      const siteId = site.siteId || site._id || "";
      const vendorRate = updatedCustomRates[siteId] !== undefined ? updatedCustomRates[siteId] : (site.vendorRate || 0);
      
      // Calculate using priceCalculator logic
      if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
        vendorSubtotal += vendorRate * site.width * site.height * site.quantity;
      } else if (site.calculateUnit === "sqft" && site.measurementUnit === "inch") {
        vendorSubtotal += vendorRate * (site.width / 12) * (site.height / 12) * site.quantity;
      } else if (site.calculateUnit === "sqin" && site.measurementUnit === "feet") {
        vendorSubtotal += vendorRate * (site.width * 12) * (site.height * 12) * site.quantity;
      } else if (site.calculateUnit === "sqin" && site.measurementUnit === "inch") {
        vendorSubtotal += vendorRate * site.width * site.height * site.quantity;
      } else {
        // For "pcs" or other units
        vendorSubtotal += vendorRate * site.quantity;
      }
    });
    
    // Calculate tax including vendor's entered charges
    const vendorChargesTotal = vendorCharges.reduce((sum, vc) => 
      sum + (parseFloat(vc.amount) || 0), 0);
    const tax = (vendorSubtotal + vendorChargesTotal) * 0.18;
    const total = vendorSubtotal + vendorChargesTotal + tax;
    
    setBidAmount(total.toFixed(2));
    // Don't reset customRates - keep vendor's edited rates
    setBidModalOpen(true);
  };

  // Handle custom rate change for a site
  const handleRateChange = (siteId: string, elementName: string, newRate: number) => {
    setCustomRates(prev => {
      const updated = { ...prev };
      
      // Find all sites with the same elementName and update them in detailTender
      if (detailTender?.sites) {
        detailTender.sites.forEach(site => {
          if (site.elementName === elementName) {
            const key = `${site.siteId || site._id}`;
            updated[key] = newRate;
          }
        });
      }
      
      return updated;
    });
  };

  // Add vendor charge
  const handleAddVendorCharge = () => {
    setVendorCharges(prev => [...prev, { label: "", amount: "" }]);
  };

  // Update vendor charge
  const handleUpdateVendorCharge = (index: number, field: "label" | "amount", value: string) => {
    setVendorCharges(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Remove vendor charge
  const handleRemoveVendorCharge = (index: number) => {
    setVendorCharges(prev => prev.filter((_, i) => i !== index));
  };

  const handleBidSubmit = async () => {
    if (!selectedTender) return;

    setIsSubmitting(true);
    
    // Prepare custom rates array from the customRates state
    const customRatesArray = Object.entries(customRates).map(([siteId, vendorRate]) => {
      const site = selectedTender.sites?.find(s => (s.siteId || s._id) === siteId);
      return {
        siteId,
        elementName: site?.elementName || "",
        vendorRate,
      };
    }).filter(r => r.elementName);
    
    // Prepare vendor charges array (only with both label and valid amount)
    const vendorChargesArray = vendorCharges
      .filter(vc => vc.label && vc.amount && parseFloat(vc.amount) > 0)
      .map(vc => ({
        label: vc.label,
        amount: vc.amount
      }));
    
    const amount = bidAmount ? parseFloat(bidAmount) : undefined;
    const success = await submitBid(
      selectedTender._id, 
      amount,
      customRatesArray.length > 0 ? customRatesArray : undefined,
      vendorChargesArray.length > 0 ? vendorChargesArray : undefined
    );
    setIsSubmitting(false);

    if (success) {
      setBidModalOpen(false);
      setSelectedTender(null);
      setBidAmount("");
      setCustomRates({});
      setVendorCharges([]);
    }
  };

  const handleRejectBid = async (tender: VendorTender) => {
    if (confirm("Are you sure you want to reject this tender?")) {
      await rejectBid(tender._id);
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
          <h1 className="text-3xl font-bold">Available Tenders</h1>
          <p className="text-muted-foreground">
            Browse and submit bids for available tenders
          </p>
        </div>
        
        {/* Filter Dropdown */}
        <div className="w-[200px]">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Tenders ({tenders.length})
              </SelectItem>
              <SelectItem value="pending">
                Pending ({tenders.filter(t => !t.vendorBidding).length})
              </SelectItem>
              <SelectItem value="submitted">
                Submitted ({tenders.filter(t => t.vendorBidding?.status === "submitted").length})
              </SelectItem>
              <SelectItem value="rejected">
                Rejected ({tenders.filter(t => t.vendorBidding?.status === "rejected").length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tenders List */}
      {filteredTenders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FileText className="h-24 w-24 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No tenders found</h2>
            <p className="text-muted-foreground">
              {filterStatus === "all" && "No tenders available at the moment."}
              {filterStatus === "pending" && "No pending tenders to bid on."}
              {filterStatus === "submitted" && "You haven't submitted any bids yet."}
              {filterStatus === "rejected" && "You haven't rejected any tenders."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredTenders.map((tender) => (
            <Card key={tender._id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">
                        {tender.tenderNumber}
                      </CardTitle>
                      {tender.vendorBidding && (
                        <Badge
                          variant="outline"
                          className={
                            tender.vendorBidding.status === "submitted"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }
                        >
                          {tender.vendorBidding.status === "submitted" ? "BID SUBMITTED" : "REJECTED"}
                        </Badge>
                      )}
                      {!tender.vendorBidding && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          PENDING
                        </Badge>
                      )}
                    </div>
                    {tender.poNumber && (
                      <p className="text-sm text-muted-foreground">
                        PO Number: {tender.poNumber}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDetailTender(
                        detailTender?._id === tender._id ? null : tender
                      )
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {detailTender?._id === tender._id
                      ? "Hide Details"
                      : "View Details"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                        {tender.totalSites} sites
                      </p>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                {!tender.vendorBidding && (
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="default"
                      onClick={() => handleSubmitBid(tender)}
                      className="gap-1"
                    >
                      <HandCoins className="h-4 w-4" />
                      Submit Bidding
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRejectBid(tender)}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Bid Status Message */}
                {tender.vendorBidding && (
                  <div className="pt-4 border-t">
                    {tender.vendorBidding.status === "submitted" && (
                      <p className="text-sm text-green-600 font-medium">
                        Bid submitted on {format(new Date(tender.vendorBidding.submittedAt), "dd MMM yyyy, hh:mm a")}
                        {/* {tender.vendorBidding.amount && ` - Amount: ₹${tender.vendorBidding.amount.toLocaleString("en-IN")}`} */}
                      </p>
                    )}
                    {tender.vendorBidding.status === "rejected" && (
                      <p className="text-sm text-red-600 font-medium">
                        Rejected on {format(new Date(tender.vendorBidding.submittedAt), "dd MMM yyyy, hh:mm a")}
                      </p>
                    )}
                  </div>
                )}

                {/* Expanded Details - Only for accepted vendors */}
                {detailTender?._id === tender._id && (
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
                            <TableHead>Vendor Rate</TableHead>
                            {/* TODO: if this is not needed to remove */}
                            {tender.acceptedVendorId && <TableHead>Accepted Amount</TableHead>} 
                            <TableHead>Qty</TableHead>
                            <TableHead>Location</TableHead>
                            {tender.acceptedVendorId && <TableHead className="text-right">Amount</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tender.sites!.map((site, index) => {
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
                                  {site.vendorRate !== undefined ? (
                                    <Input
                                      type="number"
                                      value={customRates[site.siteId || site._id || ""] !== undefined 
                                        ? customRates[site.siteId || site._id || ""] 
                                        : site.vendorRate}
                                      onChange={(e) => {
                                        const newRate = parseFloat(e.target.value);
                                        if (!isNaN(newRate)) {
                                          handleRateChange(
                                            site.siteId || site._id || "", 
                                            site.elementName, 
                                            newRate
                                          );
                                        }
                                      }}
                                      disabled={!!tender.acceptedVendorId}
                                      className="w-24"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="group relative inline-block">
                                        <span className="text-muted-foreground cursor-help">N/A</span>
                                        <div className="invisible group-hover:visible absolute z-10 w-48 p-2 text-xs text-white bg-gray-900 rounded-md shadow-lg -top-12 left-1/2 -translate-x-1/2">
                                          This element is not in your rates list. Please enter a custom rate.
                                          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
                                        </div>
                                      </div>
                                      <Input
                                        type="number"
                                        placeholder="Rate daalein"
                                        value={customRates[site.siteId || site._id || ""] || ""}
                                        onChange={(e) => {
                                          const newRate = parseFloat(e.target.value);
                                          if (!isNaN(newRate)) {
                                            handleRateChange(
                                              site.siteId || site._id || "", 
                                              site.elementName, 
                                              newRate
                                            );
                                          }
                                        }}
                                        disabled={!!tender.acceptedVendorId}
                                        className="w-24"
                                      />
                                    </div>
                                  )}
                                </TableCell>
                                {/* TODO: if this is not needed to remove */}
                                {tender.acceptedVendorId && (
                                  <TableCell>
                                    ₹{site.rate}
                                    {site.calculateUnit === "sqft" && "/sqft"}
                                  </TableCell>
                                )}
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
                                {tender.acceptedVendorId && (
                                  <TableCell className="text-right font-medium">
                                    ₹{siteTotal.toFixed(2)}
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {/* Vendor's Pricing Breakdown */}
                    <div className="mt-6 max-w-sm ml-auto space-y-2">
                      <h4 className="text-sm font-semibold mb-3">Your Calculation</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal (Your Rates)</span>
                        <span>₹{(() => {
                          let subtotal = 0;
                          tender.sites?.forEach(site => {
                            const siteId = site.siteId || site._id || "";
                            const vendorRate = customRates[siteId] !== undefined ? customRates[siteId] : (site.vendorRate || 0);
                            
                            if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
                              subtotal += vendorRate * site.width * site.height * site.quantity;
                            } else if (site.calculateUnit === "sqft" && site.measurementUnit === "inch") {
                              subtotal += vendorRate * (site.width / 12) * (site.height / 12) * site.quantity;
                            } else if (site.calculateUnit === "sqin" && site.measurementUnit === "feet") {
                              subtotal += vendorRate * (site.width * 12) * (site.height * 12) * site.quantity;
                            } else if (site.calculateUnit === "sqin" && site.measurementUnit === "inch") {
                              subtotal += vendorRate * site.width * site.height * site.quantity;
                            } else {
                              subtotal += vendorRate * site.quantity;
                            }
                          });
                          return subtotal.toFixed(2);
                        })()}</span>
                      </div>
                      
                      {/* Vendor's Additional Charges - Input fields with labels from tender */}
                      {tender.additionalCharges && tender.additionalCharges.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <p className="text-xs text-muted-foreground font-medium">Apne Additional Charges Daalein:</p>
                          {tender.additionalCharges.map((charge, index) => (
                            <div key={index} className="flex items-center justify-between gap-2">
                              <span className="text-sm text-muted-foreground">{charge.label}</span>
                              <div className="relative w-28">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={vendorCharges[index]?.amount || ""}
                                  onChange={(e) => handleUpdateVendorCharge(index, "amount", e.target.value)}
                                  disabled={!!tender.acceptedVendorId}
                                  className="pl-5 h-8 text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">
                          Tax (GST 18%)
                        </span>
                        <span>₹{(() => {
                          let subtotal = 0;
                          tender.sites?.forEach(site => {
                            const siteId = site.siteId || site._id || "";
                            const vendorRate = customRates[siteId] !== undefined ? customRates[siteId] : (site.vendorRate || 0);
                            
                            if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
                              subtotal += vendorRate * site.width * site.height * site.quantity;
                            } else if (site.calculateUnit === "sqft" && site.measurementUnit === "inch") {
                              subtotal += vendorRate * (site.width / 12) * (site.height / 12) * site.quantity;
                            } else if (site.calculateUnit === "sqin" && site.measurementUnit === "feet") {
                              subtotal += vendorRate * (site.width * 12) * (site.height * 12) * site.quantity;
                            } else if (site.calculateUnit === "sqin" && site.measurementUnit === "inch") {
                              subtotal += vendorRate * site.width * site.height * site.quantity;
                            } else {
                              subtotal += vendorRate * site.quantity;
                            }
                          });
                          const vendorChargesTotal = vendorCharges.reduce((sum, vc) => 
                            sum + (parseFloat(vc.amount) || 0), 0);
                          const tax = (subtotal + vendorChargesTotal) * 0.18;
                          return tax.toFixed(2);
                        })()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>₹{(() => {
                          let subtotal = 0;
                          tender.sites?.forEach(site => {
                            const siteId = site.siteId || site._id || "";
                            const vendorRate = customRates[siteId] !== undefined ? customRates[siteId] : (site.vendorRate || 0);
                            
                            if (site.calculateUnit === "sqft" && site.measurementUnit === "feet") {
                              subtotal += vendorRate * site.width * site.height * site.quantity;
                            } else if (site.calculateUnit === "sqft" && site.measurementUnit === "inch") {
                              subtotal += vendorRate * (site.width / 12) * (site.height / 12) * site.quantity;
                            } else if (site.calculateUnit === "sqin" && site.measurementUnit === "feet") {
                              subtotal += vendorRate * (site.width * 12) * (site.height * 12) * site.quantity;
                            } else if (site.calculateUnit === "sqin" && site.measurementUnit === "inch") {
                              subtotal += vendorRate * site.width * site.height * site.quantity;
                            } else {
                              subtotal += vendorRate * site.quantity;
                            }
                          });
                          const vendorChargesTotal = vendorCharges.reduce((sum, vc) => 
                            sum + (parseFloat(vc.amount) || 0), 0);
                          const tax = (subtotal + vendorChargesTotal) * 0.18;
                          const total = subtotal + vendorChargesTotal + tax;
                          return total.toFixed(2);
                        })()}</span>
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

      {/* Bid Submission Modal */}
      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit Your Bid</DialogTitle>
            <DialogDescription>
              Enter your bid amount for tender {selectedTender?.tenderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bidAmount">Your Bid Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="bidAmount"
                  type="number"
                  placeholder="Enter your amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Amount is auto-calculated based on your rates. You can edit if needed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBidModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleBidSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComponentsTenders;
