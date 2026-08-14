import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { getStudents } from "@/features/students/services/studentService";
import { saveBulkStudentFees, getBulkStudentFees, deleteAllFees, updateStudentFee, deleteStudentFee, saveStudentFee } from "@/features/fee/services/feeService";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { UploadCloud, CheckCircle2, AlertTriangle, Save, Edit2, Download, X, Check, Loader2, Trash2, Settings, Database, ArrowRight, History, CalendarCheck, User, Info, Printer } from "lucide-react";
import toast from "react-hot-toast";

const ALL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_ORDER = { "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6, "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12 };

// Custom Class Order
const CLASS_ORDER = {
  "Play": 1, "Nursery": 2, "KG": 3, 
  "1": 4, "One": 4, "Class 1": 4,
  "2": 5, "Two": 5, "Class 2": 5,
  "3": 6, "Three": 6, "Class 3": 6,
  "4": 7, "Four": 7, "Class 4": 7,
  "5": 8, "Five": 8, "Class 5": 8,
  "6": 9, "7": 10, "8": 11, "9": 12, "10": 13
};

const getClassRank = (c) => {
  const u = String(c).trim();
  if (CLASS_ORDER[u]) return CLASS_ORDER[u];
  const n = parseInt(u);
  if (!isNaN(n)) return n + 3; 
  return 99; 
};

const parseExcelDate = (excelDate) => {
  if (!excelDate) return new Date().toISOString().split("T")[0];
  if (typeof excelDate === 'number') {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }
  let dateStr = String(excelDate).trim();
  if (dateStr.includes(" ")) dateStr = dateStr.split(" ")[0];
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.length === 2) y = "20" + y;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  } else if (dateStr.includes("-") && dateStr.split("-")[0].length !== 4) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
          let [d, m, y] = parts;
          if (y.length === 2) y = "20" + y;
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed)) return parsed.toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
};

const sortDataByClassAndId = (a, b) => {
  const classA = a.class || "";
  const classB = b.class || "";
  const rankA = getClassRank(classA);
  const rankB = getClassRank(classB);
  
  if (rankA !== rankB) return rankA - rankB;
  
  const idA = parseInt(a.studentId) || 0;
  const idB = parseInt(b.studentId) || 0;
  return idA - idB;
};

