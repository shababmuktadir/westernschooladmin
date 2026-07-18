import React, { useState, useEffect, useRef, useMemo } from "react";
import { getStudents } from "@/features/students/services/studentService";
import { getStudentFees } from "@/features/fee/services/feeService";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Search, User, FileText, Printer, Loader2, Filter, Receipt, CalendarCheck, UserCheck } from "lucide-react";

export default function FeeHistory() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [classFilter, setClassFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const searchRef = useRef(null);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const data = await getStudents();
        setStudents(data.filter(s => s.status !== "Inactive"));
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "" && classFilter === "") {
      setFilteredStudents([]);
      return;
    }
    
    let results = students;
    if (classFilter) results = results.filter((s) => s.class === classFilter);
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      results = results.filter(
        (s) => String(s.studentId).toLowerCase().includes(lower) || (s.fullName && s.fullName.toLowerCase().includes(lower))
      );
    }
    
    setFilteredStudents(results);
    setShowDropdown(results.length > 0 || searchTerm.trim() !== "");
  }, [searchTerm, classFilter, students]);

  useEffect(() => {
    if (!selectedStudent) {
      setFeeHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await getStudentFees(selectedStudent.studentId);
        setFeeHistory(data);
        setMonthFilter(""); 
      } catch (error) {
        console.error("Failed to fetch fee history:", error);
        setFeeHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedStudent]);

  // Dropdown options generator
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set();
    feeHistory.forEach((record) => {
      if (record.selectedMonths && Array.isArray(record.selectedMonths)) {
        record.selectedMonths.forEach((m) => monthsSet.add(m));
      }
    });
    return Array.from(monthsSet).sort();
  }, [feeHistory]);

  const monthOptions = useMemo(() => [
    { label: "সব মাস", value: "" },
    ...uniqueMonths.map(m => ({ label: m, value: m }))
  ], [uniqueMonths]);

  const uniqueClasses = useMemo(() => {
    const classes = students.map((s) => s.class).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [students]);

  const classOptions = useMemo(() => [
    { label: "সকল শ্রেণি", value: "" },
    ...uniqueClasses.map(c => ({ label: c, value: c }))
  ], [uniqueClasses]);

  const filteredFeeHistory = useMemo(() => {
    if (!monthFilter) return feeHistory;
    return feeHistory.filter((record) => record.selectedMonths && record.selectedMonths.includes(monthFilter));
  }, [feeHistory, monthFilter]);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.fullName} (${student.studentId})`);
    setShowDropdown(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatFeeDetails = (details) => {
    if (!details || typeof details !== "object") return "N/A";
    return Object.entries(details)
      .map(([key, value]) => `${key}: ৳${value}`)
      .join(", ");
  };
  
  // এক্সেল ডেট ফিক্স করার ফাংশন 
  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "N/A";
    if (!isNaN(dateVal) && Number(dateVal) > 40000) {
      // Excel serial date to normal date
      const date = new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000));
      return date.toLocaleDateString('en-GB'); 
    }
    return String(dateVal);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #fee-history-print, #fee-history-print * { visibility: visible; }
          #fee-history-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center font-sans tracking-normal">
            <Receipt className="w-6 h-6 mr-2 text-blue-600" /> ফি হিস্ট্রি (Fee History)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            শিক্ষার্থীর আইডি বা নাম দিয়ে সার্চ করে পেমেন্ট রেকর্ড দেখুন।
          </p>
        </div>

        <Card className="overflow-visible border-blue-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              
              <div className="relative flex-1" ref={searchRef}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                  শিক্ষার্থী খুঁজুন
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="নাম অথবা আইডি টাইপ করুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (searchTerm.trim() !== "" || filteredStudents.length > 0) setShowDropdown(true);
                    }}
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors font-sans"
                  />
                  {loadingStudents && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>

                {showDropdown && (
                  <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 fade-in duration-200">
                    {filteredStudents.length > 0 ? (
                      <ul className="py-2">
                        {filteredStudents.map((student) => (
                          <li 
                            key={student.studentId}
                            onClick={() => handleSelectStudent(student)}
                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-4 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white font-sans tracking-normal">{student.fullName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                                ID: <span className="font-medium text-slate-700 dark:text-slate-300">{student.studentId}</span> • Class: {student.class || "N/A"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      searchTerm.trim() !== "" && !loadingStudents && (
                        <div className="px-4 py-8 text-center text-slate-500 font-sans">
                          <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="md:w-64 font-sans">
                <Select
                  label="শ্রেণি ফিল্টার"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  options={classOptions}
                  placeholder="শ্রেণি নির্বাচন করুন"
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {selectedStudent && (
          <div id="fee-history-print" ref={printRef}>
            <Card className="shadow-md overflow-visible">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-visible">
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    {/* ফন্ট ফিক্স করা হয়েছে: tracking-normal এবং font-sans দেওয়া হয়েছে */}
                    <h2 className="text-xl font-bold font-sans tracking-normal leading-normal text-slate-900 dark:text-white uppercase">
                      {selectedStudent.fullName}
                    </h2>
                    <p className="text-sm font-sans tracking-normal text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">ID: {selectedStudent.studentId}</span> 
                      <span>•</span> Class: {selectedStudent.class || "N/A"} 
                      <span>•</span> Roll: {selectedStudent.roll || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 no-print items-center overflow-visible">
                  <div className="w-full sm:w-48 font-sans">
                    <Select
                      leftIcon={<Filter className="h-4 w-4" />}
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      options={monthOptions}
                      placeholder="সব মাস"
                      className="mt-0"
                    />
                  </div>

                  <Button
                    variant="outline"
                    leftIcon={<Printer className="w-4 h-4" />}
                    onClick={handlePrint}
                    disabled={feeHistory.length === 0}
                    className="w-full sm:w-auto bg-white dark:bg-slate-800 h-[42px] font-sans"
                  >
                    প্রিন্ট করুন
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-sans">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-sm font-medium">রেকর্ড লোড হচ্ছে...</p>
                  </div>
                ) : feeHistory.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 font-sans">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">কোনো রেকর্ড নেই</p>
                    <p className="text-sm mt-1">এই শিক্ষার্থীর এখন পর্যন্ত কোনো ফি পেমেন্ট রেকর্ড পাওয়া যায়নি।</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden font-sans tracking-normal">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow>
                          <TableHead className="w-32">ইনভয়েস / মেমো</TableHead>
                          <TableHead className="w-32">তারিখ</TableHead>
                          <TableHead className="w-48">পরিশোধিত মাস</TableHead>
                          <TableHead>ফি বিবরণ (ব্রেকডাউন)</TableHead>
                          <TableHead className="text-right w-32">সর্বমোট (৳)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFeeHistory.map((record) => (
                          <TableRow key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell className="font-medium font-sans text-slate-900 dark:text-slate-100">
                              {record.invoiceNo || record.memoNo}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300 font-sans">
                              <div className="flex items-center gap-1.5">
                                <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                                {formatDisplayDate(record.invoiceDate)}
                              </div>
                            </TableCell>
                            <TableCell className="font-sans">
                              {record.selectedMonths && record.selectedMonths.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {record.selectedMonths.map(m => (
                                    <span key={m} className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-medium border border-blue-100 dark:border-blue-800">
                                      {m.substring(0, 3)}
                                    </span>
                                  ))}
                                </div>
                              ) : "N/A"}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-sans tracking-normal leading-relaxed">
                              {formatFeeDetails(record.feeDetails)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                              {record.grandTotal?.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}