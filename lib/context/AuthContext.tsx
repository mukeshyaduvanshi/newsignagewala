"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  SignupData,
  AuthContextType,
  AuthProviderProps,
} from "@/types/auth.types";
import BrandSelectionModal from "@/components/auth/brand-selection-modal";
import { useAppDispatch } from "@/lib/redux/hooks";
import {
  setAuthData,
  clearAuth,
  updateManagerData,
} from "@/lib/redux/features/auth-slice";
import { clearCart } from "@/lib/redux/features/cart-slice";
import { RESET_STORE } from "@/lib/redux/store";

// Re-export types for backward compatibility
export type { User };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);
  const [showBrandSelection, setShowBrandSelection] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const success = await refreshToken();
      if (!success) {
        // No valid session found
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    emailOrPhone: string,
    password: string,
  ): Promise<void> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Check if brand selection is required (manager with multiple brands)
      if (
        data.requiresBrandSelection &&
        data.brands &&
        data.brands.length > 1
      ) {
        setBrands(data.brands);
        setAccessToken(data.accessToken);
        setPendingLoginData(data);
        setShowBrandSelection(true);
        return;
      }

      // Set auth state
      setAccessToken(data.accessToken);
      setUser(data.user);

      // Dispatch to Redux store
      const authPayload: any = {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          userType: data.user.userType,
          isEmailVerified: data.user.isEmailVerified,
          isPhoneVerified: data.user.isPhoneVerified,
          isBusinessInformation: data.user.isBusinessInformation,
          isBusinessKyc: data.user.isBusinessKyc,
          adminApproval: data.user.adminApproval,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
        },
        accessToken: data.accessToken,
      };

      // Add business details if available
      if (data.user.companyLogo || data.user.companyName) {
        authPayload.businessDetails = {
          companyName: data.user.companyName,
          companyLogo: data.user.companyLogo,
        };
      }

      // Add manager data if user is a manager with single brand
      if (data.user.userType === "manager" && data.user.parentId) {
        authPayload.managerData = {
          parentId: data.user.parentId,
          uniqueKey: data.user.uniqueKey,
          userId: data.user.id,
          teamMemberId: data.user.teamMemberId,
          managerType: data.user.managerType,
          teamMemberName: data.user.teamMemberName,
          teamMemberEmail: data.user.teamMemberEmail,
          teamMemberPhone: data.user.teamMemberPhone,
          selectedBrandId: data.user.selectedBrandId || data.user.parentId,
        };
      }

      dispatch(setAuthData(authPayload));

      toast.success("Login successful!");

      // Admin users skip business details
      if (data.user.userType === "admin") {
        router.push("/admin");
        return;
      }

      // Manager with single brand (data already set up in login API)
      if (data.user.userType === "manager" && data.user.parentId) {
        // Store selected brand in localStorage for refresh
        if (typeof window !== "undefined") {
          localStorage.setItem("selectedBrandId", data.user.parentId);
        }
        router.push("/manager");
        return;
      }

      // Check business completion and route accordingly (only for brand/vendor)
      if (
        (data.user.userType === "brand" || data.user.userType === "vendor") &&
        (!data.user.isBusinessInformation || !data.user.isBusinessKyc)
      ) {
        router.push("/businessDetails");
      } else {
        // Route based on userType
        const redirectPath =
          data.user.userType === "brand" ? "/brand" : "/vendor";
        router.push(redirectPath);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const handleBrandSelected = (selectedBrand: any) => {
    if (!pendingLoginData) return;

    // Update access token if provided (new token with parentId and uniqueKey)
    if (selectedBrand.accessToken) {
      setAccessToken(selectedBrand.accessToken);
    }

    // Update user data with selected brand information and TeamMember data
    const updatedUser = {
      ...pendingLoginData.user,
      companyLogo: selectedBrand.companyLogo,
      companyName: selectedBrand.brandName,
      selectedBrandId: selectedBrand.brandId,
      parentId: selectedBrand.brandId,
      managerType: selectedBrand.managerType,
      uniqueKey: selectedBrand.uniqueKey,
      // Override name, email, phone with TeamMember values (brand-specific)
      teamMemberName: selectedBrand.teamMemberName,
      teamMemberEmail: selectedBrand.teamMemberEmail,
      teamMemberPhone: selectedBrand.teamMemberPhone,
      adminApproval: true, // Manager always has approval if added by brand
    };

    setUser(updatedUser);
    setShowBrandSelection(false);
    setBrands([]);
    setPendingLoginData(null);

    // Store selected brand in localStorage for later use
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedBrandId", selectedBrand.brandId);
    }

    // Dispatch complete auth data to Redux including business details
    const authPayload: any = {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        userType: updatedUser.userType,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        isBusinessInformation: updatedUser.isBusinessInformation,
        isBusinessKyc: updatedUser.isBusinessKyc,
        adminApproval: updatedUser.adminApproval,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      businessDetails: {
        companyName: selectedBrand.brandName,
        companyLogo: selectedBrand.companyLogo,
      },
      managerData: {
        parentId: selectedBrand.brandId,
        uniqueKey: selectedBrand.uniqueKey,
        userId: updatedUser.id,
        teamMemberId: selectedBrand.teamMemberId,
        managerType: selectedBrand.managerType,
        teamMemberName: selectedBrand.teamMemberName,
        teamMemberEmail: selectedBrand.teamMemberEmail,
        teamMemberPhone: selectedBrand.teamMemberPhone,
        selectedBrandId: selectedBrand.brandId,
      },
      accessToken: selectedBrand.accessToken || accessToken,
    };

    dispatch(setAuthData(authPayload));

    toast.success("Login successful!");

    // Route to manager dashboard
    router.push("/manager");
  };

  const signup = async (data: SignupData): Promise<void> => {
    try {
      const response = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify(data),
      });

      const result = await response.json();
      // console.log(result);

      if (!response.ok) {
        throw new Error(result.message || "Signup failed");
      }

      // Set auth state
      setAccessToken(result.accessToken);
      setUser(result.user);

      // Dispatch to Redux store
      const authPayload: any = {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          userType: result.user.userType,
          isEmailVerified: result.user.isEmailVerified,
          isPhoneVerified: result.user.isPhoneVerified,
          isBusinessInformation: result.user.isBusinessInformation,
          isBusinessKyc: result.user.isBusinessKyc,
          adminApproval: result.user.adminApproval,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
        accessToken: result.accessToken,
      };

      dispatch(setAuthData(authPayload));

      toast.success("Account created successfully!");

      // Admin users skip business details
      if (result.user.userType === "admin") {
        router.push("/admin");
        return;
      }

      // Check business completion and route accordingly (only for brand/vendor)
      if (
        (result.user.userType === "brand" ||
          result.user.userType === "vendor") &&
        (!result.user.isBusinessInformation || !result.user.isBusinessKyc)
      ) {
        router.push("/businessDetails");
      } else {
        // Route based on userType
        let redirectPath = "/";
        switch (result.user.userType) {
          case "brand":
            redirectPath = "/brand";
            break;
          case "vendor":
            redirectPath = "/vendor";
            break;
          case "manager":
            redirectPath = "/manager";
            break;
          case "admin":
            redirectPath = "/admin";
            break;
          default:
            redirectPath = "/";
        }
        router.push(redirectPath);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Signup failed");
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state regardless of API call success
      setUser(null);
      setAccessToken(null);

      // Clear ALL Redux state to prevent data leakage between users
      dispatch({ type: RESET_STORE }); // Global store reset (safest approach)
      dispatch(clearAuth()); // Clear authentication data
      dispatch(clearCart()); // Clear cart items

      // Clear all localStorage data
      if (typeof window !== "undefined") {
        localStorage.removeItem("selectedBrandId");
        // Clear any other user-specific localStorage items
        localStorage.removeItem("cartTimestamp");
      }

      toast.success("Logged out successfully");
      router.push("/auth/login");
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log("[AUTH CONTEXT] Starting token refresh...");

      // Build headers with current access token if available (for manager context)
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
        console.log("[AUTH CONTEXT] Sending Authorization header");
      } else {
        console.log("[AUTH CONTEXT] No access token available");
      }

      // For managers with multiple brands, include selected brand from localStorage
      const selectedBrandId =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedBrandId")
          : null;
      // console.log(
      //   "[AUTH CONTEXT] selectedBrandId from localStorage:",
      //   selectedBrandId,
      // );

      const url = selectedBrandId
        ? `/api/auth/refresh?selectedBrandId=${selectedBrandId}`
        : "/api/auth/refresh";
      // console.log("[AUTH CONTEXT] Request URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers,
        credentials: "include", // Include cookies
      });

      // console.log("[AUTH CONTEXT] Response status:", response.status);

      // if (!response.ok) {
      //   console.log(
      //     "[AUTH CONTEXT] Refresh failed with status:",
      //     response.status,
      //   );
      //   return false;
      // }

      const data = await response.json();

      // console.log("[AUTH CONTEXT] Refresh successful");
      // console.log("[AUTH CONTEXT] User type:", data.user?.userType);
      // console.log("[AUTH CONTEXT] Has parentId:", !!data.user?.parentId);
      // console.log("[AUTH CONTEXT] Has uniqueKey:", !!data.user?.uniqueKey);

      setAccessToken(data.accessToken);
      setUser(data.user);

      // Dispatch to Redux store
      const authPayload: any = {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          userType: data.user.userType,
          // isEmailVerified: data.user.isEmailVerified,
          // isPhoneVerified: data.user.isPhoneVerified,
          // isBusinessInformation: data.user.isBusinessInformation,
          // isBusinessKyc: data.user.isBusinessKyc,
          // adminApproval: data.user.adminApproval,
          // createdAt: data.user.createdAt,
          // updatedAt: data.user.updatedAt,
        },
        // accessToken: data.accessToken,
      };

      // Add business details if available
      if (data.user.companyLogo || data.user.companyName) {
        authPayload.businessDetails = {
          companyName: data.user.companyName,
          companyLogo: data.user.companyLogo,
        };
      }

      // Add manager data if user is a manager
      if (data.user.userType === "manager" && data.user.parentId) {
        authPayload.managerData = {
          parentId: data.user.parentId,
          uniqueKey: data.user.uniqueKey,
          userId: data.user.id,
          managerType: data.user.managerType,
          teamMemberName: data.user.teamMemberName,
          teamMemberEmail: data.user.teamMemberEmail,
          teamMemberPhone: data.user.teamMemberPhone,
          selectedBrandId: data.user.selectedBrandId || data.user.parentId,
        };
      }

      dispatch(setAuthData(authPayload));

      return true;
    } catch (error) {
      console.error("[AUTH CONTEXT] Token refresh failed:", error);
      return false;
    }
  };

  // Update auth data directly (for account switching)
  const updateAuthData = (newAccessToken: string, userData: any) => {
    console.log("[AUTH CONTEXT] Updating auth data for account switch...");

    // Update state
    setAccessToken(newAccessToken);

    // Build updated user object with all required fields
    const updatedUser: User = {
      id: userData.userId,
      name: userData.name,
      email: userData.email,
      phone: userData.teamMemberPhone,
      userType: userData.userType,
      isEmailVerified: true, // Already authenticated
      isPhoneVerified: true, // Already authenticated
      adminApproval: userData.adminApproval,
      parentId: userData.parentId,
      uniqueKey: userData.uniqueKey,
      teamMemberName: userData.teamMemberName,
      teamMemberEmail: userData.teamMemberEmail,
      teamMemberPhone: userData.teamMemberPhone,
      managerType: userData.managerType,
      companyLogo: userData.companyLogo,
      companyName: userData.name,
      selectedBrandId: userData.parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(updatedUser);

    // Update localStorage with selected brand
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedBrandId", userData.parentId);
    }

    // Dispatch to Redux
    const authPayload: any = {
      user: {
        id: userData.userId,
        name: userData.name,
        email: userData.email,
        phone: userData.teamMemberPhone,
        userType: userData.userType,
        adminApproval: userData.adminApproval,
      },
      businessDetails: {
        companyName: userData.name,
        companyLogo: userData.companyLogo,
      },
      managerData: {
        parentId: userData.parentId,
        uniqueKey: userData.uniqueKey,
        userId: userData.userId,
        managerType: userData.managerType,
        teamMemberName: userData.teamMemberName,
        teamMemberEmail: userData.teamMemberEmail,
        teamMemberPhone: userData.teamMemberPhone,
        selectedBrandId: userData.parentId,
      },
      accessToken: newAccessToken,
    };

    dispatch(setAuthData(authPayload));

    console.log("[AUTH CONTEXT] Auth data updated successfully");
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
    updateAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <BrandSelectionModal
        open={showBrandSelection}
        brands={brands}
        accessToken={accessToken || ""}
        onBrandSelected={handleBrandSelected}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Custom hook for protected routes
export function useProtectedRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}

// Custom hook for guest routes (login/signup pages)
export function useGuestRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  //   useEffect(() => {
  //     if (!isLoading && user) {
  //       router.push('/home');
  //     }
  //   }, [user, isLoading, router]);

  return { user, isLoading };
}
