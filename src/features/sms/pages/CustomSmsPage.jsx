import React, { useState, useEffect } from "react";
import { checkSmsBalance, sendSMS } from "../services/smsService";
import { getStudents } from "@/features/students/services/studentService"; 
import Dropdown from "@/components/ui/Dropdown";

export default function CustomSmsPage() {
  const [balance, setBalance] = useState("Loading...");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedPhones, setSelectedPhones] = useState([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState({ total: 0, success: 0, failed: 0 });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");

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
      setFilteredStudents(data || []);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  useEffect(() => {
    let result = students;
    if (classFilter) {
      result = result.filter(s => s.class === classFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.fullName && s.fullName.toLowerCase().includes(lower)) ||
        (s.studentId && s.studentId.toLowerCase().includes(lower)) ||
        (s.rollNumber && String(s.rollNumber).toLowerCase().includes(lower)) ||
        (s.contactNumber && s.contactNumber.includes(lower))
      );
    }
    setFilteredStudents(result);
  }, [searchTerm, classFilter, students]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const validPhones = filteredStudents.map(s => s.contactNumber).filter(Boolean);
      setSelectedPhones([...new Set(validPhones)]);
    } else {
      setSelectedPhones([]);
    }
  };

  const handleSelect = (phone) => {
    if (!phone) return;
    if (selectedPhones.includes(phone)) {
      setSelectedPhones(selectedPhones.filter(p => p !== phone));
    } else {
      setSelectedPhones([...selectedPhones, phone]);
    }
  };

  const handleSendSMS = async () => {
    if (selectedPhones.length === 0) return alert("Please select at least one student.");
    if (!message.trim()) return alert("Message cannot be empty.");
    
    const confirm = window.confirm(`Are you sure you want to send this custom SMS to ${selectedPhones.length} numbers?`);
    if (!confirm) return;

    setIsSending(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const phone of selectedPhones) {
      const res = await sendSMS(phone, message);
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setResults({ total: selectedPhones.length, success: successCount, failed: failCount });
    setIsSending(false);
    fetchBalance();
    
    if (successCount > 0) {
      alert(`SMS Sending Complete!\nSuccessfully sent to ${successCount} numbers.`);
      setMessage("");
      setSelectedPhones([]);
    } else {
      alert(`Failed to send SMS to ${failCount} numbers. Please check your balance or gateway.`);
    }
  };

  const charCount = message.length;
  const isUnicode = /[^\u0000-\u00ff]/.test(message);
  const smsLimit = isUnicode ? 70 : 160;
  const smsParts = charCount > 0 ? Math.ceil(charCount / smsLimit) : 0;
  
  const classOptions = Array.from(new Set(students.map(s => s.class).filter(Boolean)));
  
  const dropdownOptions = [
    { label: "All Classes", value: "" },
    ...classOptions.map(c => ({ label: c, value: c }))
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Custom Bulk SMS</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Write custom message and send to specific students</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center relative z-20">
            <input 
              type="text" 
              placeholder="Search name, ID, roll, phone..." 
              className="w-full md:flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className="w-full md:w-56">
              <Dropdown 
                options={dropdownOptions}
                value={classFilter}
                onChange={(val) => setClassFilter(val)}
                placeholder="All Classes"
                fullWidth={true}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white">Select Students</h3>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{selectedPhones.length} selected</span>
            </div>
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 w-12">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={selectedPhones.length > 0 && selectedPhones.length === filteredStudents.filter(s => s.contactNumber).length} 
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">ID / Roll</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Class</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          disabled={!s.contactNumber}
                          checked={selectedPhones.includes(s.contactNumber)} 
                          onChange={() => handleSelect(s.contactNumber)}
                          className="w-4 h-4 rounded text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200">{s.studentId} / {s.rollNumber}</td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{s.fullName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{s.class}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {s.contactNumber ? (
                          s.contactNumber
                        ) : (
                          <span className="text-red-400 text-xs font-medium">No Number</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">No students found based on filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sticky top-6">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">Draft Message</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Write your message below (Max 300 chars).</p>
            
            <textarea 
              rows="8"
              maxLength={300}
              className="w-full p-4 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-colors"
              placeholder="Start typing your message in Bangla or English..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            
            <div className="flex justify-between items-center text-xs font-medium mt-2 mb-6">
              <span className={`${isUnicode ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}`}>
                Encoding: {isUnicode ? "Unicode (Bangla)" : "Text (English)"}
              </span>
              <span className={`${charCount >= 300 ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                {charCount}/300 chars | {smsParts} SMS/person
              </span>
            </div>

            <button 
              onClick={handleSendSMS}
              disabled={selectedPhones.length === 0 || !message.trim() || isSending}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-sm ${
                selectedPhones.length === 0 || !message.trim() || isSending 
                  ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
              }`}
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Sending...
                </span>
              ) : (
                `Send to ${selectedPhones.length} selected`
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}