import React, { useState, useEffect } from "react";
import { getTeachers, saveTeacher, deleteTeacher } from "../services/teacherService";
import { Users, Edit, Trash2, UserPlus, Phone, MapPin, Briefcase, UserCheck, UserX } from "lucide-react";
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
  originalId: null 
};

export default function TeacherDirectory() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    const data = await getTeachers();
    setTeachers(data.sort((a, b) => parseInt(a.teacherId) - parseInt(b.teacherId)));
    setLoading(false);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      await saveTeacher(formData, formData.originalId); 
      toast.success(formData.originalId ? "Profile Updated!" : "Saved successfully!");
      setFormData(initialFormState);
      fetchTeachers();
    } catch (err) {
      toast.error("Failed to save.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      await deleteTeacher(id);
      toast.success("Deleted!");
      fetchTeachers();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" /> Directory & Accounts
        </h1>
        <p className="text-sm text-slate-500 mt-1">শিক্ষক এবং স্টাফদের প্রোফাইল ডাটাবেস পরিচালনা করুন।</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit Form */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <UserPlus className="w-5 h-5 text-indigo-500" /> {formData.originalId ? "Edit Profile" : "Add Account"}
          </h2>
          <form onSubmit={handleSaveTeacher} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Teacher">Teacher</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                <select value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">ID</label>
                <input type="number" placeholder="e.g. 1" value={formData.teacherId} onChange={e=>setFormData({...formData, teacherId: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Monthly Salary</label>
                <input type="number" placeholder="৳ Amount" value={formData.salary} onChange={e=>setFormData({...formData, salary: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Name (English)</label>
              <input type="text" placeholder="Full Name" value={formData.englishName} onChange={e=>setFormData({...formData, englishName: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Active" className="text-emerald-600">Active</option>
                  <option value="Ex-Teacher" className="text-red-500">Ex-Teacher/Staff</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Joining Year</label>
                <input type="number" placeholder="e.g. 2020" value={formData.joinYear} onChange={e=>setFormData({...formData, joinYear: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            {formData.status === "Ex-Teacher" && (
              <div className="animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-red-500 uppercase">Resign/Leave Year</label>
                <input type="number" placeholder="e.g. 2024" value={formData.resignYear} onChange={e=>setFormData({...formData, resignYear: e.target.value})} className="w-full p-2.5 mt-1 border border-red-300 dark:border-red-700/50 rounded-lg bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-500 outline-none" required />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
              <input type="text" placeholder="01XXX..." value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors shadow-md">
                {formData.originalId ? "Update Profile" : "Save Profile"}
              </button>
              
              {formData.originalId && (
                <button type="button" onClick={() => setFormData(initialFormState)} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold transition-colors">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Directory List</h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">Total: {teachers.length}</span>
          </div>
          <div className="overflow-x-auto max-h-[700px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-semibold">Profile</th>
                  <th className="p-4 font-semibold">Contact & Info</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          {t.teacherId}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{t.englishName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.category || "Teacher"} • {t.gender || "Male"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 mb-1">
                        <Phone className="w-3.5 h-3.5" /> <span>{t.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          <UserCheck className="w-3 h-3"/> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setFormData({ ...initialFormState, ...t, originalId: t.teacherId })} 
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit"
                        >
                          <Edit className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-500">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}