import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getStudents,
  deleteStudent,
  createStudent,
} from "@/features/students/services/studentService";
import {
  Eye, Edit, Trash2, Search, User, Copy, Check, Download, Loader2,
  Upload, FileSpreadsheet, X, AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const CopyableText = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="group flex items-center gap-2 cursor-pointer" onClick={handleCopy}>
      <span className="font-medium text-slate-800 dark:text-slate-200">{text || "N/A"}</span>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
        )}
      </button>
    </div>
  );
};

const CLASS_ORDER = {
  Play: 1, Nursery: 2, KG: 3,
  "1": 4, One: 4, "Class 1": 4,
  "2": 5, Two: 5, "Class 2": 5,
  "3": 6, Three: 6, "Class 3": 6,
  "4": 7, Four: 7, "Class 4": 7,
  "5": 8, Five: 8, "Class 5": 8,
  "6": 9, "7": 10, "8": 11, "9": 12, "10": 13,
};

const getClassRank = (c) => {
  if (!c) return 99;
  const u = String(c).trim();
  if (CLASS_ORDER[u]) return CLASS_ORDER[u];
  const n = parseInt(u.replace(/[^0-9]/g, ""));
  if (!isNaN(n)) return n + 3;
  return 99;
};

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedClassPDF, setSelectedClassPDF] = useState("All");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [parsedImportData, setParsedImportData] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (e) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      await deleteStudent(id);
      toast.success("Student deleted successfully");
      fetchStudents();
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.contactNumber?.includes(searchTerm)
  );

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map((s) => s.class).filter(Boolean))];
    return classes.sort((a, b) => getClassRank(a) - getClassRank(b));
  }, [students]);

  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    const data = students.map((s, i) => ({
      "S/N": i + 1,
      "Student Name": s.fullName || "",
      "Student ID": s.studentId || "",
      "Class": s.class || "",
      "Roll Number": s.rollNumber ?? "",
      "Contact Number": s.contactNumber || "",
      "Status": s.status || "Active",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, "Students_All_" + today + ".xlsx");
    toast.success("Exported " + students.length + " student(s) successfully!");
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws);

        const normalize = (k) => String(k).toLowerCase().replace(/[\s_-]+/g, "");

        const rows = rawRows.map((row) => {
          const n = {};
          Object.keys(row).forEach((k) => {
            n[normalize(k)] = row[k];
          });
          return {
            studentId: String(n["studentid"] ?? "").trim(),
            fullName: String(n["fullname"] ?? n["studentname"] ?? n["name"] ?? "").trim(),
            class: String(n["class"] ?? "").trim(),
            rollNumber: String(n["rollnumber"] ?? n["roll"] ?? "").trim(),
            contactNumber: String(n["contactnumber"] ?? n["phone"] ?? "").trim(),
            status: String(n["status"] ?? "Active").trim(),
          };
        });

        if (rows.length === 0) {
          toast.error("Empty Excel file or no readable rows.");
          e.target.value = "";
          return;
        }

        const existingIds = new Set(students.map((s) => String(s.studentId).trim()));
        const seenInFile = new Set();
        const valid = [];
        const duplicates = [];
        const invalid = [];

        rows.forEach((r, idx) => {
          const rowNum = idx + 2;
          if (!r.studentId || !r.fullName) {
            invalid.push({ ...r, _rowNum: rowNum, _reason: "Missing Student ID or Name" });
          } else if (existingIds.has(r.studentId)) {
            duplicates.push({ ...r, _rowNum: rowNum, _reason: "Already exists in DB" });
          } else if (seenInFile.has(r.studentId)) {
            duplicates.push({ ...r, _rowNum: rowNum, _reason: "Duplicate in file" });
          } else {
            seenInFile.add(r.studentId);
            valid.push(r);
          }
        });

        setParsedImportData({ total: rows.length, valid, duplicates, invalid });
        setShowImportModal(true);
      } catch (err) {
        console.error("Excel read error:", err);
        toast.error("Failed to read Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!parsedImportData || parsedImportData.valid.length === 0) return;
    setIsImporting(true);

    let success = 0;
    let failed = 0;
    for (const student of parsedImportData.valid) {
      try {
        await createStudent({
          fullName: student.fullName,
          studentId: student.studentId,
          class: student.class,
          rollNumber: student.rollNumber,
          contactNumber: student.contactNumber,
          status: student.status || "Active",
          photoURL: "",
        });
        success++;
      } catch (err) {
        console.error("Failed to import " + student.studentId + ":", err);
        failed++;
      }
    }

    setIsImporting(false);
    setShowImportModal(false);
    setParsedImportData(null);
    toast.success(
      "Imported " + success + " student(s)" + (failed ? " • " + failed + " failed" : ""),
      { duration: 5000 }
    );
    fetchStudents();
  };

  const handleDownloadClassList = async () => {
    setIsGeneratingPDF(true);
    try {
      const activeStudents = students.filter((s) => s.status !== "Inactive");
      let studentsToExport = activeStudents;
      if (selectedClassPDF !== "All") {
        studentsToExport = activeStudents.filter((s) => s.class === selectedClassPDF);
      }
      if (studentsToExport.length === 0) {
        toast.error("No students found for this selection!");
        return;
      }

      const grouped = {};
      studentsToExport.forEach((s) => {
        const c = s.class || "Unknown Class";
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(s);
      });
      Object.keys(grouped).forEach((c) => {
        grouped[c].sort((a, b) => {
          const ra = parseInt(a.rollNumber || a.roll) || 9999;
          const rb = parseInt(b.rollNumber || b.roll) || 9999;
          return ra - rb;
        });
      });
      const sortedGrouped = {};
      Object.keys(grouped)
        .sort((a, b) => getClassRank(a) - getClassRank(b))
        .forEach((k) => {
          sortedGrouped[k] = grouped[k];
        });

      const { pdf } = await import("@react-pdf/renderer");
      const StudentClassListTemplate = (
        await import("@/templates/pdf/StudentClassListTemplate")
      ).default;

      const doc = <StudentClassListTemplate groupedStudents={sortedGrouped} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Student_List_" + selectedClassPDF.replace(/\s+/g, "_") + "_" + new Date().toISOString().split("T")[0] + ".pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF Downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-red-800 dark:text-red-300 text-base">
            Important Notice: Web Version Shutdown
          </h3>
          <p className="text-red-700 dark:text-red-400 text-sm mt-1">
            Many features are <strong>not available</strong> on this website. Please
            be informed that the <strong>web version will be permanently shut down
            from December</strong>. To continue using the service with full features,
            please switch to our mobile app.
          </p>
          <p className="text-red-700 dark:text-red-400 text-sm mt-1 font-medium">
            গুরুত্বপূর্ণ নোটিশ: এই ওয়েবসাইটে অনেক ফিচার পাওয়া যাবে না। আগামী{" "}
            <strong>ডিসেম্বর থেকে ওয়েব ভার্সনটি বন্ধ হয়ে যাবে</strong>। সম্পূর্ণ
            সুবিধার জন্য দয়া করে আমাদের মোবাইল অ্যাপটি ব্যবহার করুন।
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            শিক্ষার্থী তালিকা
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total {students.length} students found in the database.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto flex-wrap">
          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <select
              value={selectedClassPDF}
              onChange={(e) => setSelectedClassPDF(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 min-w-[120px]"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={handleDownloadClassList}
              disabled={isGeneratingPDF || students.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors shadow-sm whitespace-nowrap"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isGeneratingPDF ? "Generating..." : "PDF"}
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={students.length === 0}
            className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
            title="Download all students as Excel"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </button>

          <label className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, ID or Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Student Info</th>
                <th className="px-6 py-4 font-medium">Student ID</th>
                <th className="px-6 py-4 font-medium">Class &amp; Roll</th>
                <th className="px-6 py-4 font-medium">Contact Number</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading students data...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 flex items-center space-x-3">
                      {student.photoURL ? (
                        <img
                          src={student.photoURL}
                          alt={student.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <CopyableText text={student.fullName} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CopyableText text={student.studentId} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Class {student.class}
                      </span>{" "}
                      <span className="mx-1 text-slate-400">•</span> Roll{" "}
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-4">
                      <CopyableText text={student.contactNumber} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={"/students/details/" + student.id}
                        className="inline-flex p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={"/students/edit/" + student.id}
                        className="inline-flex p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="inline-flex p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showImportModal && parsedImportData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => !isImporting && setShowImportModal(false)}
          ></div>
          <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                Import Preview
              </h2>
              <button
                onClick={() => !isImporting && setShowImportModal(false)}
                disabled={isImporting}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    New (Will Import)
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {parsedImportData.valid.length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    Duplicates (Skipped)
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {parsedImportData.duplicates.length}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                    Invalid (Skipped)
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {parsedImportData.invalid.length}
                  </p>
                </div>
              </div>

              {parsedImportData.valid.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Students to be added:
                  </h3>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">ID</th>
                          <th className="px-3 py-2 text-left font-semibold">Name</th>
                          <th className="px-3 py-2 text-left font-semibold">Class</th>
                          <th className="px-3 py-2 text-left font-semibold">Roll</th>
                          <th className="px-3 py-2 text-left font-semibold">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedImportData.valid.map((s, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5">{s.studentId}</td>
                            <td className="px-3 py-1.5">{s.fullName}</td>
                            <td className="px-3 py-1.5">{s.class}</td>
                            <td className="px-3 py-1.5">{s.rollNumber}</td>
                            <td className="px-3 py-1.5">{s.contactNumber || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || parsedImportData.valid.length === 0}
                className="flex items-center px-5 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...
                  </>
                ) : (
                  <>Import {parsedImportData.valid.length} Student(s)</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}