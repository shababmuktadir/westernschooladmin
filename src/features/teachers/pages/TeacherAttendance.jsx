import React, { useState, useEffect, useRef } from "react";
import { getTeachers, saveDailyAttendance, getAttendanceByDate } from "../services/teacherService";
import { UploadCloud, FileText, Printer, Save, CheckCircle2, LayoutDashboard, FileSearch, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AttendanceReportTemplate from "@/templates/pdf/AttendanceReportTemplate";

export default function TeacherAttendance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [teachers, setTeachers] = useState([]);
  
  // Dashboard State
  const [todayAttendance, setTodayAttendance] = useState([]);
  const todayString = new Date().toISOString().split("T")[0];

  // Upload State
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [previewData, setPreviewData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null); // null means no upload active
  const fileInputRef = useRef(null);
  
  // Report State
  const [reportDate, setReportDate] = useState(todayString);
  const [reportData, setReportData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const tData = await getTeachers();
    setTeachers(tData.sort((a, b) => parseInt(a.teacherId) - parseInt(b.teacherId)));
    
    // Fetch today's data for dashboard
    const todayData = await getAttendanceByDate(todayString);
    setTodayAttendance(todayData);
  };

  // --- UPLOAD & PARSE LOGIC WITH ANIMATION ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress(0); // Start animation

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const parsedTxtData = {}; 

      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const id = parts[0];
          const time = parts[2];
          if (!parsedTxtData[id]) parsedTxtData[id] = time; 
        }
      });

      const attendancePreview = teachers.map(t => {
        const timeScanned = parsedTxtData[t.teacherId];
        return {
          teacherId: t.teacherId,
          name: t.englishName,
          date: selectedDate,
          time: timeScanned || "",
          status: timeScanned ? "P" : "A"
        };
      });

      // Simulate processing time for UX animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        if (progress > 100) progress = 100;
        setUploadProgress(progress);
        
        if (progress === 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPreviewData(attendancePreview);
            setUploadProgress(null);
            toast.success("File parsed successfully!");
            if (fileInputRef.current) fileInputRef.current.value = ""; // reset input
          }, 400);
        }
      }, 100);
    };
    reader.readAsText(file);
  };

  const submitAttendance = async () => {
    if (previewData.length === 0) return toast.error("No data to save!");
    try {
      await saveDailyAttendance(selectedDate, previewData);
      toast.success(`Attendance saved for ${selectedDate}`);
      setPreviewData([]);
      if (selectedDate === todayString) fetchInitialData(); // Update dashboard if today
    } catch (err) {
      toast.error("Error saving attendance.");
    }
  };

  // --- REPORT LOGIC ---
  const fetchReport = async () => {
    const data = await getAttendanceByDate(reportDate);
    if(data.length === 0) toast.error("No records found for this date.");
    setReportData(data.sort((a, b) => parseInt(a.teacherId) - parseInt(b.teacherId)));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button onClick={() => setActiveTab("dashboard")} className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-colors ${activeTab === "dashboard" ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 dark:bg-[#1a2235] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e293b]"}`}>
          <LayoutDashboard className="w-5 h-5"/> Dashboard
        </button>
        <button onClick={() => setActiveTab("upload")} className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-colors ${activeTab === "upload" ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 dark:bg-[#1a2235] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e293b]"}`}>
          <UploadCloud className="w-5 h-5"/> Upload Data
        </button>
        <button onClick={() => setActiveTab("report")} className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-colors ${activeTab === "report" ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 dark:bg-[#1a2235] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e293b]"}`}>
          <FileText className="w-5 h-5"/> Reports & PDF
        </button>
      </div>

      {/* --- TAB 1: DASHBOARD --- */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1a2235] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase text-sm mb-2">Total Teachers</h3>
              <p className="text-4xl font-black text-slate-800 dark:text-white">{teachers.length}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
              <h3 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-sm mb-2">Present Today</h3>
              <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300">
                {todayAttendance.filter(a => a.status === "P").length}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/50">
              <h3 className="text-red-600 dark:text-red-400 font-bold uppercase text-sm mb-2">Absent Today</h3>
              <p className="text-4xl font-black text-red-700 dark:text-red-300">
                {todayAttendance.length > 0 ? todayAttendance.filter(a => a.status === "A").length : 0}
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1a2235] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500"/> Today's Attendance Overview
            </h3>
            {todayAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Time</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {todayAttendance.map((d, i) => (
                      <tr key={i} className="text-slate-700 dark:text-slate-300">
                        <td className="p-3 font-bold">{d.teacherId}</td>
                        <td className="p-3">{d.name}</td>
                        <td className="p-3">{d.time || "--:--"}</td>
                        <td className="p-3 text-center">
                          <span className={`px-3 py-1 font-bold rounded-md text-xs ${d.status === "P" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {d.status === "P" ? "PRESENT" : "ABSENT"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                No attendance data uploaded for today yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: UPLOAD TXT FILE --- */}
      {activeTab === "upload" && (
        <div className="bg-white dark:bg-[#1a2235] p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">1. Select Record Date:</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="w-full p-3 border border-slate-300 dark:border-blue-500/50 rounded-xl bg-white dark:bg-[#151c2c] text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium" 
              />
            </div>
            
            <div className="bg-slate-50 dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-center">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">2. Upload Device .TXT File:</label>
              
              {/* Custom Upload Button UI */}
              <input 
                type="file" 
                accept=".txt" 
                onChange={handleFileUpload} 
                ref={fileInputRef}
                className="hidden" 
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed border-blue-400 dark:border-blue-500/50 rounded-xl bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 cursor-pointer transition-colors text-blue-600 dark:text-blue-400 font-bold"
              >
                <UploadCloud className="w-6 h-6" />
                Choose .TXT File
              </label>

              {/* Upload Progress Animation */}
              {uploadProgress !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    <span>Processing File...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-100 ease-out flex items-center justify-end" style={{ width: `${uploadProgress}%` }}>
                      {uploadProgress < 100 && <Loader2 className="w-3 h-3 text-white animate-spin mr-1 opacity-50" />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {previewData.length > 0 && uploadProgress === null && (
            <div className="animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500"/> Preview Data
                </h3>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-[#1e293b] px-3 py-1 rounded-full">Missing IDs automatically marked Absent</span>
              </div>
              
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl mb-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="p-4 font-semibold">Teacher ID</th>
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Punch Time</th>
                      <th className="p-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {previewData.map((d, i) => (
                      <tr key={i} className={d.status === 'A' ? "bg-red-50/50 dark:bg-red-900/10" : "bg-white dark:bg-[#1a2235]"}>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{d.teacherId}</td>
                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{d.name}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{d.time || "--:--:--"}</td>
                        <td className="p-4 text-center">
                          <span className={`px-4 py-1.5 font-bold rounded-lg text-xs border ${d.status === "P" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"}`}>
                            {d.status === "P" ? "PRESENT" : "ABSENT"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={submitAttendance} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold w-full md:w-auto flex justify-center items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20">
                <Save className="w-5 h-5" /> Save Daily Record to Database
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: REPORT & PDF --- */}
      {activeTab === "report" && (
        <div className="bg-white dark:bg-[#1a2235] p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-8 bg-slate-50 dark:bg-[#1e293b] p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex-1 w-full flex items-center gap-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Select Date:</label>
              <input 
                type="date" 
                value={reportDate} 
                onChange={e => setReportDate(e.target.value)} 
                className="w-full max-w-[200px] p-2.5 border border-slate-300 dark:border-blue-500/50 rounded-xl bg-white dark:bg-[#151c2c] text-slate-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium" 
              />
              <button onClick={fetchReport} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">Fetch</button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-5 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
              >
                <FileSearch className="w-4 h-4"/> Preview
              </button>
              
              {reportData.length > 0 ? (
                <PDFDownloadLink
                  document={<AttendanceReportTemplate records={reportData} date={reportDate} />}
                  fileName={`Teachers_Attendance_${reportDate}.pdf`}
                  className="flex-1 sm:flex-none bg-slate-800 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors shadow-lg"
                >
                  {({ loading }) => (loading ? "Wait..." : <><Printer className="w-4 h-4"/> Get PDF</>)}
                </PDFDownloadLink>
              ) : (
                <button disabled className="flex-1 sm:flex-none bg-slate-300 dark:bg-slate-800 text-slate-500 px-5 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 cursor-not-allowed">
                  <Printer className="w-4 h-4"/> Get PDF
                </button>
              )}
            </div>
          </div>

          {/* HTML Preview (Corporate Style) */}
          {showPreview && reportData.length > 0 && (
            <div className="mt-8 p-8 bg-white rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4">
              <div className="text-center mb-6 pb-6 border-b-2 border-slate-800">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider font-serif">Western School and College</h2>
                <h3 className="text-lg font-bold text-slate-700 mt-1">TEACHERS ATTENDANCE REPORT</h3>
                <p className="text-slate-500 font-medium mt-1">Date: {new Date(reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              
              <div className="flex gap-8 mb-6 font-bold text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span>Subtotal: {reportData.length}</span>
                <span className="text-emerald-600">Present: {reportData.filter(d => d.status === "P").length}</span>
                <span className="text-red-600">Absent: {reportData.filter(d => d.status === "A").length}</span>
              </div>

              <table className="w-full text-left text-sm border-collapse border border-slate-300 text-black">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 border border-slate-300">ID</th>
                    <th className="p-3 border border-slate-300">Teacher Name</th>
                    <th className="p-3 border border-slate-300">Date</th>
                    <th className="p-3 border border-slate-300">Time</th>
                    <th className="p-3 border border-slate-300 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((d, i) => (
                    <tr key={i}>
                      <td className="p-3 border border-slate-300">{d.teacherId}</td>
                      <td className="p-3 border border-slate-300">{d.name}</td>
                      <td className="p-3 border border-slate-300">{new Date(d.date).toLocaleDateString('en-US')}</td>
                      <td className="p-3 border border-slate-300">{d.time || "--:--:--"}</td>
                      <td className={`p-3 border border-slate-300 text-center font-black ${d.status === 'P' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {d.status === 'P' ? 'P' : 'A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}