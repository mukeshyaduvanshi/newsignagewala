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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoaderWithText } from "@/components/ui/Loader"
import { useAuth } from "@/lib/context/AuthContext"
import { useStoreAuthority } from "@/lib/hooks/useStoreAuthority"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StoreAuthorityFormProps } from "@/types/store-authority.types"

// Predefined store authority options
const STORE_OPTIONS = [
  "In Store Branding",
  "Out Store Branding",
  "Campaigns",
  "Brand Kit",
  "Stock Management",
  "Payment Processing",
]

const storeAuthoritySchema = z.object({
  selectedOptions: z.array(z.string()).min(1, {
    message: "At least one option must be selected.",
  }),
})

type StoreAuthorityFormValues = z.infer<typeof storeAuthoritySchema>

const ComponentsStoreAuthorityForm = ({ editData, onCancelEdit }: StoreAuthorityFormProps) => {
  const { user, accessToken } = useAuth()
  const { mutate } = useStoreAuthority()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const isEditMode = !!editData

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StoreAuthorityFormValues>({
    resolver: zodResolver(storeAuthoritySchema),
    defaultValues: {
      selectedOptions: [],
    },
  })

  // Populate form when editData changes
  useEffect(() => {
    if (editData) {
      setSelectedOptions(editData.selectedOptions)
      setValue("selectedOptions", editData.selectedOptions)
    } else {
      setSelectedOptions([])
      reset()
    }
  }, [editData, setValue, reset])

  const handleOptionToggle = (option: string) => {
    setSelectedOptions((prev) => {
      const newOptions = prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
      setValue("selectedOptions", newOptions)
      return newOptions
    })
  }

  const handleRemoveOption = (option: string) => {
    setSelectedOptions((prev) => {
      const newOptions = prev.filter((o) => o !== option)
      setValue("selectedOptions", newOptions)
      return newOptions
    })
  }

  const onSubmit = async (data: StoreAuthorityFormValues) => {
    if (!user?.id) {
      toast.error("User not authenticated")
      return
    }

    if (!accessToken) {
      toast.error("No access token found. Please login again.")
      return
    }

    setIsLoading(true)
    try {
      if (isEditMode && editData) {
        // Update existing store authority
        const response = await fetch("/api/brand/store-authority/put", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: editData._id,
            selectedOptions: data.selectedOptions,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to update store authority")
        }

        toast.success("Store authority updated successfully!")
        reset()
        setSelectedOptions([])
        onCancelEdit()
        mutate()
      } else {
        // Create new store authority
        const response = await fetch("/api/brand/store-authority/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            selectedOptions: data.selectedOptions,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create store authority")
        }

        toast.success("Store authority created successfully!")
        reset()
        setSelectedOptions([])
        mutate()
      }
    } catch (error: any) {
      toast.error(error.message || isEditMode ? "Failed to update store authority" : "Failed to create store authority")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full sm:max-w-1/2 border p-6 rounded-lg shadow-md h-[550px] flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <FieldGroup className="flex-1 overflow-y-auto">
          <FieldSet>
            <FieldLegend className="font-bold">
              {isEditMode ? "Edit Store Authority" : "Store Authority"}
            </FieldLegend>
            <FieldDescription>
              {isEditMode 
                ? "Update store authority permissions."
                : "Select permissions for store management."}
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="store-options">
                  Select Store Permissions
                </FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>
                        {selectedOptions.length > 0
                          ? `${selectedOptions.length} selected`
                          : "Select options"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuLabel>Store Permissions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STORE_OPTIONS.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option}
                        checked={selectedOptions.includes(option)}
                        onCheckedChange={() => handleOptionToggle(option)}
                      >
                        {option}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors.selectedOptions && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.selectedOptions.message}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <FieldSet>
            <FieldLegend className="text-sm">Selected Permissions</FieldLegend>
            <div className="flex flex-wrap gap-2 min-h-6">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge key={option} variant="secondary" className="px-3 py-1 rounded-full border-2 border-primary/50 flex justify-center items-center">
                    {option}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No permissions selected yet
                </p>
              )}
            </div>
          </FieldSet>
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
              setSelectedOptions([])
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

export default ComponentsStoreAuthorityForm
