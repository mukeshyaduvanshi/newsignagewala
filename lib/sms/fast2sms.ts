// Send OTP via Fast2SMS
export async function sendSMSOTP(phone: string, otp: string) {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      throw new Error("Fast2SMS API key not configured");
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        sender_id: "TXTIND",
        message: `Your OTP for Signagewala verification is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
        variables_values: otp,
        flash: 0,
        numbers: phone,
      }),
    });

    const result = await response.json();

    if (result.return === true) {
      // console.log("SMS OTP sent successfully:", result);
      return { success: true, messageId: result.request_id };
    } else {
      console.error("SMS OTP failed:", result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Error sending SMS OTP:", error);
    return { success: false, error };
  }
}
