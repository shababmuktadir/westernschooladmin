import { useState } from "react";
import StudentForm from "@/components/forms/StudentForm";
import { createStudent } from "@/features/students/services/studentService";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { UploadCloud } from "lucide-react";

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateStudent = async (data) => {
    setIsSubmitting(true);
    try {
      await createStudent(data);
      toast.success("Student Data Saved Successfully!");
      navigate("/students");
    } catch (error) { 
      toast.error("Failed to register student"); 
      console.error(error);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">নতুন শিক্ষার্থী নিবন্ধন</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">সিস্টেমে নতুন শিক্ষার্থী যুক্ত করতে নিচের ফর্মটি পূরণ করুন।</p>
        </div>
        
        {/* Bulk Upload Button */}
        <Link 
          to="/students/bulk-upload" 
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center hover:bg-emerald-700 transition shadow-sm"
        >
          <UploadCloud className="w-5 h-5 mr-2" /> 
          Upload Students Data Sheet
        </Link>
      </div>
      
      {/* Student Form Component where the DatePicker actually is */}
      <StudentForm onSubmit={handleCreateStudent} isSubmitting={isSubmitting} />
    </div>
  );
}