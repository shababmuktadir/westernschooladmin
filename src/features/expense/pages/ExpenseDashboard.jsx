import React, { useState, useEffect, useRef, useMemo } from "react";
import { getExpenses, deleteExpense, updateExpense, getCategories } from "../services/expenseService";
import GlassDatePicker from "@/components/ui/GlassDatePicker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { Loader2, Receipt, Trash2, Edit2, Camera, X, TrendingUp, TrendingDown, Wallet, CalendarDays, Check } from "lucide-react";
import toast from "react-hot-toast";

const engToBng = (num) => {
  const bngDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(digit => bngDigits[digit] || digit).join('');
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function ExpenseDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Edit States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ date: "", category: "", description: "", amount: "" });
  const [isSaving, setIsSaving] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const expData = await getExpenses();
      const catData = await getCategories();
      setExpenses(expData);
      setCategories(catData);
    } catch (error) {
      toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  // --- Calculations for Dashboard ---
  const totalCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryData = useMemo(() => {
    const map = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.keys(map).map(k => ({ name: k, value: map[k] })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthlyData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const m = d.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
      map[m] = (map[m] || 0) + e.amount;
    });
    return Object.keys(map).map(k => ({ name: k, total: map[k] }));
  }, [expenses]);

  const highestCat = categoryData.length > 0 ? categoryData[0] : { name: "-", value: 0 };
  const lowestCat = categoryData.length > 0 ? categoryData[categoryData.length - 1] : { name: "-", value: 0 };

  // --- Handlers ---
  const openModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsEditing(false);
    setEditForm({
      date: invoice.date,
      category: invoice.category,
      description: invoice.description || "",
      amount: invoice.amount
    });
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const updatedData = {
        date: editForm.date,
        category: editForm.category,
        description: editForm.description,
        amount: Number(editForm.amount)
      };
      await updateExpense(selectedInvoice.id, updatedData);
      
      setExpenses(prev => prev.map(e => e.id === selectedInvoice.id ? { ...e, ...updatedData } : e));
      setSelectedInvoice({ ...selectedInvoice, ...updatedData });
      setIsEditing(false);
      toast.success("ইনভয়েস আপডেট হয়েছে!");
    } catch (error) {
      toast.error("আপডেট করতে ব্যর্থ হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এটি ডিলিট করবেন?")) return;
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      setSelectedInvoice(null);
      toast.success("সফলভাবে ডিলিট হয়েছে");
    } catch (error) {
      toast.error("ডিলিট ব্যর্থ হয়েছে");
    }
  };

  const takeScreenshot = async () => {
    if (printRef.current) {
      toast.loading("স্ক্রিনশট নেওয়া হচ্ছে...", { id: 'snap' });
      const canvas = await html2canvas(printRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const link = document.createElement("a");
      link.download = `Invoice_${selectedInvoice.id.slice(-6)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("স্ক্রিনশট সেভ হয়েছে!", { id: 'snap' });
    }
  };

  const inputClass = "w-full pl-4 pr-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 outline-none text-slate-800 dark:text-slate-200";

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-[90rem] mx-auto p-6 animate-in fade-in duration-300">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-blue-600" /> এক্সপেন্স ড্যাশবোর্ড ও লিস্ট
        </h1>
        <p className="text-slate-500 mt-2">খরচের অ্যানালাইসিস এবং সকল ইনভয়েসের তালিকা।</p>
      </div>

      {/* --- DASHBOARD STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-blue-100 uppercase tracking-wider text-sm">সর্বমোট খরচ</h3>
            <Wallet className="w-6 h-6 text-white/80" />
          </div>
          <p className="text-4xl font-black">৳ {engToBng(totalCost)}</p>
          <p className="text-sm text-blue-100 mt-2">সর্বমোট {engToBng(expenses.length)} টি এন্ট্রি</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-500 uppercase tracking-wider text-sm">সবচেয়ে বেশি খরচ</h3>
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{highestCat.name}</p>
          <p className="text-lg font-semibold text-red-500 mt-1">৳ {engToBng(highestCat.value)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-500 uppercase tracking-wider text-sm">সবচেয়ে কম খরচ</h3>
            <TrendingDown className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{lowestCat.name}</p>
          <p className="text-lg font-semibold text-emerald-500 mt-1">৳ {engToBng(lowestCat.value)}</p>
        </div>
      </div>

      {/* --- CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart (Monthly) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">মাসিক খরচের ট্রেন্ড (Monthly Trend)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#f1f5f9', opacity: 0.1}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Categories) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">ক্যাটাগরি ভিত্তিক খরচ (Category Wise)</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- ALL INVOICES TABLE --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 dark:text-white text-lg">সকল ইনভয়েস এন্ট্রি (All Entries)</h2>
          <span className="text-sm font-medium text-slate-500">ক্লিক করে বিস্তারিত দেখুন</span>
        </div>
        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm z-10 shadow-sm">
              <tr>
                <th className="p-4 font-semibold">তারিখ</th>
                <th className="p-4 font-semibold">ক্যাটাগরি</th>
                <th className="p-4 font-semibold">বিবরণ</th>
                <th className="p-4 font-semibold text-right">পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {expenses.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-500">কোনো এন্ট্রি পাওয়া যায়নি।</td></tr>}
              {expenses.map(exp => (
                <tr 
                  key={exp.id} 
                  onClick={() => openModal(exp)}
                  className="hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">{engToBng(exp.date)}</td>
                  <td className="p-4">
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 truncate max-w-[200px]">{exp.description || "-"}</td>
                  <td className="p-4 text-sm font-black text-emerald-600 dark:text-emerald-400 text-right">৳ {exp.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- INVOICE MODAL POPUP --- */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-[#151c2c]">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-blue-500" /> ইনভয়েস বিস্তারিত
              </h3>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button onClick={takeScreenshot} className="p-2 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg transition-colors" title="Screenshot">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedInvoice(null)} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 relative bg-white dark:bg-[#1e293b]">
              
              {!isEditing ? (
                // VIEW MODE (Screenshot Area)
                <div ref={printRef} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                  
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

                  <div className="text-center mb-6 relative z-10">
                    <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white font-serif">Western School & College</h2>
                    <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">EXPENSE INVOICE VOUCHER</p>
                  </div>

                  <div className="space-y-4 text-sm relative z-10">
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 font-medium">Invoice ID:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">#EXP-{selectedInvoice.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 font-medium">Date:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(selectedInvoice.date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 font-medium">Category:</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">{selectedInvoice.category}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 font-medium">Description:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{selectedInvoice.description || "N/A"}</span>
                    </div>
                    
                    <div className="pt-4 flex justify-between items-end">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Total Amount</span>
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">৳{selectedInvoice.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <div className="space-y-5">
                  <div className="relative z-40">
                    <GlassDatePicker label="Date" value={editForm.date} onChange={(val) => setEditForm({...editForm, date: val})} />
                  </div>
                  <div className="relative z-30">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                    <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className={inputClass}>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                    <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (৳)</label>
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className={inputClass} />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3">
              {!isEditing ? (
                <>
                  <button onClick={() => handleDelete(selectedInvoice.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2.5 rounded-xl font-bold flex items-center justify-center transition-colors">
                    <Trash2 className="w-4 h-4 mr-2"/> Delete
                  </button>
                  <button onClick={() => setIsEditing(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-500/20 transition-colors">
                    <Edit2 className="w-4 h-4 mr-2"/> Edit Entry
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleUpdate} disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-colors">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Check className="w-4 h-4 mr-2"/>} Save Changes
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}