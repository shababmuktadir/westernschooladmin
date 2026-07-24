export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const API_KEY = process.env.SMS_API_KEY;
  const SENDER_ID = process.env.SMS_SENDER_ID;

  if (!API_KEY || !SENDER_ID) {
    return res.status(500).json({ error: "Server Configuration Error: API/Sender ID missing" });
  }

  try {
    // Vercel অটোমেটিক্যালি JSON বডি পার্স করে নেয়, তাই JSON.parse() প্রয়োজন নেই
    const { number, message } = req.body;
    
    if (!number || !message) {
      return res.status(400).json({ error: "Number and message are required" });
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${API_KEY}&type=text&number=${number}&senderid=${SENDER_ID}&message=${encodedMessage}`;

    const response = await fetch(url);
    const textData = await response.text(); 
    
    // 202 is the success code for BulkSMSBD
    const isSuccess = textData.includes("202") || textData.toLowerCase().includes("success");

    return res.status(200).json({ result: textData, success: isSuccess });
  } catch (error) {
    console.error("SMS Function Error:", error);
    return res.status(500).json({ error: "Failed to communicate with SMS Gateway" });
  }
}