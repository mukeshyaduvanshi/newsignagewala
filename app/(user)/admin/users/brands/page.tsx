import React from "react";
import ComponentsBrands from "@/components/(user)/admin/users/components-brands";

const BrandsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mx-6 mt-2">Brands Management</h1>
        <p className="text-muted-foreground mt-2 mx-6">
          Manage and verify brand users
        </p>
      </div>
      <ComponentsBrands />
    </div>
  );
};

export default BrandsPage;
