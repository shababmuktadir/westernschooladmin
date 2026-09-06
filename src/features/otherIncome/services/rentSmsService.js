// Format Phone Number (Ensures 880 format for BD numbers)
const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let cleanPhone = phone.replace(/[^0-9]/g, ""); 
  if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
    return `88${cleanPhone}`;
  }
  return cleanPhone;
};

// Send Rent SMS via BulkSMSBD API (Isolated for Room Rent)
export const sendRentSMS = async (number, message) => {
  try {
    const formattedNumber = formatPhoneNumber(number);
    if (!formattedNumber || formattedNumber.length < 13) {
      return { success: false, error: "Invalid phone number format" };
    }

    const apiKey = "ASNQVx1KE4tJ0iHl0y3V";
    const senderId = "8809648907626";
    const encodedMessage = encodeURIComponent(message);
    
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${formattedNumber}&senderid=${senderId}&message=${encodedMessage}`;

    const response = await fetch(url, { method: "POST" });
    const result = await response.text(); 
    
    return { success: true, result };
  } catch (error) {
    console.error("Rent SMS Send Error:", error);
    return { success: false, error: "Network or server error" };
  }
};