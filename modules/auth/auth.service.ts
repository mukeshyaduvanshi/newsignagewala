import { sendOTPEmail } from "@/lib/email/templates";
import BusinessDetails from "@/lib/models/BusinessDetails";
import OTP from "@/lib/models/OTP";
import TeamMember from "@/lib/models/TeamMember";
import User from "@/lib/models/User";
import { sendSMSOTP } from "@/lib/sms/fast2sms";
import { createDefaultManagerRoles } from "@/lib/utils/create-default-roles";
import { generateOTP } from "@/lib/utils/otp";
import bcrypt from "bcryptjs";

// signup user
export async function signupService(data: any) {
  const {
    name,
    email,
    phone,
    password,
    confirmPassword,
    userType,
    isEmailVerified,
    isPhoneVerified,
  } = data;

  if (!name || !email || !phone || !password || !confirmPassword || !userType) {
    throw new Error("All fields are required");
  }

  if (password !== confirmPassword) {
    throw new Error("Password do not match");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    if (existingUser.email === email)
      throw new Error("Email already registered");
    if (existingUser.phone === phone)
      throw new Error("Phone already registered");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  //create user
  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    userType,
    isEmailVerified: isEmailVerified || false,
    isPhoneVerified: isPhoneVerified || false,
  });

  // create default roles (if brand)
  if (userType === "brand") {
    try {
      await createDefaultManagerRoles(user._id);
    } catch (error) {
      console.error("Role creation failed");
    }
  }
  return user;
}

// login user
export async function loginService(emailOrPhone: string, password: string) {
  // find user
  const isEmail = /\S+@\S+\.\S+/.test(emailOrPhone);

  const user = await User.findOne(
    isEmail ? { email: emailOrPhone } : { phone: emailOrPhone },
  ).select("+refreshTokens");
  if (!user) throw new Error("Invalid Email or Password");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("Invalid Password");

  // verification check
  if (!user.isEmailVerified || !user.isPhoneVerified) {
    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();

    await OTP.deleteMany({
      identifier: { $in: [user.email, user.phone] },
    });

    if (!user.isEmailVerified) {
      await OTP.create({
        identifier: user.email,
        otp: emailOTP,
        type: "email",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendOTPEmail({
        to: user.email,
        name: user.name,
        otp: emailOTP,
      });
    }

    if (!user.isPhoneVerified) {
      await OTP.create({
        identifier: user.phone,
        otp: phoneOTP,
        type: "phone",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendSMSOTP(user.phone, phoneOTP);
    }
    return {
      requiresVerification: true,
      user,
    };
  }

  const businessDetails = await BusinessDetails.find({
    parentId: user._id,
  });

  console.log({ businessDetails });

  const managerAssociations = await TeamMember.find({
    userId: user._id,
    status: "active",
  }).populate("parentId", "name email");

  return {
    user,
    businessDetails,
    managerAssociations,
  };
}
