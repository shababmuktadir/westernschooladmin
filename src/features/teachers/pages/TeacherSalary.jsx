import React, { useState, useEffect } from "react";
import { getTeachers, getSalariesByMonth, payTeacherSalary, deleteAllSalariesByMonth } from "../services/teacherService";
import { sendSMS } from "@/features/sms/services/smsService"; // SMS Service Path
import { Banknote, Printer, CheckCircle, ToggleLeft, ToggleRight, FileSearch, Trash2, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalarySheetTemplate from "@/templates/pdf/SalarySheetTemplate";
import ConfirmModal from "@/components/ui/ConfirmModal"; 

export default function TeacherSalary() {
  const [teachers, setTeachers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [paidRecords, setPaidRecords] = useState([]);
  
  // Inputs State
  const [baseInputs, setBaseInputs] = useState({});
  const [bonusInputs, setBonusInputs] = useState({});
  
  // Toggles & Modals
  const [showBonusColumn, setShowBonusColumn] = useState(false); 
  const [showPreview, setShowPreview] = useState(false); 
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

  // Pay Salary & Auto Send SMS
  const handlePay = async (teacher) => {
    const customBase = baseInputs[teacher.teacherId];
    const finalBase = customBase !== undefined ? Number(customBase) : Number(teacher.salary || 0);
    const bonus = showBonusColumn ? Number(bonusInputs[teacher.teacherId] || 0) : 0;
    const total = finalBase + bonus;

    if (finalBase === 0) return toast.error("Base salary cannot be 0!");

    const salaryData = {
      teacherId: teacher.teacherId,
      name: teacher.englishName,
      month: selectedMonth,
      baseSalary: finalBase,
      bonus: bonus,
      totalAmount: total
    };

    try {
      // 1. Save Salary to Database
      await payTeacherSalary(salaryData);
      toast.success(`${teacher.englishName}'s salary saved!`);

      // 2. Auto Send SMS (Without Confirmation)
      if (teacher.phone) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB');
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const monthName = new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const smsMsg = `Dear ${teacher.englishName}, your salary for ${monthName} has been paid. Amount: ${total} Tk. Date: ${dateStr}, Time: ${timeStr}. - Western School`;
        
        const smsRes = await sendSMS(teacher.phone, smsMsg);
        if (smsRes.success) {
          toast.success(`SMS successfully sent to ${teacher.phone}`);
        } else {
          toast.error(`SMS Failed: ${smsRes.error || "Unknown Error"}`);
          console.error("SMS API Error:", smsRes);
        }
      } else {
        toast.error("No phone number found for SMS.");
      }

      // Clear Inputs and Refresh Table
      setBonusInputs({ ...bonusInputs, [teacher.teacherId]: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to process payment.");
    }
  };

  // Delete All Records
  const confirmDeleteAll = async () => {
    try {
      await deleteAllSalariesByMonth(selectedMonth);
      toast.success(`All salary records for ${selectedMonth} have been deleted!`);
      setIsDeleteAllModalOpen(false);
      fetchData(); 
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
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Banknote className="w-6 h-6 text-emerald-600" /> Salary Management
            </h1>
            <button 
              onClick={() => setShowBonusColumn(!showBonusColumn)}
              className="flex items-center gap-2 mt-3 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50"
            >
              {showBonusColumn ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
              {showBonusColumn ? "Bonus Column Enabled" : "Enable Bonus Column"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#1a2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            
            {/* Custom Styled Month Picker matching your Dark Theme image */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDays className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-10 p-2.5 w-full md:w-48 border border-slate-300 dark:border-blue-500/50 rounded-xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium transition-all hover:border-blue-500 cursor-pointer shadow-sm"
              />
            </div>
            
            <button 
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={paidRecords.length === 0}
              className="bg-red-50 hover:bg-red-100 dark:bg-[#1e293b] dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-red-200 dark:border-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              title="Delete all salaries for this month"
            >
              <Trash2 className="w-5 h-5"/>
            </button>

            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-blue-900/30 text-slate-700 dark:text-blue-400 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-transparent dark:border-blue-500/30 hover:shadow-sm"
            >
              <FileSearch className="w-4 h-4"/> Preview
            </button>

            {paidRecords.length > 0 ? (
              <PDFDownloadLink
                document={<SalarySheetTemplate records={paidRecords} month={selectedMonth} totals={totals} showBonus={showBonusColumn} />}
                fileName={`Salary_Report_${selectedMonth}.pdf`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {({ loading }) => (loading ? "Generating..." : <><Printer className="w-4 h-4"/> Get PDF</>)}
              </PDFDownloadLink>
            ) : (
              <button disabled className="bg-slate-300 dark:bg-slate-700 text-slate-500 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed border border-transparent">
                <Printer className="w-4 h-4"/> Get PDF
              </button>
            )}
          </div>
        </div>

        {/* --- LIVE PREVIEW SECTION --- */}
        {showPreview && paidRecords.length > 0 && (
          <div className="mb-8 p-8 bg-white rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4 overflow-x-auto">
            <div className="text-center mb-6 pb-6 border-b-2 border-slate-800">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider font-serif">Western School and College</h2>
              <h3 className="text-lg font-bold text-slate-700 mt-1">TEACHERS SALARY REPORT</h3>
              <p className="text-slate-500 font-medium mt-1">Billing Month: {new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <table className="w-full text-left text-sm border-collapse border border-slate-300 text-black min-w-[600px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 border border-slate-300 font-bold">ID</th>
                  <th className="p-3 border border-slate-300 font-bold">Teacher Name</th>
                  <th className="p-3 border border-slate-300 text-right font-bold">Base Salary</th>
                  {showBonusColumn && <th className="p-3 border border-slate-300 text-right font-bold">Bonus</th>}
                  <th className="p-3 border border-slate-300 text-right font-bold">Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {paidRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 border border-slate-300">{r.teacherId}</td>
                    <td className="p-3 border border-slate-300 font-medium">{r.name}</td>
                    <td className="p-3 border border-slate-300 text-right">৳ {r.baseSalary}</td>
                    {showBonusColumn && <td className="p-3 border border-slate-300 text-right text-orange-600">৳ {r.bonus}</td>}
                    <td className="p-3 border border-slate-300 text-right font-bold text-emerald-700">৳ {r.totalAmount}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold text-lg">
                  <td colSpan={showBonusColumn ? 4 : 3} className="p-4 border border-slate-300 text-right uppercase">Grand Total:</td>
                  <td className="p-4 border border-slate-300 text-right text-emerald-600">৳ {totals.grand.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* --- MAIN ACTION TABLE --- */}
        <div className="bg-white dark:bg-[#1a2235] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 font-semibold">Teacher Info</th>
                  <th className="p-4 text-right font-semibold">Base Salary ৳</th>
                  {showBonusColumn && <th className="p-4 text-right font-semibold">Bonus ৳</th>}
                  <th className="p-4 text-center font-semibold">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {teachers.map(t => {
                  const alreadyPaid = isPaid(t.teacherId);
                  const paidData = alreadyPaid ? paidRecords.find(r => r.teacherId === t.teacherId) : null;

                  return (
                    <tr key={t.id} className={alreadyPaid ? "bg-slate-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-[#1e293b]/50 transition-colors"}>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{t.englishName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">ID: {t.teacherId}</p>
                      </td>
                      
                      {/* Editable Base Salary */}
                      <td className="p-4 text-right">
                        {alreadyPaid ? (
                          <span className="font-bold text-slate-700 dark:text-slate-300">৳ {Number(paidData.baseSalary).toLocaleString()}</span>
                        ) : (
                          <input 
                            type="number" 
                            placeholder="Base" 
                            value={baseInputs[t.teacherId] !== undefined ? baseInputs[t.teacherId] : (t.salary || "")}
                            onChange={(e) => setBaseInputs({...baseInputs, [t.teacherId]: e.target.value})}
                            className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl w-32 text-right bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-500"
                          />
                        )}
                      </td>
                      
                      {/* Editable Bonus Column */}
                      {showBonusColumn && (
                        <td className="p-4 text-right">
                          {alreadyPaid ? (
                            <span className="font-bold text-orange-500">৳ {Number(paidData.bonus).toLocaleString()}</span>
                          ) : (
                            <input 
                              type="number" 
                              placeholder="Optional" 
                              value={bonusInputs[t.teacherId] || ""}
                              onChange={(e) => setBonusInputs({...bonusInputs, [t.teacherId]: e.target.value})}
                              className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl w-28 text-right bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-500"
                            />
                          )}
                        </td>
                      )}
                      
                      <td className="p-4 text-center">
                        {alreadyPaid ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs border border-emerald-200 dark:border-emerald-800 shadow-sm">
                            <CheckCircle className="w-4 h-4" /> PAID (৳ {paidData.totalAmount})
                          </span>
                        ) : (
                          <button 
                            onClick={() => handlePay(t)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-2 mx-auto"
                          >
                            PAY NOW
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={showBonusColumn ? 4 : 3} className="p-8 text-center text-slate-500">
                      No teachers found in the directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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