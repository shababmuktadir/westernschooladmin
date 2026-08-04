import React, { useState, useEffect } from "react";
import { checkSmsBalance, sendSMS } from "../services/smsService";
import { getStudents } from "@/features/students/services/studentService"; 
import { format } from "date-fns";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase"; 
import Dropdown from "@/components/ui/Dropdown";
import { BellRing } from "lucide-react";

// Helper function to safely match IDs (ignores leading zeros and type differences)
const isIdMatch = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1).replace(/^0+/, '') === String(id2).replace(/^0+/, '');
};

export default function AttendanceSmsPage() {
  const [activeTab, setActiveTab] = useState("absent");
  const [balance, setBalance] = useState("Loading...");
  const [students, setStudents] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState({ total: 0, success: 0, failed: 0 });

  const todayDate = format(new Date(), "dd MMM, yyyy");
  const currentDayName = format(new Date(), "EEEE"); // Gets current day, e.g., "Tuesday"

  const [selectedIds, setSelectedIds] = useState([]);

  const [quickClass, setQuickClass] = useState("");
  const [quickId, setQuickId] = useState("");

  const [parsedTxtData, setParsedTxtData] = useState([]);
  const [fileError, setFileError] = useState("");

  // Customizable Fixed Recipients State
  const [fixedContact1, setFixedContact1] = useState({ name: "Shabab", phone: "01632426210" });
  const [fixedContact2, setFixedContact2] = useState({ name: "Fahad", phone: "01674785990" });

  useEffect(() => {
    fetchBalance();
    fetchStudents();
  }, []);

  const fetchBalance = async () => {
    setBalance("...");
    const bal = await checkSmsBalance();
    setBalance(bal);
  };

  const fetchStudents = async () => {
    try {
      const data = await getStudents(); 
      setStudents(data || []);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  const classOptions = Array.from(new Set(students.map(s => s.class).filter(Boolean)));

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(students.map(s => s.studentId));
    else setSelectedIds([]);
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(item => item !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleSendAbsentSMS = async () => {
    if (selectedIds.length === 0) return alert("Please select at least one student.");
    if (!window.confirm(`Send Absent SMS to ${selectedIds.length} students?`)) return;

    setIsSending(true);
    let successCount = 0, failCount = 0;

    for (const id of selectedIds) {
      const student = students.find(s => isIdMatch(s.studentId, id));
      if (student && student.contactNumber) {
        const msg = `Dear Guardian, your child ${student.fullName || ""} (ID: ${student.studentId || ""}) is absent from school today (${todayDate}). Please take necessary steps. - Western School`;
        const res = await sendSMS(student.contactNumber, msg);
        res.success ? successCount++ : failCount++;
      } else {
        failCount++;
      }
    }

    setResults({ total: selectedIds.length, success: successCount, failed: failCount });
    setIsSending(false);
    setSelectedIds([]);
    fetchBalance();
    alert(`SMS Complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
  };

  const handleQuickPresentSMS = async () => {
    if (!quickClass || !quickId) return alert("Please enter both Class and ID/Roll.");
    
    const student = students.find(s => 
      s.class === quickClass && 
      (isIdMatch(s.studentId, quickId) || isIdMatch(s.rollNumber, quickId))
    );

    if (!student) return alert("No student found with this Class and ID/Roll!");
    if (!student.contactNumber) return alert("This student has no contact number registered.");

    setIsSending(true);
    const msg = `Dear Guardian, your child ${student.fullName} (ID: ${student.studentId}) is PRESENT at school today (${todayDate}). - Western School`;
    
    const res = await sendSMS(student.contactNumber, msg);
    setIsSending(false);
    fetchBalance();

    if (res.success) {
      alert(`Present SMS successfully sent to ${student.fullName}!`);
      setQuickId("");
    } else {
      alert("Failed to send SMS.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n');
        const extractedData = [];

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const extractedId = parts[0];
            const extractedDate = parts[1];
            const extractedTime = parts[2];
            
            if (extractedDate.includes('-') && extractedTime.includes(':')) {
              extractedData.push({
                studentId: extractedId,
                date: extractedDate,
                time: extractedTime,
              });
            }
          }
        });

        if (extractedData.length === 0) {
          setFileError("Could not extract valid data. Please check the file format.");
        } else {
          setFileError("");
          setParsedTxtData(extractedData);
        }
      } catch (err) {
        setFileError("Failed to read the file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSendBulkPresentSMS = async () => {
    if (parsedTxtData.length === 0) return alert("No valid data to process.");
    if (!window.confirm(`Are you sure you want to send Present SMS to ${parsedTxtData.length} entries?`)) return;

    setIsSending(true);
    let successCount = 0, failCount = 0;

    // 1. Send SMS to all matched students
    for (const record of parsedTxtData) {
      const student = students.find(s => isIdMatch(s.studentId, record.studentId));
      if (student && student.contactNumber) {
        const msg = `Dear Guardian, your child ${student.fullName} has entered the school premises at ${record.time} on ${record.date}. - Western School`;
        const res = await sendSMS(student.contactNumber, msg);
        res.success ? successCount++ : failCount++;
      } else {
        failCount++;
      }
    }

    // 2. Send Fixed SMS to specific numbers (Customizable from UI)
    const fixedNumbers = [fixedContact1, fixedContact2].filter(c => c.phone && c.phone.trim() !== "");
    const fixedMsg = `Day: ${currentDayName}, Time: 8:50 am, Message: nba.`;

    for (const admin of fixedNumbers) {
      try {
        await sendSMS(admin.phone, fixedMsg);
      } catch (adminErr) {
        console.warn(`Failed to send fixed SMS to ${admin.name}`, adminErr);
      }
    }

    // 3. Save logs to Firestore
    try {
      await setDoc(doc(db, "attendance_logs", "latest_txt_upload"), {
        uploadedAt: new Date().toISOString(),
        totalProcessed: parsedTxtData.length,
        records: parsedTxtData
      });
    } catch (dbError) {
      console.error("Failed to save to Firestore:", dbError);
    }

    setResults({ total: parsedTxtData.length, success: successCount, failed: failCount });
    setIsSending(false);
    setParsedTxtData([]); 
    fetchBalance();
    alert(`Bulk Present SMS Complete!\nSuccess: ${successCount}\nFailed: ${failCount}\n\nFixed SMS sent to admins.\nLog saved to Firestore.`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Smart Attendance SMS</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage daily attendance notifications effortlessly</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-semibold">
            Balance: ৳ {balance}
          </div>
          <button onClick={fetchBalance} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-sm font-medium transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {results.total > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex justify-around">
          <div className="text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Total Tried</p><p className="font-bold text-lg text-blue-700 dark:text-blue-400">{results.total}</p></div>
          <div className="text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Success</p><p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{results.success}</p></div>
          <div className="text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Failed</p><p className="font-bold text-lg text-red-600 dark:text-red-400">{results.failed}</p></div>
        </div>
      )}

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab("absent")} className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === "absent" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          1. Manual Absent SMS
        </button>
        <button onClick={() => setActiveTab("quick")} className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === "quick" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          2. Quick Present SMS
        </button>
        <button onClick={() => setActiveTab("bulk")} className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === "bulk" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          3. TXT Bulk Present SMS
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
        
        {/* --- MANUAL ABSENT SMS --- */}
        {activeTab === "absent" && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Student List</h3>
              <button 
                onClick={handleSendAbsentSMS}
                disabled={selectedIds.length === 0 || isSending}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${selectedIds.length === 0 || isSending ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
              >
                {isSending ? "Sending..." : `Send ABSENT SMS to ${selectedIds.length}`}
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === students.length && students.length > 0} className="w-4 h-4 rounded text-blue-600" /></th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">ID / Roll</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Class</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {students.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3"><input type="checkbox" checked={selectedIds.includes(student.studentId)} onChange={() => handleSelect(student.studentId)} className="w-4 h-4 rounded text-blue-600" /></td>
                      <td className="p-3 text-slate-800 dark:text-slate-200">{student.studentId} / {student.rollNumber}</td>
                      <td className="p-3 text-slate-800 dark:text-slate-200">{student.fullName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{student.class}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{student.contactNumber || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- QUICK PRESENT SMS --- */}
        {activeTab === "quick" && (
          <div className="max-w-md mx-auto py-8 animate-in fade-in">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-6 text-center">Send Instant Present SMS</h3>
            <div className="space-y-5">
              
              <div className="relative z-20">
                <Dropdown 
                  label="Select Class"
                  options={classOptions}
                  value={quickClass}
                  onChange={(val) => setQuickClass(val)}
                  placeholder="-- Choose Class --"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Student ID or Roll</label>
                <input 
                  type="text" 
                  value={quickId}
                  onChange={(e) => setQuickId(e.target.value)}
                  placeholder="e.g. 100405 or 12"
                  className="block w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <button 
                onClick={handleQuickPresentSMS}
                disabled={!quickClass || !quickId || isSending}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all"
              >
                {isSending ? "Sending..." : "Send PRESENT SMS"}
              </button>
            </div>
          </div>
        )}

        {/* --- TXT BULK PRESENT SMS --- */}
        {activeTab === "bulk" && (
          <div className="animate-in fade-in py-4">
            
            {/* Custom Fixed Recipients Settings */}
            <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-blue-500" />
                Additional Recipients (Fixed Notification)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient 1</label>
                  <div className="flex gap-2">
                    <input type="text" value={fixedContact1.name} onChange={e => setFixedContact1({...fixedContact1, name: e.target.value})} placeholder="Name" className="w-1/3 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-sm text-slate-900 dark:text-white" />
                    <input type="text" value={fixedContact1.phone} onChange={e => setFixedContact1({...fixedContact1, phone: e.target.value})} placeholder="Phone Number" className="w-2/3 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-sm text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient 2</label>
                  <div className="flex gap-2">
                    <input type="text" value={fixedContact2.name} onChange={e => setFixedContact2({...fixedContact2, name: e.target.value})} placeholder="Name" className="w-1/3 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-sm text-slate-900 dark:text-white" />
                    <input type="text" value={fixedContact2.phone} onChange={e => setFixedContact2({...fixedContact2, phone: e.target.value})} placeholder="Phone Number" className="w-2/3 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-sm text-slate-900 dark:text-white" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 font-mono bg-white dark:bg-[#0f172a] p-2 rounded-md border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-blue-500">Preview:</span> Day: {currentDayName}, Time: 8:50 am, Message: nba.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 bg-slate-50 dark:bg-slate-800/20 mb-6">
              <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium text-center">
                Upload your Machine generated TXT file here. <br/>
                <span className="text-xs font-normal">Format expected: [ID] [Date] [Time] ...</span>
              </p>
              <input 
                type="file" 
                accept=".txt" 
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 cursor-pointer"
              />
              {fileError && <p className="text-red-500 text-sm mt-3">{fileError}</p>}
            </div>

            {parsedTxtData.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Extracted Records ({parsedTxtData.length})</h3>
                  <button 
                    onClick={handleSendBulkPresentSMS}
                    disabled={isSending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium disabled:bg-slate-400 transition-colors shadow-sm"
                  >
                    {isSending ? "Processing..." : "Save to DB & Send SMS"}
                  </button>
                </div>
                
                <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Extracted ID</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Time</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">System Match (Phone)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {parsedTxtData.map((record, index) => {
                        const matchedStudent = students.find(s => isIdMatch(s.studentId, record.studentId));
                        return (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{record.studentId}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{record.date}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{record.time}</td>
                            <td className="p-3">
                              {matchedStudent ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{matchedStudent.fullName} ({matchedStudent.contactNumber || "No Num"})</span>
                              ) : (
                                <span className="text-red-500 font-medium">Unregistered ID</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}