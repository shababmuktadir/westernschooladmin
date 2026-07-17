import { useState } from "react";
import { getStudents } from "@/features/students/services/studentService";
import toast from "react-hot-toast";

export const useSeatPlan = () => {
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  const generatePlan = async (examData) => {
    setLoading(true);
    try {
      const allStudents = await getStudents();
      
      // Filter Active Students based on class selection
      const targetStudents = allStudents.filter(student => 
        student.status !== "Inactive" && 
        (examData.targetClass === "All" || student.class === examData.targetClass)
      );

      if (targetStudents.length === 0) {
        toast.error("No active students found for this selection.");
        setGeneratedData(null);
      } else {
        // Sort students logically by Class and then by Roll Number
        const sortedStudents = targetStudents.sort((a, b) => {
          if (a.class === b.class) {
            return parseInt(a.rollNumber || 0) - parseInt(b.rollNumber || 0);
          }
          return a.class.localeCompare(b.class);
        });

        setGeneratedData({
          examDetails: examData,
          students: sortedStudents
        });
        toast.success(`${targetStudents.length} Seat Plans Generated!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate seat plans.");
    } finally {
      setLoading(false);
    }
  };

  const resetGenerator = () => setGeneratedData(null);

  return { loading, generatedData, generatePlan, resetGenerator };
};