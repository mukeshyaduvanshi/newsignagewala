"use client"

import ComponentsMasterRateForm from '@/components/(user)/admin/rates/components-master-rate-form'
import ComponentsMasterRateList from '@/components/(user)/admin/rates/components-master-rate-list'
import ComponentsNewElementRequests from '@/components/(user)/admin/rates/components-new-element-requests'
import React, { useState } from 'react'
import { MasterRateEditData } from '@/types/master-rate.types'

const page = () => {
  const [editData, setEditData] = useState<MasterRateEditData | null>(null)

  const handleEdit = (data: MasterRateEditData) => {
    setEditData(data)
  }

  const handleCancelEdit = () => {
    setEditData(null)
  }

  return (
    // <div className='m-4 flex flex-col gap-4 border border-white'>
    //   <div className='flex flex-col sm:flex-row gap-4'>
    //     <ComponentsMasterRateForm editData={editData} onCancelEdit={handleCancelEdit} />
    //   </div>
    //   <div className='w-full flex flex-col gap-8'>
    //     <ComponentsMasterRateList onEdit={handleEdit} />
    //   <ComponentsNewElementRequests />
    //   </div>
    // </div>
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
  
  {/* LEFT PANEL — FIRST COMPONENT */}
  <div className="md:col-span-2">
    <ComponentsMasterRateForm 
      editData={editData} 
      onCancelEdit={handleCancelEdit} 
    />
  </div>

  {/* RIGHT PANEL — SECOND & THIRD STACKED */}
  <div className="flex flex-col gap-4">
    <ComponentsMasterRateList onEdit={handleEdit} />
    <ComponentsNewElementRequests />
  </div>

</div>


  )
}

export default page