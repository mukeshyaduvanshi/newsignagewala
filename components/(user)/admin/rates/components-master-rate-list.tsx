"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Trash2, CirclePercent, Loader2, Search, Eye, X } from "lucide-react"
import { useAdminMasterRate } from "@/lib/hooks/useAdminMasterRate"
import { CardSkeleton } from "@/components/ui/page-loader"
import { MasterRateListProps } from "@/types/master-rate.types"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"

const ComponentsMasterRateList = ({ onEdit }: MasterRateListProps) => {
  const { rates, isLoading, isError, mutate } = useAdminMasterRate()
  const { accessToken } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Clear image from cache when modal closes
  useEffect(() => {
    if (!isImageModalOpen && selectedImage) {
      // Revoke object URL if it exists
      if (selectedImage.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImage)
      }
      setSelectedImage(null)
    }
  }, [isImageModalOpen])

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      toast.error("No access token found. Please login again.")
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch("/api/admin/rates/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.isUsedInRates) {
          toast.error(result.error || "This rate is in use and cannot be deleted")
        } else {
          throw new Error(result.error || "Failed to delete master rate")
        }
        return
      }

      toast.success("Master rate deleted successfully!")
      mutate() // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to delete master rate")
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full border rounded-lg shadow-md overflow-hidden h-[550px] p-6">
        <CardSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full border rounded-lg shadow-md overflow-hidden h-[550px] flex items-center justify-center">
        <div className="text-center">
          <CirclePercent className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Master Rates</h3>
          <p className="text-sm text-muted-foreground">
            {isError.message || "Failed to load master rates"}
          </p>
        </div>
      </div>
    )
  }

  // Filter rates based on search query
  const filteredRates = rates.filter((rate: any) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    
    return (
      rate.labelName.toLowerCase().includes(query) ||
      rate.description.toLowerCase().includes(query) ||
      rate.uniqueKey.toLowerCase().includes(query) ||
      rate.rate.toString().includes(query)
    )
  })

  return (
    <div className="w-full border rounded-lg shadow-md overflow-hidden h-[550px]">
      <div className="bg-muted p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CirclePercent className="h-5 w-5" />
              Master Rate List
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all master rates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredRates.length} of {rates.length} Rates</Badge>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, description, key, or rate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="p-6 overflow-y-auto h-[400px]">
        {filteredRates.length > 0 ? (
          <div className="space-y-4">
            {filteredRates.map((rate: any) => (
              <div
                key={rate._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {rate.labelName}
                      <Badge variant="outline" className="text-xs bg-primary">
                        {rate.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {rate.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <p className="text-sm font-medium">
                        Rate: <span className="text-primary">₹{rate.rate}/{rate.measurementUnit}</span>
                      </p>
                      <p className="text-sm font-medium">
                        Type: <span className="text-primary capitalize">{rate.rateType}</span>
                      </p>
                      <p className="text-sm font-medium">
                        Calculate Unit: <span className="text-primary capitalize">{rate.calculateUnit}</span>
                      </p>
                      {rate.rateType === "fixed" && rate.width && rate.height && (
                        <p className="text-sm font-medium">
                          Size: <span className="text-primary">{rate.width} x {rate.height}</span>
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Key: <span className="font-mono">{rate.uniqueKey}</span> | Created on {new Date(rate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {rate.imageUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewImage(rate.imageUrl)}
                        disabled={deletingId === rate._id}
                        title="View Image"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => onEdit({
                        _id: rate._id,
                        labelName: rate.labelName,
                        description: rate.description,
                        rate: rate.rate,
                      measurementUnit: rate.measurementUnit,
                      calculateUnit: rate.calculateUnit,
                        rateType: rate.rateType,
                        width: rate.width,
                        height: rate.height,
                        imageUrl: rate.imageUrl,
                      })}
                      disabled={deletingId === rate._id}
                      title="Edit Rate"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(rate._id)}
                      disabled={deletingId === rate._id}
                      title="Delete Rate"
                    >
                      {deletingId === rate._id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CirclePercent className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No Matching Rates Found" : "No Master Rates Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery 
                ? `No rates match "${searchQuery}". Try a different search term.`
                : "You haven't created any master rates yet. Create your first rate to get started."
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                size="sm"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Rate Image Preview</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex items-center justify-center bg-muted/50">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Rate image"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                onLoad={() => {
                  // Image loaded successfully
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ComponentsMasterRateList
