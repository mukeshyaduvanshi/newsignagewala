"use client"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoaderWithText } from "@/components/ui/Loader"
import { useAuth } from "@/lib/context/AuthContext"
import { usePurchaseAuthority } from "@/lib/hooks/usePurchaseAuthority"
import { PurchaseAuthorityFormProps, Vendor } from "@/types/purchase-authority.types"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

const purchaseAuthoritySchema = z.object({
  poNumber: z.string().min(1, "PO Number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  issueDate: z.date(),
  expiryDate: z.date(),
  amount: z.number().min(1, "Amount must be greater than 0"),
})

type PurchaseAuthorityFormValues = z.infer<typeof purchaseAuthoritySchema>

const ComponentsPurchaseAuthorityForm = ({ editData, onCancelEdit }: PurchaseAuthorityFormProps) => {
  const { accessToken } = useAuth()
  const { mutate } = usePurchaseAuthority()
  const [isLoading, setIsLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorSearchTerm, setVendorSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const isEditMode = !!editData

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PurchaseAuthorityFormValues>({
    resolver: zodResolver(purchaseAuthoritySchema),
    defaultValues: {
      poNumber: "",
      vendorId: "",
      issueDate: new Date(),
      expiryDate: new Date(),
      amount: 0,
    },
  })

  const issueDate = watch("issueDate")
  const expiryDate = watch("expiryDate")
  const poNumber = watch("poNumber")
  const amount = watch("amount")

  // Fetch vendors on mount
  useEffect(() => {
    const fetchVendors = async () => {
      if (!accessToken) return

      try {
        const response = await fetch("/api/brand/vendors", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setVendors(data.vendors || [])
        }
      } catch (error) {
        console.error("Error fetching vendors:", error)
      }
    }

    fetchVendors()
  }, [accessToken])

  // Populate form when editData changes
  useEffect(() => {
    if (editData) {
      setValue("poNumber", editData.poNumber)
      setValue("vendorId", editData.vendorId)
      setValue("issueDate", new Date(editData.issueDate))
      setValue("expiryDate", new Date(editData.expiryDate))
      setValue("amount", editData.amount)
      
      // Find and set the selected vendor
      const vendor = vendors.find(v => v._id === editData.vendorId)
      setSelectedVendor(vendor || null)
    } else {
      reset({
        poNumber: "",
        vendorId: "",
        issueDate: new Date(),
        expiryDate: new Date(),
        amount: 0,
      })
      setSelectedVendor(null)
    }
  }, [editData, setValue, reset, vendors])

  const onSubmit = async (data: PurchaseAuthorityFormValues) => {
    if (!accessToken) {
      toast.error("No access token found. Please login again.")
      return
    }

    setIsLoading(true)
    try {
      if (isEditMode && editData) {
        // Update existing purchase authority
        const response = await fetch("/api/brand/purchase-authority/put", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: editData._id,
            ...data,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to update purchase authority")
        }

        toast.success("Purchase authority updated successfully!")
        reset()
        setSelectedVendor(null)
        onCancelEdit()
        mutate()
      } else {
        // Create new purchase authority
        const response = await fetch("/api/brand/purchase-authority/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create purchase authority")
        }

        toast.success("Purchase authority created successfully!")
        reset()
        setSelectedVendor(null)
        mutate()
      }
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? "Failed to update purchase authority" : "Failed to create purchase authority"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full sm:max-w-full border p-6 rounded-lg shadow-md h-[550px] flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <FieldGroup className="flex-1 overflow-y-auto">
          <FieldSet>
            <FieldLegend className="font-bold">
              {isEditMode ? "Edit Purchase Authority" : "Purchase Authority"}
            </FieldLegend>
            <FieldDescription>
              {isEditMode 
                ? "Update purchase authority details."
                : "Create a new purchase order authority."}
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="poNumber">PO Number</FieldLabel>
                <Input
                  id="poNumber"
                  {...register("poNumber")}
                  placeholder="Enter PO Number"
                />
                {errors.poNumber && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.poNumber.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="vendorId">Select Vendor</FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      type="button"
                    >
                      <span>
                        {selectedVendor ? selectedVendor.companyName : "Select vendor..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[400px]">
                    <DropdownMenuLabel>Select Vendor</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Input
                        placeholder="Search vendors..."
                        value={vendorSearchTerm}
                        onChange={(e) => setVendorSearchTerm(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {vendors
                        .filter(vendor => {
                          const searchLower = vendorSearchTerm.toLowerCase()
                          const companyName = vendor.companyName?.toLowerCase() || ""
                          const email = vendor.email?.toLowerCase() || ""
                          return companyName.includes(searchLower) || email.includes(searchLower)
                        })
                        .map((vendor) => (
                          <DropdownMenuItem
                            key={vendor._id}
                            onSelect={() => {
                              setValue("vendorId", vendor._id)
                              setSelectedVendor(vendor)
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{vendor.companyName || "Unknown"}</span>
                              <span className="text-xs text-muted-foreground">{vendor.email || "No email"}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      {vendors.filter(vendor => {
                        const searchLower = vendorSearchTerm.toLowerCase()
                        const companyName = vendor.companyName?.toLowerCase() || ""
                        const email = vendor.email?.toLowerCase() || ""
                        return companyName.includes(searchLower) || email.includes(searchLower)
                      }).length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No vendors found
                        </div>
                      )}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors.vendorId && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.vendorId.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel>Issue Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !issueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {issueDate ? format(issueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={issueDate}
                      onSelect={(date) => date && setValue("issueDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.issueDate && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.issueDate.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel>Expiry Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={(date) => date && setValue("expiryDate", date)}
                      initialFocus
                      disabled={(date) => date < issueDate}
                    />
                  </PopoverContent>
                </Popover>
                {errors.expiryDate && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.expiryDate.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="amount">Amount (₹)</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          {/* <FieldSet>
            <FieldLegend className="text-sm">Purchase Order Summary</FieldLegend>
            <div className="space-y-3 min-h-6">
              {poNumber || selectedVendor || amount > 0 ? (
                <>
                  {poNumber && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">PO Number:</span>
                      <Badge variant="secondary" className="px-3 py-1">
                        {poNumber}
                      </Badge>
                    </div>
                  )}
                  {selectedVendor && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Vendor:</span>
                      <Badge variant="secondary" className="px-3 py-1">
                        {selectedVendor.companyName || "N/A"}
                      </Badge>
                    </div>
                  )}
                  {issueDate && expiryDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Validity:</span>
                      <Badge variant="secondary" className="px-3 py-1">
                        {format(issueDate, "dd/MM/yyyy")} - {format(expiryDate, "dd/MM/yyyy")}
                      </Badge>
                    </div>
                  )}
                  {amount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Amount:</span>
                      <Badge variant="secondary" className="px-3 py-1 text-primary font-bold">
                        ₹{amount.toLocaleString("en-IN")}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fill the form to see purchase order summary
                </p>
              )}
            </div>
          </FieldSet> */}
        </FieldGroup>
        <Field orientation="horizontal" className="mt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <LoaderWithText text={isEditMode ? "Updating..." : "Creating..."} position="left" />
            ) : (
              isEditMode ? "Update" : "Submit"
            )}
          </Button>
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {
              reset()
              setSelectedVendor(null)
              setVendorSearchTerm("")
              if (isEditMode) {
                onCancelEdit()
              }
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </Field>
      </form>
    </div>
  )
}

export default ComponentsPurchaseAuthorityForm
