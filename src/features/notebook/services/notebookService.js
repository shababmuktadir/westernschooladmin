import { db } from "@/config/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";

const COLLECTION_NAME = "notebook_notes";

export const getNotes = async () => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveNote = async (noteData) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...noteData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateNote = async (id, noteData) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...noteData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteNote = async (id) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};