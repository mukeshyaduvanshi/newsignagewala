"use client"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoaderWithText } from "@/components/ui/Loader"
import { useAuth } from "@/lib/context/AuthContext"
import { useAdminRolePermissions } from "@/lib/hooks/useAdminRolePermissions"
import { useAdminUserRoles } from "@/lib/hooks/useAdminUserRoles"
import { RolePermissionFormProps, Permission } from "@/types/role-permissions.types"

// Work modules
const WORK_MODULES = [
  "Rates",
  "Stores",
  "Campaigns",
  "Orders",
  "Team Member",
  "Created-Sites",
]

// Permission types
const PERMISSION_TYPES = ["Add", "Edit", "View", "Delete", "Request"]

const rolePermissionSchema = z.object({
  teamMemberId: z.string().min(1, {
    message: "Please select a team member",
  }),
  teamMemberName: z.string().min(1, {
    message: "Team member name is required",
  }),
})

type RolePermissionFormValues = z.infer<typeof rolePermissionSchema>

const ComponentsRolePermissionForm = ({ editData, onCancelEdit }: RolePermissionFormProps) => {
  const { user, accessToken } = useAuth()
  const { mutate } = useAdminRolePermissions()
  const { authorities: teamAuthorities, isLoading: teamLoading } = useAdminUserRoles()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState<{
    id: string
    name: string
    uniqueKey: string
  } | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const isEditMode = !!editData

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RolePermissionFormValues>({
    resolver: zodResolver(rolePermissionSchema),
  })

  // Initialize permissions with all modules
  useEffect(() => {
    if (!editData) {
      const initialPermissions: Permission[] = WORK_MODULES.map((module) => ({
        module,
        add: false,
        edit: false,
        view: false,
        delete: false,
        bulk: false,
        request: false,
      }))
      setPermissions(initialPermissions)
    }
  }, [editData])

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setValue("teamMemberId", editData.teamMemberId)
      setValue("teamMemberName", editData.teamMemberName)
      setSelectedTeamMember({
        id: editData.teamMemberId,
        name: editData.teamMemberName,
        uniqueKey: (editData as any).teamMemberUniqueKey || "",
      })
      setPermissions(editData.permissions)
    } else {
      reset()
      setSelectedTeamMember(null)
      const initialPermissions: Permission[] = WORK_MODULES.map((module) => ({
        module,
        add: false,
        edit: false,
        view: false,
        delete: false,
        bulk: false,
        request: false,
      }))
      setPermissions(initialPermissions)
    }
  }, [editData, reset, setValue])

  const handleTeamMemberSelect = (memberId: string) => {
    const member = teamAuthorities.find(m => m._id === memberId)
    if (member) {
      setSelectedTeamMember({ id: member._id, name: member.labelName, uniqueKey: member.uniqueKey })
      setValue("teamMemberId", member._id)
      setValue("teamMemberName", member.labelName)
    }
  }

  const handleSelectAll = (select: boolean) => {
    setPermissions((prev) =>
      prev.map((permission) => ({
        ...permission,
        add: select,
        edit: select,
        view: select,
        delete: select,
        request: select,
      }))
    )
  }

  const handlePermissionChange = (moduleIndex: number, permissionType: keyof Omit<Permission, 'module'>) => {
    setPermissions((prev) => {
      const updated = [...prev]
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        [permissionType]: !updated[moduleIndex][permissionType],
      }
      return updated
    })
  }

  const onSubmit = async (data: RolePermissionFormValues) => {
    if (!accessToken) {
      toast.error("No access token found. Please login again.")
      return
    }

    // Check if at least one permission is selected
    const hasPermission = permissions.some((p) =>
      p.add || p.edit || p.view || p.delete || p.request
    )

    if (!hasPermission) {
      toast.error("Please select at least one permission")
      return
    }

    setIsLoading(true)
    try {
      const endpoint = isEditMode
        ? "/api/admin/role-permissions/put"
        : "/api/admin/role-permissions/post"
      const method = isEditMode ? "PUT" : "POST"

      const payload: any = {
        teamMemberId: data.teamMemberId,
        teamMemberName: data.teamMemberName,
        teamMemberUniqueKey: selectedTeamMember?.uniqueKey || "",
        permissions,
      }

      if (isEditMode && editData) {
        payload.id = editData._id
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? "update" : "create"} role permission`)
      }

      toast.success(
        `Role permission ${isEditMode ? "updated" : "created"} successfully!`
      )
      mutate() // Refresh the list
      reset()
      setSelectedTeamMember(null)
      const initialPermissions: Permission[] = WORK_MODULES.map((module) => ({
        module,
        add: false,
        edit: false,
        view: false,
        delete: false,
        bulk: false,
        request: false,
      }))
      setPermissions(initialPermissions)
      if (isEditMode) {
        onCancelEdit()
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    setSelectedTeamMember(null)
    const initialPermissions: Permission[] = WORK_MODULES.map((module) => ({
      module,
      add: false,
      edit: false,
      view: false,
      delete: false,
      bulk: false,
      request: false,
    }))
    setPermissions(initialPermissions)
    if (isEditMode) {
      onCancelEdit()
    }
  }

  return (
    <div className="flex-1 bg-card text-card-foreground rounded-lg border p-6 h-[700px]">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldSet>
          <FieldLegend>
            {isEditMode ? "Edit" : "Create"} Role Permission
          </FieldLegend>

          {/* Team Member Select */}
          <FieldGroup>
            <Field>
              <FieldLabel>Team Member *</FieldLabel>
              <Select
                value={selectedTeamMember?.id || ""}
                onValueChange={handleTeamMemberSelect}
                disabled={teamLoading || isEditMode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Team Member" />
                </SelectTrigger>
                <SelectContent>
                  {teamAuthorities.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No team members available
                    </div>
                  ) : (
                    teamAuthorities.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.labelName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("teamMemberId")} />
              <input type="hidden" {...register("teamMemberName")} />
              {errors.teamMemberId && (
                <FieldDescription className="text-destructive">
                  {errors.teamMemberId.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          {/* Permissions */}
          <FieldGroup>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Work Permissions</FieldLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(false)}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-6 bg-muted font-medium text-sm">
                <div className="p-3 border-r">Module</div>
                {PERMISSION_TYPES.map((type) => (
                  <div key={type} className="p-3 border-r last:border-r-0 text-center">
                    {type}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {permissions.map((permission, moduleIndex) => (
                <div
                  key={permission.module}
                  className="grid grid-cols-6 border-t hover:bg-muted/50"
                >
                  <div className="p-3 border-r font-medium">{permission.module}</div>
                  {PERMISSION_TYPES.map((type) => {
                    const key = type.toLowerCase() as keyof Omit<Permission, 'module'>
                    return (
                      <div key={type} className="p-3 border-r last:border-r-0 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={permission[key]}
                          onChange={() => handlePermissionChange(moduleIndex, key)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </FieldGroup>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <LoaderWithText text={isEditMode ? "Updating..." : "Creating..."} />
              ) : isEditMode ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </FieldSet>
      </form>
    </div>
  )
}

export default ComponentsRolePermissionForm
