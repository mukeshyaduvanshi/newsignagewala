import React from "react";
import UsersTable from "@/components/(user)/admin/users/components-users";
import ComponentsUsers from "@/components/(user)/admin/users/components-users";

const UsersPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mx-6 mt-2">Users Management</h1>
        <p className="text-muted-foreground mt-2 mx-6">
          Manage and approve brand and vendor users
        </p>
      </div>
      <ComponentsUsers />
    </div>
  );
};

export default UsersPage;