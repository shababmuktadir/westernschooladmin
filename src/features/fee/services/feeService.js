import { collection, doc, setDoc, getDocs, query, orderBy, limit, where, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase";

export const generateNextInvoiceNo = async () => {
  try {
    const q = query(collection(db, "studentFees"), orderBy("createdAt", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return "WSC-000001";
    }
    
    // সর্বশেষ ডকুমেন্ট থেকে নম্বর বের করা
    const lastDoc = querySnapshot.docs[0].data();
    const lastInvoiceNo = lastDoc.invoiceNo || lastDoc.memoNo || "WSC-000000";
    
    // শুধু শেষের নাম্বারটুকু আলাদা করা
    const parts = lastInvoiceNo.split("-");
    const lastNumber = parts.length > 1 ? parseInt(parts[1], 10) : parseInt(lastInvoiceNo, 10);
    
    if (isNaN(lastNumber)) return `WSC-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`;
    
    const nextNumber = lastNumber + 1;
    return `WSC-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error("Error generating invoice no:", error);
    return `WSC-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
  }
};

export const getStudentPaidMonths = async (studentId) => {
  try {
    const q = query(collection(db, "studentFees"), where("studentId", "==", String(studentId)));
    const querySnapshot = await getDocs(q);
    
    let paidMonths = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.selectedMonths && Array.isArray(data.selectedMonths)) {
        paidMonths = [...paidMonths, ...data.selectedMonths];
      }
    });
    
    return [...new Set(paidMonths)];
  } catch (error) {
    console.error("Error fetching paid months:", error);
    return [];
  }
};

export const saveStudentFee = async (feeData) => {
  try {
    const docRef = doc(collection(db, "studentFees"));
    const finalData = {
      id: docRef.id,
      ...feeData,
      memoNo: feeData.invoiceNo, 
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, finalData);
    return { success: true, data: finalData };
  } catch (error) {
    console.error("Error saving fee record:", error);
    throw error;
  }
};

// বাল্ক এক্সেল ডেটা সেভ করার ফাংশন
export const saveBulkStudentFees = async (feesArray) => {
  try {
    const batch = writeBatch(db);
    
    feesArray.forEach((fee) => {
      const docRef = doc(collection(db, "studentFees"));
      batch.set(docRef, {
        id: docRef.id,
        ...fee,
        createdAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    return { success: true, count: feesArray.length };
  } catch (error) {
    console.error("Error saving bulk fees:", error);
    throw error;
  }
};

// নির্দিষ্ট স্টুডেন্টের সব ফি রেকর্ড পাওয়ার ফাংশন
export const getStudentFees = async (studentId) => {
  const q = query(collection(db, "studentFees"), where("studentId", "==", studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ডেটাবেস থেকে সব ফি রেকর্ড একসাথে নিয়ে আসার ফাংশন
export const getBulkStudentFees = async () => {
  try {
    const feesRef = collection(db, "studentFees"); // "fees" থেকে "studentFees" করা হয়েছে
    const snapshot = await getDocs(feesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all fees for validation:", error);
    return []; 
  }
};

// ডাটাবেস থেকে আগের সব ফি রেকর্ড সম্পূর্ণ মুছে ফেলার ফাংশন
export const deleteAllFees = async () => {
  try {
    const feesRef = collection(db, "studentFees"); // "fees" থেকে "studentFees" করা হয়েছে
    const snapshot = await getDocs(feesRef);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.delete(doc(db, "studentFees", document.id)); // এখানেও "studentFees" দেওয়া হয়েছে
    });

    await batch.commit();
    console.log("All previous fee records deleted successfully.");
  } catch (error) {
    console.error("Error deleting all fees:", error);
    throw error;
  }
};