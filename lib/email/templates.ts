import transporter from "./nodemailer";
import { SendOTPEmailParams, SendWelcomeEmailParams, SendPasswordResetOTPParams } from "@/types/email.types";

// OTP Email Template
export async function sendOTPEmail({ to, name, otp }: SendOTPEmailParams) {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: "Verify Your Email - OTP Code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          Hi <strong>${name}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          Thank you for signing up with Signagewala! To complete your registration, please verify your email address using the OTP code below:
                        </p>
                        
                        <!-- OTP Box -->
                        <table role="presentation" style="width: 100%; margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; display: inline-block;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                                <p style="margin: 0; font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #666666;">
                          This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
                        </p>
                        
                        <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #666666;">
                          If you didn't request this verification, please ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                          Best regards,<br>
                          <strong>Signagewala Team</strong>
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #999999;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hi ${name},\n\nThank you for signing up with Signagewala!\n\nYour OTP code is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nBest regards,\nSignagewala Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    // console.log("OTP email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error };
  }
}

// Welcome Email Template
export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams) {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: "Welcome to Signagewala! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Signagewala</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Welcome to Signagewala! 🎉</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px; font-size: 18px; line-height: 28px; color: #333333;">
                          Hi <strong>${name}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          Congratulations! Your email has been successfully verified, and your account is now active.
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          We're thrilled to have you join our community. Here's what you can do next:
                        </p>
                        
                        <!-- Features List -->
                        <table role="presentation" style="width: 100%; margin: 30px 0;">
                          <tr>
                            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                              <p style="margin: 0; font-size: 16px; color: #333333;">
                                ✨ <strong>Complete Your Profile</strong><br>
                                <span style="font-size: 14px; color: #666666;">Add more details to personalize your experience</span>
                              </p>
                            </td>
                          </tr>
                          <tr><td style="height: 10px;"></td></tr>
                          <tr>
                            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                              <p style="margin: 0; font-size: 16px; color: #333333;">
                                📊 <strong>Explore Dashboard</strong><br>
                                <span style="font-size: 14px; color: #666666;">Discover all the features and tools available</span>
                              </p>
                            </td>
                          </tr>
                          <tr><td style="height: 10px;"></td></tr>
                          <tr>
                            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                              <p style="margin: 0; font-size: 16px; color: #333333;">
                                🚀 <strong>Get Started</strong><br>
                                <span style="font-size: 14px; color: #666666;">Start using our platform right away</span>
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                                Go to Dashboard
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #666666;">
                          If you have any questions or need assistance, feel free to reach out to our support team.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                          Best regards,<br>
                          <strong>Signagewala Team</strong>
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #999999;">
                          © 2025 Signagewala. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hi ${name},\n\nWelcome to Signagewala!\n\nYour email has been successfully verified and your account is now active.\n\nWe're excited to have you on board!\n\nBest regards,\nSignagewala Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    // console.log("Welcome email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

// Manager Welcome Email Template
export async function sendManagerWelcomeEmail({
  to,
  name,
  password,
  managerType,
  loginUrl,
}: {
  to: string;
  name: string;
  password: string;
  managerType: string;
  loginUrl: string;
}) {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `Welcome to Signagewala - ${managerType} Account Created! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Signagewala</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Signagewala! 🎉</h1>
                        <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your ${managerType} account is ready</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          Hi <strong>${name}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          Congratulations! Your account has been successfully created on Signagewala. You have been assigned the role of <strong>${managerType}</strong>.
                        </p>
                        
                        <!-- Login Credentials Box -->
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #667eea;">
                          <h3 style="margin: 0 0 20px; font-size: 18px; color: #333333;">Your Login Credentials</h3>
                          
                          <table role="presentation" style="width: 100%;">
                            <tr>
                              <td style="padding: 8px 0;">
                                <p style="margin: 0; font-size: 14px; color: #666666;">Email:</p>
                                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #333333;">${to}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <p style="margin: 0; font-size: 14px; color: #666666;">Temporary Password:</p>
                                <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #667eea; letter-spacing: 2px;">${password}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <p style="margin: 0; font-size: 14px; color: #666666;">Role:</p>
                                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #333333;">${managerType}</p>
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <!-- Login Button -->
                        <table role="presentation" style="width: 100%; margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                Login to Your Account
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Security Notice -->
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                          <p style="margin: 0; font-size: 14px; line-height: 22px; color: #856404;">
                            <strong>🔒 Important Security Notice:</strong><br>
                            For security reasons, we recommend changing your password after your first login. You can do this from your account settings.
                          </p>
                        </div>
                        
                        <p style="margin: 20px 0 0; font-size: 14px; line-height: 22px; color: #666666;">
                          If you have any questions or need assistance, please don't hesitate to contact our support team.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                          Best regards,<br>
                          <strong>Signagewala Team</strong>
                        </p>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #999999;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                        <div style="margin-top: 15px;">
                          <a href="${loginUrl}" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 10px;">Login</a>
                          <span style="color: #dee2e6;">|</span>
                          <a href="${loginUrl.replace('/login', '/support')}" style="color: #667eea; text-decoration: none; font-size: 12px; margin: 0 10px;">Support</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hi ${name},

Congratulations! Your account has been successfully created on Signagewala.

Your Login Credentials:
- Email: ${to}
- Temporary Password: ${password}
- Role: ${managerType}

Login URL: ${loginUrl}

IMPORTANT: For security reasons, we recommend changing your password after your first login.

If you have any questions or need assistance, please contact our support team.

Best regards,
Signagewala Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending manager welcome email:", error);
    return { success: false, error };
  }
}

// Password Reset OTP Email Template
export async function sendPasswordResetOTP({ to, name, otp }: SendPasswordResetOTPParams) {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: "Reset Your Password - OTP Code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          Hi <strong>${name}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                          We received a request to reset your password. Use the OTP code below to proceed:
                        </p>
                        
                        <!-- OTP Box -->
                        <table role="presentation" style="width: 100%; margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <div style="background-color: #fff5f5; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; display: inline-block;">
                                <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                                <p style="margin: 0; font-size: 36px; font-weight: bold; color: #f5576c; letter-spacing: 8px;">${otp}</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #666666;">
                          This OTP will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
                        </p>
                        
                        <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #dc2626;">
                          ⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                          Best regards,<br>
                          <strong>Signagewala Team</strong>
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #999999;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hi ${name},\n\nWe received a request to reset your password.\n\nYour OTP code is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\nSignagewala Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    // console.log("Password reset OTP email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset OTP email:", error);
    return { success: false, error };
  }
}
