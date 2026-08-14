import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase";

// --- TEACHER CRUD ---
export const getTeachers = async () => {
  const snapshot = await getDocs(collection(db, "teachers"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveTeacher = async (teacherData, originalId = null) => {
  const newId = String(teacherData.teacherId);
  const newDocRef = doc(db, "teachers", newId); 
  
  // Data clean-up before saving
  const dataToSave = { ...teacherData };
  delete dataToSave.originalId;
  delete dataToSave.id; 

  // If editing and ID has been changed, migrate the old data
  if (originalId && String(originalId) !== newId) {
    const batch = writeBatch(db);
    
    // 1. Set new Teacher Document
    batch.set(newDocRef, { ...dataToSave, updatedAt: new Date().toISOString() });
    
    // 2. Delete old Teacher Document
    const oldDocRef = doc(db, "teachers", String(originalId));
    batch.delete(oldDocRef);
    
    // 3. Migrate Salary Records to the new ID
    const salaryQ = query(collection(db, "teacherSalaries"), where("teacherId", "==", String(originalId)));
    const salarySnap = await getDocs(salaryQ);
    salarySnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const newSalaryRef = doc(db, "teacherSalaries", `${data.month}_${newId}`);
      batch.set(newSalaryRef, { ...data, teacherId: newId });
      batch.delete(docSnap.ref);
    });

    // 4. Migrate Attendance Records to the new ID
    const attQ = query(collection(db, "teacherAttendance"), where("teacherId", "==", String(originalId)));
    const attSnap = await getDocs(attQ);
    attSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const newAttRef = doc(db, "teacherAttendance", `${data.date}_${newId}`);
      batch.set(newAttRef, { ...data, teacherId: newId });
      batch.delete(docSnap.ref);
    });

    // Execute all changes at once
    await batch.commit();
  } else {
    // Normal save or update (ID wasn't changed)
    await setDoc(newDocRef, { ...dataToSave, updatedAt: new Date().toISOString() }, { merge: true });
  }
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
  const q = query(collection(db, "teacherAttendance"), where("teacherId", "==", String(teacherId)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const getTeacherSalaries = async (teacherId) => {
  const q = query(collection(db, "teacherSalaries"), where("teacherId", "==", String(teacherId)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const payTeacherSalary = async (salaryData) => {
  const docRef = doc(db, "teacherSalaries", `${salaryData.month}_${salaryData.teacherId}`);
  await setDoc(docRef, { ...salaryData, paidAt: new Date().toISOString() });
};

export const getSalariesByMonth = async (month) => {
  const q = query(collection(db, "teacherSalaries"), where("month", "==", month));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const deleteTeacherSalary = async (month, teacherId) => {
  await deleteDoc(doc(db, "teacherSalaries", `${month}_${teacherId}`));
};

export const updateTeacherSalaryRecord = async (month, teacherId, updatedData) => {
  await updateDoc(doc(db, "teacherSalaries", `${month}_${teacherId}`), updatedData);
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