import React from "react";
import ComponentsManagers from "@/components/(user)/admin/users/components-managers";

const ManagersPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mx-6 mt-2">Managers Management</h1>
        <p className="text-muted-foreground mt-2 mx-6">
          Manage manager users
        </p>
      </div>
      <ComponentsManagers />
    </div>
  );
};

export default ManagersPage;
