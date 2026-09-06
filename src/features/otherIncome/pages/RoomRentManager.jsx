import React, { useState, useEffect, useRef } from "react";
import { getRenters, addRenter, updateRenter, deleteRenter, getRentPayments, addRentPayment, deleteRentPayment } from "../services/roomRentService";
import { sendRentSMS } from "../services/rentSmsService"; 
import { PDFDownloadLink } from "@react-pdf/renderer";
import RoomRentInvoiceTemplate from "@/templates/pdf/RoomRentInvoiceTemplate";
import { motion, AnimatePresence } from "framer-motion"; 
import { Users, Receipt, LayoutDashboard, Save, Trash2, Edit2, Download, Send, MessageSquare, CheckSquare, X, Clock, CalendarDays, Plus, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_YEARS = MONTHS.map(m => `${m} ${CURRENT_YEAR}`);

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
const MINS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const AMPM = ["AM", "PM"];

const GlassDropdown = ({ options, value, onChange, placeholder = "Select...", className = "", zIndex = "z-50" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayValue = () => {
    if (!value) return <span className="text-slate-500 font-medium">{placeholder}</span>;
    const selected = options.find(opt => (typeof opt === 'object' ? String(opt.value) : String(opt)) === String(value));
    return selected ? (typeof selected === 'object' ? selected.label : selected) : <span className="text-slate-500">{placeholder}</span>;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-300/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold shadow-sm">
        <span className="truncate pr-2">{getDisplayValue()}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 mt-2 w-full min-w-[120px] ${zIndex} rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar`}
          >
            {options.length === 0 && <div className="p-3 text-xs text-slate-500 text-center font-medium">No options</div>}
            {options.map((opt, i) => {
              const optValue = typeof opt === 'object' ? String(opt.value) : String(opt);
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <button key={i} type="button" onClick={() => { onChange(optValue); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${String(value) === optValue ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 font-medium"}`}>
                  {optLabel}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function RoomRentManager() {
  const [activeTab, setActiveTab] = useState("accounts"); 
  const [renters, setRenters] = useState([]);
  const [payments, setPayments] = useState([]);

  // --- Accounts Tab States ---
  const initialAccForm = { id: null, roomNo: "", schedules: [], name: "", phone: "", nid: "", rentAmount: "" };
  const [accForm, setAccForm] = useState(initialAccForm);
  const [tempDay, setTempDay] = useState("Saturday");
  const [tempHour, setTempHour] = useState("10");
  const [tempMin, setTempMin] = useState("00");
  const [tempAmPm, setTempAmPm] = useState("AM");

  // --- Collection Tab States ---
  const [selectedRenterId, setSelectedRenterId] = useState("");
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [collectionAmount, setCollectionAmount] = useState("");
  const [lastInvoice, setLastInvoice] = useState(null);

  // --- Dashboard Tab States ---
  const [dashboardMonth, setDashboardMonth] = useState(`${MONTHS[new Date().getMonth()]} ${CURRENT_YEAR}`);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsDueMonths, setSmsDueMonths] = useState("");
  const [smsTemplate, setSmsTemplate] = useState("Dear [Name],\nYour room rent for [Months] is due. Room No: [Room]. Please clear the dues ASAP.\n- Western School");
  const [selectedDefaulters, setSelectedDefaulters] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const rData = await getRenters();
    const pData = await getRentPayments();
    setRenters(rData);
    setPayments(pData);
  };

  const handleRenterSelect = (val) => {
    setSelectedRenterId(val);
    setLastInvoice(null);
    const renter = renters.find(r => String(r.id) === String(val));
    
    if (renter) {
      const baseRent = Number(renter.rentAmount) || 0;
      const multiplier = selectedMonths.length > 0 ? selectedMonths.length : 1;
      setCollectionAmount(String(baseRent * multiplier));
    } else {
      setCollectionAmount("");
    }
  };

  const handleMonthToggle = (month) => {
    setLastInvoice(null);
    const newMonths = selectedMonths.includes(month) 
      ? selectedMonths.filter(m => m !== month) 
      : [...selectedMonths, month];
    
    setSelectedMonths(newMonths);
    
    if (selectedRenterId) {
      const renter = renters.find(r => String(r.id) === String(selectedRenterId));
      if (renter) {
        const baseRent = Number(renter.rentAmount) || 0;
        const multiplier = newMonths.length;
        setCollectionAmount(multiplier === 0 ? "" : String(baseRent * multiplier));
      }
    }
  };

  const handleAmountChange = (e) => {
    setCollectionAmount(e.target.value);
    setLastInvoice(null);
  };

  const handleNameChange = (e) => {
    let value = e.target.value.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
    setAccForm({ ...accForm, name: value });
  };

  const handleAddSchedule = () => {
    const newTime = `${tempHour}:${tempMin} ${tempAmPm}`;
    setAccForm({ ...accForm, schedules: [...(accForm.schedules || []), { day: tempDay, time: newTime }] });
  };

  const handleRemoveSchedule = (indexToRemove) => {
    const updated = [...(accForm.schedules || [])];
    updated.splice(indexToRemove, 1);
    setAccForm({ ...accForm, schedules: updated });
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    try {
      accForm.id ? await updateRenter(accForm.id, accForm) : await addRenter(accForm);
      toast.success(accForm.id ? "Account Updated!" : "Account Created!");
      setAccForm(initialAccForm);
      fetchData();
    } catch (err) { toast.error("Failed to save."); }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Delete this account and ALL its payment records?")) return;
    try {
      await deleteRenter(id);
      toast.success("Account Deleted!");
      fetchData();
    } catch (err) { toast.error("Delete Failed."); }
  };

  const renderSchedules = (schedules) => {
    if (!schedules || schedules.length === 0) return <span className="text-xs text-slate-400">No schedule</span>;
    const grouped = schedules.reduce((acc, curr) => {
      if (!acc[curr.day]) acc[curr.day] = [];
      acc[curr.day].push(curr.time);
      return acc;
    }, {});
    return Object.entries(grouped).map(([day, times]) => (
      <div key={day} className="text-xs mb-0.5">
        <span className="font-bold text-slate-700 dark:text-slate-300">{day}:</span> <span className="text-slate-500">{times.join(", ")}</span>
      </div>
    ));
  };

  const handleSaveCollection = async () => {
    if (!selectedRenterId) return toast.error("Please select a Renter Account!");
    if (selectedMonths.length === 0) return toast.error("Please select at least one Month!");
    if (!collectionAmount || Number(collectionAmount) <= 0) return toast.error("Please enter a valid amount!");
    
    const renter = renters.find(r => String(r.id) === String(selectedRenterId));
    if (!renter) return toast.error("Error: Renter account not found!");

    try {
      const savedPayment = await addRentPayment({
        renterId: String(renter.id),
        renterName: renter.name,
        roomNo: renter.roomNo,
        phone: renter.phone,
        months: selectedMonths,
        amountPaid: Number(collectionAmount)
      });
      
      toast.success("Payment Received & Invoice Generated!");
      setLastInvoice(savedPayment); 
      setSelectedMonths([]);
      setCollectionAmount("");
      setSelectedRenterId("");
      fetchData();
    } catch (error) { 
      console.error(error);
      toast.error("Failed to save payment."); 
    }
  };

  const handleDeletePaymentRecord = async (id) => {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      await deleteRentPayment(id);
      toast.success("Record Deleted!");
      fetchData();
    } catch(err) { toast.error("Failed to delete payment."); }
  };

  const dashboardPayments = payments.filter(p => p.month === dashboardMonth);
  const totalCollected = dashboardPayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
  const paidRenterIds = dashboardPayments.map(p => String(p.renterId));
  const defaulters = renters.filter(r => !paidRenterIds.includes(String(r.id)));

  const handleDefaulterSelect = (id) => {
    setSelectedDefaulters(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const sendBulkSMS = async () => {
    if (selectedDefaulters.length === 0) return toast.error("Select at least one defaulter!");
    if (!smsDueMonths) return toast.error("Please enter the due months name (e.g. Jan-Feb)!");
    
    toast.loading("Sending SMS via API...", { id: "sms" });
    let successCount = 0;

    for (let renterId of selectedDefaulters) {
      const renter = renters.find(r => String(r.id) === String(renterId));
      if (renter && renter.phone) {
        let msg = smsTemplate.replace("[Name]", renter.name).replace("[Months]", smsDueMonths).replace("[Room]", renter.roomNo);
        const res = await sendRentSMS(renter.phone, msg);
        if (res.success) successCount++;
      }
    }
    toast.success(`${successCount} SMS Sent Successfully!`, { id: "sms" });
    setSmsModalOpen(false);
    setSelectedDefaulters([]);
  };

  const inputClass = "w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
  
  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Room Rent Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage accounts, collect rent, and send SMS to dues.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit">
        <button onClick={() => { setActiveTab("accounts"); setLastInvoice(null); }} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === "accounts" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><Users className="w-4 h-4"/> Accounts</button>
        <button onClick={() => setActiveTab("collection")} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === "collection" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><Receipt className="w-4 h-4"/> Collection & Invoice</button>
        <button onClick={() => { setActiveTab("dashboard"); setLastInvoice(null); }} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === "dashboard" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><LayoutDashboard className="w-4 h-4"/> Dashboard & Dues</button>
      </div>

      <AnimatePresence mode="wait">
        {/* --- TAB 1: ACCOUNTS (Width Adjusted: Left 2 cols, Right 3 cols) --- */}
        {activeTab === "accounts" && (
          <motion.div key="accounts" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
              <h2 className="text-lg font-bold mb-4">{accForm.id ? "Edit Account" : "Add Room Renter"}</h2>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Room No</label><input required value={accForm.roomNo} onChange={e=>setAccForm({...accForm, roomNo: e.target.value})} className={inputClass} placeholder="e.g. 101" /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Monthly Rent (৳)</label><input required type="number" value={accForm.rentAmount} onChange={e=>setAccForm({...accForm, rentAmount: e.target.value})} className={inputClass} placeholder="Amount" /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Holder Name</label><input required value={accForm.name} onChange={handleNameChange} className={inputClass} placeholder="Enter full name" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label><input required value={accForm.phone} onChange={e=>setAccForm({...accForm, phone: e.target.value})} className={inputClass} placeholder="01XXXXXXXXX" /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">NID Number</label><input value={accForm.nid} onChange={e=>setAccForm({...accForm, nid: e.target.value})} className={inputClass} placeholder="Optional" /></div>
                </div>
                
                <div className="p-4 bg-slate-50/50 dark:bg-[#151c2c]/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 relative">
                  <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1.5 mb-4"><CalendarDays className="w-4 h-4"/> Schedule Builder</label>
                  <div className="flex flex-col gap-3 mb-4">
                    <GlassDropdown options={DAYS} value={tempDay} onChange={setTempDay} className="w-full z-[60]" />
                    <div className="flex items-center gap-1 sm:gap-2 relative z-[50] w-full">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block"/>
                      <GlassDropdown options={HOURS} value={tempHour} onChange={setTempHour} className="flex-1 min-w-[50px]" zIndex="z-[55]" />
                      <span className="font-bold text-slate-500 shrink-0">:</span>
                      <GlassDropdown options={MINS} value={tempMin} onChange={setTempMin} className="flex-1 min-w-[50px]" zIndex="z-[55]" />
                      <GlassDropdown options={AMPM} value={tempAmPm} onChange={setTempAmPm} className="flex-1 min-w-[50px]" zIndex="z-[55]" />
                      <button type="button" onClick={handleAddSchedule} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-all shrink-0 shadow-md hover:scale-105 active:scale-95"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {accForm.schedules?.map((sch, idx) => (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{sch.day} <span className="text-indigo-500 font-medium ml-1">• {sch.time}</span></span>
                          <button type="button" onClick={() => handleRemoveSchedule(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors"><X className="w-3.5 h-3.5"/></button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {(!accForm.schedules || accForm.schedules.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">No schedule added yet</p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95"><Save className="w-4 h-4 inline mr-2"/> {accForm.id ? "Update Account" : "Save Account"}</button>
                  {accForm.id && <button type="button" onClick={()=>setAccForm(initialAccForm)} className="px-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">Cancel</button>}
                </div>
              </form>
            </div>
            
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative z-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                  <tr><th className="p-4">Room & Name</th><th className="p-4">Contact & Schedule</th><th className="p-4 text-right">Rent/Month</th><th className="p-4 text-center">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {renters.map(r => (
                    <motion.tr layout key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4"><p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">Room: {r.roomNo}</p><p className="font-bold text-slate-800 dark:text-white mt-0.5">{r.name}</p></td>
                      <td className="p-4"><p className="font-medium text-slate-600 dark:text-slate-300 mb-1">{r.phone}</p><div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">{renderSchedules(r.schedules)}</div></td>
                      <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-right text-lg">৳ {Number(r.rentAmount).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={()=> setAccForm({...r, schedules: r.schedules || []})} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={()=>handleDeleteAccount(r.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {renters.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-500">No accounts created yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* --- TAB 2: COLLECTION & INVOICE --- */}
        {activeTab === "collection" && (
          <motion.div key="collection" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="relative z-0">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-3xl mb-8">
              <h2 className="text-xl font-bold mb-6 text-emerald-700 flex items-center gap-2"><Receipt className="w-5 h-5"/> Receive Rent Payment</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Select Renter Account <span className="text-red-500">*</span></label>
                  <GlassDropdown 
                    placeholder="-- Choose Account --" 
                    options={renters.map(r => ({ value: String(r.id), label: `Room: ${r.roomNo} - ${r.name}` }))} 
                    value={selectedRenterId} 
                    onChange={handleRenterSelect} 
                    className="w-full z-[60]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 mt-4">Select Payment Months <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {MONTH_YEARS.map(m => (
                      <motion.button whileTap={{ scale: 0.95 }} key={m} onClick={() => handleMonthToggle(m)} className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${selectedMonths.includes(m) ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-slate-50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"}`}>
                        {m.split(" ")[0]}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Total Amount Received (৳) <span className="text-red-500">*</span></label>
                  <input type="number" value={collectionAmount} onChange={handleAmountChange} className={`${inputClass} text-xl font-black text-emerald-600 dark:text-emerald-400`} />
                </div>
                <div className="pt-4 flex flex-wrap gap-4 items-center">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleSaveCollection} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-emerald-500/30 transition-all"><CheckSquare className="w-5 h-5 mr-2"/> Save Payment</motion.button>
                  {lastInvoice && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                      <PDFDownloadLink 
                        document={<RoomRentInvoiceTemplate invoiceData={lastInvoice} />} 
                        fileName={`Invoice_${lastInvoice.receiptNo}.pdf`} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-blue-500/30 transition-all"
                      >
                        {({ loading }) => (loading ? "Generating PDF..." : <><Download className="w-5 h-5 mr-2"/> Download Invoice</>)}
                      </PDFDownloadLink>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- TAB 3: DASHBOARD & DUES --- */}
        {activeTab === "dashboard" && (
          <motion.div key="dashboard" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="relative z-0">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-slate-800 dark:text-white">Analysis & Due List</h2>
              <div className="mt-2 sm:mt-0 w-full sm:w-48 z-[60]">
                 <GlassDropdown options={MONTH_YEARS} value={dashboardMonth} onChange={setDashboardMonth} className="w-full"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="font-semibold text-blue-100 uppercase text-sm mb-2">Total Collected in {dashboardMonth.split(" ")[0]}</h3>
                <p className="text-4xl font-black">৳ {totalCollected.toLocaleString()}</p>
              </motion.div>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm">
                <h3 className="font-semibold text-red-500 uppercase text-sm mb-2">Total Defaulters</h3>
                <p className="text-4xl font-black text-red-600">{defaulters.length} <span className="text-lg font-medium text-slate-500">Renters</span></p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Due List ({dashboardMonth.split(" ")[0]})</h3>
                  <button onClick={()=> {
                      if(selectedDefaulters.length===0) return toast.error("Select defaulters first!");
                      setSmsDueMonths(dashboardMonth.split(" ")[0]);
                      setSmsModalOpen(true);
                    }} 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md hover:bg-indigo-700 transition-colors">
                    <MessageSquare className="w-4 h-4 mr-2"/> Send SMS
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-4 w-10"><input type="checkbox" onChange={(e)=> setSelectedDefaulters(e.target.checked ? defaulters.map(d=>d.id) : [])} checked={selectedDefaulters.length === defaulters.length && defaulters.length > 0} className="w-4 h-4 accent-indigo-600 rounded"/></th>
                        <th className="p-4 font-semibold">Renter Name</th>
                        <th className="p-4 font-semibold text-right">Rent Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defaulters.length === 0 && <tr><td colSpan="3" className="p-8 text-center font-bold text-emerald-500">🎉 100% Collection!</td></tr>}
                      {defaulters.map(d => (
                        <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#151c2c]">
                          <td className="p-4"><input type="checkbox" checked={selectedDefaulters.includes(d.id)} onChange={()=>handleDefaulterSelect(d.id)} className="w-4 h-4 accent-indigo-600"/></td>
                          <td className="p-4 font-bold text-slate-800 dark:text-white">{d.name} <span className="text-xs text-slate-500 dark:text-slate-400 block">Room: {d.roomNo}</span></td>
                          <td className="p-4 text-right font-bold text-red-500">৳ {Number(d.rentAmount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Payment Records ({dashboardMonth.split(" ")[0]})</h3>
                </div>
                <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 sticky top-0">
                      <tr><th className="p-4 font-semibold">Renter</th><th className="p-4 font-semibold text-right">Paid</th><th className="p-4 font-semibold text-center">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {dashboardPayments.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-500">No payments received yet.</td></tr>}
                      <AnimatePresence>
                        {dashboardPayments.map(p => (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#151c2c]">
                            <td className="p-4 font-bold text-slate-800 dark:text-white">{p.renterName} <span className="text-xs text-emerald-500 block">Rec: #{p.receiptNo}</span></td>
                            <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">৳ {Number(p.amountPaid).toLocaleString()}</td>
                            <td className="p-4 text-center"><button onClick={()=>handleDeletePaymentRecord(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4"/></button></td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SMS MODAL --- */}
      <AnimatePresence>
        {smsModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Send className="w-5 h-5 text-indigo-600"/> Send Due Reminder SMS</h2>
                <button onClick={()=>setSmsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <p className="text-sm text-slate-500 mb-6 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">Sending SMS to <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedDefaulters.length}</span> selected renters.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mention Due Months (Short Form)</label>
                  <input type="text" value={smsDueMonths} onChange={e=>setSmsDueMonths(e.target.value)} className={inputClass}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">SMS Template (Editable)</label>
                  <textarea rows="4" value={smsTemplate} onChange={e=>setSmsTemplate(e.target.value)} className={`${inputClass} resize-none`}></textarea>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tags: [Name], [Months], [Room] will be auto-replaced.</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={()=>setSmsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={sendBulkSMS} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center shadow-lg shadow-indigo-500/30 transition-all"><Send className="w-4 h-4 mr-2"/> Send Now</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}