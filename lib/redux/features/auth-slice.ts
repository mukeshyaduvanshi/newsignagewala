import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// User data from users collection
export interface UserData {
    id: string;
    name: string;
    email: string;
    phone: string;
    userType: "brand" | "vendor" | "admin" | "manager";
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isBusinessInformation?: boolean;
    isBusinessKyc?: boolean;
    adminApproval?: boolean;
    createdAt: string;
    updatedAt: string;
}

// Business details data
export interface BusinessData {
    companyName?: string;
    companyLogo?: string;
    companyType?: string;
    companyProfile?: string;
}

// Manager/TeamMember specific data
export interface ManagerData {
    parentId: string; // Brand ID the manager is working for
    uniqueKey: string; // regionalManager, zonalManager, storeManager
    userId: string; // Manager's user ID
    teamMemberId: string; // TeamMember document _id (for creativeManagerId matching)
    managerType: string; // Role name
    teamMemberName?: string;
    teamMemberEmail?: string;
    teamMemberPhone?: string;
    selectedBrandId?: string; // For managers working with multiple brands
}

export interface AuthState {
    user: UserData | null;
    businessDetails: BusinessData | null;
    managerData: ManagerData | null;
    accessToken: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    businessDetails: null,
    managerData: null,
    accessToken: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthData: (
            state,
            action: PayloadAction<{
                user: UserData;
                businessDetails?: BusinessData;
                managerData?: ManagerData;
                accessToken: string;
            }>
        ) => {
            state.user = action.payload.user;
            state.businessDetails = action.payload.businessDetails || null;
            state.managerData = action.payload.managerData || null;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
        },
        setUser: (state, action: PayloadAction<UserData>) => {
            state.user = action.payload;
        },
        setBusinessDetails: (state, action: PayloadAction<BusinessData>) => {
            state.businessDetails = action.payload;
        },
        setManagerData: (state, action: PayloadAction<ManagerData>) => {
            state.managerData = action.payload;
        },
        updateManagerData: (state, action: PayloadAction<Partial<ManagerData>>) => {
            if (state.managerData) {
                state.managerData = {
                    ...state.managerData,
                    ...action.payload,
                };
            } else {
                state.managerData = action.payload as ManagerData;
            }
        },
        setAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
        },
        clearAuth: (state) => {
            state.user = null;
            state.businessDetails = null;
            state.managerData = null;
            state.accessToken = null;
            state.isAuthenticated = false;
        },
    },
    extraReducers: (builder) => {
        // Listen to global RESET_STORE action for complete logout
        builder.addCase("RESET_STORE" as any, () => initialState);
    },
});

export const {
    setAuthData,
    setUser,
    setBusinessDetails,
    setManagerData,
    updateManagerData,
    setAccessToken,
    clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
