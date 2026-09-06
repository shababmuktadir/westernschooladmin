import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy, where, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase";

// --- Category Services ---
export const getCategories = async () => {
  const q = query(collection(db, "expenseCategories"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCategory = async (name) => {
  const docRef = await addDoc(collection(db, "expenseCategories"), { name, createdAt: new Date().toISOString() });
  return { id: docRef.id, name };
};

// 🛑 UPDATE: Cascade Update Logic Added Here
export const updateCategory = async (id, newName, oldName) => {
  const batch = writeBatch(db);

  // ১. প্রথমে মূল ক্যাটাগরির নাম আপডেট করা
  const categoryRef = doc(db, "expenseCategories", id);
  batch.update(categoryRef, { name: newName });

  // ২. পুরানো নামের যতগুলো খরচ (Expense/Invoice) আছে সব খুঁজে বের করা
  const expenseQuery = query(collection(db, "expenses"), where("category", "==", oldName));
  const snapshot = await getDocs(expenseQuery);

  // ৩. লুপ চালিয়ে সবগুলো খরচের রেকর্ডে ক্যাটাগরির নাম আপডেট করা
  snapshot.forEach((expenseDoc) => {
    batch.update(expenseDoc.ref, { category: newName });
  });

  // ৪. সব পরিবর্তন একসাথে ডাটাবেসে সেভ করা
  await batch.commit();
};

export const deleteCategory = async (id) => {
  await deleteDoc(doc(db, "expenseCategories", id));
};

// --- Expense Services ---
export const getExpenses = async () => {
  const q = query(collection(db, "expenses"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addExpense = async (expenseData) => {
  const finalData = { ...expenseData, createdAt: new Date().toISOString() };
  const docRef = await addDoc(collection(db, "expenses"), finalData);
  return { id: docRef.id, ...finalData };
};

export const deleteExpense = async (id) => {
  await deleteDoc(doc(db, "expenses", id));
};

export const updateExpense = async (id, updatedData) => {
  try {
    await updateDoc(doc(db, "expenses", id), updatedData);
    return true;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};