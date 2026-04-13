# Forgot Password Flow Documentation

## Overview
Complete forgot password implementation with OTP verification using Fast2SMS for phone and email templates for email. The flow ensures that only verified users can reset their password.

## Features
- ✅ Support for both email and phone number
- ✅ OTP sent via email (using email template) or SMS (using Fast2SMS)
- ✅ Only verified users can reset password
- ✅ OTP expires in 10 minutes
- ✅ Reset token expires in 15 minutes
- ✅ Modal-based UI for OTP verification and password reset
- ✅ Password strength validation
- ✅ Secure token-based flow

## Flow Steps

### 1. Request Password Reset
**File**: `components/auth/forgot-password-form.tsx`
- User enters email or phone number
- System validates format
- API checks if user exists in database
- API checks if user is verified (either email or phone)
- Generates 6-digit OTP
- Sends OTP via email or SMS based on input type
- Opens OTP verification modal

**API**: `/api/auth/forgot-password`
- Method: `POST`
- Body: `{ emailOrPhone: string }`
- Response: `{ message, type: "email" | "phone", identifier }`

### 2. Verify OTP
**File**: `components/auth/verify-otp-modal.tsx`
- User enters 6-digit OTP
- System verifies OTP against database
- Checks if OTP is expired (10 minutes validity)
- Generates reset token (valid for 15 minutes)
- Clears OTP from database
- Opens password reset modal

**API**: `/api/auth/verify-reset-otp`
- Method: `POST`
- Body: `{ emailOrPhone: string, otp: string }`
- Response: `{ message, resetToken, userId }`

### 3. Reset Password
**File**: `components/auth/reset-password-modal.tsx`
- User enters new password and confirms it
- System validates password strength:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one special character
- Hashes new password
- Updates user password in database
- Clears all reset tokens
- Redirects to login page

**API**: `/api/auth/reset-password`
- Method: `POST`
- Body: `{ resetToken: string, password: string }`
- Response: `{ message }`

## Database Schema Updates

### User Model Fields Added
```typescript
resetPasswordOTP?: string;          // 6-digit OTP
resetPasswordOTPExpiry?: Date;      // OTP expiry (10 minutes)
resetPasswordToken?: string;        // Reset token after OTP verification
resetPasswordTokenExpiry?: Date;    // Token expiry (15 minutes)
```

All fields are marked with `select: false` for security.

## Email Template

### Password Reset OTP Email
**File**: `lib/email/templates.ts`
- Function: `sendPasswordResetOTP()`
- Gradient header with pink/red colors
- Prominent OTP display in styled box
- 10-minute expiry warning
- Security warning if not requested

## SMS Integration

### Fast2SMS Configuration
**File**: `lib/sms/fast2sms.ts`
- Uses existing `sendSMSOTP()` function
- Sends OTP to 10-digit phone numbers
- Message: "Your OTP for Signagewala password reset is {OTP}. Valid for 10 minutes."

## Security Features

1. **OTP Expiry**: 10 minutes validity
2. **Token Expiry**: 15 minutes validity after OTP verification
3. **One-time Use**: OTP cleared after successful verification
4. **Token Cleared**: All reset tokens cleared after password change
5. **Password Validation**: Strong password requirements enforced
6. **Verified Users Only**: Only users with verified email or phone can reset password

## Usage

### 1. Navigate to Forgot Password
```
/auth/forgot-password
```

### 2. Enter Email or Phone
- Email: `user@example.com`
- Phone: `9876543210` (10 digits)

### 3. Verify OTP
- Enter 6-digit OTP received via email or SMS
- OTP valid for 10 minutes

### 4. Set New Password
- Enter new password (min 8 chars, 1 uppercase, 1 special char)
- Confirm password
- Submit to reset

### 5. Login with New Password
- Redirected to login page
- Login with new credentials

## Error Handling

### Common Errors
1. **User not found**: "No account found with this email or phone number"
2. **Unverified user**: "Please verify your account first"
3. **Invalid OTP**: "Invalid OTP"
4. **Expired OTP**: "OTP has expired. Please request a new one."
5. **Invalid token**: "Invalid or expired reset token"
6. **Password validation**: Specific error messages for each requirement

## Testing Checklist

- [ ] Request OTP with email
- [ ] Request OTP with phone number
- [ ] Verify OTP with correct code
- [ ] Verify OTP with incorrect code
- [ ] Verify OTP after expiry (wait 10 minutes)
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Reset password with weak password
- [ ] Reset password with mismatched confirmation
- [ ] Login with new password after reset
- [ ] Try to reset password for unverified user
- [ ] Try to reset password for non-existent user

## Environment Variables Required

```env
# Fast2SMS (for phone OTP)
FAST2SMS_API_KEY=your_api_key_here

# SMTP (for email OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_NAME=Signagewala
SMTP_FROM_EMAIL=your_email@gmail.com
```

## Files Created/Modified

### New Files
1. `components/auth/verify-otp-modal.tsx` - OTP verification modal
2. `components/auth/reset-password-modal.tsx` - Password reset modal
3. `app/api/auth/forgot-password/route.ts` - Send OTP API
4. `app/api/auth/verify-reset-otp/route.ts` - Verify OTP API
5. `app/api/auth/reset-password/route.ts` - Reset password API

### Modified Files
1. `components/auth/forgot-password-form.tsx` - Updated to use new flow
2. `lib/models/User.ts` - Added reset password fields
3. `lib/validations/auth.ts` - Added validation schemas
4. `lib/email/templates.ts` - Added password reset OTP template

### Installed Dependencies
1. `@shadcn/ui dialog` - For modal components

## Notes

- OTP is cleared from database after successful verification
- Reset token is single-use and cleared after password reset
- User is automatically redirected to login after successful password reset
- All sensitive fields (OTP, tokens) are excluded from default queries with `select: false`
- Password is hashed using bcrypt before storing
- Email and SMS sending happens asynchronously
