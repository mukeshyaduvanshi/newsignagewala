"use client";

import ComponentsStoreAuthorityForm from "@/components/(user)/brand/store-authority/components-store-authority-form";
import ComponentsStoreAuthorityList from "@/components/(user)/brand/store-authority/components-store-authority-list";
import { useState } from "react";
import { StoreAuthorityEditData } from "@/types/store-authority.types";

const page = () => {
  const [editData, setEditData] = useState<StoreAuthorityEditData | null>(null)

  const handleEdit = (data: StoreAuthorityEditData) => {
    setEditData(data)
  }

  const handleCancelEdit = () => {
    setEditData(null)
  }

  return (
    <div className="m-4 flex flex-col sm:flex-row gap-4">
      <ComponentsStoreAuthorityForm editData={editData} onCancelEdit={handleCancelEdit} />
      <ComponentsStoreAuthorityList onEdit={handleEdit} />
    </div>
  );
};

export default page;
