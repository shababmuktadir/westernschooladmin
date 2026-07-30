import React, { useState, useEffect } from "react";
import { getTeachers, saveTeacher, deleteTeacher } from "../services/teacherService";
import { Users, Edit, Trash2, UserPlus, Phone, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export default function TeacherDirectory() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ teacherId: "", englishName: "", bengaliName: "", phone: "", address: "", salary: "" });

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
      await saveTeacher(formData);
      toast.success("Teacher saved successfully!");
      setFormData({ teacherId: "", englishName: "", bengaliName: "", phone: "", address: "", salary: "" });
      fetchTeachers();
    } catch (err) {
      toast.error("Failed to save teacher.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      await deleteTeacher(id);
      toast.success("Teacher Deleted!");
      fetchTeachers();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" /> Teacher Directory & Accounts
        </h1>
        <p className="text-sm text-slate-500 mt-1">শিক্ষকদের প্রোফাইল ডাটাবেস পরিচালনা করুন।</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit Form */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <UserPlus className="w-5 h-5 text-indigo-500" /> Add / Edit Teacher
          </h2>
          <form onSubmit={handleSaveTeacher} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Teacher ID</label>
              <input type="number" placeholder="e.g. 1" value={formData.teacherId} onChange={e=>setFormData({...formData, teacherId: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Name (English)</label>
              <input type="text" placeholder="Full Name" value={formData.englishName} onChange={e=>setFormData({...formData, englishName: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Name (Bengali)</label>
              <input type="text" placeholder="নাম (বাংলায়)" value={formData.bengaliName} onChange={e=>setFormData({...formData, bengaliName: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
              <input type="text" placeholder="01XXX..." value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
              <textarea placeholder="Present Address" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Monthly Salary (৳)</label>
              <input type="number" placeholder="e.g. 15000" value={formData.salary} onChange={e=>setFormData({...formData, salary: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors">
              Save Profile
            </button>
          </form>
        </div>

        {/* Teachers List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">All Teachers</h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">Total: {teachers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">Teacher Name</th>
                  <th className="p-4 font-semibold">Contact Info</th>
                  <th className="p-4 font-semibold text-right">Salary (৳)</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{t.teacherId}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{t.englishName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.bengaliName}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 mb-1">
                        <Phone className="w-3.5 h-3.5" /> <span>{t.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[120px]">{t.address || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">
                      {Number(t.salary).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setFormData(t)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
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
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No teachers found in directory.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}