import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase"; // আপনার ফায়ারবেস কনফিগ পাথ

// --- TEACHER CRUD ---
export const getTeachers = async () => {
  const snapshot = await getDocs(collection(db, "teachers"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveTeacher = async (teacherData) => {
  // ম্যানুয়াল আইডি ব্যবহার করছি যাতে txt ফাইলের আইডির সাথে মিলে
  const docRef = doc(db, "teachers", String(teacherData.teacherId)); 
  await setDoc(docRef, { ...teacherData, createdAt: new Date().toISOString() });
};

export const updateTeacher = async (id, data) => {
  await updateDoc(doc(db, "teachers", String(id)), data);
};

export const deleteTeacher = async (id) => {
  await deleteDoc(doc(db, "teachers", String(id)));
};

// --- ATTENDANCE ---
export const saveDailyAttendance = async (date, attendanceList) => {
  const batch = writeBatch(db);
  
  attendanceList.forEach(record => {
    // Document ID: date_teacherId (e.g., 2026-07-30_1)
    const docRef = doc(db, "teacherAttendance", `${date}_${record.teacherId}`);
    batch.set(docRef, record);
  });

  await batch.commit();
};

export const getAttendanceByDate = async (date) => {
  const q = query(collection(db, "teacherAttendance"), where("date", "==", date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};
// --- NEW: TEACHER DETAILS & SALARY LOGIC ---

// নির্দিষ্ট শিক্ষকের এটেনডেন্স আনা
export const getTeacherAttendance = async (teacherId) => {
  const q = query(collection(db, "teacherAttendance"), where("teacherId", "==", String(teacherId)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

// নির্দিষ্ট শিক্ষকের স্যালারি রেকর্ড আনা
export const getTeacherSalaries = async (teacherId) => {
  const q = query(collection(db, "teacherSalaries"), where("teacherId", "==", String(teacherId)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

// স্যালারি পেমেন্ট সেভ করা (মাসের নাম এবং আইডির ভিত্তিতে)
export const payTeacherSalary = async (salaryData) => {
  const docRef = doc(db, "teacherSalaries", `${salaryData.month}_${salaryData.teacherId}`);
  await setDoc(docRef, { ...salaryData, paidAt: new Date().toISOString() });
};

// নির্দিষ্ট মাসের সবার স্যালারি রিপোর্ট আনা
export const getSalariesByMonth = async (month) => {
  const q = query(collection(db, "teacherSalaries"), where("month", "==", month));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};
// স্যালারি রেকর্ড ডিলিট করা
export const deleteTeacherSalary = async (month, teacherId) => {
  await deleteDoc(doc(db, "teacherSalaries", `${month}_${teacherId}`));
};

// স্যালারি রেকর্ড আপডেট করা
export const updateTeacherSalaryRecord = async (month, teacherId, updatedData) => {
  await updateDoc(doc(db, "teacherSalaries", `${month}_${teacherId}`), updatedData);
};
// নির্দিষ্ট মাসের সব শিক্ষকের স্যালারি একসাথে ডিলিট করা
export const deleteAllSalariesByMonth = async (month) => {
  const q = query(collection(db, "teacherSalaries"), where("month", "==", month));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((document) => {
    batch.delete(document.ref);
  });
  
  await batch.commit();
};