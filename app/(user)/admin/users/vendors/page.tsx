import React from "react";
import ComponentsVendors from "@/components/(user)/admin/users/components-vendors";

const VendorsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mx-6 mt-2">Vendors Management</h1>
        <p className="text-muted-foreground mt-2 mx-6">
          Manage and verify vendor users
        </p>
      </div>
      <ComponentsVendors />
    </div>
  );
};

export default VendorsPage;
