import React, { useState, useEffect } from "react";
import { getCategories, addCategory, updateCategory, deleteCategory, getExpenses, addExpense, deleteExpense } from "../services/expenseService";
import GlassDatePicker from "@/components/ui/GlassDatePicker";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ExpenseReportTemplate from "@/templates/pdf/ExpenseReportTemplate";
import { Plus, Edit2, Trash2, Save, Printer, Loader2, ListTree, ReceiptText, BarChart3, Search } from "lucide-react";
import toast from "react-hot-toast";

// বাংলা সংখ্যা কনভার্টার
const engToBng = (num) => {
  const bngDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(digit => bngDigits[digit] || digit).join('');
};

const ALL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function ExpenseManager() {
  const [activeTab, setActiveTab] = useState("entry"); // 'entry', 'categories', 'report'
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form States (Entry)
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCat, setExpenseCat] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States (Categories)
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState("");

  // Report States
  const [reportMonth, setReportMonth] = useState(ALL_MONTHS[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catData = await getCategories();
      const expData = await getExpenses();
      setCategories(catData);
      setExpenses(expData);
      if (catData.length > 0) setExpenseCat(catData[0].name);
    } catch (error) {
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // --- Category Handlers ---
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const added = await addCategory(newCatName.trim());
      setCategories([...categories, added]);
      setNewCatName("");
      toast.success("ক্যাটাগরি যুক্ত করা হয়েছে");
    } catch (err) { toast.error("ব্যর্থ হয়েছে"); }
  };

  const handleUpdateCategory = async (id) => {
    try {
      await updateCategory(id, editCatName);
      setCategories(categories.map(c => c.id === id ? { ...c, name: editCatName } : c));
      setEditCatId(null);
      toast.success("আপডেট হয়েছে");
    } catch (err) { toast.error("ব্যর্থ হয়েছে"); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("ক্যাটাগরিটি মুছে ফেলতে চান?")) return;
    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success("ডিলিট হয়েছে");
    } catch (err) { toast.error("ব্যর্থ হয়েছে"); }
  };

  // --- Expense Handlers ---
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseCat || !expenseAmount || !expenseDate) return toast.error("ফর্ম সম্পূর্ণ করুন");
    
    setIsSubmitting(true);
    try {
      const newExp = await addExpense({
        category: expenseCat,
        description: expenseDesc,
        amount: Number(expenseAmount),
        date: expenseDate,
      });
      setExpenses([newExp, ...expenses]);
      setExpenseDesc("");
      setExpenseAmount("");
      toast.success("হিসাব যুক্ত হয়েছে!");
    } catch (error) {
      toast.error("হিসাব যুক্ত করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("এই হিসাবটি মুছে ফেলতে চান?")) return;
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success("ডিলিট হয়েছে");
    } catch (err) { toast.error("ব্যর্থ হয়েছে"); }
  };

  // --- Report Calculations ---
  const overallTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const monthlyExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return ALL_MONTHS[d.getMonth()] === reportMonth && String(d.getFullYear()) === reportYear;
  });

  const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categorySummary = {};
  monthlyExpenses.forEach(exp => {
    categorySummary[exp.category] = (categorySummary[exp.category] || 0) + exp.amount;
  });

  // UI Common Styles
  const inputClass = "w-full pl-4 pr-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-800 dark:text-slate-200";

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-300">
      
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
          <ReceiptText className="w-8 h-8 mr-3 text-blue-600" /> খরচের হিসাব (Invoice Manager)
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab("entry")} className={`px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center ${activeTab === "entry" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
          <Plus className="w-4 h-4 mr-2"/> নতুন এন্ট্রি
        </button>
        <button onClick={() => setActiveTab("categories")} className={`px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center ${activeTab === "categories" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
          <ListTree className="w-4 h-4 mr-2"/> ক্যাটাগরি
        </button>
        <button onClick={() => setActiveTab("report")} className={`px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center ${activeTab === "report" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
          <BarChart3 className="w-4 h-4 mr-2"/> মাসিক রিপোর্ট
        </button>
      </div>

      {/* --- TAB 1: NEW ENTRY --- */}
      {activeTab === "entry" && (
        <form onSubmit={handleAddExpense} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            <div className="relative z-40">
              <GlassDatePicker label="তারিখ নির্বাচন করুন" value={expenseDate} onChange={setExpenseDate} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ক্যাটাগরি <span className="text-red-500">*</span></label>
              <select value={expenseCat} onChange={e => setExpenseCat(e.target.value)} className={`${inputClass} appearance-none`}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">বিবরণ (ঐচ্ছিক)</label>
              <input type="text" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} placeholder="কী বাবদ খরচ হলো..." className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">পরিমাণ (টাকা) <span className="text-red-500">*</span></label>
              <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="e.g. 1500" className={inputClass} required />
            </div>

          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center transition shadow-lg shadow-blue-500/20">
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>} সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 2: CATEGORIES --- */}
      {activeTab === "categories" && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex gap-4 mb-8">
            <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="নতুন ক্যাটাগরির নাম লিখুন (e.g. WiFi Bill)" className={inputClass} />
            <button onClick={handleAddCategory} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold whitespace-nowrap shadow-md">যুক্ত করুন</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                {editCatId === cat.id ? (
                  <div className="flex w-full gap-2">
                    <input type="text" value={editCatName} onChange={e => setEditCatName(e.target.value)} className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm" />
                    <button onClick={() => handleUpdateCategory(cat.id)} className="text-emerald-600"><Check className="w-5 h-5"/></button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: REPORT --- */}
      {activeTab === "report" && (
        <div className="space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex gap-4">
              <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} className={inputClass}>
                {ALL_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={reportYear} onChange={e => setReportYear(e.target.value)} className={inputClass}>
                {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <PDFDownloadLink
              document={<ExpenseReportTemplate monthName={`${reportMonth}, ${reportYear}`} overallTotal={overallTotal} monthlyTotal={monthlyTotal} categorySummary={categorySummary} monthlyExpenses={monthlyExpenses} />}
              fileName={`Expense_Report_${reportMonth}_${reportYear}.pdf`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              {({ loading }) => (loading ? "রিপোর্ট তৈরি হচ্ছে..." : <><Printer className="w-5 h-5 mr-2"/> রিপোর্ট প্রিন্ট (PDF)</>)}
            </PDFDownloadLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
              <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">সর্বমোট খরচ (Overall)</h3>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">৳ {engToBng(overallTotal)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">এই মাসের খরচ ({reportMonth})</h3>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">৳ {engToBng(monthlyTotal)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-slate-800 dark:text-white">বিস্তারিত হিসাব ({reportMonth}, {reportYear})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm">
                  <tr>
                    <th className="p-4 font-semibold">তারিখ</th>
                    <th className="p-4 font-semibold">ক্যাটাগরি</th>
                    <th className="p-4 font-semibold">বিবরণ</th>
                    <th className="p-4 font-semibold text-right">পরিমাণ</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {monthlyExpenses.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">এই মাসে কোনো খরচ নেই।</td></tr>}
                  {monthlyExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">{engToBng(exp.date)}</td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">{exp.category}</td>
                      <td className="p-4 text-sm text-slate-500">{exp.description || "-"}</td>
                      <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">৳ {engToBng(exp.amount)}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}