"use client"

import ComponentsUserRolesForm from '@/components/(user)/vendor/user-roles/components-user-roles-form'
import ComponentsUserRolesList from '@/components/(user)/vendor/user-roles/components-user-roles-list'
import React, { useState } from 'react'
import { UserRoleEditData } from '@/types/user-roles.types'

const page = () => {
  const [editData, setEditData] = useState<UserRoleEditData | null>(null)

  const handleEdit = (data: UserRoleEditData) => {
    setEditData(data)
  }

  const handleCancelEdit = () => {
    setEditData(null)
  }

  return (
    <div className='m-4 flex flex-col sm:flex-row gap-4'>
      <ComponentsUserRolesForm editData={editData} onCancelEdit={handleCancelEdit} />
      <ComponentsUserRolesList onEdit={handleEdit} />
    </div>
  )
}

export default page