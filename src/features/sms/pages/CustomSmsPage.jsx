import React, { useState, useEffect } from "react";
import { getStudents } from "@/features/students/services/studentService";
import { sendSMS, checkSmsBalance } from "../services/smsService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Checkbox from "@/components/ui/Checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

export default function CustomSmsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await getStudents();
    setStudents(data);
    setFilteredStudents(data);
  };

  // Filter by class
  useEffect(() => {
    if (classFilter) {
      setFilteredStudents(students.filter(s => s.class === classFilter));
    } else {
      setFilteredStudents(students);
    }
  }, [classFilter, students]);

  // Handle Checkbox
  const handleSelect = (phone, isChecked) => {
    if (isChecked) {
      setSelectedNumbers(prev => [...prev, phone]);
    } else {
      setSelectedNumbers(prev => prev.filter(n => n !== phone));
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allPhones = filteredStudents.map(s => s.phone).filter(Boolean);
      setSelectedNumbers(allPhones);
    } else {
      setSelectedNumbers([]);
    }
  };

  const handleSendCustomSMS = async () => {
    if (selectedNumbers.length === 0) return alert("কোনো নাম্বার সিলেক্ট করা হয়নি!");
    if (!message.trim()) return alert("মেসেজ খালি রাখা যাবে না!");

    setIsLoading(true);
    let successCount = 0;
    
    // API Call in Loop (Or bulk comma separated if API supports)
    // As per your API format, comma separation might work: number=88017..,88018..
    const bulkNumbers = selectedNumbers.join(",");
    
    try {
       await sendSMS(bulkNumbers, message);
       alert("সফলভাবে মেসেজ পাঠানো হয়েছে!");
       setMessage("");
       setSelectedNumbers([]);
    } catch(err) {
       alert("মেসেজ পাঠাতে সমস্যা হয়েছে!");
    } finally {
       setIsLoading(false);
    }
  };

  // Unique Classes for Dropdown
  const classOptions = [{ label: "All Classes", value: "" }, ...Array.from(new Set(students.map(s => s.class))).map(c => ({ label: c, value: c }))];

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Filter & List */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Select Recipients</CardTitle>
            <div className="w-48">
              <Select 
                options={classOptions} 
                value={classFilter} 
                onChange={(e) => setClassFilter(e.target.value)} 
                placeholder="Filter by Class"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedNumbers.length === filteredStudents.length && filteredStudents.length > 0} 
                        onChange={(e) => handleSelectAll(e.target.checked)} 
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedNumbers.includes(s.phone)} 
                          onChange={(e) => handleSelect(s.phone, e.target.checked)}
                          disabled={!s.phone}
                        />
                      </TableCell>
                      <TableCell>{s.studentId}</TableCell>
                      <TableCell>{s.fullName}</TableCell>
                      <TableCell>{s.class}</TableCell>
                      <TableCell>{s.phone || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Message Box */}
      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Draft Message</CardTitle>
            <p className="text-xs text-slate-500">Selected Recipients: {selectedNumbers.length}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              label="Type your message" 
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="E.g. Tomorrow is a public holiday..."
            />
            <p className="text-xs text-slate-400">Characters: {message.length} ({(message.length/160).toFixed(1)} SMS)</p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={handleSendCustomSMS}
              isLoading={isLoading}
              disabled={selectedNumbers.length === 0 || !message.trim()}
            >
              Send SMS to {selectedNumbers.length} numbers
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}