"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, AlertCircle, FileCheck } from "lucide-react";
import { toast } from "sonner";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    userType: "brand" | "vendor";
  };
  accessToken: string;
  onVerificationComplete: () => void;
}

interface DocumentStatus {
  verified: boolean;
  data: any;
  error?: string;
  rejected?: boolean;
}

export function VerificationModal({
  open,
  onOpenChange,
  user,
  accessToken,
  onVerificationComplete,
}: VerificationModalProps) {
  const [documents, setDocuments] = useState<any>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [verifyingDoc, setVerifyingDoc] = useState<string | null>(null);
  const [gstStatus, setGstStatus] = useState<DocumentStatus | null>(null);
  const [cinStatus, setCinStatus] = useState<DocumentStatus | null>(null);
  const [msmeStatus, setMsmeStatus] = useState<DocumentStatus | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Fetch user's business KYC documents
  useEffect(() => {
    if (open) {
      fetchDocuments();
    } else {
      // Reset state when modal closes
      setDocuments(null);
      setGstStatus(null);
      setCinStatus(null);
      setMsmeStatus(null);
      setIsLoadingDocs(true);
    }
  }, [open]);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await fetch(`/api/business/kyc?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();
      console.log("📄 Fetched documents:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch documents");
      }

      setDocuments(result.data);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error(error.message || "Failed to load documents");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Verify individual document using separate APIs
  const handleVerifyDocument = async (docType: "gst" | "cin" | "msme") => {
    setVerifyingDoc(docType);
    try {
      const docValue =
        docType === "gst"
          ? documents.gstNumber
          : docType === "cin"
          ? documents.cinNumber
          : documents.msmeNumber;

      if (!docValue) {
        toast.error(`${docType.toUpperCase()} number not found`);
        return;
      }

      // First check if document already exists in database
      if (documents.verifiedDocuments && documents.verifiedDocuments[docType]) {
        const existingDoc = documents.verifiedDocuments[docType];
        
        // Check if the document number matches
        if (existingDoc.number === docValue && existingDoc.verified && existingDoc.data) {
          // Use existing verified data from database
          const status: DocumentStatus = {
            verified: true,
            data: existingDoc.data,
          };

          if (docType === "gst") setGstStatus(status);
          if (docType === "cin") setCinStatus(status);
          if (docType === "msme") setMsmeStatus(status);

          toast.success(`${docType.toUpperCase()} data loaded from database!`);
          setVerifyingDoc(null);
          return;
        }
      }

      // If not in database, call AttestR API
      const endpoint = `/api/admin/users/verify-${docType}`;
      const payload = docType === "gst" 
        ? { gstin: docValue, userId: user.id }
        : { reg: docValue, userId: user.id };

      console.log(`🔍 Calling ${endpoint} with:`, payload);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log(`📥 ${docType.toUpperCase()} API Response:`, result);

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      // Update specific document status
      const status: DocumentStatus = {
        verified: result.verified || false,
        data: result.data || null,
        error: result.error,
      };

      if (docType === "gst") setGstStatus(status);
      if (docType === "cin") setCinStatus(status);
      if (docType === "msme") setMsmeStatus(status);

      if (result.verified) {
        toast.success(`${docType.toUpperCase()} verified successfully!`);
        // Refresh documents to get saved data
        await fetchDocuments();
      } else {
        toast.error(`${docType.toUpperCase()} verification failed`);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Failed to verify document");
    } finally {
      setVerifyingDoc(null);
    }
  };

  // Reject individual document
  const handleRejectDocument = async (docType: "gst" | "cin" | "msme") => {
    if (docType === "gst") setGstStatus({ verified: false, data: null, rejected: true });
    if (docType === "cin") setCinStatus({ verified: false, data: null, rejected: true });
    if (docType === "msme") setMsmeStatus({ verified: false, data: null, rejected: true });
    toast.info(`${docType.toUpperCase()} marked as rejected`);
  };

  // Handle final approval
  const handleFinalApproval = async () => {
    const hasRejected = gstStatus?.rejected || cinStatus?.rejected || msmeStatus?.rejected;
    
    if (hasRejected) {
      toast.error("Cannot approve with rejected documents.");
      return;
    }

    setIsApproving(true);
    try {
      const response = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          action: "approve",
          verifiedData: {
            gst: gstStatus,
            cin: cinStatus,
            msme: msmeStatus,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Approval failed");
      }

      toast.success("User approved successfully!");
      onVerificationComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error.message || "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw]! w-[80vw]! h-[80vw]! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Verify User Documents - AttestR API
          </DialogTitle>
          <DialogDescription>
            Verify {user.name}'s business documents using AttestR API - GST, CIN, MSME
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-muted-foreground text-sm">Name</Label>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="font-medium text-sm">{user.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">User Type</Label>
              <Badge variant={user.userType === "brand" ? "default" : "secondary"}>
                {user.userType === "brand" ? "Brand" : "Vendor"}
              </Badge>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingDocs && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading documents...</span>
            </div>
          )}

          {/* Tabbed Document Display */}
          {!isLoadingDocs && documents && (
            <Tabs defaultValue="gst" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="gst" disabled={!documents.gstNumber}>
                  GST {documents.gstNumber && "✓"}
                </TabsTrigger>
                <TabsTrigger value="cin" disabled={!documents.cinNumber}>
                  CIN {documents.cinNumber && "✓"}
                </TabsTrigger>
                <TabsTrigger value="msme" disabled={!documents.msmeNumber}>
                  MSME {documents.msmeNumber && "✓"}
                </TabsTrigger>
              </TabsList>

              {/* GST Tab */}
              <TabsContent value="gst" className="space-y-4">
                {documents.gstNumber ? (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">GST Number</Label>
                        <p className="font-mono text-lg">{documents.gstNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        {!gstStatus && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDocument("gst")}
                              disabled={verifyingDoc === "gst"}
                            >
                              {verifyingDoc === "gst" ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify GST
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectDocument("gst")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* GST Verification Results */}
                    {gstStatus && (
                      <div className={`p-4 rounded-lg ${
                        gstStatus.rejected
                          ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500'
                          : gstStatus.verified
                          ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-500'
                          : 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500'
                      }`}>
                        {gstStatus.rejected ? (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            <span className="font-semibold text-destructive">Rejected by Admin</span>
                          </div>
                        ) : gstStatus.verified ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-green-700">✓ Verified by AttestR</span>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-900 rounded">
                              <div>
                                <Label className="text-xs">Legal Name</Label>
                                <p className="font-medium text-sm">{gstStatus.data?.legalName || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Trade Name</Label>
                                <p className="font-medium text-sm">{gstStatus.data?.tradeName || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs">PAN</Label>
                                <p className="font-mono text-sm">{gstStatus.data?.pan || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs">E-Invoice Enabled</Label>
                                <Badge variant={gstStatus.data?.einvoiceEnabled ? "default" : "secondary"}>
                                  {gstStatus.data?.einvoiceEnabled ? "Yes" : "No"}
                                </Badge>
                              </div>
                            </div>

                            {/* Addresses Table */}
                            {gstStatus.data?.addresses && gstStatus.data.addresses.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">Addresses</Label>
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Pincode</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {gstStatus.data.addresses.map((addr: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">{addr.type || "N/A"}</TableCell>
                                          <TableCell className="max-w-xs truncate">
                                            {[addr.building, addr.street, addr.locality].filter(Boolean).join(", ") || "N/A"}
                                          </TableCell>
                                          <TableCell>{addr.city || addr.district || "N/A"}</TableCell>
                                          <TableCell>{addr.state || "N/A"}</TableCell>
                                          <TableCell>{addr.zip || "N/A"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {/* Filings Table */}
                            {gstStatus.data?.filings && gstStatus.data.filings.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">GST Filings (Latest 10)</Label>
                                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Return Type</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Filed Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>ACK Number</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {gstStatus.data.filings.slice(0, 10).map((filing: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">{filing.type || "N/A"}</TableCell>
                                          <TableCell>{filing.period || "N/A"}</TableCell>
                                          <TableCell>{filing.filed || "N/A"}</TableCell>
                                          <TableCell>
                                            <Badge variant={filing.status === "Filed" ? "default" : "secondary"}>
                                              {filing.status || "N/A"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">{filing.ack || "N/A"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                              <span className="font-semibold text-destructive">Verification Failed</span>
                              <p className="text-sm text-destructive mt-1">{gstStatus.error}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No GST number submitted</p>
                  </div>
                )}
              </TabsContent>

              {/* CIN Tab */}
              <TabsContent value="cin" className="space-y-4">
                {documents.cinNumber ? (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">CIN Number</Label>
                        <p className="font-mono text-lg">{documents.cinNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        {!cinStatus && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDocument("cin")}
                              disabled={verifyingDoc === "cin"}
                            >
                              {verifyingDoc === "cin" ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify CIN
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectDocument("cin")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CIN Verification Results */}
                    {cinStatus && (
                      <div className={`p-4 rounded-lg ${
                        cinStatus.rejected
                          ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500'
                          : cinStatus.verified
                          ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-500'
                          : 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500'
                      }`}>
                        {cinStatus.rejected ? (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            <span className="font-semibold text-destructive">Rejected by Admin</span>
                          </div>
                        ) : cinStatus.verified ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-green-700">✓ Verified by AttestR</span>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-900 rounded">
                              <div>
                                <Label className="text-xs">Business Name</Label>
                                <p className="font-medium text-sm">{cinStatus.data?.businessName || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Registration Number</Label>
                                <p className="font-mono text-sm">{cinStatus.data?.registrationNumber || documents.cinNumber}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Company Type</Label>
                                <p className="font-medium text-sm">{cinStatus.data?.type || "N/A"}</p>
                              </div>
                            </div>

                            {/* Directors Table */}
                            {cinStatus.data?.directorsAndSignatories && cinStatus.data.directorsAndSignatories.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">Directors & Signatories</Label>
                                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>DIN</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Appointment Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {cinStatus.data.directorsAndSignatories.slice(0, 15).map((director: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">
                                            {[director.firstName, director.middleName, director.lastName].filter(Boolean).join(" ") || "N/A"}
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">{director.din || "N/A"}</TableCell>
                                          <TableCell>{director.designation || "N/A"}</TableCell>
                                          <TableCell>{director.appointmentDate || "N/A"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {/* Charges Table */}
                            {cinStatus.data?.charges && cinStatus.data.charges.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">Charges</Label>
                                <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Charge Holder</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Created Date</TableHead>
                                        <TableHead>Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {cinStatus.data.charges.slice(0, 10).map((charge: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">{charge.chargeHolder || "N/A"}</TableCell>
                                          <TableCell>₹{charge.amount || "N/A"}</TableCell>
                                          <TableCell>{charge.createdDate || "N/A"}</TableCell>
                                          <TableCell>
                                            <Badge variant={charge.chargeStatus === "Open" ? "destructive" : "default"}>
                                              {charge.chargeStatus || "N/A"}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {/* E-Filings Table */}
                            {cinStatus.data?.efilings && cinStatus.data.efilings.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">E-Filings (Latest 15)</Label>
                                <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Form Type</TableHead>
                                        <TableHead>SRN</TableHead>
                                        <TableHead>Filing Date</TableHead>
                                        <TableHead>Description</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {cinStatus.data.efilings.slice(0, 15).map((filing: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">{filing.eform || "N/A"}</TableCell>
                                          <TableCell className="font-mono text-xs">{filing.srn || "N/A"}</TableCell>
                                          <TableCell>{filing.filed || "N/A"}</TableCell>
                                          <TableCell>{filing.description || "-"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                              <span className="font-semibold text-destructive">Verification Failed</span>
                              <p className="text-sm text-destructive mt-1">{cinStatus.error}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No CIN number submitted</p>
                  </div>
                )}
              </TabsContent>

              {/* MSME Tab */}
              <TabsContent value="msme" className="space-y-4">
                {documents.msmeNumber ? (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">MSME/Udyam Number</Label>
                        <p className="font-mono text-lg">{documents.msmeNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        {!msmeStatus && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDocument("msme")}
                              disabled={verifyingDoc === "msme"}
                            >
                              {verifyingDoc === "msme" ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify MSME
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectDocument("msme")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* MSME Verification Results */}
                    {msmeStatus && (
                      <div className={`p-4 rounded-lg ${
                        msmeStatus.rejected
                          ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500'
                          : msmeStatus.verified
                          ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-500'
                          : 'bg-red-50 dark:bg-red-950/20 border-2 border-red-500'
                      }`}>
                        {msmeStatus.rejected ? (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            <span className="font-semibold text-destructive">Rejected by Admin</span>
                          </div>
                        ) : msmeStatus.verified ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-green-700">✓ Verified by AttestR</span>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-900 rounded">
                              <div>
                                <Label className="text-xs">Entity Name</Label>
                                <p className="font-medium text-sm">{msmeStatus.data?.entity || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Type of Organization</Label>
                                <p className="font-medium text-sm">{msmeStatus.data?.type || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-xs">Registered Date</Label>
                                <p className="font-medium text-sm">{msmeStatus.data?.registered || "N/A"}</p>
                              </div>
                            </div>

                            {/* Classifications Table */}
                            {msmeStatus.data?.classifications && msmeStatus.data.classifications.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">Classifications</Label>
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Year</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {msmeStatus.data.classifications.map((classification: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">{classification.year || "N/A"}</TableCell>
                                          <TableCell>
                                            <Badge>{classification.type || "N/A"}</Badge>
                                          </TableCell>
                                          <TableCell>{classification.date || "N/A"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {/* Locations Table */}
                            {msmeStatus.data?.locations && msmeStatus.data.locations.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">Locations</Label>
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Unit Name</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead>District</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Pincode</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {msmeStatus.data.locations.map((location: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">{location.unitName || "N/A"}</TableCell>
                                          <TableCell>{location.city || "N/A"}</TableCell>
                                          <TableCell>{location.district || "N/A"}</TableCell>
                                          <TableCell>{location.state || "N/A"}</TableCell>
                                          <TableCell>{location.zip || "N/A"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {/* NIC Codes Table */}
                            {msmeStatus.data?.nicCodes && msmeStatus.data.nicCodes.length > 0 && (
                              <div>
                                <Label className="text-sm font-semibold mb-2 block">NIC Codes & Activities</Label>
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>2-Digit Code</TableHead>
                                        <TableHead>5-Digit Code</TableHead>
                                        <TableHead>Activity</TableHead>
                                        <TableHead>Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {msmeStatus.data.nicCodes.map((nic: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-mono text-xs">{nic.digit2 || "N/A"}</TableCell>
                                          <TableCell className="font-mono text-xs">{nic.digit5 || "N/A"}</TableCell>
                                          <TableCell>{nic.activity || "N/A"}</TableCell>
                                          <TableCell>{nic.date || "N/A"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                              <span className="font-semibold text-destructive">Verification Failed</span>
                              <p className="text-sm text-destructive mt-1">{msmeStatus.error}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No MSME number submitted</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isApproving}>
              Cancel
            </Button>
          </DialogClose>

          {(gstStatus?.rejected || cinStatus?.rejected || msmeStatus?.rejected) && (
            <Button variant="destructive" disabled>
              <XCircle className="mr-2 h-4 w-4" />
              Cannot Approve (Has Rejections)
            </Button>
          )}

          <Button
            onClick={handleFinalApproval}
            disabled={isApproving || (!gstStatus?.verified && !cinStatus?.verified && !msmeStatus?.verified)}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Final Approve User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
