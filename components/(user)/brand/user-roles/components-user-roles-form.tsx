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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { LoaderWithText } from "@/components/ui/Loader"
import { useAuth } from "@/lib/context/AuthContext"
import { useBrandUserRoles } from "@/lib/hooks/useBrandUserRoles"
import { UserRoleFormProps } from "@/types/user-roles.types"

const userRoleSchema = z.object({
  labelName: z.string().min(2, {
    message: "Label name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
})

type UserRoleFormValues = z.infer<typeof userRoleSchema>

const ComponentsUserRoleForm = ({ editData, onCancelEdit }: UserRoleFormProps) => {
  const { user, accessToken } = useAuth()
  const { mutate } = useBrandUserRoles()
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!editData

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserRoleFormValues>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      labelName: "",
      description: "",
    },
  })

  // Populate form when editData changes
  useEffect(() => {
    if (editData) {
      setValue("labelName", editData.labelName)
      setValue("description", editData.description)
    } else {
      reset()
    }
  }, [editData, setValue, reset])

  const onSubmit = async (data: UserRoleFormValues) => {
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
        // Update existing user role
        const response = await fetch("/api/brand/user-roles/put", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: editData._id,
            labelName: data.labelName,
            description: data.description,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to update user role")
        }

        toast.success("User role updated successfully!")
        reset()
        onCancelEdit()
        mutate()
      } else {
        // Create new user role
        const response = await fetch("/api/brand/user-roles/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            labelName: data.labelName,
            description: data.description,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to create user role")
        }

        toast.success("User role created successfully!")
        reset()
        mutate()
      }
    } catch (error: any) {
      toast.error(error.message || isEditMode ? "Failed to update user role" : "Failed to create user role")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="w-full sm:max-w-1/2 border p-6 rounded-lg shadow-md h-[550px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend className="font-bold">
                {isEditMode ? "Edit User Role" : "User Role"}
              </FieldLegend>
              <FieldDescription>
                {isEditMode 
                  ? "Update user role details and permissions."
                  : "Manage user roles and permissions for effective collaboration."
                }
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="label-name-for-authority">
                    Label Name for Authority
                  </FieldLabel>
                  <Input
                    id="label-name-for-authority"
                    placeholder="Regional Manager"
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
                  <FieldLabel htmlFor="description-for-authority">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="description-for-authority"
                    placeholder="Describe the authority role and its permissions..."
                    className="resize-none h-48"
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

export default ComponentsUserRoleForm