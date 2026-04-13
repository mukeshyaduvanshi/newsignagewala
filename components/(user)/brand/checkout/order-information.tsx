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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderInformationProps {
  orderType: "order" | "tender";
  setOrderType: (type: "order" | "tender") => void;
  orderDate: Date | undefined;
  setOrderDate: (date: Date | undefined) => void;
  deadlineDate: Date | undefined;
  setDeadlineDate: (date: Date | undefined) => void;
  formData: {
    poNumber: string;
    globalCreativeLink: string;
  };
  setFormData: (data: any) => void;
  purchaseAuthorities: any[];
  tenderNumber: string;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  wantCreativeManagers: boolean;
  setWantCreativeManagers: (value: boolean) => void;
  creativeManagers: any[];
  selectedCreativeManagerId: string;
  setSelectedCreativeManagerId: (value: string) => void;
}

export function OrderInformation({
  orderType,
  setOrderType,
  orderDate,
  setOrderDate,
  deadlineDate,
  setDeadlineDate,
  formData,
  setFormData,
  purchaseAuthorities,
  tenderNumber,
  handleInputChange,
  wantCreativeManagers,
  setWantCreativeManagers,
  creativeManagers,
  selectedCreativeManagerId,
  setSelectedCreativeManagerId,
}: OrderInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Information</CardTitle>
        <CardDescription>
          Provide order number, PO details, and timeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderType">Type *</Label>
            <Select
              value={orderType}
              onValueChange={(value: "order" | "tender") => setOrderType(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="tender">Tender</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order Date *</Label>
            <Popover>
              <PopoverTrigger disabled asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !orderDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {orderDate ? format(orderDate, "dd/MM/yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={orderDate}
                  onSelect={setOrderDate}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="poNumber">
              {orderType === "order" ? "PO Number *" : "Tender Number"}
            </Label>
            {orderType === "order" ? (
              <Select
                value={formData.poNumber}
                onValueChange={(value) =>
                  setFormData({ ...formData, poNumber: value })
                }
                disabled={
                  purchaseAuthorities.filter((pa) => pa.isActive).length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      purchaseAuthorities.filter((pa) => pa.isActive).length ===
                      0
                        ? "No active PO numbers found"
                        : "Select PO Number"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {purchaseAuthorities
                    .filter((pa) => pa.isActive)
                    .map((pa) => (
                      <SelectItem key={pa._id} value={pa.poNumber}>
                        {pa.poNumber} - ₹{pa.amount.toLocaleString("en-IN")} -{" "}
                        {pa.vendorName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="tenderNumber"
                value={tenderNumber}
                disabled
                placeholder="Auto-generated"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Deadline Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadlineDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadlineDate
                    ? format(deadlineDate, "dd/MM/yyyy")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={setDeadlineDate}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={2030}
                  disabled={(date) => (orderDate ? date < orderDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="globalCreativeLink">Global Creative Link</Label>
          <Input
            id="globalCreativeLink"
            name="globalCreativeLink"
            value={formData.globalCreativeLink}
            onChange={handleInputChange}
            placeholder="https://drive.google.com/..."
          />
          <p className="text-xs text-muted-foreground">
            This link will be applied to all sites unless overridden
            individually
          </p>
        </div>

        {/* Creative Managers Selection */}
        <div className="space-y-3 pt-2">
          <Label>Would you like to assign Creative Managers?</Label>
          <RadioGroup
            value={wantCreativeManagers ? "yes" : "no"}
            onValueChange={(value) => {
              setWantCreativeManagers(value === "yes");
              if (value === "no") {
                setSelectedCreativeManagerId("");
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="creative-yes" />
              <Label
                htmlFor="creative-yes"
                className="font-normal cursor-pointer"
              >
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="creative-no" />
              <Label
                htmlFor="creative-no"
                className="font-normal cursor-pointer"
              >
                No
              </Label>
            </div>
          </RadioGroup>

          {wantCreativeManagers && (
            <div className="space-y-3 pl-6 border-l-2 border-muted">
              <Label className="text-sm text-muted-foreground">
                Select Creative Manager ({creativeManagers.length} available)
              </Label>
              {creativeManagers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No creative managers found. Please create creative managers
                  first.
                </p>
              ) : (
                <RadioGroup
                  value={selectedCreativeManagerId}
                  onValueChange={setSelectedCreativeManagerId}
                  className="space-y-2"
                >
                  {creativeManagers.map((manager) => (
                    <div
                      key={manager._id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={manager._id}
                        id={`manager-${manager._id}`}
                      />
                      <Label
                        htmlFor={`manager-${manager._id}`}
                        className="font-normal cursor-pointer flex-1"
                      >
                        <div className="flex items-center justify-between">
                          <span>{manager.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {manager.phone}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
