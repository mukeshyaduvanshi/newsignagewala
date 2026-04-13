"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function RejectReasonModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RejectReasonModalProps) {
  const [reason, setReason] = React.useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason(""); // Reset after confirmation
    }
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Racee Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this racee request. This will be visible to the manager.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="rejection-reason">Rejection Reason *</Label>
          <Textarea
            id="rejection-reason"
            placeholder="Enter the reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            className="resize-none"
            disabled={isLoading}
          />
          {reason.trim() && (
            <p className="text-sm text-muted-foreground">
              {reason.length} characters
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
