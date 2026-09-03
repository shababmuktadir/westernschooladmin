import React, { useState, useEffect, useMemo, useRef } from "react";
import { getStudents } from "@/features/students/services/studentService";
import { getBulkStudentFees, updateStudentFee, deleteStudentFee } from "@/features/fee/services/feeService"; 

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown"; 
import GlassDatePicker from "@/components/ui/GlassDatePicker"; // নতুন GlassDatePicker ইমপোর্ট করা হলো
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Search, FileText, Printer, Loader2, Receipt, CalendarCheck, User, X, ChevronRight, Edit2, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";

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

  // Edit States for Modal
  const [editTxId, setEditTxId] = useState(null);
  const [editTxForm, setEditTxForm] = useState({ amount: "", invoiceDate: "", memoNo: "" });

  const printRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const studentsData = await getStudents();
      setAllStudents(studentsData.filter(s => s.status !== "Inactive"));
      
      const feesData = await getBulkStudentFees(); 
      setAllFees(feesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueClasses = useMemo(() => {
    const classes = allStudents.map((s) => s.class).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [allStudents]);

  const classOptions = useMemo(() => [
    { label: "All Classes", value: "" },
    ...uniqueClasses.map(c => ({ label: c, value: c }))
  ], [uniqueClasses]);

  const filteredAndAggregatedData = useMemo(() => {
    let filteredFees = allFees;

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

    if (classFilter) {
      const studentsInClass = allStudents.filter(s => s.class === classFilter).map(s => String(s.studentId));
      filteredFees = filteredFees.filter(f => studentsInClass.includes(String(f.studentId)));
    }

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

    return Object.values(aggregated).map(item => ({
      ...item,
      monthsPaid: Array.from(item.monthsPaid).sort((a, b) => (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99))
    })).sort((a, b) => a.studentName.localeCompare(b.studentName));

  }, [allFees, allStudents, classFilter, startDate, endDate, searchTerm]);

  // Handle Dynamic Closing of Modal if all transactions deleted
  useEffect(() => {
    if (selectedStudentDetails) {
      const exists = filteredAndAggregatedData.find(s => s.studentId === selectedStudentDetails.studentId);
      if (!exists) setSelectedStudentDetails(null);
    }
  }, [filteredAndAggregatedData, selectedStudentDetails]);

  const activeModalStudent = selectedStudentDetails 
    ? filteredAndAggregatedData.find(s => s.studentId === selectedStudentDetails.studentId) 
    : null;

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredAndAggregatedData.length === 1) {
      setSelectedStudentDetails(filteredAndAggregatedData[0]);
    }
  };

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

  // --- Modal Edit & Delete Handlers ---
  const handleEditClick = (tx) => {
    setEditTxId(tx.id);
    setEditTxForm({
      amount: tx.grandTotal,
      invoiceDate: tx.invoiceDate,
      memoNo: tx.invoiceNo || tx.memoNo || ""
    });
  };

  const handleSaveEdit = async (txId) => {
    try {
      const updatedPayload = {
        grandTotal: Number(editTxForm.amount),
        invoiceDate: editTxForm.invoiceDate,
        memoNo: editTxForm.memoNo,
        invoiceNo: editTxForm.memoNo
      };
      
      await updateStudentFee(txId, updatedPayload);
      toast.success("Transaction updated successfully!");
      
      setAllFees(prev => prev.map(f => f.id === txId ? { ...f, ...updatedPayload } : f));
      setEditTxId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update transaction");
    }
  };

  const handleDeleteTx = async (txId) => {
    try {
      await deleteStudentFee(txId);
      toast.success("Transaction deleted successfully!");
      setAllFees(prev => prev.filter(f => f.id !== txId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction");
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-active, .print-active * { visibility: visible; }
          .print-active { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important; 
            color: black !important;
          }
          .no-print { display: none !important; }
          .print-border { border: 1px solid #e2e8f0 !important; }
        }
      `}</style>

      <div className="animate-in fade-in duration-300 max-w-[90rem] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center font-sans">
              <Receipt className="w-6 h-6 mr-2 text-blue-600" /> Fee History Summary
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
              শিক্ষার্থীদের ফি-এর সামারি দেখুন। বিস্তারিত দেখতে নামের ওপর ক্লিক করুন বা সার্চ করে Enter দিন।
            </p>
          </div>
          {!selectedStudentDetails && (
            <Button
              variant="outline"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              disabled={filteredAndAggregatedData.length === 0}
              className="bg-white dark:bg-slate-800 shadow-sm"
            >
              Print Master Report
            </Button>
          )}
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

              {/* নতুন GlassDatePicker যুক্ত করা হয়েছে */}
              <div className="md:col-span-1 overflow-visible relative z-40">
                <GlassDatePicker 
                  label="Start Date"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  placeholder="Select start date"
                />
              </div>

              {/* নতুন GlassDatePicker যুক্ত করা হয়েছে */}
              <div className="md:col-span-1 overflow-visible relative z-40">
                <GlassDatePicker 
                  label="End Date"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  placeholder="Select end date"
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
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search by ID/Name & Press Enter"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Summary Table */}
        <div className={`relative z-10 ${!selectedStudentDetails ? 'print-active' : 'no-print'}`}>
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
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
                  <p className="text-sm mt-1">Try adjusting your filters or search for another student.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow-sm z-10">
                      <TableRow>
                        <TableHead className="w-24">ID</TableHead>
                        <TableHead className="w-64">Student Name</TableHead>
                        <TableHead className="w-24">Class</TableHead>
                        <TableHead className="w-64">Cleared Months</TableHead>
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
                              <div>
                                <span className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{data.studentName}</span>
                                <span className="text-[10px] text-slate-400">Click to view details</span>
                              </div>
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
                          <TableCell className="text-right font-black text-blue-600 dark:text-blue-400 text-base">
                            ৳ {data.totalPaid.toLocaleString()}
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

      {/* Details Modal / Printable Statement */}
      {activeModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          
          <div className={`bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print-active`}>
            
            {/* Modal Actions Header (Hidden on Print) */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-[#151c2c] no-print">
              <div className="flex items-center gap-3">
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20" leftIcon={<Printer className="w-4 h-4"/>}>
                  Print / Save PDF
                </Button>
              </div>
              <button 
                onClick={() => setSelectedStudentDetails(null)}
                className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Area */}
            <div className="p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-[#1e293b] flex-1 text-slate-900 dark:text-slate-100 print:overflow-visible print:p-0 print:m-0">
              
              {/* School Header */}
              <div className="text-center mb-8 border-b-2 border-slate-800 dark:border-slate-600 pb-6">
                <h2 className="text-3xl font-black uppercase tracking-wider font-serif text-slate-900 dark:text-white print:text-black">Western School and College</h2>
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-1 print:text-gray-700">STUDENT FEE STATEMENT</h3>
                <p className="text-sm font-medium text-slate-500 mt-2">Date Generated: {new Date().toLocaleDateString('en-GB')}</p>
              </div>

              {/* Student Info Box */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 print-border">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student Name</p>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white print:text-black">{activeModalStudent.studentName}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student ID & Class</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 print:text-indigo-800">
                    ID: {activeModalStudent.studentId} <span className="text-slate-400 font-normal mx-1">|</span> {activeModalStudent.className}
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                Transaction History
              </h3>
              
              <div className="overflow-x-auto print:overflow-visible pb-10">
                <table className="w-full text-left text-sm border-collapse border border-slate-300 print-border">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 border border-slate-300 print-border font-bold">Payment Date</th>
                      <th className="p-3 border border-slate-300 print-border font-bold">Memo / Invoice No.</th>
                      <th className="p-3 border border-slate-300 print-border font-bold">Allocated Months</th>
                      <th className="p-3 border border-slate-300 print-border font-bold">Fee Breakdown</th>
                      <th className="p-3 border border-slate-300 print-border font-bold text-right">Total (৳)</th>
                      <th className="p-3 border border-slate-300 font-bold text-center no-print w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeModalStudent.transactions.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)).map((tx, i) => {
                      const sortedTxMonths = tx.selectedMonths ? [...tx.selectedMonths].sort((a,b) => MONTH_ORDER[a] - MONTH_ORDER[b]) : [];
                      return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        
                        <td className="p-3 border border-slate-300 print-border font-medium text-slate-700 dark:text-slate-300">
                          {editTxId === tx.id ? (
                             <input type="date" value={editTxForm.invoiceDate} onChange={e=>setEditTxForm({...editTxForm, invoiceDate: e.target.value})} className="h-8 px-2 text-xs w-full border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600 outline-none focus:border-blue-500" />
                          ) : formatDisplayDate(tx.invoiceDate)}
                        </td>
                        
                        <td className="p-3 border border-slate-300 print-border text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {editTxId === tx.id ? (
                             <input value={editTxForm.memoNo} onChange={e=>setEditTxForm({...editTxForm, memoNo: e.target.value})} className="h-8 px-2 text-xs w-full border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600 outline-none focus:border-blue-500" placeholder="Memo" />
                          ) : tx.invoiceNo || tx.memoNo || "N/A"}
                        </td>
                        
                        <td className="p-3 border border-slate-300 print-border">
                          <div className="flex flex-wrap gap-1">
                            {sortedTxMonths.length > 0 ? sortedTxMonths.map(m => (
                              <span key={m} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-transparent dark:text-slate-300 rounded text-[10px] font-bold uppercase print:border print:border-slate-300 print:text-black">
                                {m.substring(0,3)}
                              </span>
                            )) : <span className="text-xs text-slate-400">-</span>}
                          </div>
                        </td>
                        
                        <td className="p-3 border border-slate-300 print-border">
                          <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {Object.entries(tx.feeDetails || {}).map(([key, val]) => (
                              <span key={key}>{key}: <b>৳{val}</b></span>
                            ))}
                          </div>
                        </td>
                        
                        <td className="p-3 border border-slate-300 print-border text-right font-bold text-slate-900 dark:text-white print:text-black">
                          {editTxId === tx.id ? (
                             <input type="number" value={editTxForm.amount} onChange={e=>setEditTxForm({...editTxForm, amount: e.target.value})} className="h-8 px-2 text-sm w-20 ml-auto border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-600 outline-none focus:border-blue-500 text-right font-bold" placeholder="Amt" />
                          ) : `৳${Number(tx.grandTotal).toLocaleString()}`}
                        </td>
                        
                        <td className="p-3 border border-slate-300 text-center no-print align-middle">
                           {editTxId === tx.id ? (
                             <div className="flex justify-center gap-1.5">
                               <button onClick={() => handleSaveEdit(tx.id)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors" title="Save"><Check className="w-4 h-4" /></button>
                               <button onClick={() => setEditTxId(null)} className="p-1.5 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                             </div>
                           ) : (
                             <div className="flex justify-center gap-1.5">
                               <button onClick={() => handleEditClick(tx)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Edit row"><Edit2 className="w-4 h-4" /></button>
                               <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Delete record"><Trash2 className="w-4 h-4" /></button>
                             </div>
                           )}
                        </td>

                      </tr>
                    )})}
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td colSpan="4" className="p-4 border border-slate-300 print-border text-right font-black uppercase text-slate-700 dark:text-slate-300">Grand Total Paid:</td>
                      <td className="p-4 border border-slate-300 print-border text-right font-black text-lg text-emerald-600 dark:text-emerald-400 print:text-black">
                        ৳{activeModalStudent.totalPaid.toLocaleString()}
                      </td>
                      <td className="border border-slate-300 no-print"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Footer text on Print */}
              <div className="mt-12 text-center text-xs text-slate-400 font-medium hidden print:block">
                This is a computer-generated statement and does not require a physical signature.
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}