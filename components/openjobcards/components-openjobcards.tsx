"use client";

import React, { useState } from "react";
import { useOpenJobCard } from "@/hooks/use-openjobcard";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Package, FileText, ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  accepted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "in-progress":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  escalation:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const ComponentsOpenJobCards = () => {
  const params = useParams();
  const id = params?.id as string;
  const { jobCard, isLoading, isError, mutate } = useOpenJobCard(id);
  const { accessToken } = useAuth();
  const [updatingSiteId, setUpdatingSiteId] = useState<string | null>(null);
  const [selectedSitePhoto, setSelectedSitePhoto] = useState<{
    photo: string;
    elementName: string;
    storeName: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-16 w-80" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !jobCard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="py-12">
              <p className="text-red-800 dark:text-red-300 text-center text-lg font-medium">
                Failed to load job card. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleElementClick = (site: any) => {
    if (site.photo) {
      setSelectedSitePhoto({
        photo: site.photo,
        elementName: site.elementName,
        storeName: site.storeName,
      });
    } else {
      toast.error("No photo available for this site");
    }
  };

  const handleChangeStatus = async (siteId: string) => {
    setUpdatingSiteId(siteId);

    try {
      const response = await fetch(
        "/api/vendor/openjobcards/update-site-status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            jobCardId: jobCard._id,
            siteId: siteId,
            status: "printed",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update site status");
      }

      toast.success("Site status updated to Printed!");

      // Refresh job card data
      mutate();
    } catch (error: any) {
      console.error("Error updating site status:", error);
      toast.error(error.message || "Failed to update site status");
    } finally {
      setUpdatingSiteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Job Card</h1>
              <p className="text-muted-foreground text-base">
                Production Order Details
              </p>
            </div>
            <Badge
              className={statusColors[jobCard.orderStatus]}
              variant="outline"
            >
              {jobCard.orderStatus.charAt(0).toUpperCase() +
                jobCard.orderStatus.slice(1).replace("-", " ")}
            </Badge>
          </div>

          {/* Order Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl px-2 py-4">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Order Number
                  </p>
                  <p className="text-lg font-semibold font-mono">
                    {jobCard.orderNumber}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Order Date
                  </p>
                  <p className="text-lg font-semibold">
                    {format(new Date(jobCard.orderDate), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Deadline Date
                  </p>
                  <p className="text-lg font-semibold">
                    {format(new Date(jobCard.deadlineDate), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    className={statusColors[jobCard.orderStatus]}
                    variant="outline"
                  >
                    {jobCard.orderStatus.charAt(0).toUpperCase() +
                      jobCard.orderStatus.slice(1).replace("-", " ")}
                  </Badge>
                </div>
              </div>

              {jobCard.notes && (
                <div className="px-2 py-4 border-t space-y-3">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 px-2 py-4">
                    <FileText className="h-4 w-4" />
                    Notes
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-base leading-relaxed">{jobCard.notes}</p>
                  </div>
                </div>
              )}

              {jobCard.globalCreativeLink && (
                <div className="py-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Global Creative Link
                  </p>
                  <a
                    href={
                      jobCard.globalCreativeLink.startsWith("http://") ||
                      jobCard.globalCreativeLink.startsWith("https://")
                        ? jobCard.globalCreativeLink
                        : `https://${jobCard.globalCreativeLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Global Creative
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sites Table */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-xl">Production Sites</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto px-2 py-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold whitespace-nowrap">
                        S.No
                      </TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">
                        Element Name
                      </TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">
                        Description
                      </TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">
                        Store Name
                      </TableHead>
                      <TableHead className="font-semibold text-right whitespace-nowrap">
                        Width
                      </TableHead>
                      <TableHead className="font-semibold text-right whitespace-nowrap">
                        Height
                      </TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">
                        Unit
                      </TableHead>
                      <TableHead className="font-semibold text-right whitespace-nowrap">
                        Qty
                      </TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">
                        Calc Unit
                      </TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">
                        Creative Link
                      </TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobCard.sites.map((site, index) => {
                      const creativeUrl =
                        site.creativeLink || jobCard.globalCreativeLink;

                      return (
                        <TableRow key={site.siteId}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => handleElementClick(site)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium transition-colors cursor-pointer"
                            >
                              {site.elementName}
                            </button>
                          </TableCell>
                          <TableCell className="max-w-xs text-muted-foreground">
                            {site.siteDescription || "-"}
                          </TableCell>
                          <TableCell>{site.storeName}</TableCell>
                          <TableCell className="text-right">
                            {site.width}
                          </TableCell>
                          <TableCell className="text-right">
                            {site.height}
                          </TableCell>
                          <TableCell>{site.measurementUnit}</TableCell>
                          <TableCell className="text-right">
                            {site.quantity}
                          </TableCell>
                          <TableCell>{site.calculateUnit}</TableCell>
                          <TableCell>
                            {creativeUrl ? (
                              <a
                                href={
                                  creativeUrl.startsWith("http://") ||
                                  creativeUrl.startsWith("https://")
                                    ? creativeUrl
                                    : `https://${creativeUrl}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium text-sm transition-colors mr-2"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                View
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                            {site.creativeAdaptive && (
                              <a
                                href={site.creativeAdaptive}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 hover:underline font-medium text-sm transition-colors mt-1"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Adaptive
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            {site.status === "printed" ? (
                              <Badge variant="default" className="bg-green-600">
                                Printed
                              </Badge>
                            ) : (
                              <Button
                                variant={"outline"}
                                size={"sm"}
                                onClick={() => handleChangeStatus(site.siteId)}
                                disabled={updatingSiteId === site.siteId}
                              >
                                {updatingSiteId === site.siteId
                                  ? "Updating..."
                                  : "Ready"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {jobCard.sites.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No sites found for this job card.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Site Photo Modal */}
      {selectedSitePhoto && (
        <Dialog
          open={!!selectedSitePhoto}
          onOpenChange={() => setSelectedSitePhoto(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedSitePhoto.elementName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedSitePhoto.storeName}
              </p>
            </DialogHeader>
            <div className="mt-4">
              <img
                src={selectedSitePhoto.photo}
                alt={selectedSitePhoto.elementName}
                className="w-full h-auto rounded-lg border object-contain max-h-[70vh]"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ComponentsOpenJobCards;
