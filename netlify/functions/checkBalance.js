exports.handler = async (event, context) => {
  // Netlify env থেকে সিকিউর ভাবে API KEY নিচ্ছে
  const API_KEY = process.env.SMS_API_KEY; 
  const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch balance" }),
    };
  }
};