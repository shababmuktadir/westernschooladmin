import { useState } from "react";
import { getStudents } from "@/features/students/services/studentService";
import toast from "react-hot-toast";

export const useAdmitCard = () => {
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  // ক্লাস নেম ম্যাচ করার জন্য স্পেশাল হেল্পার ফাংশন
  // এটি "Class 1" এবং "1" কে সমান হিসেবে গণ্য করবে
  const normalizeClassName = (className) => {
    if (!className) return "";
    return String(className).toLowerCase().replace("class", "").trim();
  };

  const generateCards = async (examData) => {
    setLoading(true);
    try {
      const allStudents = await getStudents();
      
      // Filter Active Students based on the normalized class name
      const targetStudents = allStudents.filter(student => {
        const isStatusActive = student.status !== "Inactive";
        const isClassMatch = normalizeClassName(student.class) === normalizeClassName(examData.targetClass);
        
        return isStatusActive && isClassMatch;
      });

      if (targetStudents.length === 0) {
        toast.error(`No active students found in ${examData.targetClass}.`);
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