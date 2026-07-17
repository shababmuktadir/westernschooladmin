import { useState, useEffect } from "react";
import { getStudents } from "@/features/students/services/studentService";
// আপনার বর্তমান ফোল্ডার (pages) থেকে এক ধাপ উপরে গিয়ে templates ফোল্ডারে যাওয়ার জন্য পাথটি হবে:
// ৪ নম্বর লাইনটি এভাবে পরিবর্তন করুন:
import { TestimonialTemplate, TCTemplate } from "@/templates/pdf/CertificateTemplate";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { appConfig } from "@/config/appConfig";
import { FileBadge, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Certificates() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("testimonial");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    tcNo: "",
    dueDate: "",
    presentAddress: "",
    permanentAddress: ""
  });

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await getStudents();
      setStudents(data.filter(s => s.status !== "Inactive"));
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const handleStudentChange = (e) => {
    const id = e.target.value;
    setSelectedStudentId(id);
    const student = students.find(s => s.id === id);
    if(student) {
      setFormData(prev => ({
        ...prev,
        presentAddress: student.address || "",
        permanentAddress: student.address || ""
      }));
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">সনদপত্র ও ট্রান্সফার সার্টিফিকেট</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">শিক্ষার্থীর প্রয়োজনীয় সনদপত্র তৈরি ও ডাউনলোড করুন।</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 mb-6">
            <button 
              onClick={() => setActiveTab("testimonial")}
              className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === "testimonial" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              প্রত্যয়ন পত্র (Testimonial)
            </button>
            <button 
              onClick={() => setActiveTab("tc")}
              className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === "tc" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              ট্রান্সফার সার্টিফিকেট (TC)
            </button>
          </div>

          <div className="space-y-5">
            {/* Common Field: Student Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">শিক্ষার্থী নির্বাচন করুন <span className="text-red-500">*</span></label>
              <select 
                value={selectedStudentId} 
                onChange={handleStudentChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" className="dark:bg-slate-800">-- শিক্ষার্থী খুঁজুন --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-800">
                    {s.studentId} - {s.fullName} (Class: {s.class})
                  </option>
                ))}
              </select>
            </div>

            {/* Form for Testimonial */}
            {activeTab === "testimonial" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ইস্যুর তারিখ</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            )}

            {/* Form for TC */}
            {activeTab === "tc" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">TC Number <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.tcNo} onChange={(e) => setFormData({...formData, tcNo: e.target.value})} placeholder="e.g. 2026/015" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-transparent dark:text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">TC Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-transparent dark:text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date (Fees Paid Up to)</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-transparent dark:text-white outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Present Address</label>
                  <input type="text" value={formData.presentAddress} onChange={(e) => setFormData({...formData, presentAddress: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-transparent dark:text-white outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permanent Address</label>
                  <input type="text" value={formData.permanentAddress} onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-transparent dark:text-white outline-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-6 rounded-xl flex flex-col justify-center items-center text-center shadow-sm">
          <FileBadge className="w-16 h-16 text-blue-500 mb-4" />
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">
            {activeTab === "testimonial" ? "প্রত্যয়ন পত্র" : "ট্রান্সফার সার্টিফিকেট"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">শিক্ষার্থী নির্বাচন করে ফর্ম পূরণ করুন, এরপর পিডিএফ ডাউনলোড করে প্রিন্ট করুন।</p>

          {!selectedStudent ? (
            <button disabled className="w-full bg-slate-300 text-slate-500 px-4 py-2.5 rounded-lg font-medium cursor-not-allowed">
              শিক্ষার্থী নির্বাচন করুন
            </button>
          ) : (activeTab === "tc" && !formData.tcNo) ? (
            <button disabled className="w-full bg-slate-300 text-slate-500 px-4 py-2.5 rounded-lg font-medium cursor-not-allowed">
              TC Number দিন
            </button>
          ) : (
            <PDFDownloadLink
              key={`${selectedStudentId}-${activeTab}-${JSON.stringify(formData)}`}
              document={activeTab === "testimonial" ? 
                <TestimonialTemplate student={selectedStudent} date={formData.date} schoolConfig={appConfig} /> : 
                <TCTemplate student={selectedStudent} formData={formData} schoolConfig={appConfig} />
              }
              fileName={`${activeTab === "tc" ? "TC" : "Testimonial"}_${selectedStudent.studentId}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <button className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center transition shadow-md">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-2" /> পিডিএফ ডাউনলোড করুন</>}
                </button>
              )}
            </PDFDownloadLink>
          )}
        </div>

      </div>
    </div>
  );
}