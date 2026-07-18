import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { getStudents } from "@/features/students/services/studentService";
import { saveBulkStudentFees, generateNextInvoiceNo } from "@/features/fee/services/feeService";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { UploadCloud, CheckCircle2, AlertTriangle, Save, Edit2, Download, X, Check } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function BulkFeeImport() {
  const [students, setStudents] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Editing state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ studentId: "", amount: "" });

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await getStudents();
      setStudents(data);
    };
    fetchStudents();
  }, []);

  /**
   * Validates and enriches a single fee row.
   * @param {Object} row - The parsed row with at least { studentId, ...otherData }
   * @param {Array} studentList - The full student list from DB
   * @returns {Object} A clean, fully typed row with an `isValid` flag.
   */
  const validateAndEnrichRow = (row, studentList) => {
    const studentId = String(row.studentId || "").trim();
    const matchedStudent = studentList.find(
      (s) => String(s.studentId) === studentId
    );

    if (matchedStudent) {
      return {
        ...row,
        studentId,
        studentName: matchedStudent.fullName || "Unknown",
        class: matchedStudent.class || "",
        roll: matchedStudent.roll || "",
        section: matchedStudent.section || "",
        isValid: true,
      };
    }

    return {
      ...row,
      studentId,
      studentName: "Unknown",
      class: "",
      roll: "",
      section: "",
      isValid: false,
    };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (jsonData.length === 0) {
        alert("Excel file is empty.");
        return;
      }

      let currentInvoiceBase = await generateNextInvoiceNo();
      let counter = parseInt(currentInvoiceBase.split('-')[1] || "0", 10);

      const rawRows = jsonData.map((row) => {
        const rawId = String(row["ID No"] ?? row["ID"] ?? "").trim();
        const rawMonth = String(row["Month"] ?? "").trim();
        const month =
          MONTHS.find((m) => m.toLowerCase().startsWith(rawMonth.toLowerCase())) || rawMonth;

        const amount = Number(row["Amount"] ?? 0);
        const invoiceNo = row["Memo No"]
          ? String(row["Memo No"])
          : `WSC-${String(counter++).padStart(6, "0")}`;

        return {
          studentId: rawId,
          invoiceNo,
          memoNo: invoiceNo,
          invoiceDate: row["Date"]
            ? String(row["Date"])
            : new Date().toISOString().split("T")[0],
          selectedMonths: [month],
          paymentMethod: "Bank",
          feeDetails: { "Tuition fee": amount },
          monthWiseDetails: {
            [month]: {
              checked: { "Tuition fee": true },
              amounts: { "Tuition fee": amount },
            },
          },
          grandTotal: amount,
          remarks: "Uploaded via Bulk Import",
        };
      });

      const validatedData = rawRows.map((row) =>
        validateAndEnrichRow(row, students)
      );

      setPreviewData(validatedData);
    } catch (error) {
      console.error("Excel processing failed:", error);
      alert("Excel file could not be processed. Check console for details.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveToDatabase = async () => {
    const validRows = previewData.filter((row) => row.isValid);
    if (validRows.length === 0) {
      alert("No valid records to save.");
      return;
    }

    setIsSaving(true);
    try {
      const cleanPayloads = validRows.map(({ isValid, ...rest }) => rest);

      const CHUNK_SIZE = 450;
      for (let i = 0; i < cleanPayloads.length; i += CHUNK_SIZE) {
        const chunk = cleanPayloads.slice(i, i + CHUNK_SIZE);
        await saveBulkStudentFees(chunk);
      }

      alert(`Successfully saved ${validRows.length} records.`);
      setPreviewData((prev) => prev.filter((row) => !row.isValid));
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save data. Please check the console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (index, row) => {
    setEditingIndex(index);
    setEditForm({ studentId: row.studentId, amount: row.grandTotal });
  };

  const saveEdit = (index) => {
    const newData = [...previewData];
    let row = { ...newData[index] };

    row.studentId = editForm.studentId;
    row.grandTotal = Number(editForm.amount);
    row.feeDetails["Tuition fee"] = Number(editForm.amount);
    const month = row.selectedMonths[0];
    row.monthWiseDetails[month].amounts["Tuition fee"] = Number(editForm.amount);

    newData[index] = validateAndEnrichRow(row, students);
    setPreviewData(newData);
    setEditingIndex(null);
  };

  const exportInvalidData = () => {
    const invalidData = previewData
      .filter((d) => !d.isValid)
      .map((d) => ({
        "ID No": d.studentId,
        Name: "Not Found",
        Month: d.selectedMonths.join(", "),
        Amount: d.grandTotal,
        "Memo No": d.invoiceNo,
        "Error Reason": "Student ID doesn't exist in database",
      }));

    if (invalidData.length === 0) {
      alert("কোনো ইনভ্যালিড ডেটা নেই!");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(invalidData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invalid Data");
    XLSX.writeFile(wb, "Invalid_Fee_Records.xlsx");
  };

  const validCount = previewData.filter((d) => d.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6">
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
            leftIcon={<UploadCloud className="w-4 h-4" />}
            isLoading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Excel File
          </Button>
        </div>
      </div>

      {previewData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle>
              Preview Data
              <span className="text-sm font-normal text-slate-500 ml-2">
                (Valid: {validCount}, Invalid:{" "}
                <span className="text-red-500 font-semibold">{invalidCount}</span>)
              </span>
            </CardTitle>

            <div className="flex gap-2">
              {invalidCount > 0 && (
                <Button
                  variant="outline"
                  onClick={exportInvalidData}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  Download Invalid
                </Button>
              )}
              <Button
                onClick={handleSaveToDatabase}
                isLoading={isSaving}
                disabled={validCount === 0}
                leftIcon={<Save className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Save {validCount} Valid Records
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-40">ID No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead className="w-32">Amount (TK)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow
                      key={index}
                      className={`group ${!row.isValid ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}
                    >
                      <TableCell>
                        {row.isValid ? (
                          <Badge variant="success" className="flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </Badge>
                        ) : (
                          <Badge variant="error" className="flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> Invalid
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editForm.studentId}
                            onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {row.studentId}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className={!row.isValid ? "text-red-500" : ""}>
                        {row.studentName}
                      </TableCell>

                      <TableCell>{row.selectedMonths.join(", ")}</TableCell>

                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <span>৳ {row.grandTotal}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {editingIndex === index ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => saveEdit(index)}
                              className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          !row.isValid && (
                            <button
                              onClick={() => startEdit(index, row)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit Row"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )
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