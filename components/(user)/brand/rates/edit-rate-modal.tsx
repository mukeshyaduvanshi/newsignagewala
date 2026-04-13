"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"
import { useBrandRate } from "@/lib/hooks/useBrandRate"
import type { BrandRate } from "@/types/brand-rate.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  rateType: z.enum(["fixed", "custom"]),
  measurementUnit: z.enum(["inch", "feet", "cm", "mm", "pcs", "runninginch", "runningfeet"]),
  calculateUnit: z.enum(["sqft", "sqin", "sqcm", "sqmm", "pc", "feet", "inch"]),
  width: z.number().min(0).optional().or(z.literal(undefined)),
  height: z.number().min(0).optional().or(z.literal(undefined)),
  rate: z.number().min(0, "Rate must be positive"),
  instruction: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditRateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rate: BrandRate | null
}

export function EditRateModal({ open, onOpenChange, rate }: EditRateModalProps) {
  const { accessToken } = useAuth()
  const { mutate } = useBrandRate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rateType: "custom",
      measurementUnit: "inch",
      calculateUnit: "sqft",
      width: undefined,
      height: undefined,
      rate: 0,
      instruction: "",
    },
  })

  const rateType = form.watch("rateType")
  const originalRateType = rate?.rateType

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  // Clear width/height when rateType changes to custom
  useEffect(() => {
    if (rateType === "custom") {
      form.setValue("width", undefined)
      form.setValue("height", undefined)
    }
  }, [rateType, form])

  // Populate form when rate changes
  useEffect(() => {
    if (rate) {
      form.reset({
        rateType: rate.rateType as "fixed" | "custom",
        measurementUnit: rate.measurementUnit as any,
        calculateUnit: rate.calculateUnit as any,
        width: rate.width,
        height: rate.height,
        rate: rate.rate,
        instruction: rate.instruction || "",
      })
    }
  }, [rate, form])

  const onSubmit = async (data: FormValues) => {
    if (!accessToken || !rate) {
      toast.error("Please login again")
      return
    }

    // Validation for fixed type
    if (data.rateType === "fixed" && (!data.width || !data.height || data.width <= 0 || data.height <= 0)) {
      toast.error("Width and height are required for fixed rate type")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/brand/rates/put", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          rateId: rate._id,
          ...data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update rate")
      }

      toast.success("Rate updated successfully!")
      mutate() // Refresh the rates list
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update rate")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!rate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rate</DialogTitle>
          <DialogDescription>
            Update rate details (Element name and description cannot be changed)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Element Name (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Element Name (Read-only)</label>
              <div className="px-3 py-2 bg-muted rounded-md">
                {rate.elementName}
              </div>
            </div>

            {/* Description (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description (Read-only)</label>
              <div className="px-3 py-2 bg-muted rounded-md min-h-[60px]">
                {rate.description}
              </div>
            </div>

            {/* Instruction */}
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instruction (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any special instructions..."
                      className="resize-none h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rate Type (Read-only from master) */}
            <FormField
              control={form.control}
              name="rateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled>
                    <FormControl>
                      <SelectTrigger className="w-auto bg-muted">
                        <SelectValue placeholder="Select rate type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Width and Height - Only visible for fixed type */}
            {rateType === "fixed" && (
              <div className="grid grid-cols-2 gap-4">
                {originalRateType === "fixed" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Width (Read-only)</label>
                      <div className="px-3 py-2 bg-muted rounded-md text-muted-foreground">
                        {rate.width || "-"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Height (Read-only)</label>
                      <div className="px-3 py-2 bg-muted rounded-md text-muted-foreground">
                        {rate.height || "-"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter width"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter height"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}

            {/* Rate and Measurement Unit */}
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">Rate (per unit){rateType === "fixed"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter rate"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        // disabled={rateType === "fixed"}
                        className={rateType === "fixed" ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measurementUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">Measurement Unit{rateType === "fixed"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} >
                      <FormControl>
                        <SelectTrigger className={rateType === "fixed" ? "w-auto bg-muted" : "w-auto"}>
                          <SelectValue placeholder="Select measurement unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inch">Inch</SelectItem>
                        <SelectItem value="feet">Feet</SelectItem>
                        <SelectItem value="cm">CM</SelectItem>
                        <SelectItem value="mm">MM</SelectItem>
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="runninginch">Running Inch</SelectItem>
                        <SelectItem value="runningfeet">Running Feet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calculate Unit */}
            <FormField
              control={form.control}
              name="calculateUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-muted-foreground">Calculate Unit{rateType === "fixed"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={rateType === "fixed" ? "w-auto bg-muted" : "w-auto"}>
                        <SelectValue placeholder="Select calculate unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sqft">Sq Ft</SelectItem>
                      <SelectItem value="sqin">Sq In</SelectItem>
                      <SelectItem value="sqcm">Sq CM</SelectItem>
                      <SelectItem value="sqmm">Sq MM</SelectItem>
                      <SelectItem value="pc">PC</SelectItem>
                      <SelectItem value="feet">Feet</SelectItem>
                      <SelectItem value="inch">Inch</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Rate"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
