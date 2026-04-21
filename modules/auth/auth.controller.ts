import { loginService, signupService } from "./auth.service";
import { generateTokenPair } from "@/lib/auth/jwt";
import { serialize } from "cookie";

export interface loginData {
  emailOrPhone: string;
  password: string;
  companyLogo: string;
}

// signup controller
export async function signupController(data: any) {
  const user = await signupService(data);

  // generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    user._id.toString(),
    user.email,
    user.userType,
  );

  // store refresh token
  user.refreshTokens = [refreshToken];
  await user.save();

  const cookie = serialize("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return {
    status: 201,
    cookie,
    body: {
      success: true,
      message: "Account create successfully",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
      },
    },
  };
}

// login controller
export async function loginController(data: loginData) {
  const { emailOrPhone, password } = data;

  if (!emailOrPhone || !password) {
    throw new Error("Email/Phone and password are required");
  }

  const result = await loginService(emailOrPhone, password);

  // verification case
  if (result.requiresVerification) {
    return {
      status: 403,
      body: {
        success: false,
        requiresVerification: true,
      },
    };
  }

  const { user, businessDetails } = result;

  const tokens = generateTokenPair(
    user._id.toString(),
    user.email,
    user.userType,
  );

  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  const cookie = serialize("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  const businessDetail = Array.isArray(result.businessDetails)
    ? result.businessDetails[0]
    : result.businessDetails;

  const managerAssociations = result.managerAssociations || [];

  // Manager with multiple brands → require brand selection on frontend
  if (user.userType === "manager" && managerAssociations.length > 1) {
    const brands = managerAssociations.map((tm: any) => ({
      brandId: tm.parentId?._id?.toString() || tm.parentId?.toString(),
      brandName: tm.parentId?.name || "",
      teamMemberId: tm._id?.toString(),
      uniqueKey: tm.uniqueKey,
      managerType: tm.managerType,
      teamMemberName: tm.name,
      teamMemberEmail: tm.email,
      teamMemberPhone: tm.phone,
    }));

    return {
      status: 200,
      cookie,
      body: {
        success: true,
        message: "Brand selection required",
        accessToken: tokens.accessToken,
        requiresBrandSelection: true,
        brands,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          adminApproval: user.adminApproval,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isBusinessInformation: user.isBusinessInformation || false,
          isBusinessKyc: user.isBusinessKyc || false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    };
  }

  // Manager with single brand → auto-set parentId/uniqueKey
  let managerFields: any = {};
  if (user.userType === "manager" && managerAssociations.length === 1) {
    const tm: any = managerAssociations[0];
    managerFields = {
      parentId: tm.parentId?._id?.toString() || tm.parentId?.toString(),
      uniqueKey: tm.uniqueKey,
      teamMemberId: tm._id?.toString(),
      managerType: tm.managerType,
      teamMemberName: tm.name,
      teamMemberEmail: tm.email,
      teamMemberPhone: tm.phone,
    };
  }

  return {
    status: 200,
    cookie,
    body: {
      success: true,
      message: "Login successful",
      accessToken: tokens.accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        adminApproval: user.adminApproval,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isBusinessInformation: user.isBusinessInformation || false,
        isBusinessKyc: user.isBusinessKyc || false,
        companyName: businessDetail?.companyName || null,
        companyLogo: businessDetail?.companyLogo || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        ...managerFields,
      },
    },
  };
}
