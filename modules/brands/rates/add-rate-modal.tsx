"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"
import { useBrandRate } from "@/lib/hooks/useBrandRate"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { MasterRateSearchResult } from "@/types/brand-rate.types"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
  elementName: z.string().min(2, "Element name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  rateType: z.enum(["fixed", "custom"]),
  measurementUnit: z.enum(["inch", "feet", "cm", "mm", "pcs", "runninginch", "runningfeet"]),
  calculateUnit: z.enum(["sqft", "sqin", "sqcm", "sqmm", "pc", "feet", "inch"]),
  width: z.union([z.number().min(0), z.literal(""), z.undefined(), z.null()]).optional(),
  height: z.union([z.number().min(0), z.literal(""), z.undefined(), z.null()]).optional(),
  rate: z.number().min(0, "Rate must be positive"),
  instruction: z.string().optional(),
  imageUrl: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddRateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRateModal({ open, onOpenChange }: AddRateModalProps) {
  const { accessToken } = useAuth()
  const { mutate } = useBrandRate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<MasterRateSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMasterRate, setSelectedMasterRate] = useState<MasterRateSearchResult | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [canEditDesc, setCanEditDesc] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      elementName: "",
      description: "",
      rateType: "custom",
      measurementUnit: "inch",
      calculateUnit: "sqft",
      width: "" as any,
      height: "" as any,
      rate: 0,
      instruction: "",
      imageUrl: "",
    },
  })

  console.log(isSubmitting);
  

  const rateType = form.watch("rateType")

  console.log(selectedMasterRate);
  

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset({
        elementName: "",
        description: "",
        rateType: "custom",
        measurementUnit: "inch",
        calculateUnit: "sqft",
        width: "" as any,
        height: "" as any,
        rate: 0,
        instruction: "",
        imageUrl: "",
      })
      setSelectedMasterRate(null)
      setSearchQuery("")
      setCanEditDesc(false)
      setSearchResults([])
    }
  }, [open, form])

  // Clear width/height when rateType changes to custom
  useEffect(() => {
    if (rateType === "custom") {
      form.setValue("width", "" as any)
      form.setValue("height", "" as any)
    }
  }, [rateType, form])

  // Debounced search for master rates
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/manager/rates/search-master?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (response.ok) {
          const result = await response.json()
          setSearchResults(result.data || [])
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsSearching(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, accessToken])

  // When a master rate is selected, populate the form
  const handleSelectMasterRate = (masterRate: MasterRateSearchResult) => {
    setSelectedMasterRate(masterRate)
    
    // Reset form with all values from master rate
    form.reset({
      elementName: masterRate.labelName,
      description: masterRate.description,
      rateType: masterRate.rateType as "fixed" | "custom",
      measurementUnit: masterRate.measurementUnit as any,
      calculateUnit: masterRate.calculateUnit as any,
      rate: masterRate.rate,
      width: masterRate.width || undefined,
      height: masterRate.height || undefined,
      instruction: "",
      imageUrl: masterRate.imageUrl || "",
    })
    
    setShowDropdown(false)
    setSearchQuery(masterRate.labelName)
    setCanEditDesc(false) // Reset checkbox when selecting new rate
  }

  const onSubmit = async (data: FormValues) => {
    if (!accessToken) {
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
      // Convert empty strings to undefined for optional fields
      const submitData = {
        elementName: data.elementName,
        description: data.description,
        rateType: data.rateType,
        measurementUnit: data.measurementUnit,
        calculateUnit: data.calculateUnit,
        rate: data.rate,
        width: (data.width === "" || data.width === 0 || data.width === null) ? undefined : data.width,
        height: (data.height === "" || data.height === 0 || data.height === null) ? undefined : data.height,
        instruction: data.instruction || undefined,
        imageUrl: data.imageUrl || undefined,
        uniqueKey: selectedMasterRate?.uniqueKey || undefined,
        masterRateId: selectedMasterRate?._id || undefined,
        canEditDescription: canEditDesc,
      };

      console.log("Submitting data:", submitData);
      
      const response = await fetch("/api/manager/rates/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create rate")
      }

      toast.success("Rate created successfully!")
      mutate() // Refresh the rates list
      
      // Reset form and states
      form.reset({
        elementName: "",
        description: "",
        rateType: "custom",
        measurementUnit: "inch",
        calculateUnit: "sqft",
        width: "" as any,
        height: "" as any,
        rate: 0,
        instruction: "",
        imageUrl: "",
      })
      setSelectedMasterRate(null)
      setSearchQuery("")
      setCanEditDesc(false)
      setSearchResults([])
      
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to create rate")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Rate</DialogTitle>
          <DialogDescription>
            Search for an existing rate from master rates or create your own custom rate
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Searchable Element Name - Custom Dropdown */}
            <div className="space-y-2 relative">
              <Label htmlFor="search-element">Search Element</Label>
              <Input
                id="search-element"
                placeholder="Type to search master rates..."
                value={searchQuery}
                autoComplete="off"
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full"
              />

              {/* Dropdown Results */}
              {showDropdown && searchQuery.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-72 overflow-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                      <span className="ml-2 text-sm text-gray-500">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((result) => (
                        <button
                          key={result._id}
                          type="button"
                          onClick={() => handleSelectMasterRate(result)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-sm">{result.labelName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {result.description}
                          </div>
                          <div className="flex gap-2 mt-1.5 text-xs text-gray-500">
                            <span>₹{result.rate}/{result.measurementUnit}</span>
                            <span>•</span>
                            <span className="capitalize">{result.rateType}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No master rates found.
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        You can create a custom element below.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Click outside to close dropdown */}
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
              )}
            </div>

            {/* Element Name Field */}
            <FormField
              control={form.control}
              name="elementName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Element Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter element name" disabled={!!selectedMasterRate && !canEditDesc} />
                  </FormControl>
                  {/* {selectedMasterRate && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Using master rate: {selectedMasterRate.labelName}
                    </p>
                  )} */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description with Edit Checkbox */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter description"
                      className="resize-none h-24"
                      disabled={!!selectedMasterRate && !canEditDesc}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkbox: This is being created for you */}
            {selectedMasterRate && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEditDesc"
                  checked={canEditDesc}
                  onCheckedChange={(checked) => setCanEditDesc(checked as boolean)}
                />
                <Label
                  htmlFor="canEditDesc"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  This is being created for you (check to edit description)
                </Label>
              </div>
            )}

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

            {/* Rate Type */}
            <FormField
              control={form.control}
              name="rateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-auto">
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
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width{selectedMasterRate ? " (From Master)" : ""}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter width"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                          disabled={!!selectedMasterRate}
                          className={selectedMasterRate ? "bg-muted" : ""}
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
                      <FormLabel>Height{selectedMasterRate ? " (From Master)" : ""}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter height"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                          disabled={!!selectedMasterRate}
                          className={selectedMasterRate ? "bg-muted" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Rate and Measurement Unit */}
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (per unit)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter rate"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <FormLabel>Measurement Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-auto">
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
                  <FormLabel>Calculate Unit</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-auto">
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
                onClick={() => {
                  form.reset({
                    elementName: "",
                    description: "",
                    rateType: "custom",
                    measurementUnit: "inch",
                    calculateUnit: "sqft",
                    width: "" as any,
                    height: "" as any,
                    rate: 0,
                    instruction: "",
                    imageUrl: "",
                  })
                  setSelectedMasterRate(null)
                  setSearchQuery("")
                  setCanEditDesc(false)
                  setSearchResults([])
                  onOpenChange(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Rate"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
