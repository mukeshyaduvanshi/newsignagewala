"use client";
import React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useProfileIncompleteToast } from "@/hooks/use-profile-incomplete-toast";
import { PageLoader } from "@/components/ui/page-loader";

const ComponentsDashboard = () => {
  const { user, isLoading } = useAuth();

  // Reusable toast hook - ALWAYS call hooks at top level
  useProfileIncompleteToast(user);

  // Loading state - jab tak user data load nahi hua
  if (isLoading) {
    return <PageLoader message="Loading your profile..." />;
  }

  // No user after loading
  if (!user) {
    return <PageLoader message="Redirecting to login..." />;
  }

  return (
    <>
      <div>{(user as any)?.managerType}</div>
    </>
  );
};

export default ComponentsDashboard;
