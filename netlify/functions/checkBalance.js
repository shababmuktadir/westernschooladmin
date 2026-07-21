export const handler = async (event, context) => {
  const API_KEY = process.env.SMS_API_KEY;
  
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API Key missing" }) };
  }

  const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const textData = await response.text();
    
    // BulkSMSBD এর JSON রেসপন্স থেকে ব্যালেন্স বের করা
    let finalBalance = 0;
    try {
      const parsed = JSON.parse(textData);
      finalBalance = parsed.balance !== undefined ? parsed.balance : textData;
    } catch (e) {
      finalBalance = textData; 
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: finalBalance }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};