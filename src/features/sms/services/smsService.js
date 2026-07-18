import { db } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";

// 1. Check SMS Balance via Netlify Function
export const checkSmsBalance = async () => {
  try {
    const response = await fetch("/.netlify/functions/checkBalance");
    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error("Balance Check Error:", error);
    return "Error";
  }
};

// 2. Send SMS via Netlify Function
export const sendSMS = async (number, message) => {
  try {
    const response = await fetch("/.netlify/functions/sendSms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number, message }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SMS Send Error:", error);
    return null;
  }
};

// 3. Save Uploaded TXT Data
export const saveTxtUpload = async (parsedData) => {
  const docRef = doc(db, "txtUploads", "latest_upload");
  await setDoc(docRef, { data: parsedData, updatedAt: new Date().toISOString() });
};

// 4. Save Attendance
export const updateAttendanceRecord = async (attendanceData) => {
  for (let record of attendanceData) {
    const docRef = doc(db, "attendance", String(record.id));
    await setDoc(docRef, {
      [record.date]: {
        time: record.time,
        status: "Present",
        timestamp: new Date().toISOString()
      }
    }, { merge: true });
  }
};