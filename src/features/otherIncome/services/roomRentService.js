import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, writeBatch, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";

// --- Helper to clean undefined data ---
const cleanRenterData = (data) => ({
  roomNo: String(data.roomNo || ""),
  name: String(data.name || ""),
  phone: String(data.phone || ""),
  nid: String(data.nid || ""),
  rentAmount: Number(data.rentAmount) || 0,
  schedules: Array.isArray(data.schedules) ? data.schedules : []
});

// --- RENTER ACCOUNTS CRUD ---
export const getRenters = async () => {
  try {
    const q = query(collection(db, "roomRenters"), orderBy("roomNo", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Fetch Renters Error:", error);
    return [];
  }
};

export const addRenter = async (renterData) => {
  try {
    const finalData = { ...cleanRenterData(renterData), createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, "roomRenters"), finalData);
    return { id: docRef.id, ...finalData };
  } catch (error) {
    console.error("Add Renter Error:", error);
    throw error;
  }
};

export const updateRenter = async (id, data) => {
  try {
    const finalData = { ...cleanRenterData(data), updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, "roomRenters", String(id)), finalData);
  } catch (error) {
    console.error("Update Renter Error:", error);
    throw error;
  }
};

export const deleteRenter = async (id) => {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, "roomRenters", String(id)));
    
    // Delete all associated payments
    const paymentsQ = query(collection(db, "roomRentPayments"), where("renterId", "==", String(id)));
    const paymentsSnap = await getDocs(paymentsQ);
    paymentsSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
    
    await batch.commit();
  } catch (error) {
    console.error("Delete Renter Error:", error);
    throw error;
  }
};

// --- RENT PAYMENTS CRUD ---
export const getRentPayments = async () => {
  try {
    const snapshot = await getDocs(collection(db, "roomRentPayments"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Fetch Payments Error:", error);
    return [];
  }
};

export const addRentPayment = async (paymentData) => {
  try {
    const batch = writeBatch(db);
    const receiptNo = `RR-${Date.now().toString().slice(-6)}`;
    
    const totalAmount = Number(paymentData.amountPaid) || 0;
    const monthsArray = Array.isArray(paymentData.months) ? paymentData.months : [];
    const perMonthAmount = monthsArray.length > 0 ? (totalAmount / monthsArray.length) : totalAmount;
    
    // Create individual records for each selected month
    monthsArray.forEach(monthStr => {
      const docRef = doc(collection(db, "roomRentPayments"));
      batch.set(docRef, {
        renterId: String(paymentData.renterId || ""),
        renterName: String(paymentData.renterName || ""),
        roomNo: String(paymentData.roomNo || ""),
        phone: String(paymentData.phone || ""),
        month: String(monthStr || ""),
        amountPaid: perMonthAmount,
        receiptNo: receiptNo,
        paymentDate: new Date().toISOString()
      });
    });

    await batch.commit();

    return {
      receiptNo,
      renterName: String(paymentData.renterName || ""),
      roomNo: String(paymentData.roomNo || ""),
      phone: String(paymentData.phone || ""),
      months: monthsArray,
      totalAmount: totalAmount,
      date: new Date().toISOString()
    };
  } catch (error) {
    console.error("Add Payment Error:", error);
    throw error;
  }
};

export const deleteRentPayment = async (id) => {
  try {
    await deleteDoc(doc(db, "roomRentPayments", String(id)));
  } catch (error) {
    console.error("Delete Payment Error:", error);
    throw error;
  }
};