"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

interface AdditionalNotesProps {
  formData: {
    notes: string;
    additionalCharges: { label: string; amount: string }[];
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleAddCharge: () => void;
  handleRemoveCharge: (index: number) => void;
  handleChargeChange: (index: number, field: 'label' | 'amount', value: string) => void;
  orderType: "order" | "tender";
  isSubmitting: boolean;
  handleSubmitOrder: (e: React.FormEvent, submitType: "order" | "tender") => void;
  totalAmount: number;
}

export function AdditionalNotes({
  formData,
  handleInputChange,
  handleAddCharge,
  handleRemoveCharge,
  handleChargeChange,
  orderType,
  isSubmitting,
  handleSubmitOrder,
  totalAmount,
}: AdditionalNotesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Notes</CardTitle>
        <CardDescription>
          Any special requirements or instructions for this order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Additional Charges</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCharge}
              >
                Add Charge
              </Button>
            </div>
            {formData.additionalCharges.map((charge, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Charge label"
                  value={charge.label}
                  onChange={(e) => handleChargeChange(index, 'label', e.target.value)}
                  className="flex-1 w-3/4"
                />
                <Input
                  type="number"
                  placeholder="Amount (₹)"
                  value={charge.amount}
                  onChange={(e) => handleChargeChange(index, 'amount', e.target.value)}
                  className="w-1/4"
                />
                {formData.additionalCharges.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCharge(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any special instructions or requirements..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {orderType === "tender" ? (
              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={isSubmitting}
                onClick={(e) => handleSubmitOrder(e, "tender")}
                className="w-full md:col-span-2"
              >
                {isSubmitting ? "Processing..." : "Float Tender"}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                disabled={isSubmitting}
                onClick={(e) => handleSubmitOrder(e, "order")}
                className="w-full md:col-span-2"
              >
                {isSubmitting
                  ? "Processing..."
                  : `Place Order - ₹${totalAmount.toFixed(2)}`}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
