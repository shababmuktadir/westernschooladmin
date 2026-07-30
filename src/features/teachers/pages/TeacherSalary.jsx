import React, { useState, useEffect } from "react";
import { getTeachers, getSalariesByMonth, payTeacherSalary, deleteAllSalariesByMonth } from "../services/teacherService";
import { Banknote, Printer, CheckCircle, ToggleLeft, ToggleRight, FileSearch, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalarySheetTemplate from "@/templates/pdf/SalarySheetTemplate";
import ConfirmModal from "@/components/ui/ConfirmModal"; // <--- Import Glassmorphism Modal

export default function TeacherSalary() {
  const [teachers, setTeachers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [paidRecords, setPaidRecords] = useState([]);
  const [bonusInputs, setBonusInputs] = useState({});
  const [showBonusColumn, setShowBonusColumn] = useState(false); 
  const [showPreview, setShowPreview] = useState(false); 
  
  // Delete All Modal State
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    const tData = await getTeachers();
    setTeachers(tData.sort((a, b) => parseInt(a.teacherId) - parseInt(b.teacherId)));
    const sData = await getSalariesByMonth(selectedMonth);
    setPaidRecords(sData);
  };

  const handlePay = async (teacher) => {
    const bonus = showBonusColumn ? Number(bonusInputs[teacher.teacherId] || 0) : 0;
    const base = Number(teacher.salary || 0);
    const total = base + bonus;

    if (base === 0) return toast.error("Base salary is not set for this teacher!");

    const salaryData = {
      teacherId: teacher.teacherId,
      name: teacher.englishName,
      month: selectedMonth,
      baseSalary: base,
      bonus: bonus,
      totalAmount: total
    };

    try {
      await payTeacherSalary(salaryData);
      toast.success(`${teacher.englishName} paid!`);
      setBonusInputs({ ...bonusInputs, [teacher.teacherId]: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to pay salary.");
    }
  };

  // Delete All Function
  const confirmDeleteAll = async () => {
    try {
      await deleteAllSalariesByMonth(selectedMonth);
      toast.success(`All salary records for ${selectedMonth} have been deleted!`);
      setIsDeleteAllModalOpen(false);
      fetchData(); // Refresh Data
    } catch (error) {
      toast.error("Failed to delete records.");
    }
  };

  const isPaid = (teacherId) => paidRecords.some(r => r.teacherId === teacherId);

  const totals = {
    base: paidRecords.reduce((acc, curr) => acc + Number(curr.baseSalary), 0),
    bonus: paidRecords.reduce((acc, curr) => acc + Number(curr.bonus), 0),
    grand: paidRecords.reduce((acc, curr) => acc + Number(curr.totalAmount), 0)
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Banknote className="w-6 h-6 text-emerald-600" /> Salary Management
            </h1>
            <button 
              onClick={() => setShowBonusColumn(!showBonusColumn)}
              className="flex items-center gap-2 mt-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg transition-colors"
            >
              {showBonusColumn ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
              {showBonusColumn ? "Bonus Column Enabled" : "Enable Bonus Column"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#1a2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            
            {/* Month Picker */}
            <div className="relative">
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2.5 border border-slate-300 dark:border-blue-500/50 rounded-xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
              />
            </div>
            
            {/* Delete All Button */}
            <button 
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={paidRecords.length === 0}
              className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-red-200 dark:border-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete all salaries for this month"
            >
              <Trash2 className="w-4 h-4"/>
            </button>

            {/* Preview Button */}
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-blue-900/30 text-slate-700 dark:text-blue-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-transparent dark:border-blue-500/30"
            >
              <FileSearch className="w-4 h-4"/> Preview
            </button>

            {/* Print/PDF Button */}
            {paidRecords.length > 0 ? (
              <PDFDownloadLink
                document={<SalarySheetTemplate records={paidRecords} month={selectedMonth} totals={totals} showBonus={showBonusColumn} />}
                fileName={`Salary_Report_${selectedMonth}.pdf`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                {({ loading }) => (loading ? "Generating..." : <><Printer className="w-4 h-4"/> Get PDF</>)}
              </PDFDownloadLink>
            ) : (
              <button disabled className="bg-slate-300 dark:bg-slate-700 text-slate-500 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed">
                <Printer className="w-4 h-4"/> Get PDF
              </button>
            )}
          </div>
        </div>

        {/* --- LIVE PREVIEW SECTION --- */}
        {showPreview && paidRecords.length > 0 && (
          <div className="mb-8 p-8 bg-white rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4">
            <div className="text-center mb-6 pb-6 border-b-2 border-slate-800">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider font-serif">Western School and College</h2>
              <h3 className="text-lg font-bold text-slate-700 mt-1">TEACHERS SALARY REPORT</h3>
              <p className="text-slate-500">Billing Month: {new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <table className="w-full text-left text-sm border-collapse border border-slate-300 text-black">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 border border-slate-300">ID</th>
                  <th className="p-3 border border-slate-300">Teacher Name</th>
                  <th className="p-3 border border-slate-300 text-right">Base Salary</th>
                  {showBonusColumn && <th className="p-3 border border-slate-300 text-right">Bonus</th>}
                  <th className="p-3 border border-slate-300 text-right font-bold">Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {paidRecords.map((r, i) => (
                  <tr key={i}>
                    <td className="p-3 border border-slate-300">{r.teacherId}</td>
                    <td className="p-3 border border-slate-300">{r.name}</td>
                    <td className="p-3 border border-slate-300 text-right">৳ {r.baseSalary}</td>
                    {showBonusColumn && <td className="p-3 border border-slate-300 text-right">৳ {r.bonus}</td>}
                    <td className="p-3 border border-slate-300 text-right font-bold">৳ {r.totalAmount}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold text-lg">
                  <td colSpan={showBonusColumn ? 4 : 3} className="p-4 border border-slate-300 text-right">GRAND TOTAL:</td>
                  <td className="p-4 border border-slate-300 text-right text-emerald-600">৳ {totals.grand.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Main Action Table */}
        <div className="bg-white dark:bg-[#1a2235] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-4">Teacher Name & ID</th>
                <th className="p-4 text-right">Base Salary</th>
                {showBonusColumn && <th className="p-4 text-right">Add Bonus</th>}
                <th className="p-4 text-center">Action / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {teachers.map(t => {
                const alreadyPaid = isPaid(t.teacherId);
                return (
                  <tr key={t.id} className={alreadyPaid ? "bg-slate-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-[#1e293b]/50 transition-colors"}>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{t.englishName}</p>
                      <p className="text-xs text-slate-500">ID: {t.teacherId}</p>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">৳ {Number(t.salary || 0).toLocaleString()}</td>
                    
                    {showBonusColumn && (
                      <td className="p-4 text-right">
                        <input 
                          type="number" 
                          placeholder="Bonus ৳" 
                          disabled={alreadyPaid}
                          value={bonusInputs[t.teacherId] || ""}
                          onChange={(e) => setBonusInputs({...bonusInputs, [t.teacherId]: e.target.value})}
                          className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg w-32 text-right bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                        />
                      </td>
                    )}
                    
                    <td className="p-4 text-center">
                      {alreadyPaid ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-4 h-4" /> PAID
                        </span>
                      ) : (
                        <button 
                          onClick={() => handlePay(t)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs transition-colors shadow-md shadow-blue-500/20"
                        >
                          PAY NOW
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render the Custom Bottom Glassmorphism Confirm Modal for Delete All */}
      <ConfirmModal 
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={confirmDeleteAll}
        title="Delete ALL Salary Records?"
        message={`Are you absolutely sure you want to delete EVERY salary record for the month of ${selectedMonth}? This action cannot be undone.`}
      />
    </>
  );
}