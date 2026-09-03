import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
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

export const updateCategory = async (id, name) => {
  await updateDoc(doc(db, "expenseCategories", id), { name });
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
// Expense Services এর নিচে এটি যুক্ত করুন
export const updateExpense = async (id, updatedData) => {
  try {
    await updateDoc(doc(db, "expenses", id), updatedData);
    return true;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};