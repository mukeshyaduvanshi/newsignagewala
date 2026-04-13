// Authentication related types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: "brand" | "vendor" | "admin" | "manager";
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isBusinessInformation?: boolean; // Optional - only for brand/vendor
  companyLogo?: string;
  companyName?: string;
  isBusinessKyc?: boolean; // Optional - only for brand/vendor
  adminApproval?: boolean; // Optional - only for brand/vendor
  createdAt: string;
  updatedAt: string;
  // Manager-specific fields from TeamMember
  selectedBrandId?: string; // Brand they're working for
  teamMemberName?: string; // Name set by brand
  teamMemberEmail?: string; // Email set by brand
  teamMemberPhone?: string; // Phone set by brand
  managerType?: string; // Role in the brand
  uniqueKey?: string; // UniqueKey from TeamMember
  parentId?: string; // Parent brand ID
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: "brand" | "vendor" | "admin";
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateAuthData: (newAccessToken: string, userData: any) => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

// JWT Payload types
export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
  role?: string; // Alias for userType for backward compatibility
  parentId?: string; // For managers - brand they're working for
  uniqueKey?: string; // For managers - their role/uniqueKey
  teamMemberId?: string; // For managers - TeamMember document _id
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  userType: string;
  iat?: number;
  exp?: number;
}
