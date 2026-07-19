export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { number, message } = JSON.parse(event.body);
    const API_KEY = process.env.SMS_API_KEY;
    const SENDER_ID = process.env.SMS_SENDER_ID;
    
    const encodedMessage = encodeURIComponent(message);
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${API_KEY}&type=text&number=${number}&senderid=${SENDER_ID}&message=${encodedMessage}`;

    const response = await fetch(url);
    const data = await response.text(); 
    // BulkSMSBD রেসপন্স কোড (যেমন: 202) টেক্সট বা JSON হিসেবে দিতে পারে।

    return {
      statusCode: 200,
      body: JSON.stringify({ result: data, success: data.includes("202") || data.includes("Success") }),
    };
  } catch (error) {
    console.error("SMS Sending Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send SMS" }),
    };
  }
};