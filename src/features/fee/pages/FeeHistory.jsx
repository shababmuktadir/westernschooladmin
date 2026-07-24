import React, { useState, useEffect, useMemo, useRef } from "react";
import { getStudents } from "@/features/students/services/studentService";
// Note: Ensure getBulkStudentFees fetches all fee records from the database
import { getBulkStudentFees } from "@/features/fee/services/feeService"; 

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown"; 
import DatePicker from "@/components/ui/DatePicker"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Search, FileText, Printer, Loader2, Filter, Receipt, CalendarCheck, User, X, ChevronRight } from "lucide-react";

// মাসের ক্রমানুসারে সাজানোর জন্য অর্ডার ম্যাপ
const MONTH_ORDER = {
  "January": 1, "February": 2, "March": 3, "April": 4,
  "May": 5, "June": 6, "July": 7, "August": 8,
  "September": 9, "October": 10, "November": 11, "December": 12
};

export default function FeeHistory() {
  const [allStudents, setAllStudents] = useState([]);
  const [allFees, setAllFees] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studentsData = await getStudents();
        setAllStudents(studentsData.filter(s => s.status !== "Inactive"));
        
        // Fetch ALL fee records
        const feesData = await getBulkStudentFees(); 
        setAllFees(feesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uniqueClasses = useMemo(() => {
    const classes = allStudents.map((s) => s.class).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [allStudents]);

  const classOptions = useMemo(() => [
    { label: "All Classes", value: "" },
    ...uniqueClasses.map(c => ({ label: c, value: c }))
  ], [uniqueClasses]);

  // Aggregate and Filter Data for the Summary List
  const filteredAndAggregatedData = useMemo(() => {
    let filteredFees = allFees;

    // 1. Date Filter
    if (startDate && endDate) {
      filteredFees = filteredFees.filter(f => {
        const d = new Date(f.invoiceDate);
        return d >= new Date(startDate) && d <= new Date(endDate);
      });
    } else if (startDate) {
      filteredFees = filteredFees.filter(f => new Date(f.invoiceDate) >= new Date(startDate));
    } else if (endDate) {
      filteredFees = filteredFees.filter(f => new Date(f.invoiceDate) <= new Date(endDate));
    }

    // 2. Class Filter
    if (classFilter) {
      const studentsInClass = allStudents.filter(s => s.class === classFilter).map(s => String(s.studentId));
      filteredFees = filteredFees.filter(f => studentsInClass.includes(String(f.studentId)));
    }

    // 3. Search Filter (Name or ID)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredFees = filteredFees.filter(f => {
        const student = allStudents.find(s => String(s.studentId) === String(f.studentId));
        return (
          String(f.studentId).includes(lowerSearch) || 
          (student && student.fullName && student.fullName.toLowerCase().includes(lowerSearch))
        );
      });
    }

    // 4. Aggregate by Student (Summary)
    const aggregated = {};
    filteredFees.forEach(fee => {
      const sId = String(fee.studentId);
      if (!aggregated[sId]) {
        const student = allStudents.find(s => String(s.studentId) === sId);
        aggregated[sId] = {
          studentId: sId,
          studentName: student ? student.fullName : "Unknown",
          className: student ? student.class : "N/A",
          roll: student ? student.roll : "N/A",
          totalPaid: 0,
          monthsPaid: new Set(),
          transactions: []
        };
      }
      
      aggregated[sId].totalPaid += Number(fee.grandTotal || 0);
      
      if (fee.selectedMonths && Array.isArray(fee.selectedMonths)) {
        fee.selectedMonths.forEach(m => aggregated[sId].monthsPaid.add(m));
      }
      
      aggregated[sId].transactions.push(fee);
    });

    // Convert Set to Array and Sort Chronologically by Month, then sort users alphabetically
    return Object.values(aggregated).map(item => ({
      ...item,
      // Months are now sorted chronologically using MONTH_ORDER
      monthsPaid: Array.from(item.monthsPaid).sort((a, b) => (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99))
    })).sort((a, b) => a.studentName.localeCompare(b.studentName));

  }, [allFees, allStudents, classFilter, startDate, endDate, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const parsed = new Date(dateVal);
    if (!isNaN(parsed)) {
      return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); 
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

      <div className="animate-in fade-in duration-300 max-w-[90rem] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center font-sans">
              <Receipt className="w-6 h-6 mr-2 text-blue-600" /> Fee History Summary
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
              শিক্ষার্থীদের ফি-এর সামারি দেখুন। বিস্তারিত দেখতে যেকোনো শিক্ষার্থীর নামের ওপর ক্লিক করুন।
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
            disabled={filteredAndAggregatedData.length === 0}
            className="bg-white dark:bg-slate-800"
          >
            Print Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-blue-100 dark:border-slate-800 shadow-sm no-print overflow-visible relative z-30">
          <CardContent className="p-6 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 overflow-visible">
              
              <div className="md:col-span-1 overflow-visible relative z-50">
                <Dropdown 
                  label="Select Class"
                  options={classOptions}
                  value={classFilter}
                  onChange={(val) => setClassFilter(val)}
                  placeholder="All Classes"
                />
              </div>

              <div className="md:col-span-1 overflow-visible relative z-40">
                <DatePicker 
                  label="Start Date"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                />
              </div>

              <div className="md:col-span-1 overflow-visible relative z-40">
                <DatePicker 
                  label="End Date"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                />
              </div>

              <div className="md:col-span-1 relative z-30">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID or Name..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Summary Table */}
        <div id="fee-history-print" ref={printRef} className="relative z-10">
          <Card className="shadow-md">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-lg">
                All History List 
                {classFilter && <span className="text-blue-600 ml-2">({classFilter})</span>}
                <span className="text-sm font-normal text-slate-500 ml-3">
                  Found: {filteredAndAggregatedData.length} Students
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-sm font-medium">Loading data...</p>
                </div>
              ) : filteredAndAggregatedData.length === 0 ? (
                <div className="text-center py-16 text-slate-500 bg-slate-50 dark:bg-slate-800/20">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No records found</p>
                  <p className="text-sm mt-1">Try adjusting your class or date filters, or search for another student.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow-sm z-10">
                      <TableRow>
                        <TableHead className="w-24">ID</TableHead>
                        <TableHead className="w-48">Student Name</TableHead>
                        <TableHead className="w-24">Class</TableHead>
                        <TableHead className="w-64">Summary: Months Paid</TableHead>
                        <TableHead className="text-right w-32">Total Paid (৳)</TableHead>
                        <TableHead className="w-10 no-print"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndAggregatedData.map((data) => (
                        <TableRow 
                          key={data.studentId} 
                          onClick={() => setSelectedStudentDetails(data)}
                          className="hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                        >
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                            {data.studentId}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{data.studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {data.className}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {data.monthsPaid.length > 0 ? (
                                data.monthsPaid.map(m => (
                                  <span key={m} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded text-[10px] font-semibold uppercase tracking-wider">
                                    {m.substring(0, 3)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400 text-lg">
                            {data.totalPaid.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center no-print">
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
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
      </div>

      {/* Details Modal */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 border border-blue-200 dark:border-blue-800 shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">
                    {selectedStudentDetails.studentName}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="font-semibold">ID:</span> {selectedStudentDetails.studentId} • <span className="font-semibold">Class:</span> {selectedStudentDetails.className}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentDetails(null)}
                className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50 flex-1">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                Full Transaction History
              </h3>
              
              <div className="space-y-4">
                {selectedStudentDetails.transactions.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)).map((tx, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-4 gap-4">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 mb-2">
                          Memo No: {tx.invoiceNo || tx.memoNo || "N/A"}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                          <CalendarCheck className="w-4 h-4 text-slate-400" />
                          Paid on: {formatDisplayDate(tx.invoiceDate)}
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Amount Paid</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">৳{Number(tx.grandTotal).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fee Breakdown</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(tx.feeDetails || {}).map(([key, val]) => (
                            <span key={key} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
                              {key}: <span className="font-bold text-slate-900 dark:text-white">৳{val}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {tx.selectedMonths && tx.selectedMonths.length > 0 && (
                        <div>
                           <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Months Covered</p>
                           <div className="flex flex-wrap gap-1.5">
                             {/* Months inside details modal are also sorted chronologically */}
                             {tx.selectedMonths.slice().sort((a, b) => (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99)).map(m => (
                               <span key={m} className="px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 rounded-lg text-sm font-semibold">
                                 {m}
                               </span>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}