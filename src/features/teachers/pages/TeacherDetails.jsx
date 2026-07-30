import React, { useState, useEffect, useRef } from "react";
import { getTeachers, getTeacherAttendance, getTeacherSalaries, deleteTeacherSalary, updateTeacherSalaryRecord } from "../services/teacherService";
import { Search, UserCircle, CalendarDays, Wallet, ChevronDown, Edit, Trash2, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal"; // <--- Import our new Modal

export default function TeacherDetails() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState(null);
  
  const [attendance, setAttendance] = useState([]);
  const [salaries, setSalaries] = useState([]);

  // Editing State
  const [editRecord, setEditRecord] = useState(null);
  const [editBase, setEditBase] = useState("");
  const [editBonus, setEditBonus] = useState("");
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchTeachers();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTeachers = async () => {
    const data = await getTeachers();
    setTeachers(data);
  };

  const loadTeacherData = async (teacherId) => {
    const info = teachers.find(t => t.teacherId === String(teacherId));
    setTeacherInfo(info || null);

    if (info) {
      const attData = await getTeacherAttendance(teacherId);
      setAttendance(attData.sort((a, b) => new Date(b.date) - new Date(a.date))); 
      
      const salData = await getTeacherSalaries(teacherId);
      setSalaries(salData.sort((a, b) => b.month.localeCompare(a.month)));
    }
  };

  const handleSelectTeacher = (id) => {
    setSelectedTeacherId(id);
    setIsDropdownOpen(false);
  };

  const handleSearch = () => {
    if (selectedTeacherId) loadTeacherData(selectedTeacherId);
  };

  // Trigger Delete Modal
  const openDeleteModal = (month) => {
    setSalaryToDelete(month);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Action
  const confirmDeleteSalary = async () => {
    if (!salaryToDelete) return;
    try {
      await deleteTeacherSalary(salaryToDelete, selectedTeacherId);
      toast.success("Salary record deleted successfully!");
      setIsDeleteModalOpen(false);
      setSalaryToDelete(null);
      loadTeacherData(selectedTeacherId); // Refresh Data
    } catch(err) {
      toast.error("Failed to delete record.");
    }
  };

  // Save Edit
  const saveEdit = async (month) => {
    const base = Number(editBase);
    const bonus = Number(editBonus);
    const total = base + bonus;

    try {
      await updateTeacherSalaryRecord(month, selectedTeacherId, { baseSalary: base, bonus: bonus, totalAmount: total });
      toast.success("Salary updated successfully!");
      setEditRecord(null);
      loadTeacherData(selectedTeacherId);
    } catch(err) {
      toast.error("Failed to update salary.");
    }
  };

  const totalPresents = attendance.filter(a => a.status === "P").length;
  const totalAbsents = attendance.filter(a => a.status === "A").length;
  const totalEarned = salaries.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
  
  const selectedTeacherName = selectedTeacherId ? teachers.find(t => t.teacherId === selectedTeacherId)?.englishName : "Select a Teacher...";

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1a2235] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-600" /> Teacher Profile & History
            </h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto relative" ref={dropdownRef}>
            
            <div className="relative w-full md:w-72">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex justify-between items-center bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-blue-500/50 text-slate-800 dark:text-white p-3 rounded-xl font-medium transition-colors hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <span className="truncate">{selectedTeacherName}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto custom-scrollbar">
                  <div onClick={() => handleSelectTeacher("")} className="px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-blue-600 dark:hover:text-white cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50">
                    Clear Selection
                  </div>
                  {teachers.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => handleSelectTeacher(t.teacherId)} 
                      className="px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-600 dark:hover:text-white cursor-pointer transition-colors"
                    >
                      {t.teacherId} - {t.englishName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md shadow-blue-500/20">Search</button>
          </div>
        </div>

        {teacherInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1a2235] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                <UserCircle className="w-20 h-20 text-blue-200 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{teacherInfo.englishName}</h2>
                <p className="text-slate-500 font-medium">{teacherInfo.bengaliName}</p>
                <span className="mt-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-1 rounded-full text-sm font-bold border border-blue-100 dark:border-blue-800">
                  ID: {teacherInfo.teacherId}
                </span>
              </div>
              <div className="pt-6 space-y-4">
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Phone:</span> <span className="font-bold text-slate-900 dark:text-white">{teacherInfo.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Address:</span> <span className="font-bold text-right max-w-[150px] text-slate-900 dark:text-white">{teacherInfo.address}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Base Salary:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">৳ {teacherInfo.salary}</span></div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#1a2235] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-[#1e293b]">
                  <Wallet className="w-5 h-5 text-slate-500" />
                  <h3 className="font-bold text-slate-800 dark:text-white">Salary & Bonus History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-4">Month</th>
                        <th className="p-4 text-right">Base Salary</th>
                        <th className="p-4 text-right">Bonus</th>
                        <th className="p-4 text-right">Total Paid</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {salaries.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/50 transition-colors">
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{s.month}</td>
                          
                          {editRecord === s.month ? (
                            <>
                              <td className="p-4 text-right">
                                <input type="number" value={editBase} onChange={e=>setEditBase(e.target.value)} className="w-24 p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-[#151c2c] dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </td>
                              <td className="p-4 text-right">
                                <input type="number" value={editBonus} onChange={e=>setEditBonus(e.target.value)} className="w-24 p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-[#151c2c] dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </td>
                              <td className="p-4 text-right font-bold text-blue-500">৳ {Number(editBase) + Number(editBonus)}</td>
                              <td className="p-4 flex justify-center gap-2">
                                <button onClick={() => saveEdit(s.month)} className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-2 rounded-lg transition-colors"><Check className="w-5 h-5"/></button>
                                <button onClick={() => setEditRecord(null)} className="text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 text-right text-slate-600 dark:text-slate-300">৳ {Number(s.baseSalary).toLocaleString()}</td>
                              <td className="p-4 text-right text-orange-500 font-medium">+ ৳ {Number(s.bonus).toLocaleString()}</td>
                              <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">৳ {Number(s.totalAmount).toLocaleString()}</td>
                              <td className="p-4 flex justify-center gap-2">
                                <button onClick={() => { setEditRecord(s.month); setEditBase(s.baseSalary); setEditBonus(s.bonus); }} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => openDeleteModal(s.month)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {salaries.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400">No payment records found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Render the Custom Bottom Glassmorphism Confirm Modal */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteSalary}
        title="Delete Salary Record"
        message={`Are you sure you want to permanently delete the salary record for ${salaryToDelete}? This action cannot be undone.`}
      />
    </>
  );
}