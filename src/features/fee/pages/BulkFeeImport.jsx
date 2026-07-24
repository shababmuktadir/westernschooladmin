import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { getStudents } from "@/features/students/services/studentService";
// Make sure to export deleteAllFees from feeService
import { saveBulkStudentFees, getBulkStudentFees, deleteAllFees } from "@/features/fee/services/feeService";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { UploadCloud, CheckCircle2, AlertTriangle, Save, Edit2, Download, X, Check, Loader2, Trash2, AlertOctagon } from "lucide-react";

const FEE_COLUMNS_MAP = {
  "ADMISSION FEE": "Admission fee",
  "RE ADMISSION FEE": "Re-admission fee",
  "SPORTS FEE": "Sports fee",
  "TC FEE": "TC fee",
  "COMPUTER FEE": "Computer fee",
  "MISCELLENIOUS": "Miscellaneous",
  "MISCELLANEOUS": "Miscellaneous"
};

const VALID_MONTHLY_TUITION = [1200, 1000, 800, 500];

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

const extractMonths = (rawMonthStr, fallbackDateStr) => {
  const getFallback = () => {
    const d = new Date(fallbackDateStr);
    return isNaN(d) ? [new Date().toLocaleString('en-US', { month: 'long' })] : [d.toLocaleString('en-US', { month: 'long' })];
  };

  if (!rawMonthStr) return getFallback();

  const str = String(rawMonthStr).toLowerCase();
  const matches = str.match(/[a-z]{3,}/g) || [];
  
  const monthPrefixes = {
    jan: "January", feb: "February", fab: "February", mar: "March",
    apr: "April", may: "May", jun: "June", jul: "July",
    aug: "August", sep: "September", oct: "October", nov: "November", dec: "December"
  };

  const found = [];
  matches.forEach(m => {
    const prefix = m.substring(0, 3);
    if (monthPrefixes[prefix] && !found.includes(monthPrefixes[prefix])) {
      found.push(monthPrefixes[prefix]);
    }
  });
  
  return found.length > 0 ? found : getFallback();
};

const applyFeeLogic = (rawTuition, rawExam, monthCount) => {
  let tuition = rawTuition;
  let exam = rawExam;
  let monthly = 0;
  let matched = true;

  if (rawTuition === 0) return { tuition: 0, exam: rawExam, monthly: 0, matched: true };

  let foundMatch = false;
  for (const T of VALID_MONTHLY_TUITION) {
    if (rawTuition === T * monthCount) {
      monthly = T; foundMatch = true; break;
    }
    if (rawTuition === (T * monthCount) + 500) {
      tuition = T * monthCount; exam = rawExam + 500;
      monthly = T; foundMatch = true; break;
    }
  }

  if (!foundMatch) {
    matched = false;
    monthly = tuition / (monthCount || 1);
  }
  return { tuition, exam, monthly, matched };
};

const applyFeeLogicEdit = (combinedAmount, monthCount, originalTuition, originalExam) => {
  if (combinedAmount === originalTuition + originalExam) {
      return { tuition: originalTuition, exam: originalExam, monthly: originalTuition / (monthCount || 1), matched: true };
  }
  if (combinedAmount === 0) return { tuition: 0, exam: 0, monthly: 0, matched: true };

  for (const T of VALID_MONTHLY_TUITION) {
      if (combinedAmount === T * monthCount) return { tuition: combinedAmount, exam: 0, monthly: T, matched: true };
      if (combinedAmount === (T * monthCount) + 500) return { tuition: T * monthCount, exam: 500, monthly: T, matched: true };
  }
  
  if (combinedAmount === 500 && monthCount === 0) return { tuition: 0, exam: 500, monthly: 0, matched: true };
  return { tuition: combinedAmount, exam: 0, monthly: combinedAmount / (monthCount || 1), matched: false };
};

// --- Custom Sorting Logic: By Class, then by ID ---
const sortDataByClassAndId = (a, b) => {
  const classA = a.class || "";
  const classB = b.class || "";
  if (classA !== classB) {
    return classA.localeCompare(classB); // Sort alphabetically by class
  }
  // If class is same, sort by student ID
  const idA = parseInt(a.studentId) || 0;
  const idB = parseInt(b.studentId) || 0;
  return idA - idB;
};

