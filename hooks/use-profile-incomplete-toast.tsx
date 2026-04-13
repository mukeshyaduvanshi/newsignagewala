"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  isBusinessInformation?: boolean;
  isBusinessKyc?: boolean;
}

interface UseProfileIncompleteToastOptions {
  duration?: number;
  redirectPath?: string;
}

export function useProfileIncompleteToast(
  user: User | null | undefined,
  options: UseProfileIncompleteToastOptions = {}
) {
  const router = useRouter();
  const toastShownRef = useRef(false);
  const { duration = 10000, redirectPath = "/profile" } = options;

  useEffect(() => {
    if (
      user &&
      (!user.isBusinessInformation || !user.isBusinessKyc) &&
      !toastShownRef.current
    ) {
      toast.warning("Please Update Your Profile", {
        duration,
        style: {
          backgroundColor: "#f97316",
          color: "white",
          border: "1px solid #ea580c",
        },
        action: {
          label: "Now",
          onClick: () => {
            router.push(redirectPath);
          },
        },
        cancel: {
          label: "Later",
          onClick: () => {
            toast.dismiss();
          },
        },
      });

      toastShownRef.current = true;
    }

    if (user && user.isBusinessInformation && user.isBusinessKyc) {
      toastShownRef.current = false;
    }
  }, [user, router, duration, redirectPath]);
}
