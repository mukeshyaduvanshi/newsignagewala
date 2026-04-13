"use client";

import React, { useState } from "react";
import { useNewElementRequests, type NewElementRequest } from "@/lib/hooks/useNewElementRequests";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { CardSkeleton } from "@/components/ui/page-loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ComponentsNewElementRequests() {
  const { requests, isLoading, isError, mutate } = useNewElementRequests();
  const { accessToken } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<NewElementRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (requestId: string, source: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/rates/approve-element', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ requestId, source }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Element approved and added to master rates');
        mutate();
        setSelectedRequest(null);
      } else {
        toast.error(result.error || 'Failed to approve element');
      }
    } catch (error) {
      toast.error('Failed to approve element');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string, source: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/rates/reject-element', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ requestId, source }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Element request rejected');
        mutate();
        setSelectedRequest(null);
      } else {
        toast.error(result.error || 'Failed to reject element');
      }
    } catch (error) {
      toast.error('Failed to reject element');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Element Requests</CardTitle>
          <CardDescription>Pending approval from brands and vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <CardSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New Element Requests</CardTitle>
          <CardDescription>Pending approval from brands and vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            Failed to load requests
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-[500px] overflow-hidden">
        <CardHeader>
          <CardTitle>New Element Requests ({requests.length})</CardTitle>
          <CardDescription>
            Pending approval from brands and vendors - Review and approve to add to master rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No pending requests
            </div>
          ) : (
            <div className="space-y-3 h-[350px] overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{request.elementName}</h3>
                        <Badge variant="outline" className="capitalize">
                          {request.source}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {request.rateType}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Rate:</span>{" "}
                          <span className="font-medium">₹{request.rate}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit:</span>{" "}
                          <span className="font-medium">{request.measurementUnit}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Calculate:</span>{" "}
                          <span className="font-medium">{request.calculateUnit}</span>
                        </div>
                        {request.width && request.height && (
                          <div>
                            <span className="text-gray-500">Size:</span>{" "}
                            <span className="font-medium">
                              {request.width} x {request.height}
                            </span>
                          </div>
                        )}
                      </div>

                      {request.instruction && (
                        <div className="text-sm">
                          <span className="text-gray-500">Instruction:</span>{" "}
                          <span className="text-gray-700 dark:text-gray-300">
                            {request.instruction}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Requested by: {request.createdBy.name} ({request.createdBy.email})
                        <br />
                        {new Date(request.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setSelectedRequest(request)}
                        disabled={isProcessing}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          toast('Are you sure you want to reject this request?', {
                            description: 'This action cannot be undone.',
                            action: {
                              label: 'Reject',
                              onClick: () => handleReject(request._id, request.source),
                            },
                            cancel: {
                              label: 'Cancel',
                              onClick: () => {},
                            },
                          });
                        }}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Confirmation Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Element Request</DialogTitle>
            <DialogDescription>
              Review the details before approving this element to master rates
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Element Name</label>
                  <p className="font-semibold">{selectedRequest.elementName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Source</label>
                  <p className="font-semibold capitalize">{selectedRequest.source}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p>{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Rate Type</label>
                  <p className="capitalize">{selectedRequest.rateType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rate</label>
                  <p>₹{selectedRequest.rate}/{selectedRequest.measurementUnit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Calculate Unit</label>
                  <p>{selectedRequest.calculateUnit}</p>
                </div>
              </div>

              {selectedRequest.width && selectedRequest.height && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Width</label>
                    <p>{selectedRequest.width}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Height</label>
                    <p>{selectedRequest.height}</p>
                  </div>
                </div>
              )}

              {selectedRequest.instruction && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Instruction</label>
                  <p>{selectedRequest.instruction}</p>
                </div>
              )}

              {selectedRequest.imageUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Image</label>
                  <img
                    src={selectedRequest.imageUrl}
                    alt={selectedRequest.elementName}
                    className="mt-2 max-w-xs rounded-lg border"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApprove(selectedRequest._id, selectedRequest.source)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve & Add to Master Rates
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
