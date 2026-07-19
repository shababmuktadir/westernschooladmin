export const handler = async (event, context) => {
  const API_KEY = "ASNQVx1KE4tJ0iHl0y3V"; // সরাসরি বসিয়ে চেক করছি
  const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const textData = await response.text();
    console.log("BulkSMSBD Response:", textData); // টার্মিনালে চেক করুন কী আসছে

    return {
      statusCode: 200,
      body: JSON.stringify({ balance: textData }), // সরাসরি টেক্সট পাঠাচ্ছি
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};