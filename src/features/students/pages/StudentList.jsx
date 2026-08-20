import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStudents, deleteStudent } from "@/features/students/services/studentService";
import { Eye, Edit, Trash2, Search, User, Copy, Check, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Reusable Copy Component for Hover Effect
const CopyableText = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center gap-2 cursor-pointer" onClick={handleCopy}>
      <span className="font-medium text-slate-800 dark:text-slate-200">{text || "N/A"}</span>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />}
      </button>
    </div>
  );
};

// Sorting order for classes
const CLASS_ORDER = {
  "Play": 1, "Nursery": 2, "KG": 3, 
  "1": 4, "One": 4, "Class 1": 4,
  "2": 5, "Two": 5, "Class 2": 5,
  "3": 6, "Three": 6, "Class 3": 6,
  "4": 7, "Four": 7, "Class 4": 7,
  "5": 8, "Five": 8, "Class 5": 8,
  "6": 9, "7": 10, "8": 11, "9": 12, "10": 13
};

const getClassRank = (c) => {
  if (!c) return 99;
  const u = String(c).trim();
  if (CLASS_ORDER[u]) return CLASS_ORDER[u];
  const n = parseInt(u.replace(/[^0-9]/g, ''));
  if (!isNaN(n)) return n + 3; 
  return 99; 
};

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // PDF Download States
  const [selectedClassPDF, setSelectedClassPDF] = useState("All");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const data = await getStudents();
    setStudents(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      await deleteStudent(id);
      toast.success("Student deleted successfully");
      fetchStudents();
    }
  };

  const filteredStudents = students.filter(student => 
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.contactNumber?.includes(searchTerm)
  );

  // Extract unique classes for the dropdown
  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class).filter(Boolean))];
    return classes.sort((a, b) => getClassRank(a) - getClassRank(b));
  }, [students]);

  // Handle PDF Download
  const handleDownloadClassList = async () => {
    setIsGeneratingPDF(true);
    try {
      const activeStudents = students.filter(s => s.status !== "Inactive");
      let studentsToExport = activeStudents;

      if (selectedClassPDF !== "All") {
        studentsToExport = activeStudents.filter(s => s.class === selectedClassPDF);
      }

      if (studentsToExport.length === 0) {
        toast.error("No students found for this selection!");
        setIsGeneratingPDF(false);
        return;
      }

      // Group by class
      const grouped = {};
      studentsToExport.forEach(s => {
        const c = s.class || "Unknown Class";
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(s);
      });

      // Sort by roll inside each class
      Object.keys(grouped).forEach(c => {
        grouped[c].sort((a, b) => {
          const rollA = parseInt(a.rollNumber || a.roll) || 9999;
          const rollB = parseInt(b.rollNumber || b.roll) || 9999;
          return rollA - rollB;
        });
      });

      // Sort the classes sequentially
      const sortedGrouped = {};
      Object.keys(grouped)
        .sort((a, b) => getClassRank(a) - getClassRank(b))
        .forEach(k => {
          sortedGrouped[k] = grouped[k];
        });

      // Dynamically import PDF components to keep initial bundle size small
      const { pdf } = await import("@react-pdf/renderer");
      const StudentClassListTemplate = (await import("@/templates/pdf/StudentClassListTemplate")).default;

      const doc = <StudentClassListTemplate groupedStudents={sortedGrouped} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Student_List_${selectedClassPDF.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF Downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Header & Controls */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">শিক্ষার্থী তালিকা</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total {students.length} students found in the database.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* PDF Download Section */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <select
              value={selectedClassPDF}
              onChange={(e) => setSelectedClassPDF(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 min-w-[120px]"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleDownloadClassList}
              disabled={isGeneratingPDF || students.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors shadow-sm whitespace-nowrap"
            >
              {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Name, ID or Number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Student Info</th>
                <th className="px-6 py-4 font-medium">Student ID</th>
                <th className="px-6 py-4 font-medium">Class & Roll</th>
                <th className="px-6 py-4 font-medium">Contact Number</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading students data...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No students found.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      {student.photoURL ? (
                        <img src={student.photoURL} alt={student.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <CopyableText text={student.fullName} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CopyableText text={student.studentId} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Class {student.class}</span> <span className="mx-1 text-slate-400">•</span> Roll {student.rollNumber}
                    </td>
                    <td className="px-6 py-4">
                      <CopyableText text={student.contactNumber} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/students/details/${student.id}`} className="inline-flex p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/students/edit/${student.id}`} className="inline-flex p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(student.id)} className="inline-flex p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}