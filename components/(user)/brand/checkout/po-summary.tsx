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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface POSummaryProps {
  selectedPO: {
    poNumber: string;
    issueDate: string;
    expiryDate: string;
    vendorName?: string;
    amount: number;
    usedAmount?: number;
  } | null;
  currentOrderTotal: number;
}

export function POSummary({ selectedPO, currentOrderTotal }: POSummaryProps) {
  if (!selectedPO) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PO Number Summary
          </CardTitle>
          <CardDescription>
            Select a PO Number to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No PO selected
          </p>
        </CardContent>
      </Card>
    );
  }

  const usedAmount = selectedPO.usedAmount || 0;
  const balance = selectedPO.amount - usedAmount;
  const remainingBalance = balance - currentOrderTotal;
  const isOverBudget = remainingBalance < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PO Number Summary
        </CardTitle>
        <CardDescription>
          Purchase order details and budget tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">PO Number</span>
            <Badge variant="secondary">{selectedPO.poNumber}</Badge>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Issue Date</span>
            <span className="text-sm font-medium">
              {format(new Date(selectedPO.issueDate), "dd MMM yyyy")}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Expiry Date</span>
            <span className="text-sm font-medium">
              {format(new Date(selectedPO.expiryDate), "dd MMM yyyy")}
            </span>
          </div>

          {selectedPO.vendorName && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendor</span>
              <span className="text-sm font-medium">{selectedPO.vendorName}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-sm font-semibold">
              ₹{selectedPO.amount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Used-up Amount</span>
            <span className="text-sm font-medium text-orange-600">
              ₹{usedAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-sm font-semibold text-blue-600">
              ₹{balance.toLocaleString("en-IN")}
            </span>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between items-center bg-muted p-3 rounded-md">
            <span className="text-sm font-medium">This Order</span>
            <span className="text-sm font-bold">
              ₹{currentOrderTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Remaining Balance</span>
            <span 
              className={`text-sm font-bold ${
                isOverBudget ? "text-red-600" : "text-green-600"
              }`}
            >
              ₹{remainingBalance.toLocaleString("en-IN")}
            </span>
          </div>

          {isOverBudget && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-600 font-medium">
                ⚠️ Warning: Order exceeds available PO balance by ₹
                {Math.abs(remainingBalance).toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
