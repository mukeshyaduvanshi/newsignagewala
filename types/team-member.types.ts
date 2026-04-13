// Team Member types
export interface TeamMember {
  _id: string;
  parentId: string;
  uniqueKey: string;
  userId: string;
  managerType: string;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
  // Populated user data
  user?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    userType: string;
  };
}

export interface TeamMemberFormData {
  name: string;
  email: string;
  phone: string;
  managerType: string;
}

export interface TeamMemberUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive" | "deleted";
}

export interface TeamMemberListResponse {
  success: boolean;
  data: TeamMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TeamMemberApiResponse {
  success: boolean;
  message: string;
  data?: TeamMember;
}
