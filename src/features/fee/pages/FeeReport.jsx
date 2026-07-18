import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from "recharts";
import { 
  Download, TrendingUp, DollarSign, Calendar, Users, Loader2, Award, CheckCircle2, Layers, Database 
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

// --- ফায়ারবেস ইমপোর্ট ---
import { db } from "@/config/firebase"; 
import { collection, getDocs } from "firebase/firestore";

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#f43f5e', '#06b6d4'];

export default function FeeReport() {
  const [feesData, setFeesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllFees = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "studentFees"));
        const allDocs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFeesData(allDocs);
        setError(null);
      } catch (err) {
        console.error("Error fetching student fees: ", err);
        setError("ফায়ারবেস থেকে ডেটা লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchAllFees();
  }, []);

  const reportStats = useMemo(() => {
    let overallTotal = 0;
    const feeTypeMap = {};
    const invoiceMonthMap = {};
    const academicMonthMap = {};
    const studentMap = {};

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
        if (!studentMap[doc.studentId]) {
          studentMap[doc.studentId] = {
            id: doc.studentId,
            name: doc.studentName || "Unknown",
            class: doc.class || "N/A",
            totalPaid: 0,
            months: new Set(),
            feeBreakdown: {}
          };
        }
        studentMap[doc.studentId].totalPaid += (doc.grandTotal || 0);
        
        (doc.selectedMonths || []).forEach(m => studentMap[doc.studentId].months.add(m));

        Object.entries(doc.feeDetails || {}).forEach(([type, amount]) => {
          studentMap[doc.studentId].feeBreakdown[type] = (studentMap[doc.studentId].feeBreakdown[type] || 0) + (Number(amount) || 0);
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
      const monthsArray = Array.from(s.months);
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
      academicMonthMap
    };
  }, [feesData]);

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
    doc.text(`Duration: ${reportStats.startMonth} to ${reportStats.endMonth}`, 40, 100);
    doc.text(`Total Earnings: ${reportStats.overallTotal.toLocaleString()} BDT`, 40, 115);

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
        if (mData[ft]) {
          breakdownText += `${ft}: ${mData[ft]} BDT\n`;
        }
      });

      tableRows.push([
        month,
        breakdownText.trim(),
        `${mData.total.toLocaleString()} BDT`
      ]);
    });

    doc.autoTable({
      startY: 135,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`WSC_All_Fees_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Glassmorphism Base Classes
  const glassCard = "bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ফায়ারবেস থেকে সকল ফি রিপোর্ট লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className={`${glassCard} p-6 text-center border-red-200/50 dark:border-red-900/30`}>
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent min-h-screen font-sans text-slate-800 dark:text-slate-200 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fee Collection & Revenue Analytics</h1>
            
            <span className="flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 border border-indigo-200/50 dark:border-indigo-500/30 dark:text-indigo-400 dark:bg-indigo-500/20 backdrop-blur-sm rounded-full shadow-sm">
              <Database className="w-3.5 h-3.5" />
              {feesData.length} Documents Analyzed
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            সমগ্র কালেকশন ডেটার ডিপ অ্যানালাইসিস এবং স্টুডেন্ট পারফরম্যান্স ওভারভিউ।
          </p>
        </div>
        <button 
          onClick={generatePDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-700 backdrop-blur-sm text-white font-medium rounded-xl transition-all shadow-sm shrink-0"
        >
          <Download className="w-4 h-4" />
          A4 পিডিএফ ডাউনলোড
        </button>
      </div>

      {/* 6-Grid Advanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Total Income */}
        <div className={`${glassCard} p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">সর্বমোট ইনকাম</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white truncate">৳ {reportStats.overallTotal.toLocaleString()}</h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 truncate">
              {reportStats.startMonth} থেকে {reportStats.endMonth}
            </p>
          </div>
        </div>

        {/* Highest Earning Month */}
        <div className={`${glassCard} p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">সর্বোচ্চ আয়ের মাস</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{reportStats.highestMonth.month}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              আয়: ৳ {reportStats.highestMonth.amount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Max Paid Student Ever */}
        <div className={`${glassCard} p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">সর্বোচ্চ ফি প্রদানকারী</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={reportStats.maxPaidStudent.name}>
              {reportStats.maxPaidStudent.name}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              পেইড: ৳ {reportStats.maxPaidStudent.amount.toLocaleString()} ({reportStats.maxPaidStudent.upToMonth} পর্যন্ত)
            </p>
          </div>
        </div>

        {/* Most Months Cleared Student */}
        <div className={`${glassCard} p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">সর্বাধিক মাস পরিশোধকারী</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" title={reportStats.mostMonthsStudent.name}>
              {reportStats.mostMonthsStudent.name}
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
              ক্লিয়ার: {reportStats.mostMonthsStudent.monthsCount} মাস ({reportStats.mostMonthsStudent.upToMonth} পর্যন্ত)
            </p>
          </div>
        </div>

        {/* Latest Month Earning */}
        <div className={`${glassCard} p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
          <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">চলতি মাস ({reportStats.endMonth})</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳ {reportStats.latestMonthEarning.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">লেটেস্ট ইনভয়েস মাস</p>
          </div>
        </div>

        {/* Total Active Students */}
        <div className={`${glassCard} p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">মোট পেইড শিক্ষার্থী</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reportStats.studentsList.length} জন</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ডেটাবেস রেকর্ড অনুযায়ী</p>
          </div>
        </div>

      </div>

      {/* Dynamic All Fee Types Breakdown Banner */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          খাতওয়ারি মোট আয় (All Fee Types Breakdown)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {reportStats.feeTypeChart.map((fee, idx) => (
            <div key={idx} className={`${glassCard} p-4 !rounded-xl`}>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate" title={fee.name}>{fee.name}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1" style={{ color: COLORS[idx % COLORS.length] }}>
                ৳ {fee.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Area Chart: Monthly Revenue */}
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', color: '#fff' }}
                    formatter={(value) => [`৳ ${value.toLocaleString()}`, 'Earning']}
                  />
                  <Area type="monotone" dataKey="earning" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEarning)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">গ্রাফ দেখানোর মতো যথেষ্ট ডেটা নেই</div>
            )}
          </div>
        </div>

        {/* Pie Chart: Fee Types */}
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
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="rgba(255,255,255,0.1)"
                  >
                    {reportStats.feeTypeChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`৳ ${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">চার্ট দেখানোর মতো যথেষ্ট ডেটা নেই</div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Student Based Stacked Bar Chart */}
      <div className={`${glassCard} p-6 mb-8`}>
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">শীর্ষ ১০ শিক্ষার্থীর ফি ব্রেকডাউন (Stacked Bar Chart)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">কোন শিক্ষার্থী কোন খাতে কত টাকা দিয়েছে তার ডাইনামিক স্ট্যাকড বার-চার্ট</p>
          </div>
        </div>
        <div className="h-80">
          {reportStats.topStudentsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportStats.topStudentsChart} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', color: '#fff' }}
                  formatter={(value, name) => [`৳ ${Number(value).toLocaleString()}`, name]}
                  labelFormatter={(label, payload) => `${payload[0]?.payload?.fullName || label} (সর্বশেষ: ${payload[0]?.payload?.upToMonth || 'N/A'})`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                {reportStats.allFeeNames.map((feeName, index) => (
                  <Bar 
                    key={feeName} 
                    dataKey={feeName} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]} 
                    radius={index === reportStats.allFeeNames.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">স্টুডেন্ট গ্রাফ দেখানোর মতো যথেষ্ট ডেটা নেই</div>
          )}
        </div>
      </div>

      {/* Student Payments Table */}
      <div className={`${glassCard} overflow-hidden`}>
        <div className="px-6 py-5 border-b border-white/30 dark:border-white/10 flex justify-between items-center bg-white/30 dark:bg-slate-900/30">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">শিক্ষার্থীদের ফি প্রদানের বিস্তারিত ইতিহাস (Up to Month সহ)</h3>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 backdrop-blur-sm rounded-full border border-indigo-200/50 dark:border-indigo-500/20">
            মোট স্টুডেন্ট: {reportStats.studentsList.length} জন
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase bg-white/40 dark:bg-white/5 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-semibold">আইডি</th>
                <th className="px-6 py-4 font-semibold">নাম</th>
                <th className="px-6 py-4 font-semibold">ক্লাস</th>
                <th className="px-6 py-4 font-semibold">পরিশোধিত মাসসমূহ</th>
                <th className="px-6 py-4 font-semibold text-center">কোন মাস পর্যন্ত (Up to)</th>
                <th className="px-6 py-4 font-semibold text-right">সর্বমোট পেইড (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 dark:divide-white/10">
              {reportStats.studentsList.map((student, idx) => (
                <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">{student.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{student.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.class}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2.5 py-1 bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-lg whitespace-normal leading-relaxed">
                      {student.monthsList}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 backdrop-blur-sm">
                    {student.upToMonth}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                    ৳ {student.totalPaid.toLocaleString()}
                  </td>
                </tr>
              ))}
              {reportStats.studentsList.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
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