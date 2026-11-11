import { db } from "@/config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

export const createStudent = async (studentData) => {
  try {
    const { createdAt, updatedAt, ...rest } = studentData;
    const docRef = await addDoc(collection(db, "students"), {
      ...rest,
      createdAt: serverTimestamp(),
      status: rest.status || "Active",
    });
    return docRef.id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to save student data");
  }
};

// Backward-compatible alias
export const addStudent = createStudent;

export const getStudents = async () => {
  try {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch students");
  }
};

export const getStudentById = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "students", id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    return null;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch student details");
  }
};

export const updateStudent = async (id, studentData) => {
  try {
    const { createdAt, updatedAt, ...rest } = studentData;
    await updateDoc(doc(db, "students", id), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update student");
  }
};

export const deleteStudent = async (id) => {
  try {
    await deleteDoc(doc(db, "students", id));
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete student");
  }
};