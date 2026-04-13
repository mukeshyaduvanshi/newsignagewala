# Setup Instructions

## Environment Variables Required

Add the following to your `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://signagewala:nitin1985@cluster0.x10j3jr.mongodb.net/signagewala

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mukeshyaduvanshi1508@gmail.com
SMTP_PASSWORD=uuqgtyqdesbdylqh
SMTP_FROM_NAME=Signagewala
SMTP_FROM_EMAIL=mukeshyaduvanshi1508@gmail.com

# Fast2SMS API
FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

## Getting Fast2SMS API Key

1. Visit: https://www.fast2sms.com/
2. Sign up for a free account
3. Go to Dashboard → API Keys
4. Copy your API key
5. Add it to `.env.local` as `FAST2SMS_API_KEY`

## Features Implemented

### Dual Verification System with Smart Loop
- **Email OTP**: Sent via Gmail SMTP using Nodemailer
- **Phone OTP**: Sent via Fast2SMS API
- **Smart Verification Loop**: System automatically detects which channel(s) need verification
  - If both unverified → Shows both tabs
  - If only email unverified → Shows only email tab
  - If only phone unverified → Shows only phone tab
- Users must verify both email and phone to complete registration

### Authentication Flow

#### Signup Flow:
1. User fills signup form with email, phone, name, password
2. System sends OTP to both email and phone
3. User redirected to verification page showing both Email and Phone tabs
4. User can verify in any order (email first or phone first)
5. After first verification, tab switches to remaining channel
6. Once both verified, welcome email sent and user redirected to home

#### Login with Unverified Account (Smart Loop):
1. User enters email/phone and password
2. System checks verification status:
   - **Both unverified**: Sends OTP to both channels, shows both tabs
   - **Email verified, phone not**: Sends only phone OTP, shows only phone tab
   - **Phone verified, email not**: Sends only email OTP, shows only email tab
   - **Both verified**: Login success, redirect to home
3. User completes only the pending verifications
4. After completing all verifications, user can login

#### Example Scenarios:
- **Scenario 1**: User signs up but closes browser before verifying anything
  - Next login → OTP sent to both email and phone → Must verify both
  
- **Scenario 2**: User signs up, verifies email but forgets phone
  - Next login → OTP sent only to phone → Only phone tab shown
  
- **Scenario 3**: User verifies phone but email server was down
  - Next login → OTP sent only to email → Only email tab shown
  
- **Scenario 4**: User verified both but tries to login again
  - Login success immediately, no OTP needed

### Database Schema

#### User Model:
```typescript
{
  name: string
  email: string (unique, indexed)
  phone: string (unique, indexed)
  password: string (hashed with bcrypt)
  userType: "admin" | "viewer"
  isEmailVerified: boolean
  isPhoneVerified: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### OTP Model:
```typescript
{
  identifier: string (email or phone)
  otp: string
  type: "email" | "phone"
  expiresAt: Date (TTL index - auto deletes after 10 minutes)
  verified: boolean
  createdAt: Date
}
```

### API Endpoints

1. **POST /api/auth/signup**
   - Registers user
   - Sends OTP to both email and phone
   - Returns: `{ success: true, message: "..." }`

2. **POST /api/auth/login**
   - Authenticates user
   - Checks verification status
   - If unverified, sends OTP and returns: `{ requiresVerification: true, email, phone }`
   - If verified, logs in user

3. **POST /api/auth/verify-otp**
   - Body: `{ identifier, otp, type }`
   - Verifies OTP for email or phone
   - Sends welcome email when both verified
   - Returns: `{ success: true, allVerified: boolean }`

4. **POST /api/auth/resend-otp**
   - Body: `{ identifier, type }`
   - Resends OTP via email or SMS
   - Returns: `{ success: true, message: "..." }`

### UI Components

#### Verify OTP Form
- **Tabs UI**: Switch between Email and Phone verification
- **InputOTP**: 6 separate boxes for digit entry
- **Verification Status**: Shows checkmark when verified
- **Resend OTP**: With 60-second countdown
- **Auto-redirect**: When both verifications complete

#### Login Form
- **Email or Phone**: Single input accepts both
- **Password Toggle**: Eye icon to show/hide
- **Error Display**: Shows validation and API errors
- **Auto-redirect**: To verification if unverified

#### Signup Form
- **Full Validation**: Name, email, phone, password
- **Password Rules**: 8+ chars, capital letter, special character
- **Phone Format**: 10-digit Indian numbers
- **Toast Notifications**: Success/error messages

## Testing the Flow

### Test Signup:
1. Go to `/auth/signup`
2. Fill form with valid data
3. Submit
4. Check email for OTP
5. Check phone for SMS OTP
6. Go to `/auth/verify-otp`
7. Verify email in Email tab
8. Verify phone in Phone tab
9. Check email for welcome message
10. Get redirected to home

### Test Login with Unverified Account:
1. Create account but don't verify
2. Go to `/auth/login`
3. Enter credentials
4. Get redirected to `/auth/verify-otp`
5. Complete pending verifications
6. Get logged in

## Important Notes

- OTPs expire after 10 minutes (MongoDB TTL index)
- Resend OTP has 60-second cooldown
- Welcome email only sent when BOTH email and phone verified
- User cannot login until both verifications complete
- Session storage used to pass email/phone to verification page
- Fast2SMS API key must be active and have SMS credits
