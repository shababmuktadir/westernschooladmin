import React, { useState, useEffect } from "react";
import { getTeachers, getSalariesByMonth, payTeacherSalary, deleteAllSalariesByMonth } from "../services/teacherService";
import { sendSMS } from "@/features/sms/services/smsService"; 
import { Banknote, Printer, CheckCircle, ToggleLeft, ToggleRight, FileSearch, Trash2, GripVertical, FileDown, CalendarDays, X, Users, Download, MessageSquare } from "lucide-react";
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
  const [teachers, setTeachers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); 
  const [paidRecords, setPaidRecords] = useState([]);
  
  const [baseInputs, setBaseInputs] = useState({});
  const [bonusInputs, setBonusInputs] = useState({});
  const [customMonths, setCustomMonths] = useState({}); 
  
  const [showBonusColumn, setShowBonusColumn] = useState(false); 
  const [enableSMS, setEnableSMS] = useState(false); // --- SMS Enable State ---
  const [showPreview, setShowPreview] = useState(false); 
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  // Rearrange Modal States
  const [rearrangeType, setRearrangeType] = useState(null); 
  const [orderedList, setOrderedList] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    const tData = await getTeachers();
    
    // 1. Load Saved Sequence for Main Table (Full List)
    const savedOrderStr = localStorage.getItem("teacher_salary_order");
    if (savedOrderStr) {
      try {
        const savedOrder = JSON.parse(savedOrderStr);
        tData.sort((a, b) => {
          let posA = savedOrder.indexOf(a.teacherId);
          let posB = savedOrder.indexOf(b.teacherId);
          if (posA === -1) posA = 999999; // New teachers go to the bottom
          if (posB === -1) posB = 999999;
          if (posA !== posB) return posA - posB;
          return parseInt(a.teacherId) - parseInt(b.teacherId); // Fallback sort
        });
      } catch (e) {
        tData.sort((a, b) => parseInt(a.teacherId) - parseInt(b.teacherId));
      }
    } else {
      tData.sort((a, b) => parseInt(a.teacherId) - parseInt(b.teacherId));
    }
    
    setTeachers(tData);
    
    if (selectedMonth) {
      const sData = await getSalariesByMonth(selectedMonth);
      setPaidRecords(sData);
    } else {
      setPaidRecords([]);
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

      // SMS Logic controlled by enableSMS state
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
          console.warn("SMS Failed:", smsError);
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

  // --- MODAL & DRAG/DROP LOGIC WITH AUTO-SAVE ---
  const openRearrangeModal = (type) => {
    if (type === 'paid') {
      let paidStaff = teachers.filter(t => isPaid(t.teacherId));
      // Load specific order for Paid Report if exists
      const savedPaidOrderStr = localStorage.getItem("teacher_paid_salary_order");
      if (savedPaidOrderStr) {
         try {
           const savedPaidOrder = JSON.parse(savedPaidOrderStr);
           paidStaff.sort((a,b) => {
              let posA = savedPaidOrder.indexOf(a.teacherId);
              let posB = savedPaidOrder.indexOf(b.teacherId);
              if(posA === -1) posA = 999999;
              if(posB === -1) posB = 999999;
              if(posA !== posB) return posA - posB;
              return parseInt(a.teacherId) - parseInt(b.teacherId);
           });
         } catch(e){}
      }
      setOrderedList(paidStaff);
    } else {
      // Full list is already sorted correctly from fetchData
      setOrderedList(teachers);
    }
    setRearrangeType(type);
  };

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const updatedList = [...orderedList];
    const draggedItem = updatedList[draggedIndex];
    updatedList.splice(draggedIndex, 1);
    updatedList.splice(index, 0, draggedItem);
    setOrderedList(updatedList);
    setDraggedIndex(null);

    // AUTO-SAVE SEQUENCE TO LOCAL STORAGE
    if (rearrangeType === 'full') {
      const orderIds = updatedList.map(t => t.teacherId);
      localStorage.setItem("teacher_salary_order", JSON.stringify(orderIds));
      setTeachers(updatedList); // Update main background table simultaneously
      toast.success("Sequence auto-saved!", { id: "order_save", duration: 1500 });
    } else if (rearrangeType === 'paid') {
      const orderIds = updatedList.map(t => t.teacherId);
      localStorage.setItem("teacher_paid_salary_order", JSON.stringify(orderIds));
      toast.success("Paid sequence auto-saved!", { id: "order_save", duration: 1500 });
    }
  };

  const totals = {
    base: paidRecords.reduce((acc, curr) => acc + Number(curr.baseSalary), 0),
    bonus: paidRecords.reduce((acc, curr) => acc + Number(curr.bonus), 0),
    grand: paidRecords.reduce((acc, curr) => acc + Number(curr.totalAmount), 0)
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase">
              <Users className="w-7 h-7 text-emerald-600" /> Teachers and Staff
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage monthly salaries and generate reports.</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button 
                onClick={() => setShowBonusColumn(!showBonusColumn)}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50"
              >
                {showBonusColumn ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                {showBonusColumn ? "Bonus Column Enabled" : "Enable Bonus Column"}
              </button>

              <button 
                onClick={() => setEnableSMS(!enableSMS)}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors border ${enableSMS ? 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-700/50' : 'text-slate-600 bg-slate-100 border-slate-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}
              >
                {enableSMS ? <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                <MessageSquare className="w-4 h-4" />
                {enableSMS ? "SMS Active" : "Enable SMS"}
              </button>
            </div>
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

            {/* Rearrange Paid Report Button */}
            {paidRecords.length > 0 && selectedMonth ? (
              <button
                onClick={() => openRearrangeModal('paid')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Printer className="w-4 h-4"/> Paid Report
              </button>
            ) : (
              <button disabled className="bg-slate-300 dark:bg-slate-700 text-slate-500 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed border border-transparent">
                <Printer className="w-4 h-4"/> Paid Report
              </button>
            )}

            {/* Rearrange Full Sheet Button */}
            {teachers.length > 0 && selectedMonth ? (
              <button
                onClick={() => openRearrangeModal('full')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <FileDown className="w-4 h-4"/> Full Sheet
              </button>
            ) : (
              <button disabled className="bg-slate-300 dark:bg-slate-700 text-slate-500 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed border border-transparent">
                <FileDown className="w-4 h-4"/> Full Sheet
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

      <ConfirmModal 
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={confirmDeleteAll}
        title="Delete ALL Salary Records?"
        message={`Are you absolutely sure you want to delete EVERY salary record for the month of ${selectedMonth}? This action cannot be undone.`}
      />

      {/* --- UNIFIED REARRANGE & DOWNLOAD MODAL --- */}
      {rearrangeType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRearrangeType(null)}></div>
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-[#151c2c] rounded-t-2xl z-20">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <GripVertical className="w-5 h-5 text-blue-500"/> 
                {rearrangeType === 'paid' ? 'Rearrange Paid Report' : 'Rearrange Full Sheet'}
              </h2>
              <button onClick={() => setRearrangeType(null)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              
              {rearrangeType === 'full' && (
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Select month and drag rows to reorder.</p>
                  <div className="w-full sm:w-56 shrink-0 relative">
                    <CustomMonthPicker 
                      value={selectedMonth} 
                      onChange={(val) => {
                        setSelectedMonth(val);
                        setCustomMonths({});
                      }} 
                      placement="bottom"
                    />
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">Drag and drop the rows to set the printing sequence. <br/> <span className="text-emerald-500 font-bold">Progress auto-saves automatically.</span></p>
              
              <div className="space-y-2">
                {orderedList.map((t, index) => (
                  <div 
                    key={`modal-drag-${t.teacherId}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`flex items-center gap-4 p-3 bg-slate-50 dark:bg-[#0f172a] border ${draggedIndex === index ? "border-blue-500 opacity-50" : "border-slate-200 dark:border-slate-700 hover:border-slate-400"} rounded-xl cursor-move transition-all`}
                  >
                    <GripVertical className="w-5 h-5 text-slate-400 shrink-0"/>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-white">{t.englishName}</p>
                      <p className="text-xs text-slate-500">ID: {t.teacherId}</p>
                    </div>
                  </div>
                ))}
                {orderedList.length === 0 && (
                  <p className="text-center text-slate-500 py-10">No records found to arrange.</p>
                )}
              </div>
            </div>

            {/* Modal Footer with PDF Buttons */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151c2c] rounded-b-2xl flex justify-between items-center z-10">
              <p className="text-xs font-bold text-slate-500 uppercase">Selected: {orderedList.length} Staff</p>
              
              {orderedList.length > 0 && (
                rearrangeType === 'paid' ? (
                  <PDFDownloadLink
                    document={
                      <SalarySheetTemplate 
                        records={orderedList.map(t => paidRecords.find(r => r.teacherId === t.teacherId)).filter(Boolean)} 
                        month={selectedMonth} 
                        totals={totals} 
                        showBonus={showBonusColumn} 
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
                        showBonus={showBonusColumn} 
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
    </>
  );
}