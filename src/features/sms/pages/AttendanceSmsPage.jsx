import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkSmsBalance, saveTxtUpload, updateAttendanceRecord, sendSMS } from "../services/smsService";
import { getStudents } from "@/features/students/services/studentService"; // Assuming you have this
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { MessageSquare, UploadCloud, RefreshCw, Trash2, Send } from "lucide-react";

export default function AttendanceSmsPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState("Loading...");
  const [parsedData, setParsedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);

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
    const data = await getStudents();
    setStudents(data);
  };

  // TXT File (Tab Separated) Parser
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      
      const data = lines.map(line => {
        // Tab (\t) separated values
        const parts = line.split("\t"); 
        // Assuming format: ID  Date  Time (e.g. 1001 \t 2026-07-18 \t 09:15 AM)
        return {
          id: parts[0]?.trim(),
          date: parts[1]?.trim(),
          time: parts[2]?.trim(),
        };
      });
      setParsedData(data);
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    setParsedData([]);
    document.getElementById("txtUpload").value = "";
  };

  const processAndSendSMS = async () => {
    if (parsedData.length === 0) return alert("কোনো ডেটা নেই!");
    setIsLoading(true);

    try {
      // 1. Overwrite TXT collection
      await saveTxtUpload(parsedData);
      
      // 2. Append Attendance Record
      await updateAttendanceRecord(parsedData);

      // 3. Send SMS to all matched IDs
      let successCount = 0;
      for (let record of parsedData) {
        const student = students.find(s => String(s.studentId) === String(record.id));
        if (student && student.phone) {
          const msg = `Dear Guardian, your child ${student.fullName} has entered the school premises at ${record.time} on ${record.date}. Western School.`;
          await sendSMS(student.phone, msg);
          successCount++;
        }
      }

      alert(`সফলভাবে ডেটা সেভ হয়েছে এবং ${successCount} টি SMS পাঠানো হয়েছে!`);
      clearData();
      fetchBalance();
    } catch (error) {
      console.error(error);
      alert("কোথাও কোনো সমস্যা হয়েছে!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header & Balance */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Attendance SMS Auto-Sender</h2>
          <p className="text-sm text-slate-500">আপলোড করা TXT ফাইল থেকে অ্যাটেন্ডেন্স সেভ এবং SMS সেন্ড করুন</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-semibold flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Balance: {balance}
          </div>
          <Button variant="outline" onClick={fetchBalance}><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => navigate("/custom-sms")} className="bg-purple-600 hover:bg-purple-700">
            <Send className="w-4 h-4 mr-2" /> Send Specific SMS
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>আপলোড অ্যাটেন্ডেন্স ফাইল (.txt)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input 
              id="txtUpload" 
              type="file" 
              accept=".txt" 
              onChange={handleFileUpload}
              className="max-w-sm"
            />
            {parsedData.length > 0 && (
              <>
                <Button onClick={processAndSendSMS} isLoading={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  <UploadCloud className="w-4 h-4 mr-2" /> Save Attendance & Send SMS
                </Button>
                <Button variant="outline" onClick={clearData} className="text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>ডেটা প্রিভিউ ({parsedData.length} Records)</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student/Teacher ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold">{row.id}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-emerald-600">{row.time}</TableCell>
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