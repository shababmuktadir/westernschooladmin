import { useState } from "react";
import { getStudents } from "@/features/students/services/studentService";
import toast from "react-hot-toast";

export const useAdmitCard = () => {
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  const normalizeClassName = (className) => {
    if (!className) return "";
    return String(className).toLowerCase().replace("class", "").trim();
  };

  const generateCards = async (examData) => {
    setLoading(true);
    try {
      const allStudents = await getStudents();
      let targetStudents = [];

      // Status check (যদি status না থাকে বা inactive ছাড়া অন্য কিছু হয়)
      const isStatusActive = (status) => !status || String(status).toLowerCase() !== "inactive";

      if (examData.studentId) {
        // Single ID: checking the studentId field from your schema
        const targetId = String(examData.studentId).trim().toLowerCase();
        targetStudents = allStudents.filter(student => 
          isStatusActive(student.status) && String(student.studentId).trim().toLowerCase() === targetId
        );
      } 
      else if (examData.selectedStudentIds && examData.selectedStudentIds.length > 0) {
        // Custom IDs
        const targetIds = examData.selectedStudentIds.map(id => String(id).trim().toLowerCase());
        targetStudents = allStudents.filter(student => 
          isStatusActive(student.status) && targetIds.includes(String(student.studentId).trim().toLowerCase())
        );
      } 
      else if (examData.targetClass) {
        // Class Search
        targetStudents = allStudents.filter(student => {
          const classMatch = normalizeClassName(student.class) === normalizeClassName(examData.targetClass);
          return isStatusActive(student.status) && classMatch;
        });
      }

      if (targetStudents.length === 0) {
        toast.error("প্রদত্ত তথ্যের ভিত্তিতে কোনো অ্যাকটিভ শিক্ষার্থী পাওয়া যায়নি।");
        setGeneratedData(null);
      } else {
        setGeneratedData({
          examDetails: examData,
          students: targetStudents
        });
        toast.success(`${targetStudents.length} Admit Cards Generated Successfully!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate admit cards.");
    } finally {
      setLoading(false);
    }
  };

  const resetGenerator = () => setGeneratedData(null);

  return { loading, generatedData, generateCards, resetGenerator };
};