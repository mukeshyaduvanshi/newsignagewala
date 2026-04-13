"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserInfoModalProps {
  open: boolean;
  onSubmit: (name: string, phone: string) => void;
}

export const UserInfoModal = ({ open, onSubmit }: UserInfoModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    // Phone number validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSubmitting(true);
    
    try {
      onSubmit(name.trim(), phone.trim());
      toast.success("Information saved successfully");
      setName("");
      setPhone("");
    } catch (error) {
      toast.error("Failed to save information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome!</DialogTitle>
          <DialogDescription>
            Please provide your information to continue
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Only digits
                if (value.length <= 10) {
                  setPhone(value);
                }
              }}
              disabled={isSubmitting}
              required
              maxLength={10}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
