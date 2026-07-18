import React, { useState, useEffect, useRef, useMemo } from "react";
import { getStudents } from "@/features/students/services/studentService";
import { getStudentFees } from "@/features/fee/services/feeService";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Search, UserCheck, FileText, Printer, Loader2, Filter } from "lucide-react";

export default function FeeHistory() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filters
  const [classFilter, setClassFilter] = useState(""); // for student search
  const [monthFilter, setMonthFilter] = useState(""); // for fee records

  const searchRef = useRef(null);
  const printRef = useRef(null);

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      const data = await getStudents();
      setStudents(data);
      setLoadingStudents(false);
    };
    fetchStudents();
  }, []);

  // Filter students by search term and class
  useEffect(() => {
    if (searchTerm.trim() === "" && classFilter === "") {
      setFilteredStudents([]);
      return;
    }
    let results = students;

    if (classFilter) {
      results = results.filter((s) => s.class === classFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      results = results.filter(
        (s) =>
          String(s.studentId).toLowerCase().includes(lower) ||
          (s.fullName && s.fullName.toLowerCase().includes(lower))
      );
    }
    setFilteredStudents(results);
    setShowDropdown(results.length > 0);
  }, [searchTerm, classFilter, students]);

  // Fetch fee history
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
        setMonthFilter(""); // reset month filter when changing student
      } catch (error) {
        console.error("Failed to fetch fee history:", error);
        setFeeHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedStudent]);

  // Extract unique months from the fee history (for the month filter)
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set();
    feeHistory.forEach((record) => {
      if (record.selectedMonths && Array.isArray(record.selectedMonths)) {
        record.selectedMonths.forEach((m) => monthsSet.add(m));
      }
    });
    return Array.from(monthsSet).sort();
  }, [feeHistory]);

  // Filter fee records by selected month
  const filteredFeeHistory = useMemo(() => {
    if (!monthFilter) return feeHistory;
    return feeHistory.filter((record) => {
      return record.selectedMonths && record.selectedMonths.includes(monthFilter);
    });
  }, [feeHistory, monthFilter]);

  // Get unique classes for the class filter dropdown
  const uniqueClasses = useMemo(() => {
    const classes = students.map((s) => s.class).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [students]);

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
        
        .fee-history-container {
          font-family: 'Montserrat', sans-serif;
        }
        .fee-history-title {
          font-weight: 700;
          font-size: 1.5rem;
          color: #1e293b;
          line-height: 1.3;
        }
        .fee-history-subtitle {
          font-weight: 400;
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        .card-title {
          font-weight: 600;
          font-size: 1.125rem;
        }
        /* Ensure dropdown is not clipped */
        .search-dropdown {
          z-index: 50;
          position: absolute;
          width: 100%;
          max-height: 15rem;
          overflow-y: auto;
        }
        /* Parent must allow overflow */
        .search-container {
          position: relative;
          overflow: visible;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #fee-history-print, #fee-history-print * {
            visibility: visible;
          }
          #fee-history-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6 fee-history-container">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="fee-history-title flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" /> ফি হিস্টোরি
            </div>
            <div className="fee-history-subtitle">
              শিক্ষার্থীর পেমেন্ট হিস্টোরি দেখতে আইডি বা নাম লিখে সার্চ করুন।
            </div>
          </div>
        </div>

        {/* Student search card */}
        <Card>
          <CardHeader>
            <CardTitle>শিক্ষার্থী নির্বাচন করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Search input */}
              <div className="search-container flex-1" ref={searchRef}>
                <Input
                  placeholder="আইডি বা নাম দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (filteredStudents.length > 0) setShowDropdown(true);
                  }}
                  icon={<Search className="w-4 h-4 text-slate-400" />}
                />
                {loadingStudents && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}
                {/* Dropdown */}
                {showDropdown && filteredStudents.length > 0 && (
                  <div className="search-dropdown mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.studentId}
                        onClick={() => handleSelectStudent(student)}
                        className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4 text-blue-500" />
                        <span>
                          {student.fullName} <span className="text-slate-400 text-sm">({student.studentId})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && searchTerm && filteredStudents.length === 0 && !loadingStudents && (
                  <div className="search-dropdown mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg p-4 text-sm text-slate-500">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </div>
                )}
              </div>

              {/* Class filter dropdown */}
              <div className="sm:w-48">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">সকল শ্রেণি</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee history card */}
        {selectedStudent && (
          <div id="fee-history-print" ref={printRef}>
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    {selectedStudent.fullName}
                    <span className="text-sm font-normal text-slate-500">
                      (আইডি: {selectedStudent.studentId})
                    </span>
                  </CardTitle>
                  <p className="text-sm text-slate-500">
                    {selectedStudent.class && `শ্রেণি: ${selectedStudent.class} | `}
                    {selectedStudent.section && `শাখা: ${selectedStudent.section} | `}
                    {selectedStudent.roll && `রোল: ${selectedStudent.roll}`}
                  </p>
                </div>
                <div className="flex gap-2 no-print items-center">
                  {/* Month filter (inside history card) */}
                  <div className="flex items-center gap-1">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="h-9 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
                    >
                      <option value="">সব মাস</option>
                      {uniqueMonths.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    leftIcon={<Printer className="w-4 h-4" />}
                    onClick={handlePrint}
                    disabled={feeHistory.length === 0}
                  >
                    প্রিন্ট / PDF ডাউনলোড
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : feeHistory.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-lg font-medium">কোনো ফি হিস্টোরি নেই</p>
                    <p className="text-sm">এই শিক্ষার্থীর এখন পর্যন্ত কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-28">ইনভয়েস নং</TableHead>
                          <TableHead className="w-28">তারিখ</TableHead>
                          <TableHead>পরিশোধিত মাস</TableHead>
                          <TableHead>ফি বিবরণ</TableHead>
                          <TableHead className="text-right w-28">সর্বমোট</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFeeHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.invoiceNo || record.memoNo}</TableCell>
                            <TableCell>{record.invoiceDate || "N/A"}</TableCell>
                            <TableCell>
                              {record.selectedMonths && record.selectedMonths.length > 0
                                ? record.selectedMonths.join(", ")
                                : "N/A"}
                            </TableCell>
                            <TableCell>{formatFeeDetails(record.feeDetails)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ৳ {record.grandTotal?.toLocaleString()}
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