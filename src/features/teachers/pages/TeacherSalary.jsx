import React, { useState, useEffect } from "react";
import { getTeachers, getSalariesByMonth, payTeacherSalary, deleteAllSalariesByMonth } from "../services/teacherService";
import { sendSMS } from "@/features/sms/services/smsService"; 
import { Banknote, Printer, CheckCircle, ToggleLeft, ToggleRight, FileSearch, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalarySheetTemplate from "@/templates/pdf/SalarySheetTemplate";
import ConfirmModal from "@/components/ui/ConfirmModal"; 

export default function TeacherSalary() {
  const [teachers, setTeachers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [paidRecords, setPaidRecords] = useState([]);
  
  // Inputs State
  const [baseInputs, setBaseInputs] = useState({});
  const [bonusInputs, setBonusInputs] = useState({});
  const [customMonths, setCustomMonths] = useState({}); // <--- Individual Teacher Month State
  
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
    
    if (selectedMonth) {
      const sData = await getSalariesByMonth(selectedMonth);
      setPaidRecords(sData);
    } else {
      setPaidRecords([]);
    }
  };

  const handlePay = async (teacher) => {
    // Determine the month to pay for (row-specific month or global month fallback)
    const payMonth = customMonths[teacher.teacherId] || selectedMonth;
    if (!payMonth) return toast.error("Please select a valid month for this teacher!");

    const customBase = baseInputs[teacher.teacherId];
    const finalBase = customBase !== undefined ? Number(customBase) : Number(teacher.salary || 0);
    const bonus = showBonusColumn ? Number(bonusInputs[teacher.teacherId] || 0) : 0;
    const total = finalBase + bonus;

    if (finalBase === 0) return toast.error("Base salary cannot be 0!");

    const salaryData = {
      teacherId: teacher.teacherId,
      name: teacher.englishName,
      month: payMonth, // <--- Using the specific payMonth
      baseSalary: finalBase,
      bonus: bonus,
      totalAmount: total
    };

    try {
      await payTeacherSalary(salaryData);
      toast.success(`${teacher.englishName}'s salary for ${payMonth} saved!`);

      if (teacher.phone) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB');
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const monthName = new Date(payMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const smsMsg = `Dear ${teacher.englishName}, your salary for ${monthName} has been paid. Amount: ${total} Tk. Date: ${dateStr}, Time: ${timeStr}. - Western School`;
        
        const smsRes = await sendSMS(teacher.phone, smsMsg);
        if (smsRes.success) {
          toast.success(`SMS successfully sent to ${teacher.phone}`);
        } else {
          toast.error(`SMS Failed: ${smsRes.error || "Unknown Error"}`);
        }
      }

      setBonusInputs({ ...bonusInputs, [teacher.teacherId]: "" });
      fetchData(); // Refresh data to show changes
    } catch (error) {
      toast.error("Failed to process payment.");
    }
  };

  const confirmDeleteAll = async () => {
    if (!selectedMonth) return;
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

          <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#1a2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-20">
            
            {/* Native Input Month Picker */}
            <div className="w-full md:w-48">
              <input 
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCustomMonths({}); // Reset individual month overrides when global month changes
                }}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#151c2c] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
              />
            </div>
            
            <button 
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={paidRecords.length === 0 || !selectedMonth}
              className="bg-red-50 hover:bg-red-100 dark:bg-[#1e293b] dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-red-200 dark:border-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              title="Delete all salaries for this month"
            >
              <Trash2 className="w-5 h-5"/>
            </button>

            <button 
              onClick={() => setShowPreview(!showPreview)}
              disabled={!selectedMonth}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-blue-900/30 text-slate-700 dark:text-blue-400 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-transparent dark:border-blue-500/30 hover:shadow-sm disabled:opacity-50"
            >
              <FileSearch className="w-4 h-4"/> Preview
            </button>

            {paidRecords.length > 0 && selectedMonth ? (
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
        {showPreview && paidRecords.length > 0 && selectedMonth && (
          <div className="mb-8 p-8 bg-white rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4 overflow-x-auto relative z-10">
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
        <div className="bg-white dark:bg-[#1a2235] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 font-semibold">Teacher Info</th>
                  <th className="p-4 font-semibold text-center">Pay Month</th>
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
                      
                      {/* Teacher Info */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{t.englishName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">ID: {t.teacherId}</p>
                      </td>

                      {/* Pay Month Selector (Custom for each row) */}
                      <td className="p-4 text-center">
                        {alreadyPaid ? (
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {new Date((paidData.month) + "-01").toLocaleDateString('en-US', {month: 'short', year: 'numeric'})}
                          </span>
                        ) : (
                          <input 
                            type="month"
                            value={customMonths[t.teacherId] || selectedMonth}
                            onChange={(e) => setCustomMonths({...customMonths, [t.teacherId]: e.target.value})}
                            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        )}
                      </td>
                      
                      {/* Base Salary */}
                      <td className="p-4 text-right">
                        {alreadyPaid ? (
                          <span className="font-bold text-slate-700 dark:text-slate-300">৳ {Number(paidData.baseSalary).toLocaleString()}</span>
                        ) : (
                          <input 
                            type="number" 
                            placeholder="Base" 
                            disabled={!selectedMonth}
                            value={baseInputs[t.teacherId] !== undefined ? baseInputs[t.teacherId] : (t.salary || "")}
                            onChange={(e) => setBaseInputs({...baseInputs, [t.teacherId]: e.target.value})}
                            className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl w-32 text-right bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50"
                          />
                        )}
                      </td>
                      
                      {/* Bonus */}
                      {showBonusColumn && (
                        <td className="p-4 text-right">
                          {alreadyPaid ? (
                            <span className="font-bold text-orange-500">৳ {Number(paidData.bonus).toLocaleString()}</span>
                          ) : (
                            <input 
                              type="number" 
                              placeholder="Optional" 
                              disabled={!selectedMonth}
                              value={bonusInputs[t.teacherId] || ""}
                              onChange={(e) => setBonusInputs({...bonusInputs, [t.teacherId]: e.target.value})}
                              className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl w-28 text-right bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50"
                            />
                          )}
                        </td>
                      )}
                      
                      {/* Action / Status */}
                      <td className="p-4 text-center">
                        {alreadyPaid ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs border border-emerald-200 dark:border-emerald-800 shadow-sm">
                            <CheckCircle className="w-4 h-4" /> PAID (৳ {paidData.totalAmount})
                          </span>
                        ) : (
                          <button 
                            onClick={() => handlePay(t)}
                            disabled={!selectedMonth}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white px-8 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-2 mx-auto"
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
                    <td colSpan={showBonusColumn ? 5 : 4} className="p-8 text-center text-slate-500">
                      No teachers found in the directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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