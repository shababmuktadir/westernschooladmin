// Check Balance
export const checkSmsBalance = async () => {
  try {
    const response = await fetch("/.netlify/functions/checkBalance");
    if (!response.ok) throw new Error("Failed to fetch balance");
    
    const data = await response.json();
    const balValue = (typeof data === 'object' && data !== null) ? (data.balance || 0) : data;
    
    const num = parseFloat(balValue);
    return !isNaN(num) ? num.toFixed(2) : "0.00";
  } catch (error) {
    console.error("Balance Check Error:", error);
    return "0.00";
  }
};

// Format Phone Number (Ensures 880 format for BD numbers)
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let cleanPhone = phone.replace(/[^0-9]/g, ""); // Remove non-numeric chars
  if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
    return `88${cleanPhone}`;
  }
  return cleanPhone;
};

// Send SMS
export const sendSMS = async (number, message) => {
  try {
    const formattedNumber = formatPhoneNumber(number);
    if (!formattedNumber || formattedNumber.length < 13) {
      return { success: false, error: "Invalid phone number format" };
    }

    const response = await fetch("/.netlify/functions/sendSms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: formattedNumber, message }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SMS Send Error:", error);
    return { success: false, error: "Network or server error" };
  }
};