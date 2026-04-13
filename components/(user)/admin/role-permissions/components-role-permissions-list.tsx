"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Briefcase, Loader2 } from "lucide-react"
import { useAdminRolePermissions } from "@/lib/hooks/useAdminRolePermissions"
import { CardSkeleton } from "@/components/ui/page-loader"
import { RolePermissionListProps } from "@/types/role-permissions.types"
import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"

const ComponentsRolePermissionList = ({ onEdit }: RolePermissionListProps) => {
  const { authorities, isLoading, isError, mutate } = useAdminRolePermissions()
  const { accessToken } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      toast.error("No access token found. Please login again.")
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch("/api/admin/role-permissions/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.isUsedInWork) {
          toast.error(result.error || "This role permission is in use and cannot be deleted")
        } else {
          throw new Error(result.error || "Failed to delete role permission")
        }
        return
      }

      toast.success("Role permission deleted successfully!")
      mutate()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role permission")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (authority: any) => {
    onEdit({
      _id: authority._id,
      teamMemberId: authority.teamMemberId,
      teamMemberName: authority.teamMemberName,
      teamMemberUniqueKey: authority.teamMemberUniqueKey,
      permissions: authority.permissions,
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-card text-card-foreground rounded-lg border p-6">
        <CardSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 bg-card text-card-foreground rounded-lg border p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load work authorities</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-card text-card-foreground rounded-lg border p-6 h-[700px] overflow-hidden">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Work Authorities</h3>
        <p className="text-sm text-muted-foreground">
          Manage work permissions for team members
        </p>
      </div>

      {authorities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Briefcase className="h-12 w-12 mb-4 opacity-50" />
          <p>No work authorities found</p>
          <p className="text-sm">Create your first role permission to get started</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto h-[600px]">
          {authorities.map((authority: any) => (
            <div
              key={authority._id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {authority.teamMemberName}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(authority.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(authority)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(authority._id)}
                    disabled={deletingId === authority._id}
                  >
                    {deletingId === authority._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Permissions Display */}
              <div className="space-y-2">
                {authority.permissions
                  .filter((p: any) => p.add || p.edit || p.view || p.delete || p.request)
                  .map((permission: any, index: number) => {
                    const activePermissions: string[] = []
                    if (permission.add) activePermissions.push("Add")
                    if (permission.edit) activePermissions.push("Edit")
                    if (permission.view) activePermissions.push("View")
                    if (permission.delete) activePermissions.push("Delete")
                    if (permission.request) activePermissions.push("Request")

                    if (activePermissions.length === 0) return null

                    return (
                      <div key={index} className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-medium">
                          {permission.module}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        {activePermissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ComponentsRolePermissionList