export default function BulkFeeImport() {
  const [students, setStudents] = useState([]);
  const [dbFeeMap, setDbFeeMap] = useState({}); 
  
  const [tuitionRatesInput, setTuitionRatesInput] = useState("1200, 1000, 800, 500");
  const [examFeeRate, setExamFeeRate] = useState(500);

  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("valid"); 

  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ studentId: "", amount: "", invoiceDate: "" });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState({ id: "", name: "" });
  const [historyRecords, setHistoryRecords] = useState([]);
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);

  const [editHistoryId, setEditHistoryId] = useState(null);
  const [editHistoryForm, setEditHistoryForm] = useState({ amount: "", invoiceDate: "", memoNo: "" });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const studentData = await getStudents();
      setStudents(studentData);
      
      const feeData = await getBulkStudentFees(); 
      const map = {};
      feeData.forEach(record => {
        const sId = String(record.studentId).trim();
        if (!map[sId]) map[sId] = { paidTuitionMonths: [], dates: [], history: [] };
        
        map[sId].history.push(record);
        if (record.invoiceDate && !map[sId].dates.includes(record.invoiceDate)) {
          map[sId].dates.push(record.invoiceDate);
        }
        
        if (record.monthWiseDetails) {
          Object.entries(record.monthWiseDetails).forEach(([month, details]) => {
            if (details.amounts && details.amounts["Tuition fee"]) {
              if (!map[sId].paidTuitionMonths.includes(month)) map[sId].paidTuitionMonths.push(month);
            }
          });
        }
      });
      setDbFeeMap(map);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  const getParsedTuitionRates = () => {
    const rates = tuitionRatesInput.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    return rates.length > 0 ? rates : [1200, 1000, 800, 500];
  };

  const deduceFeeBreakdown = (amount) => {
    const rates = getParsedTuitionRates();
    const examRate = Number(examFeeRate) || 500;

    if (amount === 0) return { monthlyRate: 0, examFee: 0, monthCount: 0, matched: true, tuitionTotal: 0 };

    for (let m = 1; m <= 12; m++) {
      for (const r of rates) {
        if (amount === r * m) return { monthlyRate: r, examFee: 0, monthCount: m, matched: true, tuitionTotal: amount };
      }
    }
    for (let m = 0; m <= 12; m++) {
      for (const r of rates) {
        if (amount === (r * m) + examRate) return { monthlyRate: r, examFee: examRate, monthCount: m, matched: true, tuitionTotal: r * m };
      }
    }
    return { monthlyRate: amount, examFee: 0, monthCount: 1, matched: false, tuitionTotal: amount };
  };

  const allocateMonthsAndFees = (studentId, rawDate, amountPaid, isEdit = false) => {
    const { monthlyRate, examFee, monthCount, matched, tuitionTotal } = deduceFeeBreakdown(amountPaid);
    let assignedMonths = [];
    
    if (monthCount > 0 && studentId) {
        const paidMonthsDB = dbFeeMap[studentId]?.paidTuitionMonths || [];
        const allPaidTuition = isEdit ? paidMonthsDB : [...paidMonthsDB];
        const unpaidMonths = ALL_MONTHS.filter(m => !allPaidTuition.includes(m));
        
        assignedMonths = unpaidMonths.slice(0, monthCount);
        if (assignedMonths.length === 0) {
            const d = new Date(rawDate);
            assignedMonths = isNaN(d) ? ["January"] : [d.toLocaleString('en-US', { month: 'long' })];
        }
    } else if (monthCount === 0 && amountPaid > 0) {
         const d = new Date(rawDate);
         assignedMonths = isNaN(d) ? ["January"] : [d.toLocaleString('en-US', { month: 'long' })];
    }

    assignedMonths.sort((a,b) => MONTH_ORDER[a] - MONTH_ORDER[b]);

    let feeDetails = {};
    if (tuitionTotal > 0) feeDetails["Tuition fee"] = tuitionTotal;
    if (examFee > 0) feeDetails["Exam fee"] = examFee;

    let monthWiseDetails = {};
    let allocatedDetailsArray = [];

    assignedMonths.forEach((m, idx) => {
      monthWiseDetails[m] = { checked: {}, amounts: {} };
      let rowExamFee = 0;
      
      if (monthlyRate > 0) {
        monthWiseDetails[m].checked["Tuition fee"] = true;
        monthWiseDetails[m].amounts["Tuition fee"] = monthlyRate;
      }
      
      if (examFee > 0 && idx === assignedMonths.length - 1) {
        monthWiseDetails[m].checked["Exam fee"] = true;
        monthWiseDetails[m].amounts["Exam fee"] = examFee;
        rowExamFee = examFee;
      }

      allocatedDetailsArray.push({ month: m, tuition: monthlyRate, exam: rowExamFee, total: monthlyRate + rowExamFee });
    });

    return { 
      selectedMonths: assignedMonths, 
      feeDetails, 
      monthWiseDetails, 
      allocatedDetailsArray,
      logicMatched: matched,
      monthlyRate,
      examFee
    };
  };

  const revalidateData = (rows, studentList, dbMap) => {
    return rows.map(row => {
      let errorReasons = [];
      const studentId = String(row.studentId || "").trim();
      const totalAmount = Number(row.grandTotal || 0);

      const matchedStudent = studentList.find((s) => String(s.studentId) === studentId);
      const dbDates = dbMap[studentId]?.dates || [];

      if (!studentId) errorReasons.push("ID missing in Sheet");
      else if (!matchedStudent) errorReasons.push("ID not found in System DB");
      
      if (totalAmount <= 0) errorReasons.push(`Invalid Amount`);
      if (!row.logicMatched) errorReasons.push("Amount logic mismatch");

      if (studentId && dbDates.includes(row.invoiceDate)) {
        errorReasons.push(`Duplicate Date: ${row.invoiceDate} already exists in DB`);
      }

      errorReasons = [...new Set(errorReasons)];
      const isValid = errorReasons.length === 0;

      return {
        ...row,
        studentName: matchedStudent ? matchedStudent.fullName : "Unknown",
        class: matchedStudent ? matchedStudent.class : "",
        roll: matchedStudent ? matchedStudent.roll : "",
        phone: matchedStudent ? matchedStudent.contactNumber : "",
        isValid,
        errorReason: errorReasons.join(", "),
      };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setPreviewData([]);
    
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (jsonData.length === 0) {
        toast.error("Excel file is empty.");
        return;
      }

      let rawRows = jsonData.map((row, index) => {
        const normRow = {};
        Object.keys(row).forEach(k => { normRow[k.trim().toUpperCase()] = row[k]; });

        const rawId = String(normRow["PARTICULARS"] ?? normRow["STUDENT ID"] ?? normRow["ID"] ?? "").trim();
        const rawDate = parseExcelDate(normRow["DATE"]);
        const amountPaid = Number(normRow["CREDIT"] ?? normRow["AMOUNT"] ?? 0);
        const generatedMemo = `BLK-${Date.now().toString().slice(-6)}-${index}`;

        const allocation = allocateMonthsAndFees(rawId, rawDate, amountPaid);

        return {
          studentId: rawId,
          invoiceNo: generatedMemo,
          memoNo: generatedMemo,
          invoiceDate: rawDate,
          paymentMethod: "Bank",
          grandTotal: amountPaid,
          remarks: "Uploaded via Bulk Import",
          ...allocation
        };
      });

      let validatedData = revalidateData(rawRows, students, dbFeeMap);
      validatedData.sort(sortDataByClassAndId);

      setPreviewData(validatedData);
      toast.success("File processed successfully!");
    } catch (error) {
      console.error("Excel processing failed:", error);
      toast.error("Excel file processing failed. Please check the format.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveEdit = (index) => {
    const newData = [...previewData];
    let row = { ...newData[index] };
    
    row.studentId = editForm.studentId;
    row.invoiceDate = editForm.invoiceDate;
    const newAmount = Number(editForm.amount);

    const allocation = allocateMonthsAndFees(row.studentId, row.invoiceDate, newAmount, true);
    
    row.grandTotal = newAmount;
    row.selectedMonths = allocation.selectedMonths;
    row.feeDetails = allocation.feeDetails;
    row.monthWiseDetails = allocation.monthWiseDetails;
    row.allocatedDetailsArray = allocation.allocatedDetailsArray;
    row.logicMatched = allocation.logicMatched;
    row.monthlyRate = allocation.monthlyRate;
    row.examFee = allocation.examFee;
    
    newData[index] = row;
    
    let revalidatedData = revalidateData(newData, students, dbFeeMap);
    setPreviewData(revalidatedData);
    setEditingIndex(null);
    toast.success("Row updated and re-calculated!");
  };

  const handleDeleteRow = (index) => {
    const newData = [...previewData];
    newData.splice(index, 1);
    setPreviewData(newData);
    setEditingIndex(null);
  };

  const handleSaveSingleRow = async (index) => {
    const row = previewData[index];
    if (!row.isValid) return toast.error("Cannot save invalid record.");
    
    setIsSaving(true);
    try {
      const { isValid, errorReason, studentName, class: stdClass, roll, phone, allocatedDetailsArray, logicMatched, monthlyRate, examFee, ...payload } = row;
      await saveStudentFee(payload);
      toast.success(`Record for ${row.studentName} saved to DB!`);
      
      const newData = [...previewData];
      newData.splice(index, 1);
      setPreviewData(newData);
      fetchInitialData(); 
    } catch (error) {
      toast.error("Failed to save record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDatabase = async () => {
    const validRows = previewData.filter((row) => row.isValid);
    if (validRows.length === 0) return;

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const cleanPayloads = validRows.map(({ isValid, errorReason, studentName, class: stdClass, roll, phone, allocatedDetailsArray, logicMatched, monthlyRate, examFee, ...rest }) => rest);
      const CHUNK_SIZE = 50; 
      const totalChunks = Math.ceil(cleanPayloads.length / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = cleanPayloads.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await saveBulkStudentFees(chunk);
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      toast.success(`Successfully saved ${validRows.length} records.`);
      setPreviewData((prev) => prev.filter((row) => !row.isValid));
      setIsSaving(false);
      setUploadProgress(0);
      fetchInitialData(); 
    } catch (error) {
      toast.error("Failed to save data.");
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  // ONLY CLEARS THE DB, DOES NOT SAVE NEW ONES
  const handleClearDatabase = async () => {
    if (!window.confirm("⚠️ সতর্কতা! আপনি কি নিশ্চিত?\n\nডাটাবেসের সকল ফি রেকর্ড সম্পূর্ণ মুছে যাবে। নতুন কোনো রেকর্ড সেভ হবে না।")) return;

    setIsSaving(true);
    try {
      await deleteAllFees();
      toast.success(`ডাটাবেসের সকল ফি রেকর্ড মুছে ফেলা হয়েছে।`);
      fetchInitialData(); 
    } catch (error) {
      toast.error("Failed to clear Database.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportInvalidData = () => {
    const invalidData = previewData
      .filter((d) => !d.isValid)
      .map((d) => ({
        "STUDENT ID": d.studentId,
        "NAME": d.studentName || "Unknown",
        "DATE": d.invoiceDate,
        "AMOUNT (TK)": d.grandTotal,
        "ERROR REASON": d.errorReason,
      }));

    if (invalidData.length === 0) return toast.error("কোনো ইনভ্যালিড ডেটা নেই!");
    
    const ws = XLSX.utils.json_to_sheet(invalidData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invalid Data");
    XLSX.writeFile(wb, "Invalid_Fee_Records.xlsx");
  };

  const openHistoryModal = (studentId, studentName) => {
    setHistoryStudent({ id: studentId, name: studentName });
    const history = dbFeeMap[studentId]?.history || [];
    history.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
    setHistoryRecords(history);
    setShowHistoryModal(true);
  };

  const handleSaveHistoryEdit = async (recordId) => {
    try {
      const newAmount = Number(editHistoryForm.amount);
      const allocation = allocateMonthsAndFees(historyStudent.id, editHistoryForm.invoiceDate, newAmount, true);

      const updatedPayload = {
        invoiceDate: editHistoryForm.invoiceDate,
        memoNo: editHistoryForm.memoNo,
        grandTotal: newAmount,
        feeDetails: allocation.feeDetails,
        monthWiseDetails: allocation.monthWiseDetails,
        selectedMonths: allocation.selectedMonths
      };

      await updateStudentFee(recordId, updatedPayload);
      toast.success("DB Record Updated!");
      setEditHistoryId(null);
      fetchInitialData(); 
      setTimeout(() => openHistoryModal(historyStudent.id, historyStudent.name), 500);
    } catch(err) {
      toast.error("Failed to update record.");
    }
  };

  const handleDeleteHistory = async (recordId) => {
    if(!window.confirm("Permanently delete this record from DB?")) return;
    try {
      await deleteStudentFee(recordId);
      toast.success("Record Deleted!");
      setHistoryRecords(prev => prev.filter(r => r.id !== recordId));
      fetchInitialData(); 
    } catch(err) {
      toast.error("Failed to delete.");
    }
  };

  const validData = previewData.filter(d => d.isValid);
  const invalidData = previewData.filter(d => !d.isValid);

  // --- SUMMARY CALCULATIONS ---
  const summaryByClass = {};
  const summaryByMonth = {};
  let grandTuition = 0;
  let grandExam = 0;
  let grandOther = 0;

  validData.forEach(row => {
     const c = row.class || "Unknown";
     if(!summaryByClass[c]) summaryByClass[c] = { tuition: 0, exam: 0, other: 0, total: 0, count: 0 };
     
     summaryByClass[c].count += 1;
     summaryByClass[c].total += row.grandTotal;
     
     let tuition = row.feeDetails["Tuition fee"] || 0;
     let exam = row.feeDetails["Exam fee"] || 0;
     let other = row.grandTotal - tuition - exam;
     
     summaryByClass[c].tuition += tuition;
     summaryByClass[c].exam += exam;
     summaryByClass[c].other += other;
     
     grandTuition += tuition;
     grandExam += exam;
     grandOther += other;
     
     row.allocatedDetailsArray.forEach(m => {
        if(!summaryByMonth[m.month]) summaryByMonth[m.month] = { tuition: 0, exam: 0, total: 0 };
        summaryByMonth[m.month].tuition += m.tuition;
        summaryByMonth[m.month].exam += m.exam;
        summaryByMonth[m.month].total += m.total;
     });
  });

  const sortedClassSummary = Object.keys(summaryByClass).sort((a,b) => getClassRank(a) - getClassRank(b)).map(k => ({ className: k, ...summaryByClass[k] }));
  const sortedMonthSummary = Object.keys(summaryByMonth).sort((a,b) => MONTH_ORDER[a] - MONTH_ORDER[b]).map(k => ({ monthName: k, ...summaryByMonth[k] }));

  return (
    <div className="animate-in fade-in duration-300 max-w-[100rem] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <UploadCloud className="w-6 h-6 mr-2 text-blue-600" /> Smart Fee Analyzer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Date, Particulars (ID), Credit (Amount) কলামযুক্ত এক্সেল শিট আপলোড করুন।
          </p>
        </div>

        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
          <Button
            variant="primary"
            leftIcon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            disabled={isUploading || isSaving}
            onClick={() => fileInputRef.current?.click()}
            className="shadow-lg shadow-blue-500/20"
          >
            {isUploading ? "Processing Excel..." : "Upload Excel File"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2235] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" /> অটোমেটিক অ্যামাউন্ট অ্যানালাইসিস সেটিংস
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">সম্ভাব্য টিউশন ফি রেট (কমা দিয়ে লিখুন)</label>
              <Input value={tuitionRatesInput} onChange={(e) => setTuitionRatesInput(e.target.value)} placeholder="e.g. 1200, 1000, 800" className="font-mono text-blue-600 dark:text-blue-400 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">পরীক্ষার ফি রেট (Exam Fee)</label>
              <Input type="number" value={examFeeRate} onChange={(e) => setExamFeeRate(e.target.value)} placeholder="e.g. 500" className="font-bold text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800/50">
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Import Format Note
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            Excel sheet must contain these exact column names:<br/>
            <strong className="text-slate-800 dark:text-slate-200">Date</strong> (e.g. 2/8/2026)<br/>
            <strong className="text-slate-800 dark:text-slate-200">Particulars</strong> (Student ID)<br/>
            <strong className="text-slate-800 dark:text-slate-200">Credit</strong> (Amount Paid)
          </p>
        </div>
      </div>

      {isSaving && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-800 dark:text-white">Processing Action...</h3>
            <span className="font-bold text-blue-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {previewData.length > 0 && !isSaving && (
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-0">
             <div className="flex flex-wrap items-center justify-between p-4 gap-4">
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab("valid")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'valid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    Valid Data ({validData.length})
                  </button>
                  <button onClick={() => setActiveTab("invalid")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'invalid' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    Invalid Data ({invalidData.length})
                  </button>
                  <button onClick={() => setActiveTab("summary")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'summary' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    Class Summary & Report
                  </button>
                </div>
                
                {activeTab === 'valid' && validData.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveToDatabase} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"><Database className="w-4 h-4 mr-2"/> Save All Valid</Button>
                    <Button onClick={handleClearDatabase} className="bg-red-600 hover:bg-red-700 text-white shadow-lg" title="Deletes all old DB fees (Does not save new ones)"><Trash2 className="w-4 h-4 mr-2"/> Clear DB Only</Button>
                  </div>
                )}

                {activeTab === 'invalid' && invalidData.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={exportInvalidData} 
                      className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white"
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Download Invalid (.xlsx)
                    </Button>
                  </div>
                )}
             </div>
          </CardHeader>
          <CardContent className="p-0">
            
            {/* VALID DATA TAB */}
            {activeTab === "valid" && (
              <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 dark:bg-[#1a2235] z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-64">Student Info</TableHead>
                      <TableHead className="w-32">DB Record</TableHead>
                      <TableHead className="w-32">Imported Date</TableHead>
                      <TableHead className="w-64">Allocated Months (Analyzed)</TableHead>
                      <TableHead className="w-48 text-right">Total & Breakdown</TableHead>
                      <TableHead className="w-32 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        
                        <TableCell>
                          <div 
                            className="flex items-start gap-3 cursor-pointer group"
                            onClick={() => { setSelectedStudentInfo(row); setShowStudentModal(true); }}
                            title="Click for Details"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors"><User className="w-4 h-4"/></div>
                            <div>
                              {editingIndex === index ? (
                                <Input value={editForm.studentId} onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })} className="h-7 text-xs w-20" onClick={e=>e.stopPropagation()}/>
                              ) : (
                                <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{row.studentId}</p>
                              )}
                              <p className="text-[10px] text-slate-500 font-medium">{row.studentName}</p>
                              <p className="text-[10px] text-slate-500">Roll: {row.roll} • {row.class}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <button 
                            onClick={() => openHistoryModal(row.studentId, row.studentName)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-900/40 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                          >
                            <History className="w-3.5 h-3.5"/> View DB
                          </button>
                        </TableCell>

                        <TableCell>
                          {editingIndex === index ? (
                            <Input type="date" value={editForm.invoiceDate} onChange={(e) => setEditForm({ ...editForm, invoiceDate: e.target.value })} className="h-7 text-xs w-28" />
                          ) : (
                            <span className="font-medium text-slate-700 dark:text-slate-300">{row.invoiceDate}</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            {row.allocatedDetailsArray.map((m, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase w-12 text-center">
                                  {m.month.slice(0,3)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Tuition: {m.tuition} {m.exam > 0 && <span className="text-orange-500 ml-1">+ Exam: {m.exam}</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          {editingIndex === index ? (
                            <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="h-7 text-xs w-20 ml-auto" />
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="font-black text-slate-800 dark:text-white text-base">৳ {row.grandTotal}</span>
                              <div className="flex gap-1 mt-1">
                                {Object.entries(row.feeDetails).map(([k, v]) => (
                                  <span key={k} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500">{k.split(' ')[0]}: {v}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {editingIndex === index ? (
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => saveEdit(index)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingIndex(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleSaveSingleRow(index)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 rounded transition-colors" title="Save Row">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setEditingIndex(index); setEditForm({ studentId: row.studentId, amount: row.grandTotal, invoiceDate: row.invoiceDate }); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 rounded transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteRow(index)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* INVALID DATA TAB */}
            {activeTab === "invalid" && (
              <div className="overflow-x-auto max-h-[600px] custom-scrollbar p-4">
                {invalidData.length === 0 ? (
                  <p className="text-center text-slate-500 py-10 font-bold">No Invalid Records! 🎉</p>
                ) : (
                  <div className="space-y-3">
                    {invalidData.map((row, idx) => (
                      <div key={idx} className="bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center w-full">
                          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0"/>
                          <div>
                            <p className="text-sm font-bold text-red-700 dark:text-red-400 leading-snug">{row.errorReason}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                              Parsed ID: <span className="font-bold text-slate-800 dark:text-slate-200">{row.studentId || "Empty"}</span> | 
                              Amount: ৳{row.grandTotal} | 
                              Date: {row.invoiceDate}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => {
                          const nd = [...previewData];
                          const realIdx = nd.findIndex(x => x === row);
                          if(realIdx > -1) handleDeleteRow(realIdx);
                        }} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg shrink-0">
                          <Trash2 className="w-5 h-5"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUMMARY TAB */}
            {activeTab === "summary" && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 min-h-[400px]">
                <div className="flex justify-between items-center mb-6 no-print border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Batch Analysis & Summary</h2>
                    <p className="text-sm text-slate-500">Overview of valid records before saving.</p>
                  </div>
                  <Button onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4"/>}>Print Summary PDF</Button>
                </div>
                
                <div id="print-area" className="print-area bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
                   
                   <div className="text-center mb-6 pb-6 border-b-2 border-slate-800 dark:border-slate-600 hidden print:block">
                     <h2 className="text-2xl font-black text-black uppercase tracking-wider font-serif">Western School and College</h2>
                     <h3 className="text-lg font-bold text-slate-700 mt-1">FEE BATCH SUMMARY REPORT</h3>
                     <p className="text-slate-500 font-medium mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <p className="text-xs font-bold text-indigo-500 uppercase">Valid Records</p>
                        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{validData.length}</p>
                     </div>
                     <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-xs font-bold text-emerald-500 uppercase">Total Expected Earn</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">৳{validData.reduce((a,c)=>a+c.grandTotal,0).toLocaleString()}</p>
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <p className="text-xs font-bold text-blue-500 uppercase">Total Tuition</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-400">৳{grandTuition.toLocaleString()}</p>
                     </div>
                     <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                        <p className="text-xs font-bold text-orange-500 uppercase">Total Exam Fee</p>
                        <p className="text-2xl font-black text-orange-700 dark:text-orange-400">৳{grandExam.toLocaleString()}</p>
                     </div>
                   </div>

                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">1. Class-wise Earnings</h3>
                   <div className="overflow-x-auto mb-8">
                     <table className="w-full text-left text-sm border-collapse border border-slate-300">
                       <thead className="bg-slate-100 dark:bg-slate-700">
                         <tr>
                           <th className="p-2 border border-slate-300">Class</th>
                           <th className="p-2 border border-slate-300 text-center">Students</th>
                           <th className="p-2 border border-slate-300 text-right">Tuition Fee</th>
                           <th className="p-2 border border-slate-300 text-right">Exam Fee</th>
                           <th className="p-2 border border-slate-300 text-right font-bold">Total Amount</th>
                         </tr>
                       </thead>
                       <tbody>
                         {sortedClassSummary.map((c, i) => (
                           <tr key={i}>
                             <td className="p-2 border border-slate-300 font-bold">{c.className}</td>
                             <td className="p-2 border border-slate-300 text-center">{c.count}</td>
                             <td className="p-2 border border-slate-300 text-right">৳{c.tuition}</td>
                             <td className="p-2 border border-slate-300 text-right">৳{c.exam}</td>
                             <td className="p-2 border border-slate-300 text-right font-bold">৳{c.total}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>

                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">2. Month-wise Allocation</h3>
                   <div className="overflow-x-auto mb-8">
                     <table className="w-full text-left text-sm border-collapse border border-slate-300">
                       <thead className="bg-slate-100 dark:bg-slate-700">
                         <tr>
                           <th className="p-2 border border-slate-300">Month</th>
                           <th className="p-2 border border-slate-300 text-right">Tuition Earned</th>
                           <th className="p-2 border border-slate-300 text-right">Exam Fee Earned</th>
                           <th className="p-2 border border-slate-300 text-right font-bold">Total</th>
                         </tr>
                       </thead>
                       <tbody>
                         {sortedMonthSummary.map((m, i) => (
                           <tr key={i}>
                             <td className="p-2 border border-slate-300 font-bold">{m.monthName}</td>
                             <td className="p-2 border border-slate-300 text-right">৳{m.tuition}</td>
                             <td className="p-2 border border-slate-300 text-right">৳{m.exam}</td>
                             <td className="p-2 border border-slate-300 text-right font-bold">৳{m.total}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>

                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">3. Student Detailed List</h3>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm border-collapse border border-slate-300 text-black dark:text-white">
                       <thead className="bg-slate-100 dark:bg-slate-700">
                         <tr>
                           <th className="p-2 border border-slate-300">ID</th>
                           <th className="p-2 border border-slate-300">Name & Class</th>
                           <th className="p-2 border border-slate-300">Allocated Months</th>
                           <th className="p-2 border border-slate-300">Fee Breakdown</th>
                           <th className="p-2 border border-slate-300 text-right font-bold">Total</th>
                         </tr>
                       </thead>
                       <tbody>
                         {validData.map((row, i) => (
                           <tr key={i}>
                             <td className="p-2 border border-slate-300 font-bold">{row.studentId}</td>
                             <td className="p-2 border border-slate-300">{row.studentName} <br/><span className="text-[10px] text-slate-500">{row.class}</span></td>
                             <td className="p-2 border border-slate-300 text-xs font-medium">{row.selectedMonths.join(", ")}</td>
                             <td className="p-2 border border-slate-300 text-xs">
                               {Object.entries(row.feeDetails).map(([k, v]) => (
                                  <span key={k} className="mr-2">{k}: ৳{v}</span>
                               ))}
                             </td>
                             <td className="p-2 border border-slate-300 text-right font-bold">৳{row.grandTotal}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- STUDENT INFO MODAL --- */}
      {showStudentModal && selectedStudentInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95">
            <button onClick={() => setShowStudentModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-red-500"><X className="w-4 h-4"/></button>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><User className="w-10 h-10"/></div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedStudentInfo.studentName}</h2>
              <p className="text-sm font-bold text-indigo-600 mt-1">ID: {selectedStudentInfo.studentId}</p>
              
              <div className="w-full mt-6 space-y-3 text-sm text-left">
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800"><span className="text-slate-500">Class:</span> <span className="font-bold text-slate-800 dark:text-white">{selectedStudentInfo.class || "N/A"}</span></div>
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800"><span className="text-slate-500">Roll:</span> <span className="font-bold text-slate-800 dark:text-white">{selectedStudentInfo.roll || "N/A"}</span></div>
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800"><span className="text-slate-500">Phone:</span> <span className="font-bold text-slate-800 dark:text-white">{selectedStudentInfo.phone || "N/A"}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY MODAL (Database View & Edit) --- */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-[#151c2c]">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Database className="w-5 h-5 text-blue-500"/> DB Fee History </h2>
                <p className="text-sm font-bold text-slate-500 mt-1">Student: <span className="text-blue-600 dark:text-blue-400">{historyStudent.name}</span> (ID: {historyStudent.id})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {historyRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800 border-none">
                      <TableHead className="font-bold">Payment Date</TableHead>
                      <TableHead className="font-bold">Memo No.</TableHead>
                      <TableHead className="font-bold">Allocated Months</TableHead>
                      <TableHead className="font-bold text-right">Amount</TableHead>
                      <TableHead className="font-bold text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.map(record => {
                      const isEditing = editHistoryId === record.id;
                      const sortedMonths = [...(record.selectedMonths || [])].sort((a,b) => MONTH_ORDER[a] - MONTH_ORDER[b]);
                      return (
                        <TableRow key={record.id} className="border-b border-slate-100 dark:border-slate-700/50">
                          <TableCell>
                            {isEditing ? <Input type="date" value={editHistoryForm.invoiceDate} onChange={e => setEditHistoryForm({...editHistoryForm, invoiceDate: e.target.value})} className="h-8 text-xs w-28" /> : <span className="font-medium text-slate-700 dark:text-slate-300">{record.invoiceDate}</span>}
                          </TableCell>
                          <TableCell>
                            {isEditing ? <Input value={editHistoryForm.memoNo} onChange={e => setEditHistoryForm({...editHistoryForm, memoNo: e.target.value})} className="h-8 text-xs w-24" /> : <span className="text-xs font-mono font-bold text-slate-500">{record.memoNo || record.invoiceNo}</span>}
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {sortedMonths.length > 0 ? sortedMonths.map(m => <span key={m} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded text-[10px] font-bold uppercase">{m.slice(0,3)}</span>) : <span className="text-xs text-slate-400">Other Fees</span>}
                                </div>
                                {record.feeDetails && (
                                  <div className="flex gap-2">
                                    {Object.entries(record.feeDetails).map(([k,v]) => <span key={k} className="text-[10px] text-slate-500">{k}: ৳{v}</span>)}
                                  </div>
                                )}
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             {isEditing ? <Input type="number" value={editHistoryForm.amount} onChange={e => setEditHistoryForm({...editHistoryForm, amount: e.target.value})} className="h-8 text-sm w-20 ml-auto" /> : <span className="font-black text-slate-800 dark:text-white">৳{record.grandTotal}</span>}
                          </TableCell>
                          <TableCell className="text-center">
                             {isEditing ? (
                               <div className="flex justify-center gap-1.5">
                                 <button onClick={() => handleSaveHistoryEdit(record.id)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded"><Check className="w-4 h-4" /></button>
                                 <button onClick={() => setEditHistoryId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded"><X className="w-4 h-4" /></button>
                               </div>
                             ) : (
                               <div className="flex justify-center gap-1.5">
                                 <button onClick={() => { setEditHistoryId(record.id); setEditHistoryForm({ amount: record.grandTotal, invoiceDate: record.invoiceDate, memoNo: record.memoNo || record.invoiceNo }); }} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit2 className="w-4 h-4" /></button>
                                 <button onClick={() => handleDeleteHistory(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4" /></button>
                               </div>
                             )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Database className="w-12 h-12 mb-3 opacity-20"/>
                    <p>No DB records found.</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}