import React, { useState, useEffect } from "react";
import { getTeachers, saveTeacher, deleteTeacher, getTeacherSalaries } from "../services/teacherService";
import { Users, Edit, Trash2, UserPlus, Phone, MapPin, Briefcase, UserCheck, UserX, Eye, X, Banknote, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";

const initialFormState = { 
  teacherId: "", 
  englishName: "", 
  bengaliName: "", 
  phone: "", 
  address: "", 
  salary: "", 
  category: "Teacher", 
  gender: "Male",
  status: "Active",
  joinYear: "",
  resignYear: "",
  originalId: null,
  sortOrder: 999999 // Default sort order
};

export default function TeacherDirectory() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  // View Modal States
  const [viewTeacher, setViewTeacher] = useState(null);
  const [teacherSalaries, setTeacherSalaries] = useState([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    const data = await getTeachers();
    // sortOrder অনুযায়ী সাজানো হচ্ছে, যাতে স্যালারি পেজের সিরিয়াল ঠিক থাকে
    setTeachers(data.sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : 999999;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return parseInt(a.teacherId) - parseInt(b.teacherId);
    }));
    setLoading(false);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      // sortOrder যেন হারিয়ে না যায় তা নিশ্চিত করা হচ্ছে
      const dataToSave = { ...formData };
      await saveTeacher(dataToSave, formData.originalId); 
      toast.success(formData.originalId ? "Profile Updated & Synced!" : "Account Created Successfully!");
      setFormData(initialFormState);
      fetchTeachers();
    } catch (err) {
      toast.error("Failed to save.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this account? All associated salaries and attendance will also be deleted from the database.")) {
      toast.loading("Deleting account and records...", { id: "del" });
      try {
        await deleteTeacher(id);
        toast.success("Account and all records completely deleted!", { id: "del" });
        fetchTeachers();
      } catch (error) {
        toast.error("Failed to delete.", { id: "del" });
      }
    }
  };

  const handleViewDetails = async (teacher) => {
    setViewTeacher(teacher);
    try {
      const salaries = await getTeacherSalaries(teacher.teacherId);
      // নতুন স্যালারিগুলো উপরে দেখানোর জন্য সর্ট করা
      salaries.sort((a, b) => new Date(b.paidAt || b.month) - new Date(a.paidAt || a.month));
      setTeacherSalaries(salaries);
    } catch (error) {
      toast.error("Failed to fetch salary records.");
    }
  };

  return (
    <div className="max-w-[90rem] mx-auto p-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="w-8 h-8 text-indigo-600" /> Directory & Accounts
        </h1>
        <p className="text-slate-500 mt-2">শিক্ষক এবং স্টাফদের প্রোফাইল ডাটাবেস পরিচালনা করুন।</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- ADD / EDIT FORM --- */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit sticky top-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserPlus className="w-5 h-5 text-indigo-500" /> {formData.originalId ? "Edit & Update Profile" : "Create New Account"}
          </h2>
          <form onSubmit={handleSaveTeacher} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value="Teacher">Teacher</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                <select value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">System ID <span className="text-red-500">*</span></label>
                <input type="number" placeholder="e.g. 101" value={formData.teacherId} onChange={e=>setFormData({...formData, teacherId: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Base Salary (৳)</label>
                <input type="number" placeholder="Amount" value={formData.salary} onChange={e=>setFormData({...formData, salary: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Full Name (English) <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Enter full name" value={formData.englishName} onChange={e=>setFormData({...formData, englishName: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  <option value="Active" className="text-emerald-600">Active</option>
                  <option value="Ex-Teacher" className="text-red-500">Ex-Teacher/Staff</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Joining Year</label>
                <input type="number" placeholder="e.g. 2020" value={formData.joinYear} onChange={e=>setFormData({...formData, joinYear: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>

            {formData.status === "Ex-Teacher" && (
              <div className="animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-red-500 uppercase">Resign/Leave Year</label>
                <input type="number" placeholder="e.g. 2024" value={formData.resignYear} onChange={e=>setFormData({...formData, resignYear: e.target.value})} className="w-full p-2.5 mt-1.5 border border-red-300 dark:border-red-700/50 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 focus:ring-2 focus:ring-red-500 outline-none transition-all" required />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <input type="text" placeholder="01XXXXXXXXX" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                <textarea rows="2" placeholder="Full address..." value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full p-2.5 mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/30">
                {formData.originalId ? "Update Database Record" : "Save to Database"}
              </button>
              
              {formData.originalId && (
                <button type="button" onClick={() => setFormData(initialFormState)} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-colors">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* --- DIRECTORY LIST --- */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2235] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#151c2c]">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Database Directory</h2>
            <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800/50">
              Total Staff: {teachers.length}
            </span>
          </div>
          <div className="overflow-x-auto max-h-[800px] custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-400 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-semibold">Profile</th>
                  <th className="p-4 font-semibold">Contact & Info</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 shadow-inner">
                          {t.teacherId}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{t.englishName}</p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{t.category || "Teacher"} • {t.gender || "Male"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <Phone className="w-3.5 h-3.5" /> <span>{t.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                        <Briefcase className="w-3.5 h-3.5" /> <span>Joined: {t.joinYear || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {(t.status === "Ex-Teacher" || t.status === "Resigned") ? (
                         <div className="flex flex-col items-center">
                           <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                             <UserX className="w-3 h-3"/> Ex-{t.category || "Staff"}
                           </span>
                           <span className="text-[10px] text-slate-500 mt-1 font-bold">Left: {t.resignYear || "N/A"}</span>
                         </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-emerald-200 dark:border-emerald-800">
                          <UserCheck className="w-3 h-3"/> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => handleViewDetails(t)} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="View Full Profile & Salaries"
                        >
                          <Eye className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={() => setFormData({ ...initialFormState, ...t, originalId: t.teacherId })} 
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit Profile"
                        >
                          <Edit className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-500">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- VIEW PROFILE MODAL --- */}
      {viewTeacher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setViewTeacher(null)}></div>
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-[#151c2c] rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">
                  {viewTeacher.teacherId}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewTeacher.englishName}</h2>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{viewTeacher.category || "Teacher"} • Base Salary: ৳{viewTeacher.salary || 0}</p>
                </div>
              </div>
              <button onClick={() => setViewTeacher(null)} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-full transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              
              {/* Personal Info Grid */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Personal Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Gender</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{viewTeacher.gender || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Phone className="w-3 h-3"/> Phone</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{viewTeacher.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Briefcase className="w-3 h-3"/> Joining Year</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{viewTeacher.joinYear || "N/A"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><MapPin className="w-3 h-3"/> Address</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{viewTeacher.address || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Salary History Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Banknote className="w-4 h-4"/> Salary History
                </h3>
                {teacherSalaries.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="p-3 font-semibold">Month</th>
                          <th className="p-3 font-semibold text-right">Base</th>
                          <th className="p-3 font-semibold text-right">Bonus</th>
                          <th className="p-3 font-semibold text-right">Total Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {teacherSalaries.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-slate-400"/> {s.month}
                            </td>
                            <td className="p-3 text-right">৳{s.baseSalary}</td>
                            <td className="p-3 text-right text-orange-500">৳{s.bonus || 0}</td>
                            <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">৳{s.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                    <Banknote className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-500 font-medium">No salary history found in the database.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}