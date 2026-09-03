import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase";

// --- TEACHER CRUD ---
export const getTeachers = async () => {
  const snapshot = await getDocs(collection(db, "teachers"));
  let teachers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // GHOST ACCOUNT FIX: ডাটাবেসে থাকা সকল ফাঁকা/ইনভ্যালিড অ্যাকাউন্ট ফিল্টার করে বাদ দেওয়া হচ্ছে
  teachers = teachers.filter(t => t.teacherId && t.englishName);

  // AUTO ID-WISE SORTING LOGIC: 
  // 1000+ আইডিগুলো আগে বসবে, ২ ডিজিটের (১০০ এর ছোট) আইডিগুলো শেষে যাবে।
  return teachers.sort((a, b) => {
    const idA = parseInt(a.teacherId) || 0;
    const idB = parseInt(b.teacherId) || 0;

    // চেক করা হচ্ছে আইডি ২ ডিজিটের (১০০ এর ছোট) কি না
    const isSmallA = idA < 100;
    const isSmallB = idB < 100;

    if (isSmallA && !isSmallB) return 1;  // A ছোট আইডি হলে তাকে শেষে পাঠাও
    if (!isSmallA && isSmallB) return -1; // B ছোট আইডি হলে তাকে শেষে পাঠাও

    // বাকি সব ক্ষেত্রে নরমাল সিরিয়াল (ছোট থেকে বড়)
    return idA - idB; 
  });
};

export const saveTeacher = async (teacherData, originalId = null) => {
  const newId = String(teacherData.teacherId);
  const newDocRef = doc(db, "teachers", newId); 
  
  const dataToSave = { ...teacherData };
  delete dataToSave.originalId;
  delete dataToSave.id; 

  if (originalId && String(originalId) !== newId) {
    const batch = writeBatch(db);
    
    batch.set(newDocRef, { ...dataToSave, updatedAt: new Date().toISOString() });
    
    const oldDocRef = doc(db, "teachers", String(originalId));
    batch.delete(oldDocRef);
    
    // Migrate Salary
    const salaryQ = query(collection(db, "teacherSalaries"), where("teacherId", "in", [String(originalId), Number(originalId)]));
    const salarySnap = await getDocs(salaryQ);
    salarySnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const newSalaryRef = doc(db, "teacherSalaries", `${data.month}_${newId}`);
      batch.set(newSalaryRef, { ...data, teacherId: newId });
      batch.delete(docSnap.ref);
    });

    // Migrate Attendance
    const attQ = query(collection(db, "teacherAttendance"), where("teacherId", "in", [String(originalId), Number(originalId)]));
    const attSnap = await getDocs(attQ);
    attSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const newAttRef = doc(db, "teacherAttendance", `${data.date}_${newId}`);
      batch.set(newAttRef, { ...data, teacherId: newId });
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  } else {
    await setDoc(newDocRef, { ...dataToSave, updatedAt: new Date().toISOString() }, { merge: true });
  }
};

export const updateTeacher = async (id, data) => {
  await updateDoc(doc(db, "teachers", String(id)), data);
};

// --- CASCADE DELETE: Teacher + Salaries + Attendance ---
export const deleteTeacher = async (id) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, "teachers", String(id)));
  
  const salaryQ = query(collection(db, "teacherSalaries"), where("teacherId", "in", [String(id), Number(id)]));
  const salarySnap = await getDocs(salaryQ);
  salarySnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
  
  const attQ = query(collection(db, "teacherAttendance"), where("teacherId", "in", [String(id), Number(id)]));
  const attSnap = await getDocs(attQ);
  attSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
  
  await batch.commit();
};

// --- ATTENDANCE ---
export const saveDailyAttendance = async (date, attendanceList) => {
  const batch = writeBatch(db);
  attendanceList.forEach(record => {
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

// --- TEACHER DETAILS & SALARY LOGIC ---
export const getTeacherAttendance = async (teacherId) => {
  const q = query(collection(db, "teacherAttendance"), where("teacherId", "in", [String(teacherId), Number(teacherId)]));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const getTeacherSalaries = async (teacherId) => {
  const q = query(collection(db, "teacherSalaries"), where("teacherId", "in", [String(teacherId), Number(teacherId)]));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const getAllSalaries = async () => {
  const snapshot = await getDocs(collection(db, "teacherSalaries"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const payTeacherSalary = async (salaryData) => {
  const docRef = doc(db, "teacherSalaries", `${salaryData.month}_${salaryData.teacherId}`);
  await setDoc(docRef, { ...salaryData, paidAt: new Date().toISOString() });
};

export const getSalariesByMonth = async (month) => {
  const q = query(collection(db, "teacherSalaries"), where("month", "==", month));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteTeacherSalary = async (month, teacherId) => {
  await deleteDoc(doc(db, "teacherSalaries", `${month}_${teacherId}`));
};

export const deleteSalaryRecordById = async (docId) => {
  await deleteDoc(doc(db, "teacherSalaries", docId));
};

export const updateTeacherSalaryRecord = async (month, teacherId, updatedData) => {
  await updateDoc(doc(db, "teacherSalaries", `${month}_${teacherId}`), updatedData);
};

export const updateSalaryRecordById = async (docId, updatedData) => {
  await updateDoc(doc(db, "teacherSalaries", docId), updatedData);
};

export const deleteAllSalariesByMonth = async (month) => {
  const q = query(collection(db, "teacherSalaries"), where("month", "==", month));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((document) => {
    batch.delete(document.ref);
  });
  await batch.commit();
};