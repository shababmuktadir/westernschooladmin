import { collection, doc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase";

// ১. ডাটাবেস থেকে সব ক্লাস এবং তাদের সাবজেক্ট নিয়ে আসা
export const getClassesAndSubjects = async () => {
  try {
    const snap = await getDocs(collection(db, "classes"));
    const subjectsMap = {};
    const classList = [];
    
    snap.forEach(docSnap => {
      classList.push(docSnap.id);
      subjectsMap[docSnap.id] = docSnap.data().subjects || [];
    });
    
    return { classList, subjectsMap };
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

// ২. কোনো নির্দিষ্ট ক্লাসে নতুন সাবজেক্ট যুক্ত করা
export const addSubjectToClass = async (className, subjectName) => {
  const classRef = doc(db, "classes", className);
  const classSnap = await getDoc(classRef);
  
  if (classSnap.exists()) {
    await updateDoc(classRef, { subjects: arrayUnion(subjectName) });
  } else {
    await setDoc(classRef, { name: className, subjects: [subjectName] });
  }
};

// ৩. সাবজেক্ট ডিলিট করা
export const removeSubjectFromClass = async (className, subjectName) => {
  const classRef = doc(db, "classes", className);
  await updateDoc(classRef, { subjects: arrayRemove(subjectName) });
};

// ৪. সাবজেক্টের নাম এডিট/আপডেট করা
export const editSubjectInClass = async (className, oldSubject, newSubject) => {
  const classRef = doc(db, "classes", className);
  const classSnap = await getDoc(classRef);
  
  if (classSnap.exists()) {
    let subjects = classSnap.data().subjects || [];
    subjects = subjects.map(s => s === oldSubject ? newSubject : s);
    await updateDoc(classRef, { subjects });
  }
};

// ৫. ডিফল্ট সাবজেক্ট লিস্ট একবারে ডাটাবেসে সেভ করা (Batch Write)
export const initializeDefaultSubjects = async (defaultData) => {
  const batch = writeBatch(db);
  for (const [className, subjects] of Object.entries(defaultData)) {
    const classRef = doc(db, "classes", className);
    batch.set(classRef, { name: className, subjects: subjects }, { merge: true });
  }
  await batch.commit();
};