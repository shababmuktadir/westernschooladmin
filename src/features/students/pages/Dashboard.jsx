import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Wallet, AlertCircle, CheckCircle2, TrendingUp, 
  GraduationCap, BookOpen, Banknote, CalendarCheck, FileText, BadgePercent,
  Layers, UserX, UserCheck
} from "lucide-react";

// Services
import { getStudents } from "@/features/students/services/studentService";
import { getBulkStudentFees } from "@/features/fee/services/feeService";
import { getTeachers, getSalariesByMonth, getAttendanceByDate } from "@/features/teachers/services/teacherService";

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: { total: 0, male: 0, female: 0, classWise: {} },
    teachers: { total: 0, salaryCost: 0, presentToday: 0, absentToday: 0 },
    fees: { 
      totalEarned: 0, 
      tuitionEarned: 0, 
      tuitionDue: 0, 
      examFee: 0, 
      admissionFee: 0, 
      tcFee: 0, 
      readmissionFee: 0, 
      otherFee: 0 
    },
    lists: { fullyPaid: [], withDues: [] }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const date = new Date();
      const currentMonthIndex = date.getMonth() + 1; // August = 8
      const currentMonthStr = date.toISOString().substring(0, 7); // "2026-08"
      const todayStr = date.toISOString().split("T")[0]; // "2026-08-04"
      const requiredMonthsUpToNow = ALL_MONTHS.slice(0, currentMonthIndex);

      // 1. Fetch All Real-time Data Parallelly
      const [studentsData, feesData, teachersData, salariesData, attendanceData] = await Promise.all([
        getStudents().catch(() => []),
        getBulkStudentFees().catch(() => []),
        getTeachers().catch(() => []),
        getSalariesByMonth(currentMonthStr).catch(() => []),
        getAttendanceByDate(todayStr).catch(() => [])
      ]);

      // 2. Process Students & Gender / Class Count
      let male = 0, female = 0;
      const classWise = {};
      const activeStudents = studentsData.filter(s => s.status !== "Inactive");

      activeStudents.forEach(s => {
        if (s.gender === "Male") male++;
        else if (s.gender === "Female") female++;
        
        const cls = s.class || "Unassigned";
        classWise[cls] = (classWise[cls] || 0) + 1;
      });

      // 3. Process Teachers & Salaries & Attendance
      const totalTeachers = teachersData.length;
      const salaryCost = salariesData.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
      const presentToday = attendanceData.filter(a => a.status === "P").length;
      const absentToday = totalTeachers > 0 ? Math.max(0, totalTeachers - presentToday) : 0;

      // 4. Process All Student Fees Breakdowns
      let grandTotalEarned = 0;
      let tuitionEarned = 0;
      let examFee = 0;
      let admissionFee = 0;
      let readmissionFee = 0;
      let tcFee = 0;
      let otherFee = 0;

      // Track paid months per student ID
      const studentPaidMonthsMap = {};

      feesData.forEach(feeDoc => {
        const total = Number(feeDoc.grandTotal || feeDoc.amount || 0);
        grandTotalEarned += total;

        const sId = String(feeDoc.studentId);
        if (!studentPaidMonthsMap[sId]) studentPaidMonthsMap[sId] = new Set();

        if (Array.isArray(feeDoc.selectedMonths)) {
          feeDoc.selectedMonths.forEach(m => studentPaidMonthsMap[sId].add(m));
        }

        // Breakdown feeDetails object
        const details = feeDoc.feeDetails || {};
        Object.entries(details).forEach(([key, value]) => {
          const amt = Number(value) || 0;
          const kLower = key.toLowerCase();

          if (kLower.includes("monthly") || kLower.includes("tuition")) {
            tuitionEarned += amt;
          } else if (kLower.includes("exam")) {
            examFee += amt;
          } else if (kLower.includes("re-admission") || kLower.includes("readmission")) {
            readmissionFee += amt;
          } else if (kLower.includes("admission")) {
            admissionFee += amt;
          } else if (kLower.includes("tc") || kLower.includes("transfer")) {
            tcFee += amt;
          } else {
            otherFee += amt;
          }
        });
      });

      // 5. Calculate Dues & Categorize Students (Up to August)
      let totalTuitionDue = 0;
      const fullyPaid = [];
      const withDues = [];

      activeStudents.forEach(s => {
        const sId = String(s.studentId || s.id);
        const paidSet = studentPaidMonthsMap[sId] || new Set();
        const monthlyRate = Number(s.monthlyFee || s.tuitionFee || 1000);

        const missingMonths = requiredMonthsUpToNow.filter(m => !paidSet.has(m));

        if (missingMonths.length === 0) {
          fullyPaid.push(s);
        } else {
          const dueAmount = missingMonths.length * monthlyRate;
          totalTuitionDue += dueAmount;
          withDues.push({
            ...s,
            dueAmount,
            dueMonthsCount: missingMonths.length,
            missingMonths,
            monthlyRate
          });
        }
      });

      // Sort students with dues by highest due amount
      withDues.sort((a, b) => b.dueAmount - a.dueAmount);

      setStats({
        students: { total: activeStudents.length, male, female, classWise },
        teachers: { total: totalTeachers, salaryCost, presentToday, absentToday },
        fees: { 
          totalEarned: grandTotalEarned, 
          tuitionEarned, 
          tuitionDue: totalTuitionDue, 
          examFee, 
          admissionFee, 
          tcFee, 
          readmissionFee, 
          otherFee 
        },
        lists: { fullyPaid, withDues }
      });

      setLoading(false);
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Analytics Data...</p>
      </div>
    );
  }

  // Animation Variants
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVars = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="p-6 max-w-[1600px] mx-auto space-y-6 font-sans">
      
      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            System Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Western School & College Analytics Overview</p>
        </div>
        <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-sm">
          Billing Context: <span className="text-indigo-600 dark:text-indigo-400">Up to August 2026</span>
        </div>
      </div>

      {/* METRICS ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Earned */}
        <motion.div variants={itemVars} className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <h3 className="text-blue-100 font-bold uppercase text-xs mb-1 tracking-wider">Total Collection Earned</h3>
          <p className="text-3xl font-black mb-2">৳ {stats.fees.totalEarned.toLocaleString()}</p>
          <div className="text-xs font-medium bg-white/20 inline-block px-2.5 py-1 rounded-lg backdrop-blur-sm">
            Tuition Fee: ৳ {stats.fees.tuitionEarned.toLocaleString()}
          </div>
        </motion.div>

        {/* Tuition Dues */}
        <motion.div variants={itemVars} className="bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <h3 className="text-rose-100 font-bold uppercase text-xs mb-1 tracking-wider">Total Tuition Dues</h3>
          <p className="text-3xl font-black mb-2">৳ {stats.fees.tuitionDue.toLocaleString()}</p>
          <div className="text-xs font-medium bg-white/20 inline-block px-2.5 py-1 rounded-lg backdrop-blur-sm">
            {stats.lists.withDues.length} Students Pending
          </div>
        </motion.div>

        {/* Total Students */}
        <motion.div variants={itemVars} className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs mb-1">Total Active Students</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-2">{stats.students.total}</p>
          <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="text-blue-500">Male: {stats.students.male}</span>
            <span className="text-pink-500">Female: {stats.students.female}</span>
          </div>
        </motion.div>

        {/* Teacher Salary Cost */}
        <motion.div variants={itemVars} className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
            <Banknote className="w-6 h-6" />
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs mb-1">Teacher Salary Cost</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-2">৳ {stats.teachers.salaryCost.toLocaleString()}</p>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            For {stats.teachers.total} Staff Members
          </div>
        </motion.div>
      </div>

      {/* SECOND ROW: FEE BREAKDOWN & CLASS DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fee Category Breakdown */}
        <motion.div variants={itemVars} className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500"/> Revenue Breakdown by Category
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <BookOpen className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Exam Fee</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">৳ {stats.fees.examFee.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <GraduationCap className="w-5 h-5 text-emerald-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Admission Fee</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">৳ {stats.fees.admissionFee.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <BadgePercent className="w-5 h-5 text-orange-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Re-Admission Fee</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">৳ {stats.fees.readmissionFee.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <FileText className="w-5 h-5 text-purple-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">TC / Transfer Fee</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">৳ {stats.fees.tcFee.toLocaleString()}</p>
            </div>
          </div>

          {/* Class-wise Student Distribution */}
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Class-wise Student Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.students.classWise).map(([className, count]) => {
              const percentage = Math.min((count / Math.max(1, stats.students.total)) * 100, 100);
              return (
                <div key={className} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{className}</div>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${percentage}%` }} 
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full"
                    />
                  </div>
                  <div className="w-10 text-right text-xs font-bold text-slate-800 dark:text-white">{count}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Teacher Attendance Overview */}
        <motion.div variants={itemVars} className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-500"/> Today's Staff Attendance
            </h2>
            
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-800 mb-4">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                   <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                   <motion.circle 
                     cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="16" fill="transparent" 
                     strokeDasharray="452" 
                     strokeDashoffset={452 - (452 * (stats.teachers.presentToday / Math.max(1, stats.teachers.total)))}
                     className="text-emerald-500 transition-all duration-1000"
                   />
                 </svg>
                 <div className="text-center">
                   <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.teachers.presentToday}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Present</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-between p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-center flex-1">
              <p className="text-2xl font-black text-emerald-600">{stats.teachers.presentToday}</p>
              <p className="text-xs font-bold text-slate-500">PRESENT</p>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="text-center flex-1">
              <p className="text-2xl font-black text-rose-600">{stats.teachers.absentToday}</p>
              <p className="text-xs font-bold text-slate-500">ABSENT</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* THIRD ROW: STUDENT DUES TABLE & FULLY PAID LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Dues Students */}
        <motion.div variants={itemVars} className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[520px]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-900/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-500" /> Pending Tuition Dues (Up to August)
            </h2>
            <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-bold">
              {stats.lists.withDues.length} Students
            </span>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
            {stats.lists.withDues.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-3 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Class / Roll</th>
                    <th className="p-3 font-semibold text-center">Months Due</th>
                    <th className="p-3 font-semibold text-right">Amount (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {stats.lists.withDues.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{s.fullName}</p>
                        <p className="text-[10px] text-slate-400">ID: {s.studentId}</p>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{s.class} / {s.rollNumber}</td>
                      <td className="p-3 text-center text-rose-600 font-bold">{s.dueMonthsCount}m</td>
                      <td className="p-3 text-right font-black text-rose-600">৳ {s.dueAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-2" />
                <p className="font-semibold text-emerald-600">All students have cleared their fees up to August!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Fully Paid Students */}
        <motion.div variants={itemVars} className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[520px]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" /> Fully Paid (Up to current month)
            </h2>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
              {stats.lists.fullyPaid.length} Students
            </span>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
            {stats.lists.fullyPaid.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-3 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Class / Roll</th>
                    <th className="p-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {stats.lists.fullyPaid.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{s.fullName}</p>
                        <p className="text-[10px] text-slate-400">ID: {s.studentId}</p>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{s.class} / {s.rollNumber}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold">CLEAR</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-2" />
                <p>No fully paid students found yet.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}