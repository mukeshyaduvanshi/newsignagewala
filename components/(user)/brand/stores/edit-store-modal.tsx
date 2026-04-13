"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"
import { useStores } from "@/lib/hooks/useStores"
import type { Store } from "@/types/store.types"
import { Country, State, City } from "country-state-city"
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
import { Loader2, Upload, X } from "lucide-react"

const formSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storePhone: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"),
  storeAddress: z.string().min(10, "Address must be at least 10 characters"),
  storeCountry: z.string().min(1, "Country is required"),
  storeState: z.string().min(1, "State is required"),
  storeCity: z.string().min(1, "City is required"),
  storePincode: z.string().regex(/^[0-9]{6}$/, "Please enter a valid 6-digit pincode"),
  storeImage: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditStoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store | null
}

export function EditStoreModal({ open, onOpenChange, store }: EditStoreModalProps) {
  const { accessToken } = useAuth()
  const { mutate } = useStores()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isFetchingPincode, setIsFetchingPincode] = useState(false)
  
  // Country/State/City data from library
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("IN")
  const [selectedStateCode, setSelectedStateCode] = useState<string>("")
  const [availableStates, setAvailableStates] = useState<any[]>([])
  const [availableCities, setAvailableCities] = useState<any[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: "",
      storePhone: "",
      storeAddress: "",
      storeCountry: "India",
      storeState: "",
      storeCity: "",
      storePincode: "",
      storeImage: "",
    },
  })

  const selectedCountry = form.watch("storeCountry")
  const selectedState = form.watch("storeState")
  const pincode = form.watch("storePincode")

  // Get all countries
  const allCountries = Country.getAllCountries()

  // Update states when country changes
  useEffect(() => {
    if (selectedCountryCode) {
      const states = State.getStatesOfCountry(selectedCountryCode)
      setAvailableStates(states)
    }
  }, [selectedCountryCode])

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountryCode && selectedStateCode) {
      const cities = City.getCitiesOfState(selectedCountryCode, selectedStateCode)
      setAvailableCities(cities)
    }
  }, [selectedStateCode, selectedCountryCode])

  // Load store data when modal opens
  useEffect(() => {
    if (open && store) {
      // Find country code
      const country = allCountries.find(c => c.name === store.storeCountry)
      if (country) {
        setSelectedCountryCode(country.isoCode)
        
        // Load states for the country
        const states = State.getStatesOfCountry(country.isoCode)
        setAvailableStates(states)
        
        // Find state code
        const state = states.find((s: any) => s.name === store.storeState)
        if (state) {
          setSelectedStateCode(state.isoCode)
          
          // Load cities for the state
          const cities = City.getCitiesOfState(country.isoCode, state.isoCode)
          setAvailableCities(cities)
        }
      }
      
      form.reset({
        storeName: store.storeName,
        storePhone: store.storePhone,
        storeAddress: store.storeAddress,
        storeCountry: store.storeCountry,
        storeState: store.storeState,
        storeCity: store.storeCity,
        storePincode: store.storePincode,
        storeImage: store.storeImage || "",
      })
      setImagePreview(store.storeImage || "")
    } else if (!open) {
      form.reset()
      setImagePreview("")
      setSelectedCountryCode("IN")
      setSelectedStateCode("")
      setAvailableStates([])
      setAvailableCities([])
    }
  }, [open, store, form, allCountries])

  // Fetch location from pincode (only if pincode changed)
  useEffect(() => {
    if (!store) return
    
    const fetchPincodeData = async () => {
      if (pincode && pincode.length === 6 && selectedCountry === "India" && pincode !== store.storePincode) {
        setIsFetchingPincode(true)
        try {
          const response = await fetch(`/api/brand/stores/pincode?pincode=${pincode}`)
          if (response.ok) {
            const data = await response.json()
            // Set both state and city from pincode
            if (data.state) {
              form.setValue("storeState", data.state)
            }
            if (data.city) {
              // Wait a bit for cities to load, then set city
              setTimeout(() => {
                form.setValue("storeCity", data.city)
              }, 500)
            }
            toast.success("State and City auto-filled from pincode")
          }
        } catch (error) {
          console.error("Error fetching pincode data:", error)
        } finally {
          setIsFetchingPincode(false)
        }
      }
    }

    const timer = setTimeout(() => {
      fetchPincodeData()
    }, 500)

    return () => clearTimeout(timer)
  }, [pincode, selectedCountry, form, store])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    if (!accessToken) {
      toast.error("Please login again")
      return
    }

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/brand/stores/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || uploadData.details || 'Upload failed')
      }

      if (!uploadData.url) {
        throw new Error('No URL returned from upload')
      }
      
      form.setValue("storeImage", uploadData.url)
      setImagePreview(uploadData.url)
      toast.success("Image uploaded successfully")
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast.error(error.message || "Failed to upload image. Please try again.")
      // Reset file input
      if (e.target) {
        e.target.value = ''
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  const removeImage = () => {
    form.setValue("storeImage", "")
    setImagePreview("")
  }

  const onSubmit = async (values: FormValues) => {
    if (!store) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/brand/stores/put", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          _id: store._id,
          ...values,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Store updated successfully")
        mutate()
        onOpenChange(false)
      } else {
        toast.error(data.error || "Failed to update store")
      }
    } catch (error) {
      console.error("Error updating store:", error)
      toast.error("Failed to update store")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Store</DialogTitle>
          <DialogDescription>
            Update store details below. Pincode will auto-fill state and city.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Store Name */}
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter store name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Store Phone */}
            <FormField
              control={form.control}
              name="storePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 10-digit phone number" {...field} maxLength={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Store Address */}
            <FormField
              control={form.control}
              name="storeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter complete address" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pincode */}
            <FormField
              control={form.control}
              name="storePincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="Enter 6-digit pincode" {...field} maxLength={6} />
                      {isFetchingPincode && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country */}
            <FormField
              control={form.control}
              name="storeCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      const country = allCountries.find(c => c.name === value)
                      if (country) {
                        setSelectedCountryCode(country.isoCode)
                      }
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allCountries.map((country) => (
                        <SelectItem key={country.isoCode} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* State */}
            <FormField
              control={form.control}
              name="storeState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      const state = availableStates.find(s => s.name === value)
                      if (state) {
                        setSelectedStateCode(state.isoCode)
                      }
                    }} 
                    value={field.value}
                    disabled={!selectedCountryCode}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStates.length > 0 ? (
                        availableStates.map((state) => (
                          <SelectItem key={state.isoCode} value={state.name}>
                            {state.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="N/A" disabled>No states available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="storeCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedStateCode}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCities.length > 0 ? (
                        availableCities.map((city) => (
                          <SelectItem key={city.name} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="N/A" disabled>No cities available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Store Image */}
            <div className="space-y-2">
              <FormLabel>Store Image (Optional)</FormLabel>
              {imagePreview ? (
                <div className="relative w-full h-36 border rounded-md overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Store preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <Upload className="mx-auto h-6 w-12 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="store-image-edit" className="cursor-pointer">
                      <span className="text-sm text-blue-600 hover:text-blue-500">
                        Upload an image
                      </span>
                      <input
                        id="store-image-edit"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB
                  </p>
                  {isUploadingImage && (
                    <div className="mt-2 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploadingImage}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Store
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
