"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";
import { CameraView } from "@/components/ui/camera-view";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Edit2,
  Mail,
  Phone,
  Building2,
  FileText,
  Shield,
  Check,
  X,
  User,
  Upload,
  Image as ImageIcon,
  User2,
  UserX,
  User2Icon,
  UserCircle,
  Eye,
  EyeOff,
  Lock,
  Camera,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { is } from "zod/v4/locales";

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    userType: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isBusinessInformation: boolean;
    isBusinessKyc: boolean;
    adminApproval: boolean;
  };
  businessDetails: {
    companyName: string;
    companyType: string;
    companyLogo?: string;
    companyProfile?: string;
  } | null;
  businessKyc: {
    hasGST: boolean;
    gstNumber?: string;
    aadharNumber?: string;
    cinNumber?: string;
    msmeNumber?: string;
  } | null;
}

export default function ProfilePage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isManager = user?.userType === "manager";
  const [activeTab, setActiveTab] = useState(isManager ? "personal" : "user");

  // Edit name dialog
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Change email dialog
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // Change phone dialog
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // Business info states
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyProfile, setCompanyProfile] = useState<File | null>(null);
  const [profileFileName, setProfileFileName] = useState("");
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);

  // KYC states
  const [hasGST, setHasGST] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [msmeNumber, setMsmeNumber] = useState("");
  const [isUpdatingKyc, setIsUpdatingKyc] = useState(false);

  // PDF viewer dialog
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isNewPdfPreview, setIsNewPdfPreview] = useState(false); // Track if it's a new file preview

  // Change password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Camera states
  const [showLogoCamera, setShowLogoCamera] = useState(false);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl && isNewPdfPreview) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl, isNewPdfPreview]);

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/profile/get", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch profile");
      }

      setProfileData(result.data);

      // Set business info if exists
      if (result.data.businessDetails) {
        setCompanyName(result.data.businessDetails.companyName || "");
        setCompanyType(result.data.businessDetails.companyType || "");
        if (result.data.businessDetails.companyLogo) {
          setLogoPreview(result.data.businessDetails.companyLogo);
        }
        if (result.data.businessDetails.companyProfile) {
          setProfileFileName("Company Profile.pdf");
        }
      }

      // Set KYC info if exists
      if (result.data.businessKyc) {
        setHasGST(result.data.businessKyc.hasGST || false);
        setGstNumber(result.data.businessKyc.gstNumber || "");
        setAadharNumber(result.data.businessKyc.aadharNumber || "");
        setCinNumber(result.data.businessKyc.cinNumber || "");
        setMsmeNumber(result.data.businessKyc.msmeNumber || "");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsUpdatingName(true);
    try {
      const response = await fetch("/api/profile/update-name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update name");
      }

      toast.success("Name updated successfully");
      setIsEditNameOpen(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }

      setCompanyLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoCameraCapture = (
    imageSrc: string,
    rectInfo?: {
      x: number;
      y: number;
      width: number;
      height: number;
      videoWidth: number;
      videoHeight: number;
      originalWidth: number;
      originalHeight: number;
    },
  ) => {
    // Create an image element to load the captured image
    const img = new Image();
    img.onload = () => {
      // Create canvas for cropping
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to process image");
        return;
      }

      if (rectInfo) {
        // Use the original image dimensions as the base
        const scaleX = img.width / rectInfo.videoWidth;
        const scaleY = img.height / rectInfo.videoHeight;

        // Calculate cropped dimensions in original image coordinates
        const cropX = Math.round(rectInfo.x * scaleX);
        const cropY = Math.round(rectInfo.y * scaleY);
        const cropWidth = Math.round(rectInfo.width * scaleX);
        const cropHeight = Math.round(rectInfo.height * scaleY);

        // Set canvas size to cropped dimensions
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw cropped portion of image
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight,
        );
      } else {
        // No rect info, use full image
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      }

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "logo-photo.jpg", {
              type: "image/jpeg",
            });
            const croppedImageSrc = canvas.toDataURL("image/jpeg");
            setCompanyLogo(file);
            setLogoPreview(croppedImageSrc);
            setShowLogoCamera(false);
            toast.success("Photo captured successfully");
          } else {
            toast.error("Failed to process image");
          }
        },
        "image/jpeg",
        0.95,
      );
    };

    img.onerror = () => {
      toast.error("Failed to load captured image");
    };

    img.src = imageSrc;
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("PDF size should be less than 5MB");
        return;
      }

      // Revoke previous blob URL if exists
      if (pdfUrl && isNewPdfPreview) {
        URL.revokeObjectURL(pdfUrl);
      }

      setCompanyProfile(file);
      setProfileFileName(file.name);

      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);
      setPdfUrl(blobUrl);
      setIsNewPdfPreview(true);
    }
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoPreview("");
  };

  const removeProfile = () => {
    // Revoke blob URL if exists
    if (pdfUrl && isNewPdfPreview) {
      URL.revokeObjectURL(pdfUrl);
    }

    setCompanyProfile(null);
    setProfileFileName("");
    setPdfUrl("");
    setIsNewPdfPreview(false);
  };

  //function to save business information for Brand or Vendor
  const handleUpdateBusiness = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter company name");
      return;
    }
    if (!companyType) {
      toast.error("Please select company type");
      return;
    }

    setIsUpdatingBusiness(true);
    try {
      const formData = new FormData();
      formData.append("companyName", companyName);
      formData.append("companyType", companyType);

      if (companyLogo) {
        formData.append("companyLogo", companyLogo);
      }

      if (companyProfile) {
        formData.append("companyProfile", companyProfile);
      }

      const response = await fetch("/api/business/information", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update business information",
        );
      }

      toast.success("Business information updated successfully");
      fetchProfile();

      // Clear the newly selected file states after successful upload
      setCompanyLogo(null);
      setCompanyProfile(null);

      // Revoke blob URL if it was a preview
      if (pdfUrl && isNewPdfPreview) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
        setIsNewPdfPreview(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update business information");
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  //function to save personal information for Manager
  const handleUpdatePersonalProfile = async () => {
    setIsUpdatingBusiness(true);
    try {
      const formData = new FormData();
      formData.append("userName", profileData?.user.name || "");

      if (companyLogo) {
        formData.append("companyLogo", companyLogo);
      }

      if (companyProfile) {
        formData.append("companyProfile", companyProfile);
      }
      if (aadharNumber) {
        formData.append("aadharNumber", aadharNumber);
      }

      const response = await fetch("/api/personal/information", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update personal information",
        );
      }

      toast.success("Personal information updated successfully");
      fetchProfile();

      // Clear the newly selected file states after successful upload
      setCompanyLogo(null);
      setCompanyProfile(null);

      // Revoke blob URL if it was a preview
      if (pdfUrl && isNewPdfPreview) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
        setIsNewPdfPreview(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update Personal information");
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  const handleUpdateKyc = async () => {
    setIsUpdatingKyc(true);
    try {
      const response = await fetch("/api/business/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          hasGST,
          gstNumber: hasGST ? gstNumber : undefined,
          aadharNumber,
          cinNumber,
          msmeNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update KYC information");
      }

      toast.success("KYC information updated successfully");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update KYC information");
    } finally {
      setIsUpdatingKyc(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }

    setIsSendingEmailOtp(true);
    try {
      const response = await fetch("/api/profile/change-email/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send OTP");
      }

      toast.success("OTP sent to your new email");
      setIsEmailOtpSent(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp.trim()) {
      toast.error("Please enter OTP");
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const response = await fetch("/api/profile/change-email/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newEmail, otp: emailOtp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify OTP");
      }

      toast.success("Email updated successfully");
      setIsChangeEmailOpen(false);
      setNewEmail("");
      setEmailOtp("");
      setIsEmailOtpSent(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!newPhone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setIsSendingPhoneOtp(true);
    try {
      const response = await fetch("/api/profile/change-phone/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newPhone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send OTP");
      }

      toast.success("OTP sent to your new phone number");
      setIsPhoneOtpSent(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp.trim()) {
      toast.error("Please enter OTP");
      return;
    }

    setIsVerifyingPhone(true);
    try {
      const response = await fetch("/api/profile/change-phone/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newPhone, otp: phoneOtp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify OTP");
      }

      toast.success("Phone number updated successfully");
      setIsChangePhoneOpen(false);
      setNewPhone("");
      setPhoneOtp("");
      setIsPhoneOtpSent(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword.trim()) {
      toast.error("Please enter old password");
      return;
    }
    if (!newPassword.trim()) {
      toast.error("Please enter new password");
      return;
    }
    if (!confirmPassword.trim()) {
      toast.error("Please confirm new password");
      return;
    }

    // Password strength validation
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[@$!%*?&]/.test(newPassword)) {
      toast.error(
        "Password must contain at least one special character (@$!%*?&)",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // adminApproval = true means user is approved and can only edit name, email (with OTP), phone (with OTP)
  // adminApproval = false means user can edit everything
  const isApproved = profileData?.user.adminApproval || false;

  if (authLoading || isLoading) {
    return <PageLoader message="Loading your profile..." />;
  }

  if (!user) {
    return <PageLoader message="Redirecting to login..." />;
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
            My Profile
          </h1>
          <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-base">
            Manage your account and {isManager ? "personal" : "business"}{" "}
            information
          </p>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {isApproved && (
            <Badge
              variant="default"
              className="bg-green-600 text-white px-2 sm:px-4 py-1 sm:py-2 text-xs"
            >
              <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
              <span className="hidden sm:inline">Admin Approved</span>
              <span className="sm:hidden">Approved</span>
            </Badge>
          )}
          {isManager && (
            <Badge
              variant="default"
              className="bg-green-600 text-white px-2 sm:px-4 py-1 sm:py-2 text-xs"
            >
              <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
              <span className="hidden sm:inline">Approved Manager</span>
              <span className="sm:hidden">Manager</span>
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className={`grid w-full ${
            isManager ? "grid-cols-2" : "grid-cols-3"
          } h-auto p-1`}
        >
          <TabsTrigger
            value="user"
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm"
          >
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">User Details</span>
            <span className="sm:hidden">User</span>
          </TabsTrigger>
          <TabsTrigger
            value={isManager ? "personal" : "business"}
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm"
          >
            {isManager ? (
              <UserCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">
              {isManager ? "Personal" : "Business"} Details
            </span>
            <span className="sm:hidden">
              {isManager ? "Personal" : "Business"}
            </span>
          </TabsTrigger>
          {!isManager && (
            <TabsTrigger
              value="kyc"
              className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">KYC Details</span>
              <span className="sm:hidden">KYC</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* User Details Tab */}
        <TabsContent
          value="user"
          className="space-y-3 sm:space-y-4 mt-3 sm:mt-6"
        >
          <Card className="border-2">
            <CardHeader className="bg-muted/50 py-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your account credentials and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-semibold">
                    Full Name
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={profileData.user.name}
                      disabled
                      className="bg-muted/30 text-sm h-9"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setNewName(profileData.user.name);
                        setIsEditNameOpen(true);
                      }}
                      className="shrink-0 h-9 w-9"
                    >
                      <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can change your name anytime
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-semibold">
                    Account Type
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={profileData.user.userType.toUpperCase()}
                      disabled
                      className="bg-muted/30 flex-1 text-sm h-9"
                    />
                    {/* <Badge variant="secondary" className="shrink-0 px-3 py-1">
                      {profileData.user.userType}
                    </Badge> */}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    Email Address
                  </Label>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Input
                      value={profileData.user.email}
                      disabled
                      className="bg-muted/30 flex-1 min-w-[140px] sm:min-w-[200px] text-sm h-9"
                    />
                    {profileData.user.isEmailVerified ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 shrink-0 text-xs py-0.5 px-2"
                      >
                        <Check className="h-3 w-3 mr-0.5" />{" "}
                        <span className="hidden sm:inline">Verified</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="shrink-0 text-xs py-0.5 px-2"
                      >
                        <X className="h-3 w-3 mr-0.5" />{" "}
                        <span className="hidden sm:inline">Not Verified</span>
                      </Badge>
                    )}
                    <Button
                      disabled={isManager}
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangeEmailOpen(true)}
                      className={`shrink-0 h-9 text-xs sm:text-sm`}
                    >
                      <span className="hidden sm:inline">Change Email</span>
                      <span className="sm:hidden">Change</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isManager
                      ? "Contact admin to change your email"
                      : "You can change your email anytime with OTP verification"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    Phone Number
                  </Label>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Input
                      value={profileData.user.phone}
                      disabled
                      className="bg-muted/30 flex-1 min-w-[120px] sm:min-w-[200px] text-sm h-9"
                    />
                    {profileData.user.isPhoneVerified ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 shrink-0 text-xs py-0.5 px-2"
                      >
                        <Check className="h-3 w-3 mr-0.5" />{" "}
                        <span className="hidden sm:inline">Verified</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="shrink-0 text-xs py-0.5 px-2"
                      >
                        <X className="h-3 w-3 mr-0.5" />{" "}
                        <span className="hidden sm:inline">Not Verified</span>
                      </Badge>
                    )}
                    <Button
                      disabled={isManager}
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangePhoneOpen(true)}
                      className="shrink-0 h-9 text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Change Phone</span>
                      <span className="sm:hidden">Change</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isManager
                      ? "Contact admin to change your phone number"
                      : "You can change your phone anytime with OTP verification"}
                  </p>
                </div>
              </div>

              {/* Change Password Section - Manager Only */}

              <div className="border-t pt-3 sm:pt-5 mt-3 sm:mt-5">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold">
                    Change Password
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Update your account password with a strong and secure password
                </p>

                <div className="space-y-3 w-full">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-semibold">
                      Old Password *
                    </Label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-semibold">
                      New Password *
                    </Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="h-9 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Min 8 chars, 1 uppercase, 1 special (@$!%*?&)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-semibold">
                      Confirm New Password *
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 space-y-1.5">
                    <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Password Requirements:
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5 ml-4 list-disc">
                      <li>At least 8 characters long</li>
                      <li>Contains at least one uppercase letter (A-Z)</li>
                      <li>Contains at least one special character (@$!%*?&)</li>
                    </ul>
                  </div>

                  <div className="pt-1.5">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="w-full h-10 text-sm sm:text-base sm:h-12"
                      size="lg"
                    >
                      {isChangingPassword && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Details Tab - Brand/Vendor Only */}
        {!isManager && (
          <TabsContent
            value="business"
            className="space-y-3 sm:space-y-4 mt-3 sm:mt-6"
          >
            <Card className="border-2">
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Complete your company profile and update anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Company Logo */}
                <div className="flex flex-col items-center gap-4 pb-4 border-b">
                  <Label className="text-sm font-semibold">Company Logo</Label>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="relative">
                    <div
                      className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 border-2 border-dashed rounded-2xl overflow-hidden bg-muted/50 cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      {logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLogo();
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 sm:p-1.5 hover:bg-red-600 shadow-md"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full gap-1 p-3 text-center">
                          <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Click to upload logo
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLogoCamera(true)}
                      className="absolute bottom-0 right-0 rounded-full shadow-md"
                      title="Capture with camera"
                    >
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    PNG, JPG up to 2MB
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Company Name *
                    </Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Company Type *
                    </Label>
                    <select
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select company type</option>
                      <option value="pvt_ltd">Private Limited</option>
                      <option value="public_ltd">Public Limited</option>
                      <option value="llp">Limited Liability Partnership</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietorship">
                        Sole Proprietorship
                      </option>
                      <option value="trust">Trust</option>
                      <option value="society">Society</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold">
                      Company Profile (PDF)
                    </Label>
                    {profileFileName && (
                      <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg bg-muted/30 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <span className="text-sm font-medium block">
                              {profileFileName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PDF Document
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {/* Show View PDF button for existing saved PDF */}
                          {profileData.businessDetails?.companyProfile &&
                            !companyProfile && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPdfUrl(
                                    profileData.businessDetails!
                                      .companyProfile!,
                                  );
                                  setIsNewPdfPreview(false);
                                  setIsPdfViewerOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View PDF
                              </Button>
                            )}
                          {/* Show Preview button for newly selected PDF */}
                          {companyProfile && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsPdfViewerOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Preview PDF
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={removeProfile}
                            className="text-red-500 hover:text-red-600 p-2"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      id="profile-upload"
                      accept="application/pdf"
                      onChange={handleProfileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12"
                      onClick={() =>
                        document.getElementById("profile-upload")?.click()
                      }
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {profileFileName
                        ? "Change Profile PDF"
                        : "Upload Profile PDF"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF up to 5MB
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleUpdateBusiness}
                    disabled={isUpdatingBusiness}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isUpdatingBusiness && (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    )}
                    Save Business Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Personal Details Tab - Manager Only */}
        {isManager && (
          <TabsContent
            value="personal"
            className="space-y-3 sm:space-y-4 mt-3 sm:mt-6"
          >
            <Card className="border-2">
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Complete your company profile and update anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-4 pb-4 border-b">
                  <Label className="text-sm font-semibold">Profile Photo</Label>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="relative">
                    <div
                      className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 border-2 border-dashed rounded-2xl overflow-hidden bg-muted/50 cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      {logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLogo();
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 sm:p-1.5 hover:bg-red-600 shadow-md"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full gap-1 p-3 text-center">
                          <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Click to Profile Photo
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLogoCamera(true)}
                      className="absolute bottom-0 right-0 rounded-full shadow-md"
                      title="Capture with camera"
                    >
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    PNG, JPG up to 2MB
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold">
                      Aadhar Number (Required)
                    </Label>
                    <Input
                      value={aadharNumber}
                      onChange={(e) =>
                        setAadharNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 12-digit Aadhar number"
                      maxLength={12}
                    />
                    <p className="text-xs text-muted-foreground">
                      12-digit identification number
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold">
                      Upload Adhar (PDF)
                    </Label>
                    {profileFileName && (
                      <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg bg-muted/30 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <span className="text-sm font-medium block">
                              {profileFileName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PDF Document
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {/* Show View PDF button for existing saved PDF */}
                          {profileData.businessDetails?.companyProfile &&
                            !companyProfile && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPdfUrl(
                                    profileData.businessDetails!
                                      .companyProfile!,
                                  );
                                  setIsNewPdfPreview(false);
                                  setIsPdfViewerOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View PDF
                              </Button>
                            )}
                          {/* Show Preview button for newly selected PDF */}
                          {companyProfile && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsPdfViewerOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Preview PDF
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={removeProfile}
                            className="text-red-500 hover:text-red-600 p-2"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      id="profile-upload"
                      accept="application/pdf"
                      onChange={handleProfileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12"
                      onClick={() =>
                        document.getElementById("profile-upload")?.click()
                      }
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {profileFileName
                        ? "Change Profile PDF"
                        : "Upload Profile PDF"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF up to 5MB
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleUpdatePersonalProfile}
                    disabled={isUpdatingBusiness}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isUpdatingBusiness && (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    )}
                    Save Personal Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* KYC Details Tab - Brand/Vendor Only */}
        {!isManager && (
          <TabsContent
            value="kyc"
            className="space-y-3 sm:space-y-4 mt-3 sm:mt-6"
          >
            <Card className="border-2">
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  KYC Information
                </CardTitle>
                <CardDescription>
                  {isApproved
                    ? "Your KYC details are approved (cannot be modified)"
                    : "Complete your business verification - editable until admin approval"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center gap-3 p-4 border-2 rounded-lg bg-muted/30">
                      <input
                        type="checkbox"
                        id="hasGST"
                        checked={hasGST}
                        onChange={(e) => setHasGST(e.target.checked)}
                        disabled={isApproved}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <Label
                        htmlFor="hasGST"
                        className="text-sm font-semibold cursor-pointer flex-1"
                      >
                        Do you have GST registration?
                      </Label>
                    </div>
                  </div>

                  {hasGST && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold">
                        GST Number *
                      </Label>
                      <Input
                        value={gstNumber}
                        onChange={(e) =>
                          setGstNumber(e.target.value.toUpperCase())
                        }
                        placeholder="Enter 15-character GST number"
                        disabled={isApproved}
                        maxLength={15}
                        className={isApproved ? "bg-muted/30" : ""}
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: 22AAAAA0000A1Z5
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Aadhar Number (Optional)
                    </Label>
                    <Input
                      value={aadharNumber}
                      onChange={(e) =>
                        setAadharNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 12-digit Aadhar number"
                      disabled={isApproved}
                      maxLength={12}
                      className={isApproved ? "bg-muted/30" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      12-digit identification number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      CIN Number (Optional)
                    </Label>
                    <Input
                      value={cinNumber}
                      onChange={(e) =>
                        setCinNumber(e.target.value.toUpperCase())
                      }
                      placeholder="Enter CIN number"
                      disabled={isApproved}
                      className={isApproved ? "bg-muted/30" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Corporate Identification Number
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold">
                      MSME Number (Optional)
                    </Label>
                    <Input
                      value={msmeNumber}
                      onChange={(e) =>
                        setMsmeNumber(e.target.value.toUpperCase())
                      }
                      placeholder="Enter MSME/Udyam registration number"
                      disabled={isApproved}
                      className={isApproved ? "bg-muted/30" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Micro, Small & Medium Enterprise registration
                    </p>
                  </div>
                </div>

                {!isApproved && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleUpdateKyc}
                      disabled={isUpdatingKyc}
                      className="w-full h-12 text-base"
                      size="lg"
                    >
                      {isUpdatingKyc && (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      )}
                      Save KYC Information
                    </Button>
                  </div>
                )}

                {isApproved && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Your KYC details are approved by admin and cannot be
                      modified.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Name Dialog */}
      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Update Your Name
            </DialogTitle>
            <DialogDescription>
              You can change your name anytime. Enter your new name below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newName" className="text-sm font-semibold">
                Full Name
              </Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your full name"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditNameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateName} disabled={isUpdatingName}>
              {isUpdatingName && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Email Dialog */}
      <Dialog open={isChangeEmailOpen} onOpenChange={setIsChangeEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Change Email Address
            </DialogTitle>
            <DialogDescription>
              {isEmailOtpSent
                ? "Enter the OTP sent to your new email address"
                : "Enter your new email and we'll send you a verification code"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail" className="text-sm font-semibold">
                New Email Address
              </Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                disabled={isEmailOtpSent}
                className="h-11"
              />
            </div>

            {isEmailOtpSent && (
              <div className="space-y-2">
                <Label htmlFor="emailOtp" className="text-sm font-semibold">
                  Verification Code
                </Label>
                <Input
                  id="emailOtp"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="h-11 text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Check your email inbox for the OTP
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsChangeEmailOpen(false);
                setNewEmail("");
                setEmailOtp("");
                setIsEmailOtpSent(false);
              }}
            >
              Cancel
            </Button>
            {!isEmailOtpSent ? (
              <Button onClick={handleSendEmailOtp} disabled={isSendingEmailOtp}>
                {isSendingEmailOtp && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Send OTP
              </Button>
            ) : (
              <Button
                onClick={handleVerifyEmailOtp}
                disabled={isVerifyingEmail}
              >
                {isVerifyingEmail && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Verify & Update
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Phone Dialog */}
      <Dialog open={isChangePhoneOpen} onOpenChange={setIsChangePhoneOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Change Phone Number
            </DialogTitle>
            <DialogDescription>
              {isPhoneOtpSent
                ? "Enter the OTP sent to your new phone number"
                : "Enter your new phone number and we'll send you a verification code"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPhone" className="text-sm font-semibold">
                New Phone Number
              </Label>
              <Input
                id="newPhone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                disabled={isPhoneOtpSent}
                className="h-11"
              />
            </div>

            {isPhoneOtpSent && (
              <div className="space-y-2">
                <Label htmlFor="phoneOtp" className="text-sm font-semibold">
                  Verification Code
                </Label>
                <Input
                  id="phoneOtp"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="h-11 text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Check your SMS for the OTP
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsChangePhoneOpen(false);
                setNewPhone("");
                setPhoneOtp("");
                setIsPhoneOtpSent(false);
              }}
            >
              Cancel
            </Button>
            {!isPhoneOtpSent ? (
              <Button onClick={handleSendPhoneOtp} disabled={isSendingPhoneOtp}>
                {isSendingPhoneOtp && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Send OTP
              </Button>
            ) : (
              <Button
                onClick={handleVerifyPhoneOtp}
                disabled={isVerifyingPhone}
              >
                {isVerifyingPhone && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Verify & Update
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfViewerOpen} onOpenChange={setIsPdfViewerOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-4xl h-[80vh] sm:h-[90vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Company Profile Document
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View your uploaded company profile PDF
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg border">
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                style={{ minHeight: "50vh" }}
                title="Company Profile PDF"
              />
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPdfViewerOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => window.open(pdfUrl, "_blank")}
              className="w-full sm:w-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Open in New Tab</span>
              <span className="sm:hidden">Open</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera View for Logo/Profile Photo */}
      {showLogoCamera && (
        <CameraView
          onCapture={handleLogoCameraCapture}
          onCancel={() => setShowLogoCamera(false)}
          width={800}
          height={800}
        />
      )}
    </div>
  );
}
