"use client"

import { useState } from "react"
import ComponentsPurchaseAuthorityForm from "@/components/(user)/brand/purchase-authority/components-purchase-authority-form"
import ComponentsPurchaseAuthorityList from "@/components/(user)/brand/purchase-authority/components-purchase-authority-list"
import { PurchaseAuthority, PurchaseAuthorityFormData } from "@/types/purchase-authority.types"

const PurchaseAuthorityPage = () => {
  const [editData, setEditData] = useState<PurchaseAuthorityFormData | undefined>(undefined)

  const handleEdit = (authority: PurchaseAuthority) => {
    // Map PurchaseAuthority to PurchaseAuthorityFormData
    const formData: PurchaseAuthorityFormData = {
      _id: authority._id,
      poNumber: authority.poNumber,
      vendorId: authority.vendorId,
      issueDate: authority.issueDate,
      expiryDate: authority.expiryDate,
      amount: authority.amount,
    }
    setEditData(formData)
  }

  const handleCancelEdit = () => {
    setEditData(undefined)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Purchase Authority Management</h1>
        <p className="text-muted-foreground">Create and manage purchase order authorities for your vendors</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComponentsPurchaseAuthorityForm 
          editData={editData} 
          onCancelEdit={handleCancelEdit} 
        />
        <ComponentsPurchaseAuthorityList onEdit={handleEdit} />
      </div>
    </div>
  )
}

export default PurchaseAuthorityPage