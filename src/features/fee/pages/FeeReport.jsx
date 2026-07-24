import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from "recharts";
import { 
  Download, TrendingUp, DollarSign, Calendar, Users, Loader2, Award, 
  CheckCircle2, Layers, Database, AlertCircle, PlusCircle, Settings, UserX, Wallet
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom"; 

import { db } from "@/config/firebase"; 
import { collection, getDocs } from "firebase/firestore";
import { getStudents } from "@/features/students/services/studentService"; 

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#f43f5e', '#06b6d4'];

const MONTH_ORDER = {
  "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6, 
  "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
};

export default function FeeReport() {
  const [feesData, setFeesData] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Frontend Expected Fee Settings
  const [defaultTuitionFee, setDefaultTuitionFee] = useState(1200);
  const [defaultExamFee, setDefaultExamFee] = useState(1500);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [feesSnapshot, studentsData] = await Promise.all([
          getDocs(collection(db, "studentFees")),
          getStudents()
        ]);
        
        const allFeesDocs = feesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFeesData(allFeesDocs);
        setAllStudents(studentsData.filter(s => s.status !== "Inactive")); 
        
        setError(null);
      } catch (err) {
        console.error("Error fetching data: ", err);
        setError("ফায়ারবেস থেকে ডেটা লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const reportStats = useMemo(() => {
    let overallTotal = 0;
    const feeTypeMap = {};
    const invoiceMonthMap = {};
    const academicMonthMap = {};
    const studentMap = {};

    // 1. Process Fees Data & Fix "Unknown" names
    feesData.forEach(doc => {
      overallTotal += doc.grandTotal || 0;

      Object.entries(doc.feeDetails || {}).forEach(([type, amount]) => {
        feeTypeMap[type] = (feeTypeMap[type] || 0) + (Number(amount) || 0);
      });

      if (doc.invoiceDate) {
        const invMonth = doc.invoiceDate.substring(0, 7);
        invoiceMonthMap[invMonth] = (invoiceMonthMap[invMonth] || 0) + (doc.grandTotal || 0);
      }

      if (doc.studentId) {
        const sId = String(doc.studentId);
        if (!studentMap[sId]) {
          const actualStudent = allStudents.find(s => String(s.studentId) === sId);
          studentMap[sId] = {
            id: sId,
            name: actualStudent ? actualStudent.fullName : (doc.studentName || "Unknown"),
            class: actualStudent ? actualStudent.class : (doc.class || "N/A"),
            totalPaid: 0,
            months: new Set(),
            feeBreakdown: {}
          };
        }
        studentMap[sId].totalPaid += (doc.grandTotal || 0);
        
        (doc.selectedMonths || []).forEach(m => studentMap[sId].months.add(m));

        Object.entries(doc.feeDetails || {}).forEach(([type, amount]) => {
          studentMap[sId].feeBreakdown[type] = (studentMap[sId].feeBreakdown[type] || 0) + (Number(amount) || 0);
        });
      }

      Object.entries(doc.monthWiseDetails || {}).forEach(([monthName, details]) => {
        if (!academicMonthMap[monthName]) academicMonthMap[monthName] = { total: 0 };
        Object.entries(details.amounts || {}).forEach(([feeType, amtStr]) => {
          const amt = parseInt(amtStr, 10) || 0;
          academicMonthMap[monthName][feeType] = (academicMonthMap[monthName][feeType] || 0) + amt;
          academicMonthMap[monthName].total += amt;
        });
      });
    });

    const feeTypeChart = Object.keys(feeTypeMap).map(key => ({ name: key, value: feeTypeMap[key] }));
    const allFeeNames = Object.keys(feeTypeMap); 
    
    let highestMonth = { month: "নাই", amount: 0 };
    const invoiceChart = Object.keys(invoiceMonthMap).sort().map(key => {
      if (invoiceMonthMap[key] > highestMonth.amount) {
        highestMonth = { month: key, amount: invoiceMonthMap[key] };
      }
      return { month: key, earning: invoiceMonthMap[key] };
    });

    const sortedMonths = Object.keys(invoiceMonthMap).sort();
    const startMonth = sortedMonths[0] || "N/A";
    const endMonth = sortedMonths[sortedMonths.length - 1] || "N/A";
    const latestMonthEarning = invoiceMonthMap[endMonth] || 0;

    let maxPaidStudent = { name: "নাই", amount: 0, class: "", id: "", upToMonth: "N/A" };
    let mostMonthsStudent = { name: "নাই", monthsCount: 0, class: "", id: "", upToMonth: "N/A" };

    const studentsList = Object.values(studentMap).map(s => {
      const monthsArray = Array.from(s.months).sort((a, b) => (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99));
      const monthsCount = monthsArray.length;
      const upToMonth = monthsCount > 0 ? monthsArray[monthsCount - 1] : "N/A";
      
      if (s.totalPaid > maxPaidStudent.amount) {
        maxPaidStudent = { name: s.name, amount: s.totalPaid, class: s.class, id: s.id, upToMonth };
      }
      if (monthsCount > mostMonthsStudent.monthsCount) {
        mostMonthsStudent = { name: s.name, monthsCount: monthsCount, class: s.class, id: s.id, upToMonth };
      }

      return {
        ...s,
        monthsCount,
        upToMonth,
        monthsList: monthsArray.join(", ")
      };
    });

    const topStudentsChart = [...studentsList]
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10)
      .map(s => ({
        name: `${s.name.split(' ')[0]} (${s.id})`,
        fullName: s.name,
        totalAmount: s.totalPaid,
        upToMonth: s.upToMonth,
        ...s.feeBreakdown 
      }));

    // 2. Missing Months & Completely Unpaid Students Calculation
    const currentMonthIndex = new Date().getMonth(); 
    const allYearMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const requiredMonths = allYearMonths.slice(0, currentMonthIndex + 1);

    const defaulterStudents = [];
    const zeroRecordStudents = [];
    
    allStudents.forEach(student => {
      const sId = String(student.studentId);
      const paidData = studentMap[sId]; 
      
      if (!paidData) {
        zeroRecordStudents.push({
          id: sId,
          name: student.fullName,
          class: student.class
        });
      } else {
        const paidSet = paidData.months;
        const missing = requiredMonths.filter(m => !paidSet.has(m));
        
        if (missing.length > 0) {
          defaulterStudents.push({
            id: sId,
            name: student.fullName,
            class: student.class,
            missingMonths: missing,
            estimatedDue: missing.length * defaultTuitionFee
          });
        }
      }
    });

    // 3. Global Expected Revenue & Total Due Calculation
    const totalActiveStudents = allStudents.length;
    const monthsPassed = currentMonthIndex + 1;
    const expectedRevenue = totalActiveStudents * ((monthsPassed * defaultTuitionFee) + defaultExamFee);
    const totalDue = Math.max(0, expectedRevenue - overallTotal);

    return {
      overallTotal,
      feeTypeChart,
      allFeeNames,
      feeTypeMap,
      invoiceChart,
      highestMonth,
      startMonth,
      endMonth,
      latestMonthEarning,
      maxPaidStudent,
      mostMonthsStudent,
      studentsList,
      topStudentsChart,
      academicMonthMap,
      defaulterStudents,
      zeroRecordStudents,
      totalActiveStudents,
      expectedRevenue,
      totalDue
    };
  }, [feesData, allStudents, defaultTuitionFee, defaultExamFee]);

  const generatePDF = () => {
    if (feesData.length === 0) return alert("ডাউনলোড করার মতো কোনো ডেটা নেই!");
    
    const doc = new jsPDF("p", "pt", "a4");
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); 
    doc.text("WSC - Fee Collection Report", 40, 50);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 70);
    doc.text(`Based on: ${feesData.length} database records`, 40, 85);
    doc.text(`Total Collected: ${reportStats.overallTotal.toLocaleString()} BDT`, 40, 100);
    doc.text(`Estimated Due: ${reportStats.totalDue.toLocaleString()} BDT`, 40, 115);

    const tableColumn = ["Academic Month", "Fee Types Breakdown", "Total Amount (BDT)"];
    const tableRows = [];

    const allFeeTypes = new Set();
    Object.values(reportStats.academicMonthMap).forEach(monthData => {
      Object.keys(monthData).forEach(key => {
        if(key !== "total") allFeeTypes.add(key);
      });
    });

    Object.keys(reportStats.academicMonthMap).forEach(month => {
      const mData = reportStats.academicMonthMap[month];
      let breakdownText = "";
      allFeeTypes.forEach(ft => {
        if (mData[ft]) breakdownText += `${ft}: ${mData[ft]} BDT\n`;
      });
      tableRows.push([month, breakdownText.trim(), `${mData.total.toLocaleString()} BDT`]);
    });

    doc.autoTable({
      startY: 135,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }
    });
    doc.save(`WSC_Fees_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const glassCard = "bg-white/80 dark:bg-[#0f172a]/70 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">অ্যানালাইটিক্স ডেটা প্রস্তুত করা হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className={`${glassCard} p-6 text-center border-red-200 dark:border-red-900/50`}>
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent min-h-screen font-sans text-slate-900 dark:text-slate-100 animate-in fade-in duration-300">
      
      {/* Header & Settings */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Revenue & Due Analytics</h1>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 border border-indigo-200 dark:border-indigo-500/30 dark:text-indigo-300 dark:bg-indigo-900/40 backdrop-blur-md rounded-full shadow-sm">
              <Database className="w-3.5 h-3.5" />
              {feesData.length} Records
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
            সমগ্র কালেকশন এবং বকেয়ার (Due) ডিপ অ্যানালাইসিস।
          </p>
        </div>

        {/* Dynamic Expected Fee Settings */}
        <div className={`${glassCard} !rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shrink-0`}>
          <div className="flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Calculation Settings:</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Tuition Rate/Month</label>
              <input 
                type="number" 
                value={defaultTuitionFee} 
                onChange={(e) => setDefaultTuitionFee(Number(e.target.value) || 0)}
                className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-indigo-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Yearly Exam Fee</label>
              <input 
                type="number" 
                value={defaultExamFee} 
                onChange={(e) => setDefaultExamFee(Number(e.target.value) || 0)}
                className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-emerald-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={generatePDF}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 w-full xl:w-auto shrink-0"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* KPI Cards (Including Total Due) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        <div className={`${glassCard} p-6 flex flex-col justify-center hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 opacity-5"><DollarSign className="w-32 h-32" /></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Collected Revenue</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">৳ {reportStats.overallTotal.toLocaleString()}</h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> From {reportStats.totalActiveStudents} active students
          </p>
        </div>

        <div className={`${glassCard} p-6 flex flex-col justify-center border-orange-200 dark:border-orange-900/50 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 opacity-5 text-orange-600"><Wallet className="w-32 h-32" /></div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Estimated Total Due</p>
          <h3 className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-2">৳ {reportStats.totalDue.toLocaleString()}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-2">
            Expected: ৳ {reportStats.expectedRevenue.toLocaleString()}
          </p>
        </div>

        <div className={`${glassCard} p-6 flex flex-col justify-center hover:shadow-xl transition-all hover:-translate-y-1`}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Highest Earning Month</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">{reportStats.highestMonth.month}</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            ৳ {reportStats.highestMonth.amount.toLocaleString()}
          </p>
        </div>

        <div className={`${glassCard} p-6 flex flex-col justify-center hover:shadow-xl transition-all hover:-translate-y-1`}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Top Payer Ever</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2 truncate" title={reportStats.maxPaidStudent.name}>
            {reportStats.maxPaidStudent.name}
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold mt-2 truncate">
            ৳ {reportStats.maxPaidStudent.amount.toLocaleString()} ({reportStats.maxPaidStudent.upToMonth})
          </p>
        </div>
      </div>

      {/* --- NEW SECTION: Students with NO RECORDS (0 Paid) --- */}
      {reportStats.zeroRecordStudents.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <UserX className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unpaid Students (0 Records)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">যে সকল শিক্ষার্থীর ডাটাবেসে এখন পর্যন্ত কোনো ফি রেকর্ড নেই।</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {reportStats.zeroRecordStudents.map(student => (
              <div key={student.id} className="relative group bg-rose-50/50 dark:bg-rose-900/10 backdrop-blur-xl border border-rose-200 dark:border-rose-900/40 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-rose-400 transition-all overflow-hidden">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={student.name}>{student.name}</h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">ID: {student.id} &nbsp;•&nbsp; Class: {student.class}</p>
                <div className="mt-3">
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-xs font-bold rounded-lg border border-rose-200 dark:border-rose-800">
                    No Payment Found
                  </span>
                </div>
                
                {/* Hover Add Button */}
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/80 backdrop-blur-[4px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-3xl">
                  <button 
                    onClick={() => navigate('/fee/entry')} 
                    className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-rose-700 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                  >
                    <PlusCircle className="w-5 h-5"/> Add Fee Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Missing Months Alert (Defaulters) --- */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Due Fees (Missing Months)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">বর্তমান মাস অনুযায়ী যে সকল শিক্ষার্থীর আংশিক ফি বকেয়া রয়েছে।</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {reportStats.defaulterStudents.slice(0, 12).map(student => (
            <div key={student.id} className="relative group bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-orange-200/60 dark:border-orange-900/40 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-orange-400 dark:hover:border-orange-700/50 transition-all overflow-hidden flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={student.name}>{student.name}</h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">ID: {student.id} &nbsp;•&nbsp; Class: {student.class}</p>
                <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
                  {student.missingMonths.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      {m.substring(0,3)}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Due</span>
                <span className="font-black text-orange-600 dark:text-orange-400">৳ {student.estimatedDue.toLocaleString()}</span>
              </div>
              
              {/* Hover Add Button */}
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/70 backdrop-blur-[4px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-3xl">
                <button 
                  onClick={() => navigate('/fee/entry')} 
                  className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                >
                  <PlusCircle className="w-5 h-5"/> Add Fee Record
                </button>
              </div>
            </div>
          ))}
          
          {reportStats.defaulterStudents.length === 0 && (
            <div className="col-span-full p-8 text-center bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-3xl backdrop-blur-xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Great Job!</h3>
              <p className="text-emerald-600 dark:text-emerald-500/70">বর্তমান মাস পর্যন্ত কারও কোনো আংশিক ফি বকেয়া নেই।</p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic All Fee Types Breakdown Banner */}
      <div className="mb-10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          খাতওয়ারি মোট আয় (Fee Breakdown)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {reportStats.feeTypeChart.map((fee, idx) => (
            <div key={idx} className={`${glassCard} p-5 !rounded-2xl flex flex-col justify-center items-center text-center`}>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider truncate w-full" title={fee.name}>{fee.name}</p>
              <p className="text-xl font-black mt-2" style={{ color: COLORS[idx % COLORS.length] }}>
                ৳ {fee.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className={`${glassCard} p-6`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">মাসিক রেভিনিউ কালেকশন গ্রাফ</h3>
          <div className="h-72">
            {reportStats.invoiceChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportStats.invoiceChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontWeight: 600 }}
                    formatter={(value) => [`৳ ${value.toLocaleString()}`, 'Earning']}
                  />
                  <Area type="monotone" dataKey="earning" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorEarning)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">গ্রাফ দেখানোর মতো যথেষ্ট ডেটা নেই</div>
            )}
          </div>
        </div>

        <div className={`${glassCard} p-6`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">ফি টাইপ অনুযায়ী আয়ের অনুপাত</h3>
          <div className="h-72">
            {reportStats.feeTypeChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportStats.feeTypeChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={80} 
                    outerRadius={105}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {reportStats.feeTypeChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`৳ ${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">চার্ট দেখানোর মতো যথেষ্ট ডেটা নেই</div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Student Based Stacked Bar Chart */}
      <div className={`${glassCard} p-6 mb-10`}>
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">শীর্ষ ১০ শিক্ষার্থীর ফি ব্রেকডাউন</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">কোন শিক্ষার্থী কোন খাতে কত টাকা দিয়েছে তার ডাইনামিক স্ট্যাকড বার-চার্ট</p>
          </div>
        </div>
        <div className="h-96">
          {reportStats.topStudentsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportStats.topStudentsChart} margin={{ top: 20, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  dy={15}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', color: '#fff', fontWeight: 500 }}
                  formatter={(value, name) => [`৳ ${Number(value).toLocaleString()}`, name]}
                  labelFormatter={(label, payload) => `${payload[0]?.payload?.fullName || label} (সর্বশেষ: ${payload[0]?.payload?.upToMonth || 'N/A'})`}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: 500 }}/>
                {reportStats.allFeeNames.map((feeName, index) => (
                  <Bar 
                    key={feeName} 
                    dataKey={feeName} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]} 
                    barSize={12} 
                    radius={index === reportStats.allFeeNames.length - 1 ? [10, 10, 0, 0] : [0, 0, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">স্টুডেন্ট গ্রাফ দেখানোর মতো যথেষ্ট ডেটা নেই</div>
          )}
        </div>
      </div>

      {/* Student Payments Table */}
      <div className={`${glassCard} overflow-hidden`}>
        <div className="px-7 py-6 border-b border-white/40 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-slate-800/30">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">শিক্ষার্থীদের ফি প্রদানের বিস্তারিত ইতিহাস</h3>
          <span className="text-xs font-bold px-4 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 backdrop-blur-md rounded-full border border-indigo-200/50 dark:border-indigo-700/50">
            মোট স্টুডেন্ট: {reportStats.studentsList.length} জন
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
              <tr>
                <th className="px-7 py-5">আইডি</th>
                <th className="px-7 py-5">নাম</th>
                <th className="px-7 py-5">ক্লাস</th>
                <th className="px-7 py-5">পরিশোধিত মাসসমূহ</th>
                <th className="px-7 py-5 text-center">কোন মাস পর্যন্ত (Up to)</th>
                <th className="px-7 py-5 text-right">সর্বমোট পেইড (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {reportStats.studentsList.map((student, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-7 py-5 font-bold text-indigo-600 dark:text-indigo-400">{student.id}</td>
                  <td className="px-7 py-5 font-bold text-slate-900 dark:text-slate-100">{student.name}</td>
                  <td className="px-7 py-5 font-medium text-slate-600 dark:text-slate-400">{student.class}</td>
                  <td className="px-7 py-5">
                    <span className="text-[11px] px-3 py-1.5 font-semibold bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl whitespace-normal leading-relaxed">
                      {student.monthsList}
                    </span>
                  </td>
                  <td className="px-7 py-5 text-center font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                      {student.upToMonth}
                    </span>
                  </td>
                  <td className="px-7 py-5 text-right font-black text-lg text-slate-900 dark:text-white">
                    ৳ {student.totalPaid.toLocaleString()}
                  </td>
                </tr>
              ))}
              {reportStats.studentsList.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-7 py-10 text-center font-medium text-slate-500">
                    কালেকশনে কোনো ডেটা পাওয়া যায়নি!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}