import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getStudentById, deleteStudent } from "@/features/students/services/studentService";
import { ArrowLeft, Edit, Trash2, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Reusable UI component for displaying information
const InfoItem = ({ label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="font-medium text-slate-800 dark:text-slate-200">{value || "N/A"}</p>
  </div>
);

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const data = await getStudentById(id);
      if (data) {
        setStudent(data);
      } else {
        toast.error("Student not found");
        navigate("/students");
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(id);
        toast.success("Student deleted successfully");
        navigate("/students");
      } catch (error) {
        toast.error("Failed to delete student");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate("/students")} 
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">শিক্ষার্থীর প্রোফাইল</h1>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleDelete} 
            className="px-4 py-2 flex items-center text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition font-medium"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </button>
          <Link 
            to={`/students/edit/${id}`} 
            className="px-4 py-2 flex items-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium shadow-sm"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Info
          </Link>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Top Section: Photo and Highlights */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          {student.photoURL ? (
            <img src={student.photoURL} alt={student.fullName} className="w-32 h-32 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
          ) : (
            <div className="w-32 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
              <User className="w-12 h-12" />
            </div>
          )}
          
          <div className="flex-1 mt-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3">
              {student.fullName || "Name Not Found"}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-sm font-semibold border border-blue-200 dark:border-blue-800/50">
                ID: {student.studentId}
              </span>
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md text-sm font-semibold border border-emerald-200 dark:border-emerald-800/50">
                Class: {student.class} {student.section ? `(Sec: ${student.section})` : ""}
              </span>
              <span className="px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-md text-sm font-semibold border border-purple-200 dark:border-purple-800/50">
                Roll: {student.rollNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Details Sections */}
        <div className="p-6 sm:p-8">
          
          {/* Section 1: Academic & Personal */}
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Academic & Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <InfoItem label="Contact Number" value={student.contactNumber} />
            <InfoItem label="Date of Birth" value={student.dateOfBirth} />
            <InfoItem label="Gender" value={student.gender} />
            <InfoItem label="Blood Group" value={student.bloodGroup} />
            <InfoItem label="Birth Certificate No." value={student.birthCertificateNumber} />
          </div>

          {/* Section 2: Family Info */}
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Family Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <InfoItem label="Father's Name" value={student.fatherName} />
            <InfoItem label="Father's NID" value={student.fatherNID} />
            <InfoItem label="Mother's Name" value={student.motherName} />
            <InfoItem label="Mother's NID" value={student.motherNID} />
            <InfoItem label="Local Guardian" value={student.guardianName} />
          </div>

          {/* Section 3: Address */}
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Address details</h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
            <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {student.address || "N/A"}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}