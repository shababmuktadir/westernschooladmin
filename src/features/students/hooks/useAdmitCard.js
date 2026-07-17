import { useState } from "react";
import { getStudents } from "@/features/students/services/studentService";
import toast from "react-hot-toast";

export const useAdmitCard = () => {
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  const generateCards = async (examData) => {
    setLoading(true);
    try {
      const allStudents = await getStudents();
      
      // Filter Active Students strictly based on the selected class
      const targetStudents = allStudents.filter(student => 
        student.status !== "Inactive" && student.class === examData.targetClass
      );

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