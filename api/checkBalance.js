export default async function handler(req, res) {
  const API_KEY = process.env.SMS_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: "API Key missing" });
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

    return res.status(200).json({ balance: finalBalance });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}