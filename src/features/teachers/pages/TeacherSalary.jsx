import React, { useState, useEffect } from "react";
import { 
  getTeachers, getSalariesByMonth, payTeacherSalary, deleteAllSalariesByMonth, 
  getAllSalaries, updateSalaryRecordById, deleteSalaryRecordById
} from "../services/teacherService";
import { sendSMS } from "@/features/sms/services/smsService"; 
import { Banknote, Printer, CheckCircle, ToggleLeft, ToggleRight, FileSearch, Trash2, FileDown, CalendarDays, X, Users, Download, MessageSquare, Edit2, Database } from "lucide-react";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SalarySheetTemplate from "@/templates/pdf/SalarySheetTemplate";
import OrderedSalarySheetTemplate from "@/templates/pdf/OrderedSalarySheetTemplate";
import ConfirmModal from "@/components/ui/ConfirmModal"; 

// --- Custom Tailwind Month Picker Component ---
const CustomMonthPicker = ({ value, onChange, label, placement = "bottom" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(parseInt(value.split('-')[0]));
  const [month, setMonth] = useState(parseInt(value.split('-')[1]));
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleSelect = (selectedYear, selectedMonth) => {
    const formattedMonth = selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth;
    onChange(`${selectedYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  const dropdownClass = placement === "top" 
    ? "absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-4 animate-in slide-in-from-bottom-2"
    : "absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-4 animate-in slide-in-from-top-2";

  return (
    <div className="relative w-full md:w-56">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          {label ? <span className="text-slate-500 mr-1">{label}</span> : null}
          {months[parseInt(value.split('-')[1]) - 1]} {value.split('-')[0]}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className={dropdownClass}>
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setYear(year - 1)} className="p-1 hover:bg-slate-100 dark:bg-[#0f172a] rounded text-slate-600 dark:text-slate-300">◀</button>
              <span className="font-black text-lg text-slate-800 dark:text-white">{year}</span>
              <button onClick={() => setYear(year + 1)} className="p-1 hover:bg-slate-100 dark:bg-[#0f172a] rounded text-slate-600 dark:text-slate-300">▶</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map((m, idx) => (
                <button 
                  key={m}
                  onClick={() => handleSelect(year, idx + 1)}
                  className={`py-2 text-sm font-bold rounded-lg transition-all ${
                    (month === idx + 1 && year === parseInt(value.split('-')[0])) 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "bg-slate-50 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function TeacherSalary() {
  const [activeTab, setActiveTab] = useState("payment"); 

  // --- Payment Tab States ---
  const [teachers, setTeachers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); 
  const [paidRecords, setPaidRecords] = useState([]);
  const [baseInputs, setBaseInputs] = useState({});
  const [bonusInputs, setBonusInputs] = useState({});
  const [customMonths, setCustomMonths] = useState({}); 
  const [showBonusColumn, setShowBonusColumn] = useState(false); 
  const [enableSMS, setEnableSMS] = useState(false); 
  const [showPreview, setShowPreview] = useState(false); 
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  // Print Modal States
  const [printType, setPrintType] = useState(null); 
  const [orderedList, setOrderedList] = useState([]);

  // --- Database Tab States ---
  const [allDatabaseSalaries, setAllDatabaseSalaries] = useState([]);
  const [dbSearchTerm, setDbSearchTerm] = useState("");
  const [editingSalaryRecord, setEditingSalaryRecord] = useState(null);
  const [editForm, setEditForm] = useState({ baseSalary: "", bonus: "" });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  useEffect(() => {
    if (activeTab === "database") {
      fetchDatabaseSalaries();
    }
  }, [activeTab]);

  const fetchData = async () => {
    // getTeachers এখন নতুন লজিক অনুযায়ী (1000+ আগে, ২ ডিজিট পরে) অটো সাজিয়ে আনবে
    const tData = await getTeachers();
    setTeachers(tData);
    
    if (selectedMonth) {
      const sData = await getSalariesByMonth(selectedMonth);
      setPaidRecords(sData);
    } else {
      setPaidRecords([]);
    }
  };

  const fetchDatabaseSalaries = async () => {
    try {
      const allSalaries = await getAllSalaries();
      allSalaries.sort((a, b) => new Date(b.paidAt || b.month) - new Date(a.paidAt || a.month));
      setAllDatabaseSalaries(allSalaries);
    } catch (error) {
      toast.error("Failed to fetch salary database.");
    }
  };

  const isPaid = (teacherId) => paidRecords.some(r => r.teacherId === teacherId);

  // --- PAYMENT LOGIC ---
  const handlePay = async (teacher) => {
    const payMonth = customMonths[teacher.teacherId] || selectedMonth;
    if (!payMonth) return toast.error("Please select a valid month for this teacher!");

    const customBase = baseInputs[teacher.teacherId];
    const finalBase = customBase !== undefined ? Number(customBase) : Number(teacher.salary || 0);
    const bonus = showBonusColumn ? Number(bonusInputs[teacher.teacherId] || 0) : 0;
    const total = finalBase + bonus;

    if (finalBase === 0) return toast.error("Salary amount cannot be 0!");

    const salaryData = {
      teacherId: teacher.teacherId,
      name: teacher.englishName,
      month: payMonth, 
      baseSalary: finalBase,
      bonus: bonus,
      totalAmount: total
    };

    try {
      await payTeacherSalary(salaryData);
      toast.success(`${teacher.englishName}'s salary for ${payMonth} saved!`);

      if (enableSMS && teacher.phone) {
        try {
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-GB');
          const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const monthName = new Date(payMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          
          const smsMsg = `Dear ${teacher.englishName}, your salary for ${monthName} has been paid. Amount: ${total} Tk. Date: ${dateStr}, Time: ${timeStr}. - Western School`;
          await sendSMS(teacher.phone, smsMsg);
          toast.success(`SMS sent to ${teacher.phone}`);
        } catch (smsError) {
          toast.error("Entry saved, but SMS failed.");
        }
      }

      setBonusInputs({ ...bonusInputs, [teacher.teacherId]: "" });
      fetchData(); 
    } catch (error) {
      toast.error("Failed to process payment.");
    }
  };

  const confirmDeleteAll = async () => {
    if (!selectedMonth) return;
    try {
      await deleteAllSalariesByMonth(selectedMonth);
      toast.success(`All records for ${selectedMonth} deleted!`);
      setIsDeleteAllModalOpen(false);
      fetchData(); 
    } catch (error) {
      toast.error("Failed to delete records.");
    }
  };

  // --- DATABASE EDIT/DELETE LOGIC ---
  const handleEditDatabaseRecord = async () => {
    const base = Number(editForm.baseSalary) || 0;
    const bonus = Number(editForm.bonus) || 0;
    
    try {
      await updateSalaryRecordById(editingSalaryRecord.id, {
        baseSalary: base,
        bonus: bonus,
        totalAmount: base + bonus
      });
      toast.success("Salary record updated successfully!");
      setEditingSalaryRecord(null);
      fetchDatabaseSalaries();
      fetchData(); 
    } catch (error) {
      toast.error("Failed to update record.");
    }
  };

  const handleDeleteDatabaseRecord = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this salary record?")) return;
    try {
      await deleteSalaryRecordById(id);
      toast.success("Salary record deleted!");
      fetchDatabaseSalaries();
      fetchData();
    } catch (error) {
      toast.error("Failed to delete record.");
    }
  };

  // --- PRINT MODAL LOGIC ---
  const openPrintModal = (type) => {
    if (type === 'paid') {
      const paidStaff = teachers.filter(t => isPaid(t.teacherId));
      setOrderedList(paidStaff); // Already correctly sorted by getTeachers
    } else {
      setOrderedList(teachers);
    }
    setPrintType(type);
  };

  const totals = {
    base: paidRecords.reduce((acc, curr) => acc + Number(curr.baseSalary), 0),
    bonus: paidRecords.reduce((acc, curr) => acc + Number(curr.bonus), 0),
    grand: paidRecords.reduce((acc, curr) => acc + Number(curr.totalAmount), 0)
  };

  // AUTO-BONUS DETECTION FOR PREVIOUS MONTHS
  const hasBonusInCurrentMonth = paidRecords.some(r => Number(r.bonus) > 0);
  const finalShowBonus = showBonusColumn || hasBonusInCurrentMonth;

  const filteredDatabaseSalaries = allDatabaseSalaries.filter(s => 
    s.name?.toLowerCase().includes(dbSearchTerm.toLowerCase()) || 
    s.teacherId?.includes(dbSearchTerm) ||
    s.month?.includes(dbSearchTerm)
  );

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
        
        {/* --- Header and Tabs --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase">
              <Users className="w-7 h-7 text-emerald-600" /> Salary Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage monthly payments and view complete salary database.</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("payment")}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === "payment" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
            >
              <Banknote className="w-4 h-4"/> Payment Setup
            </button>
            <button 
              onClick={() => setActiveTab("database")}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === "database" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
            >
              <Database className="w-4 h-4"/> All Salary Database
            </button>
          </div>
        </div>

        {/* =========================================
            TAB 1: PAYMENT SETUP
        ============================================= */}
        {activeTab === "payment" && (
          <div className="animate-in slide-in-from-left-4 duration-300">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setShowBonusColumn(!showBonusColumn)}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2.5 rounded-xl transition-colors border border-blue-200 dark:border-blue-800/50"
                >
                  {showBonusColumn ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  {showBonusColumn ? "Bonus Column Enabled" : "Enable Bonus Column"}
                </button>

                <button 
                  onClick={() => setEnableSMS(!enableSMS)}
                  className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors border ${enableSMS ? 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-700/50' : 'text-slate-600 bg-slate-100 border-slate-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}
                >
                  {enableSMS ? <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  <MessageSquare className="w-4 h-4" />
                  {enableSMS ? "SMS Active" : "Enable SMS"}
                </button>
              </div>

              <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#1a2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-20">
                
                <CustomMonthPicker 
                  value={selectedMonth} 
                  onChange={(val) => {
                    setSelectedMonth(val);
                    setCustomMonths({});
                  }} 
                />
                
                <button 
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  disabled={paidRecords.length === 0 || !selectedMonth}
                  className="bg-red-50 hover:bg-red-100 dark:bg-[#1e293b] dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-red-200 dark:border-red-900/50 disabled:opacity-50"
                  title="Delete all salaries for this month"
                >
                  <Trash2 className="w-5 h-5"/>
                </button>

                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={!selectedMonth}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-blue-900/30 text-slate-700 dark:text-blue-400 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-transparent dark:border-blue-500/30 disabled:opacity-50"
                >
                  <FileSearch className="w-4 h-4"/> Preview
                </button>

                {paidRecords.length > 0 && selectedMonth ? (
                  <button
                    onClick={() => openPrintModal('paid')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    <Printer className="w-4 h-4"/> Paid Report
                  </button>
                ) : (
                  <button disabled className="bg-slate-300 dark:bg-slate-700 text-slate-500 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed border border-transparent">
                    <Printer className="w-4 h-4"/> Paid Report
                  </button>
                )}

                {teachers.length > 0 && selectedMonth ? (
                  <button
                    onClick={() => openPrintModal('full')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <FileDown className="w-4 h-4"/> Full Sheet PDF
                  </button>
                ) : (
                  <button disabled className="bg-slate-300 dark:bg-slate-700 text-slate-500 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed border border-transparent">
                    <FileDown className="w-4 h-4"/> Full Sheet PDF
                  </button>
                )}
              </div>
            </div>

            {showPreview && paidRecords.length > 0 && selectedMonth && (
              <div className="mb-8 p-8 bg-white rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4 overflow-x-auto relative z-10">
                <div className="text-center mb-6 pb-6 border-b-2 border-slate-800">
                  <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider font-serif">Western School and College</h2>
                  <h3 className="text-lg font-bold text-slate-700 mt-1">TEACHERS AND STAFF SALARY REPORT</h3>
                  <p className="text-slate-500 font-medium mt-1">Billing Month: {new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                <table className="w-full text-left text-sm border-collapse border border-slate-300 text-black min-w-[600px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3 border border-slate-300 font-bold">ID</th>
                      <th className="p-3 border border-slate-300 font-bold">Name</th>
                      <th className="p-3 border border-slate-300 text-right font-bold">Salary Amount</th>
                      {finalShowBonus && <th className="p-3 border border-slate-300 text-right font-bold">Bonus</th>}
                      <th className="p-3 border border-slate-300 text-right font-bold">Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 border border-slate-300">{r.teacherId}</td>
                        <td className="p-3 border border-slate-300 font-medium">{r.name}</td>
                        <td className="p-3 border border-slate-300 text-right">৳ {r.baseSalary}</td>
                        {finalShowBonus && <td className="p-3 border border-slate-300 text-right text-orange-600">৳ {r.bonus}</td>}
                        <td className="p-3 border border-slate-300 text-right font-bold text-emerald-700">৳ {r.totalAmount}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold text-lg">
                      <td colSpan={finalShowBonus ? 4 : 3} className="p-4 border border-slate-300 text-right uppercase">Grand Total:</td>
                      <td className="p-4 border border-slate-300 text-right text-emerald-600">৳ {totals.grand.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-white dark:bg-[#1a2235] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[850px]">
                  <thead className="bg-slate-50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4 font-semibold">Teachers and Staff</th>
                      <th className="p-4 font-semibold text-center w-48">Pay Month</th>
                      <th className="p-4 text-right font-semibold">Salary Amount ৳</th>
                      {showBonusColumn && <th className="p-4 text-right font-semibold">Bonus ৳</th>}
                      <th className="p-4 text-center font-semibold">Action / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {teachers.map((t, index) => {
                      const alreadyPaid = isPaid(t.teacherId);
                      const paidData = alreadyPaid ? paidRecords.find(r => r.teacherId === t.teacherId) : null;
                      const isLastFew = teachers.length > 3 && index >= teachers.length - 2;

                      return (
                        <tr key={t.teacherId} className={`${alreadyPaid ? "bg-slate-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-[#1e293b]/50"} transition-colors`}>
                          <td className="p-4">
                            <p className="font-bold text-slate-900 dark:text-white">{t.englishName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">ID: {t.teacherId}</p>
                          </td>

                          <td className="p-4 text-center">
                            {alreadyPaid ? (
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {new Date((paidData.month) + "-01").toLocaleDateString('en-US', {month: 'short', year: 'numeric'})}
                              </span>
                            ) : (
                              <CustomMonthPicker 
                                placement={isLastFew ? "top" : "bottom"}
                                value={customMonths[t.teacherId] || selectedMonth}
                                onChange={(val) => setCustomMonths({...customMonths, [t.teacherId]: val})}
                              />
                            )}
                          </td>
                          
                          <td className="p-4 text-right">
                            {alreadyPaid ? (
                              <span className="font-bold text-slate-700 dark:text-slate-300">৳ {Number(paidData.baseSalary).toLocaleString()}</span>
                            ) : (
                              <input 
                                type="number" placeholder="Amount" disabled={!selectedMonth}
                                value={baseInputs[t.teacherId] !== undefined ? baseInputs[t.teacherId] : (t.salary || "")}
                                onChange={(e) => setBaseInputs({...baseInputs, [t.teacherId]: e.target.value})}
                                className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl w-32 text-right bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-50"
                              />
                            )}
                          </td>
                          
                          {showBonusColumn && (
                            <td className="p-4 text-right">
                              {alreadyPaid ? (
                                <span className="font-bold text-orange-500">৳ {Number(paidData.bonus).toLocaleString()}</span>
                              ) : (
                                <input 
                                  type="number" placeholder="Optional" disabled={!selectedMonth}
                                  value={bonusInputs[t.teacherId] || ""}
                                  onChange={(e) => setBonusInputs({...bonusInputs, [t.teacherId]: e.target.value})}
                                  className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl w-28 text-right bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-50"
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
                                disabled={!selectedMonth}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white px-8 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 mx-auto"
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
          </div>
        )}

        {/* =========================================
            TAB 2: SALARY DATABASE 
        ============================================= */}
        {activeTab === "database" && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="font-bold text-slate-800 dark:text-white text-lg">All Paid Salaries History</h2>
                <input
                  type="text"
                  placeholder="Search Name, ID or Month (e.g. 2026-08)"
                  value={dbSearchTerm}
                  onChange={(e) => setDbSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg w-full sm:w-72 bg-white dark:bg-[#0f172a] text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-[#151c2c] text-slate-600 dark:text-slate-300 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 font-bold">Month</th>
                      <th className="p-4 font-bold">Teacher ID</th>
                      <th className="p-4 font-bold">Name</th>
                      <th className="p-4 font-bold text-right">Base Salary</th>
                      <th className="p-4 font-bold text-right">Bonus</th>
                      <th className="p-4 font-bold text-right">Total Paid</th>
                      <th className="p-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredDatabaseSalaries.length === 0 ? (
                      <tr><td colSpan="7" className="p-10 text-center text-slate-500">No records found.</td></tr>
                    ) : (
                      filteredDatabaseSalaries.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{record.month}</td>
                          <td className="p-4">{record.teacherId}</td>
                          <td className="p-4 font-medium">{record.name}</td>
                          <td className="p-4 text-right text-slate-600 dark:text-slate-400">৳ {record.baseSalary}</td>
                          <td className="p-4 text-right text-orange-500">৳ {record.bonus}</td>
                          <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">৳ {record.totalAmount}</td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingSalaryRecord(record);
                                  setEditForm({ baseSalary: record.baseSalary, bonus: record.bonus });
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteDatabaseRecord(record.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- PRINT MODAL (DOWNLOAD PDF DIRECTLY) --- */}
      {printType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPrintType(null)}></div>
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 animate-in zoom-in-95">
            
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-[#151c2c] rounded-t-2xl z-20">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileDown className="w-5 h-5 text-blue-500"/> 
                {printType === 'paid' ? 'Download Paid Report' : 'Download Full Sheet'}
              </h2>
              <button onClick={() => setPrintType(null)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
                The list below is strictly sorted by Teacher ID (Large IDs first, 2-Digit IDs last)
              </p>
              
              <div className="space-y-2">
                {orderedList.map((t) => (
                  <div 
                    key={t.teacherId}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                      {t.teacherId}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-white">{t.englishName}</p>
                      <p className="text-xs text-slate-500">System ID: {t.teacherId}</p>
                    </div>
                  </div>
                ))}
                {orderedList.length === 0 && (
                  <p className="text-center text-slate-500 py-10">No records found.</p>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151c2c] rounded-b-2xl flex justify-between items-center z-10">
              <p className="text-xs font-bold text-slate-500 uppercase">Selected: {orderedList.length} Staff</p>
              
              {orderedList.length > 0 && (
                printType === 'paid' ? (
                  <PDFDownloadLink
                    document={
                      <SalarySheetTemplate 
                        records={orderedList.map(t => paidRecords.find(r => r.teacherId === t.teacherId)).filter(Boolean)} 
                        month={selectedMonth} 
                        totals={totals} 
                        showBonus={finalShowBonus} 
                      />
                    }
                    fileName={`Paid_Salaries_${selectedMonth}.pdf`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
                  >
                    {({ loading }) => (loading ? "Generating PDF..." : <><Download className="w-5 h-5"/> Download PDF</>)}
                  </PDFDownloadLink>
                ) : (
                  <PDFDownloadLink
                    document={
                      <OrderedSalarySheetTemplate 
                        teachers={orderedList} 
                        paidRecords={paidRecords} 
                        month={selectedMonth} 
                        showBonus={finalShowBonus} 
                      />
                    }
                    fileName={`Full_Staff_Salary_Sheet_${selectedMonth}.pdf`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
                  >
                    {({ loading }) => (loading ? "Generating PDF..." : <><Download className="w-5 h-5"/> Download PDF</>)}
                  </PDFDownloadLink>
                )
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* --- EDIT DATABASE RECORD MODAL --- */}
      {editingSalaryRecord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingSalaryRecord(null)}></div>
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-sm relative z-10 animate-in zoom-in-95 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white">Edit Salary Record</h3>
              <p className="text-xs text-slate-500 mt-1">{editingSalaryRecord.name} ({editingSalaryRecord.month})</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Base Salary</label>
                <input 
                  type="number" 
                  value={editForm.baseSalary}
                  onChange={(e) => setEditForm({...editForm, baseSalary: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bonus</label>
                <input 
                  type="number" 
                  value={editForm.bonus}
                  onChange={(e) => setEditForm({...editForm, bonus: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500" 
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setEditingSalaryRecord(null)} className="px-5 py-2 rounded-lg font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700">Cancel</button>
              <button onClick={handleEditDatabaseRecord} className="px-5 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700">Save Update</button>
            </div>
          </div>
        </div>
      )}

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