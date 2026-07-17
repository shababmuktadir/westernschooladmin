import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentForm from "@/components/forms/StudentForm";
import { getStudentById, updateStudent } from "@/features/students/services/studentService";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function StudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      const data = await getStudentById(id);
      if(data) setStudent(data);
      else { toast.error("Student not found"); navigate("/students"); }
    };
    fetchDetails();
  }, [id, navigate]);

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      await updateStudent(id, data);
      toast.success("Student Info Updated!");
      navigate(`/students/details/${id}`);
    } catch (error) { 
      toast.error("Failed to update"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (!student) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">তথ্য আপডেট করুন</h1>
      </div>
      <StudentForm defaultValues={student} onSubmit={handleUpdate} isSubmitting={isSubmitting} />
    </div>
  );
}