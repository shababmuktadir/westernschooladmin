import { db } from "@/config/firebase";
import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";

export const createStudent = async (studentData) => {
  try {
    const docRef = await addDoc(collection(db, "students"), { ...studentData, createdAt: serverTimestamp(), status: "Active" });
    return docRef.id;
  } catch (error) { throw new Error("Failed to save student data"); }
};

export const getStudents = async () => {
  try {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) { throw new Error("Failed to fetch students"); }
};

export const getStudentById = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "students", id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    return null;
  } catch (error) { throw new Error("Failed to fetch student details"); }
};

export const updateStudent = async (id, studentData) => {
  try {
    await updateDoc(doc(db, "students", id), { ...studentData, updatedAt: serverTimestamp() });
  } catch (error) { throw new Error("Failed to update student"); }
};

export const deleteStudent = async (id) => {
  try { await deleteDoc(doc(db, "students", id)); } 
  catch (error) { throw new Error("Failed to delete student"); }
};