"use client";

import React, { useRef, Suspense } from "react";
import AssignManagersForm from "@/components/(user)/admin/users/assign-managers-form";
import AssignedManagersList from "@/components/(user)/admin/users/assigned-managers-list";
import { Loader2 } from "lucide-react";

const AssignManagersContent = () => {
  const listRef = useRef<{ refreshList: () => void }>(null);

  const handleAssignmentSuccess = () => {
    // Refresh the list when assignment is successful
    if (listRef.current) {
      listRef.current.refreshList();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Assign Managers</h1>
        <p className="text-muted-foreground mt-2">
          Assign managers to brands and view your assignments
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Form */}
        <div>
          <AssignManagersForm onAssignmentSuccess={handleAssignmentSuccess} />
        </div>
        {/* Right side - List */}
        <div>
          <AssignedManagersList ref={listRef} />
        </div>
      </div>
    </div>
  );
};

const AssignManagersPage = () => {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AssignManagersContent />
    </Suspense>
  );
};

export default AssignManagersPage;
