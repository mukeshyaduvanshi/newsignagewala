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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { LoaderWithText } from "@/components/ui/Loader"
import { useAuth } from "@/lib/context/AuthContext"
import { useAdminMasterRate } from "@/lib/hooks/useAdminMasterRate"
import { MasterRateFormProps } from "@/types/master-rate.types"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"

const masterRateSchema = z.object({
  labelName: z.string().min(2, {
    message: "Label name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  rate: z.coerce.number().min(0, {
    message: "Rate must be a positive number.",
  }),
  measurementUnit: z.string().min(1, {
    message: "Measurement unit is required.",
  }),
  calculateUnit: z.string().min(1, {
    message: "Calculate unit is required.",
  }),
  rateType: z.string().min(1, {
    message: "Rate type is required.",
  }),
  width: z.coerce.number().min(0).optional(),
  height: z.coerce.number().min(0).optional(),
}).refine((data) => {
  if (data.rateType === "fixed") {
    return data.width && data.width > 0 && data.height && data.height > 0;
  }
  return true;
}, {
  message: "Width and Height are required for fixed rate type",
  path: ["width"],
})

type MasterRateFormValues = z.infer<typeof masterRateSchema>

const ComponentsMasterRateForm = ({ editData, onCancelEdit }: MasterRateFormProps) => {
  const { user, accessToken } = useAuth()
  const { mutate } = useAdminMasterRate()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditMode = !!editData

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
    watch,
  } = useForm({
    resolver: zodResolver(masterRateSchema),
    defaultValues: {
      labelName: "",
      description: "",
      rate: 0,
      measurementUnit: "inch",
      calculateUnit: "sqft",
      rateType: "custom",
      width: 0,
      height: 0,
    },
  })

  const rateType = watch("rateType")

  // Populate form when editData changes
  useEffect(() => {
    if (editData) {
      setValue("labelName", editData.labelName)
      setValue("description", editData.description)
      setValue("rate", editData.rate)
      setValue("measurementUnit", editData.measurementUnit || "inch")
      setValue("calculateUnit", editData.calculateUnit || "sqft")
      setValue("rateType", editData.rateType || "custom")
      if (editData.width) setValue("width", editData.width)
      if (editData.height) setValue("height", editData.height)
      if (editData.imageUrl) setImagePreview(editData.imageUrl)
    } else {
      reset()
      setImagePreview("")
      setImageFile(null)
    }
  }, [editData, setValue, reset])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !accessToken) return null

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", imageFile)

      const response = await fetch("/api/admin/rates/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image")
      }

      toast.success(`Image uploaded (${result.compressionRatio} compressed)`)
      return result.imageUrl
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: MasterRateFormValues) => {
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
      // Upload image first if new image is selected
      let imageUrl = imagePreview
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      if (isEditMode && editData) {
        // Update existing master rate
        const response = await fetch("/api/admin/rates/put", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: editData._id,
            labelName: data.labelName,
            description: data.description,
            rate: data.rate,
            measurementUnit: data.measurementUnit,
            calculateUnit: data.calculateUnit,
            rateType: data.rateType,
            width: data.rateType === "fixed" ? data.width : undefined,
            height: data.rateType === "fixed" ? data.height : undefined,
            imageUrl: imageUrl || undefined,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to update master rate")
        }

        toast.success("Master rate updated successfully!")
        reset()
        setImagePreview("")
        setImageFile(null)
        onCancelEdit()
        mutate()
      } else {
        // Create new master rate
        const response = await fetch("/api/admin/rates/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            labelName: data.labelName,
            description: data.description,
            rate: data.rate,
            measurementUnit: data.measurementUnit,
            calculateUnit: data.calculateUnit,
            rateType: data.rateType,
            width: data.rateType === "fixed" ? data.width : undefined,
            height: data.rateType === "fixed" ? data.height : undefined,
            imageUrl: imageUrl || undefined,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create master rate")
        }

        toast.success("Master rate created successfully!")
        reset()
        setImagePreview("")
        setImageFile(null)
        mutate()
      }
    } catch (error: any) {
      toast.error(error.message || isEditMode ? error.message : error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className=" border p-6 rounded-lg shadow-md h-auto">
      {/* <div className=""> */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend className="font-bold">
                {isEditMode ? "Edit Master Rate" : "Master Rate"}
              </FieldLegend>
              <FieldDescription>
                {isEditMode 
                  ? "Update master rate details."
                  : "Create master rate for the system."
                }
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="label-name-for-rate">
                    Label Name for Rate
                  </FieldLabel>
                  <Input
                    id="label-name-for-rate"
                    placeholder="Standard Rate"
                    {...register("labelName")}
                  />
                  {errors.labelName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.labelName.message}
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="description-for-rate">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="description-for-rate"
                    placeholder="Describe the rate details..."
                    className="resize-none h-32"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="rate-per-inch">
                    Rate (per unit)
                  </FieldLabel>
                  <Input
                    id="rate-per-inch"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("rate", { valueAsNumber: true })}
                  />
                  {errors.rate && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.rate.message}
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldGroup className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="measurement-unit">Measurement Unit</FieldLabel>
                  <Controller
                    name="measurementUnit"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="measurement-unit">
                          <SelectValue placeholder="Select measurement unit" />
                        </SelectTrigger>
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
                    )}
                  />
                  {errors.measurementUnit && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.measurementUnit.message}
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="calculate-unit">Calculate Unit</FieldLabel>
                  <Controller
                    name="calculateUnit"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="calculate-unit">
                          <SelectValue placeholder="Select calculate unit" />
                        </SelectTrigger>
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
                    )}
                  />
                  {errors.calculateUnit && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.calculateUnit.message}
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="rate-type">Rate Type</FieldLabel>
                  <Controller
                    name="rateType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="rate-type">
                          <SelectValue placeholder="Select rate type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.rateType && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.rateType.message}
                    </p>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
            {rateType === "fixed" && (
              <>
                <FieldSeparator />
                <FieldSet>
                  <FieldGroup className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="width">Width</FieldLabel>
                      <Input
                        id="width"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register("width", { valueAsNumber: true })}
                      />
                      {errors.width && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.width.message}
                        </p>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="height">Height</FieldLabel>
                      <Input
                        id="height"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register("height", { valueAsNumber: true })}
                      />
                      {errors.height && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.height.message}
                        </p>
                      )}
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </>
            )}
            <FieldSeparator />
            <FieldSet>
              <FieldLegend>Rate Image (Optional)</FieldLegend>
              <FieldDescription>
                Upload an image for this rate (PNG, JPG, WebP).
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="rate-image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div
                    className="relative w-full h-20 border-2 border-dashed rounded-lg overflow-hidden bg-muted/50 cursor-pointer hover:border-primary transition-all duration-300 group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Rate preview"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm font-medium">Uploading...</p>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImage()
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground transition-colors group-hover:text-primary">
                        <div className="relative mb-2">
                          <Upload className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <p className="text-xs font-medium mb-0.5">Click to upload image up to 5MB</p>
                        {/* <p className="text-xs">PNG, JPG, WebP up to 5MB</p> */}
                      </div>
                    )}
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <Field orientation="horizontal">
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
                  if (isEditMode) {
                    onCancelEdit()
                  }
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </>
  )
}

export default ComponentsMasterRateForm
