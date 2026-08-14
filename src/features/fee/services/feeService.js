import { collection, doc, setDoc, getDocs, query, orderBy, limit, where, writeBatch, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export const generateNextInvoiceNo = async () => {
  try {
    const q = query(collection(db, "studentFees"), orderBy("createdAt", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return "WSC-000001";
    }
    
    const lastDoc = querySnapshot.docs[0].data();
    const lastInvoiceNo = lastDoc.invoiceNo || lastDoc.memoNo || "WSC-000000";
    
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

export const getStudentFees = async (studentId) => {
  const q = query(collection(db, "studentFees"), where("studentId", "==", studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBulkStudentFees = async () => {
  try {
    const feesRef = collection(db, "studentFees"); 
    const snapshot = await getDocs(feesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all fees:", error);
    return []; 
  }
};

export const deleteAllFees = async () => {
  try {
    const feesRef = collection(db, "studentFees"); 
    const snapshot = await getDocs(feesRef);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.delete(doc(db, "studentFees", document.id)); 
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting all fees:", error);
    throw error;
  }
};

// --- NEW FIX: Update and Delete Single Record ---
export const updateStudentFee = async (id, updatedData) => {
  try {
    await updateDoc(doc(db, "studentFees", id), updatedData);
  } catch (error) {
    console.error("Error updating fee:", error);
    throw error;
  }
};

export const deleteStudentFee = async (id) => {
  try {
    await deleteDoc(doc(db, "studentFees", id));
  } catch (error) {
    console.error("Error deleting fee:", error);
    throw error;
  }
};