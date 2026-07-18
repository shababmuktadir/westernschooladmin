exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { number, message } = JSON.parse(event.body);
    const API_KEY = process.env.SMS_API_KEY;
    const SENDER_ID = process.env.SMS_SENDER_ID;
    
    const encodedMessage = encodeURIComponent(message);
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${API_KEY}&type=text&number=${number}&senderid=${SENDER_ID}&message=${encodedMessage}`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send SMS" }),
    };
  }
};