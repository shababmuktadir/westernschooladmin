export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const API_KEY = process.env.SMS_API_KEY;
  const SENDER_ID = process.env.SMS_SENDER_ID;

  if (!API_KEY || !SENDER_ID) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server Configuration Error: API/Sender ID missing" }) };
  }

  try {
    const { number, message } = JSON.parse(event.body);
    
    if (!number || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Number and message are required" }) };
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${API_KEY}&type=text&number=${number}&senderid=${SENDER_ID}&message=${encodedMessage}`;

    const response = await fetch(url);
    const textData = await response.text(); 
    
    // 202 is the success code for BulkSMSBD
    const isSuccess = textData.includes("202") || textData.toLowerCase().includes("success");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: textData, success: isSuccess }),
    };
  } catch (error) {
    console.error("SMS Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to communicate with SMS Gateway" }),
    };
  }
};