export default function BulkFeeImport() {
  const [students, setStudents] = useState([]);
  const [dbFeeMap, setDbFeeMap] = useState({}); 
  
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ studentId: "", memoNo: "", invoiceDate: "", months: "", amount: "" });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const studentData = await getStudents();
        setStudents(studentData);
        
        const feeData = await getBulkStudentFees(); 
        const map = {};
        feeData.forEach(record => {
          const sId = String(record.studentId).trim();
          if (!map[sId]) map[sId] = {};
          
          if (record.monthWiseDetails) {
            Object.entries(record.monthWiseDetails).forEach(([month, details]) => {
              if (!map[sId][month]) map[sId][month] = [];
              if (details.amounts) {
                Object.keys(details.amounts).forEach(feeType => {
                  if (!map[sId][month].includes(feeType)) map[sId][month].push(feeType);
                });
              }
            });
          }
        });
        setDbFeeMap(map);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  const revalidateData = (rows, studentList, dbMap) => {
    const sheetFeeMap = {};
    rows.forEach(row => {
      const sid = String(row.studentId || "").trim();
      if (sid && row.monthWiseDetails) {
        if (!sheetFeeMap[sid]) sheetFeeMap[sid] = {};
        Object.entries(row.monthWiseDetails).forEach(([month, details]) => {
          if (!sheetFeeMap[sid][month]) sheetFeeMap[sid][month] = {};
          if (details.amounts) {
            Object.keys(details.amounts).forEach(feeType => {
              sheetFeeMap[sid][month][feeType] = (sheetFeeMap[sid][month][feeType] || 0) + 1;
            });
          }
        });
      }
    });

    return rows.map(row => {
      let errorReasons = [];
      const studentId = String(row.studentId || "").trim();
      const memoNo = String(row.memoNo || "").trim();
      const totalAmount = Number(row.grandTotal || 0);

      const matchedStudent = studentList.find((s) => String(s.studentId) === studentId);
      const studentClass = matchedStudent ? matchedStudent.class : "";

      if (!studentId) errorReasons.push("ID missing");
      else if (!matchedStudent) errorReasons.push("ID not found in DB");
      if (!memoNo) errorReasons.push("Memo No missing");
      if (totalAmount < 500) errorReasons.push(`Amount < 500`);
      if (!row.logicMatched) errorReasons.push("Invalid Tuition/Exam mapping");

      if (studentId && row.monthWiseDetails) {
        Object.entries(row.monthWiseDetails).forEach(([month, details]) => {
          if (details.amounts) {
            Object.keys(details.amounts).forEach(feeType => {
              if (dbMap[studentId]?.[month]?.includes(feeType)) {
                errorReasons.push(`DB Duplicate: ${feeType} for ${month}`);
              }
              if (sheetFeeMap[studentId]?.[month]?.[feeType] > 1) {
                errorReasons.push(`Sheet Duplicate: ${feeType} for ${month}`);
              }
            });
          }
        });
      }

      errorReasons = [...new Set(errorReasons)];
      const isValid = errorReasons.length === 0;

      return {
        ...row,
        studentId,
        memoNo,
        studentName: matchedStudent ? matchedStudent.fullName : "Unknown",
        class: studentClass,
        roll: matchedStudent ? matchedStudent.roll : "",
        section: matchedStudent ? matchedStudent.section : "",
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
        alert("Excel file is empty.");
        return;
      }

      let rawRows = jsonData.map((row) => {
        const normRow = {};
        Object.keys(row).forEach(k => { normRow[k.trim().toUpperCase()] = row[k]; });

        const rawId = String(normRow["STUDENT ID"] ?? normRow["ID NO"] ?? normRow["ID"] ?? "").trim();
        const rawMemo = String(normRow["MEMO NO"] ?? normRow["MEMO"] ?? "").trim();
        const rawDate = parseExcelDate(normRow["DATE"]);
        
        const rawMonthStr = String(normRow["MONTH PAID"] ?? normRow["MONTH"] ?? normRow["MONTHS"] ?? "");
        const extractedMonths = extractMonths(rawMonthStr, rawDate);
        const M = extractedMonths.length;

        const rawTuition = Number(normRow["TUTION FEE"] ?? normRow["TUITION FEE"] ?? normRow["AMOUNT"] ?? 0);
        const rawExam = Number(normRow["EXAM FEE"] ?? 0);
        
        const { tuition, exam, monthly, matched } = applyFeeLogic(rawTuition, rawExam, M);

        let feeDetails = {};
        let totalAmount = 0;

        if (tuition > 0) { feeDetails["Tuition fee"] = tuition; totalAmount += tuition; }
        if (exam > 0) { feeDetails["Exam fee"] = exam; totalAmount += exam; }

        Object.keys(normRow).forEach(key => {
          if (FEE_COLUMNS_MAP[key]) {
            const amt = Number(normRow[key]) || 0;
            if (amt > 0) {
              feeDetails[FEE_COLUMNS_MAP[key]] = amt;
              totalAmount += amt;
            }
          }
        });

        let monthWiseDetails = {};
        extractedMonths.forEach(m => {
          monthWiseDetails[m] = { checked: {}, amounts: {} };
          if (monthly > 0) {
            monthWiseDetails[m].checked["Tuition fee"] = true;
            monthWiseDetails[m].amounts["Tuition fee"] = monthly;
          }
        });

        if (extractedMonths.length > 0) {
          const firstMonth = extractedMonths[0];
          Object.keys(feeDetails).forEach(feeName => {
            if (feeName !== "Tuition fee") {
              monthWiseDetails[firstMonth].checked[feeName] = true;
              monthWiseDetails[firstMonth].amounts[feeName] = feeDetails[feeName];
            }
          });
        }

        return {
          studentId: rawId,
          invoiceNo: rawMemo,
          memoNo: rawMemo,
          invoiceDate: rawDate,
          selectedMonths: extractedMonths,
          paymentMethod: "Bank",
          feeDetails,
          monthWiseDetails,
          grandTotal: totalAmount,
          logicMatched: matched,
          remarks: "Uploaded via Bulk Import",
        };
      });

      let validatedData = revalidateData(rawRows, students, dbFeeMap);
      
      // Sort: First by Class alphabetically, then by ID
      validatedData.sort(sortDataByClassAndId);

      setPreviewData(validatedData);
    } catch (error) {
      console.error("Excel processing failed:", error);
      alert("Excel file could not be processed. Ensure correct columns.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveEdit = (index) => {
    const newData = [...previewData];
    let row = { ...newData[index] };
    
    row.studentId = editForm.studentId;
    row.memoNo = editForm.memoNo;
    row.invoiceNo = editForm.memoNo;
    row.invoiceDate = editForm.invoiceDate;
    
    const extractedMonths = extractMonths(editForm.months, editForm.invoiceDate);
    row.selectedMonths = extractedMonths;
    const M = extractedMonths.length;
    const newGrandTotal = Number(editForm.amount);

    const otherFeesTotal = Object.entries(row.feeDetails)
      .filter(([key]) => key !== "Tuition fee" && key !== "Exam fee")
      .reduce((sum, [, val]) => sum + val, 0);

    const newCombinedAmount = newGrandTotal - otherFeesTotal;
    const oldTuition = row.feeDetails["Tuition fee"] || 0;
    const oldExam = row.feeDetails["Exam fee"] || 0;

    const { tuition, exam, monthly, matched } = applyFeeLogicEdit(newCombinedAmount, M, oldTuition, oldExam);

    let newFeeDetails = {};
    if (tuition > 0) newFeeDetails["Tuition fee"] = tuition;
    if (exam > 0) newFeeDetails["Exam fee"] = exam;
    Object.entries(row.feeDetails).forEach(([k, v]) => {
      if (k !== "Tuition fee" && k !== "Exam fee") newFeeDetails[k] = v;
    });

    row.feeDetails = newFeeDetails;
    row.grandTotal = newGrandTotal;
    row.logicMatched = matched;

    let newMonthWise = {};
    extractedMonths.forEach(m => {
      newMonthWise[m] = { checked: {}, amounts: {} };
      if (monthly > 0) {
        newMonthWise[m].checked["Tuition fee"] = true;
        newMonthWise[m].amounts["Tuition fee"] = monthly;
      }
    });
    
    if (extractedMonths.length > 0) {
      const firstMonth = extractedMonths[0];
      Object.keys(newFeeDetails).forEach(feeName => {
        if (feeName !== "Tuition fee") {
          newMonthWise[firstMonth].checked[feeName] = true;
          newMonthWise[firstMonth].amounts[feeName] = newFeeDetails[feeName];
        }
      });
    }
    
    row.monthWiseDetails = newMonthWise;
    newData[index] = row;
    
    let revalidatedData = revalidateData(newData, students, dbFeeMap);
    revalidatedData.sort(sortDataByClassAndId);

    setPreviewData(revalidatedData);
    setEditingIndex(null);
  };

  const handleDeleteRow = (index) => {
    const newData = [...previewData];
    newData.splice(index, 1);
    
    let revalidatedData = revalidateData(newData, students, dbFeeMap);
    revalidatedData.sort(sortDataByClassAndId);

    setPreviewData(revalidatedData);
    setEditingIndex(null);
  };

  // --- Normal Save (Append to Database) ---
  const handleSaveToDatabase = async () => {
    const validRows = previewData.filter((row) => row.isValid);
    if (validRows.length === 0) return;

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const cleanPayloads = validRows.map(({ isValid, errorReason, studentName, class: stdClass, roll, section, logicMatched, ...rest }) => rest);
      
      const CHUNK_SIZE = 50; 
      const totalChunks = Math.ceil(cleanPayloads.length / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = cleanPayloads.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await saveBulkStudentFees(chunk);
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      setTimeout(() => {
        alert(`Successfully appended ${validRows.length} records.`);
        setPreviewData((prev) => prev.filter((row) => !row.isValid));
        setIsSaving(false);
        setUploadProgress(0);
        window.location.reload(); 
      }, 500);

    } catch (error) {
      alert("Failed to save data. Please check the console.");
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  // --- Destructive Save (Wipe Database then Save) ---
  const handleReplaceDatabase = async () => {
    const validRows = previewData.filter((row) => row.isValid);
    if (validRows.length === 0) return;

    const confirmClear = window.confirm(
      "⚠️ সতর্কতা! আপনি কি নিশ্চিত?\n\nএই অপশনটি ডাটাবেসের আগের সকল ফি রেকর্ড সম্পূর্ণ মুছে ফেলবে এবং শুধু বর্তমান শিটের ভ্যালিড রেকর্ডগুলো সেভ করবে। এটি আর ফেরত পাওয়া যাবে না।"
    );
    if (!confirmClear) return;

    setIsSaving(true);
    setUploadProgress(0);

    try {
      // 1. Wipe old database
      await deleteAllFees();

      // 2. Upload new data
      const cleanPayloads = validRows.map(({ isValid, errorReason, studentName, class: stdClass, roll, section, logicMatched, ...rest }) => rest);
      
      const CHUNK_SIZE = 50; 
      const totalChunks = Math.ceil(cleanPayloads.length / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = cleanPayloads.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await saveBulkStudentFees(chunk);
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      setTimeout(() => {
        alert(`সাফল্যমণ্ডিত! আগের সব রেকর্ড মুছে ${validRows.length} টি নতুন রেকর্ড সেভ হয়েছে।`);
        setPreviewData((prev) => prev.filter((row) => !row.isValid));
        setIsSaving(false);
        setUploadProgress(0);
        window.location.reload(); 
      }, 500);

    } catch (error) {
      alert("Failed to replace data. Ensure 'deleteAllFees' is properly implemented in feeService.js");
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const exportInvalidData = () => {
    const invalidData = previewData
      .filter((d) => !d.isValid)
      .map((d) => ({
        "STUDENT ID": d.studentId,
        "CLASS": d.class,
        "NAME": d.studentName,
        "MEMO NO": d.memoNo,
        "DATE": d.invoiceDate,
        "MONTHS": d.selectedMonths.join(", "),
        "FEE TYPES": Object.keys(d.feeDetails).join(", "),
        "TOTAL AMOUNT": d.grandTotal,
        "ERROR REASON": d.errorReason,
      }));

    if (invalidData.length === 0) return alert("কোনো ইনভ্যালিড ডেটা নেই!");
    
    const ws = XLSX.utils.json_to_sheet(invalidData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invalid Data");
    XLSX.writeFile(wb, "Invalid_Fee_Records.xlsx");
  };

  const validCount = previewData.filter((d) => d.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div className="animate-in fade-in duration-300 max-w-[90rem] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <UploadCloud className="w-6 h-6 mr-2 text-blue-600" /> Bulk Fee Import
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            এক্সেল শিট আপলোড করে ফি এন্ট্রি করুন এবং ভুল ডেটা সংশোধন করুন।
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <Button
            variant="primary"
            leftIcon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            disabled={isUploading || isSaving}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? "Processing..." : "Upload Excel File"}
          </Button>
        </div>
      </div>

      {isSaving && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-800 dark:text-white">Processing Records in Database...</h3>
            <span className="font-bold text-blue-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {previewData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle>
              Preview Data
              <span className="text-sm font-normal text-slate-500 ml-2">
                (Valid: <span className="text-emerald-600 font-semibold">{validCount}</span>, Invalid:{" "}
                <span className="text-red-500 font-semibold">{invalidCount}</span>)
              </span>
            </CardTitle>

            <div className="flex flex-wrap gap-2">
              {invalidCount > 0 && (
                <Button
                  variant="outline"
                  onClick={exportInvalidData}
                  disabled={isSaving}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  Download Invalid
                </Button>
              )}
              
              <Button
                onClick={handleSaveToDatabase}
                disabled={validCount === 0 || isSaving}
                leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving ? "Saving..." : `Append ${validCount} Records`}
              </Button>

              <Button
                onClick={handleReplaceDatabase}
                disabled={validCount === 0 || isSaving}
                leftIcon={<AlertOctagon className="w-4 h-4" />}
                className="bg-red-600 hover:bg-red-700 text-white"
                title="Deletes all old DB fees, saves only this sheet."
              >
                Replace All (Clear & Save)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-24">Class</TableHead>
                    <TableHead className="w-24">ID No</TableHead>
                    <TableHead className="w-24">Memo No</TableHead>
                    <TableHead className="w-40">Student Name</TableHead>
                    <TableHead className="w-32">Date & Month</TableHead>
                    <TableHead className="w-48">Fee Types</TableHead>
                    <TableHead className="w-28 text-right">Amount (TK)</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow
                      key={index}
                      className={`group transition-colors ${!row.isValid ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                    >
                      <TableCell>
                        {row.isValid ? (
                          <Badge variant="success" className="flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </Badge>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Badge variant="error" className="flex items-center gap-1 w-max bg-red-100 text-red-700 border-red-200">
                              <AlertTriangle className="w-3 h-3" /> Invalid
                            </Badge>
                            <span className="text-[10px] text-red-500 font-medium leading-tight max-w-[140px]">
                              {row.errorReason}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="font-semibold text-slate-700 dark:text-slate-300">
                        {row.class || "-"}
                      </TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editForm.studentId}
                            onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                            className="h-8 text-sm px-2 w-20"
                            placeholder="ID"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {row.studentId || "-"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editForm.memoNo}
                            onChange={(e) => setEditForm({ ...editForm, memoNo: e.target.value })}
                            className="h-8 text-sm px-2 w-20"
                            placeholder="Memo"
                          />
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                            {row.memoNo || "-"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className={!row.isValid ? "text-red-500 font-medium" : "font-medium text-slate-800 dark:text-slate-200"}>
                        {row.studentName}
                      </TableCell>

                      <TableCell className="text-slate-500">
                        {editingIndex === index ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              type="date"
                              value={editForm.invoiceDate}
                              onChange={(e) => setEditForm({ ...editForm, invoiceDate: e.target.value })}
                              className="h-8 text-xs px-2 w-28"
                            />
                            <Input
                              value={editForm.months}
                              onChange={(e) => setEditForm({ ...editForm, months: e.target.value })}
                              className="h-8 text-xs px-2 w-28"
                              placeholder="e.g. Jan, Feb"
                            />
                          </div>
                        ) : (
                          <>
                            <span className="block font-medium text-slate-700 dark:text-slate-300">{row.invoiceDate}</span>
                            <span className="text-xs">{row.selectedMonths.join(", ")}</span>
                          </>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(row.feeDetails).map(fee => (
                            <span key={fee} className="text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 px-1.5 py-0.5 rounded">
                              {fee}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            className="h-8 text-sm px-2 w-20 ml-auto"
                            placeholder="Amt"
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">৳ {row.grandTotal}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {editingIndex === index ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => saveEdit(index)}
                              className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 shadow-sm transition"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 shadow-sm transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!row.isValid && !isSaving && (
                              <button
                                onClick={() => {
                                  setEditingIndex(index);
                                  setEditForm({ 
                                    studentId: row.studentId, 
                                    memoNo: row.memoNo, 
                                    invoiceDate: row.invoiceDate,
                                    months: row.selectedMonths.join(", "),
                                    amount: row.grandTotal 
                                  });
                                }}
                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded transition-colors"
                                title="Edit Row"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {!isSaving && (
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors"
                                title="Delete Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}