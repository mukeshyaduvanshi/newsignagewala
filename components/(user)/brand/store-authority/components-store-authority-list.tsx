"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Store, Loader2 } from "lucide-react"
import { useStoreAuthority } from "@/lib/hooks/useStoreAuthority"
import { CardSkeleton } from "@/components/ui/page-loader"
import { StoreAuthorityListProps } from "@/types/store-authority.types"
import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"

const ComponentsStoreAuthorityList = ({ onEdit }: StoreAuthorityListProps) => {
  const { authorities, isLoading, isError, mutate } = useStoreAuthority()
  const { accessToken } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      toast.error("No access token found. Please login again.")
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch("/api/brand/store-authority/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.isUsedInStore) {
          toast.error(result.error || "This authority is assigned to stores and cannot be deleted")
        } else {
          throw new Error(result.error || "Failed to delete store authority")
        }
        return
      }

      toast.success("Store authority deleted successfully!")
      mutate()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete store authority")
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
          <Store className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Store Authorities</h3>
          <p className="text-sm text-muted-foreground">
            {isError.message || "Failed to load store authorities"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full border rounded-lg shadow-md overflow-hidden h-[550px]">
      <div className="bg-muted p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Authority List
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all store authority permissions
            </p>
          </div>
          <Badge variant="secondary">{authorities.length} Authorities</Badge>
        </div>
      </div>

      <div className="p-6 overflow-y-auto h-[450px]">
        {authorities.length > 0 ? (
          <div className="space-y-4">
            {authorities.map((authority) => (
              <div
                key={authority._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">Store Permissions</h3>
                      <Badge variant="outline" className="text-xs bg-primary">
                        {authority.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {authority.selectedOptions.map((option) => (
                        <Badge key={option} variant="secondary">
                          {option}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created on {new Date(authority.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => onEdit({
                        _id: authority._id,
                        selectedOptions: authority.selectedOptions
                      })}
                      disabled={deletingId === authority._id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(authority._id)}
                      disabled={deletingId === authority._id}
                    >
                      {deletingId === authority._id ? (
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
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Store Authorities Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You haven't created any store authority permissions yet. Create your first one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComponentsStoreAuthorityList