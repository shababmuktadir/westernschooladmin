import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { getStudents } from "@/features/students/services/studentService";
import { generateNextInvoiceNo, getStudentPaidMonths, saveStudentFee } from "@/features/fee/services/feeService";
import InvoiceTemplate from "@/templates/pdf/InvoiceTemplate";
import { pdf } from "@react-pdf/renderer";
import { appConfig } from "@/config/appConfig";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import GlassDatePicker from "@/components/ui/GlassDatePicker"; // নতুন Glass Date Picker

import { Search, User, FileText, CheckCircle2, Calculator, Receipt, CreditCard, UploadCloud } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const FEE_TYPES = [
  "Tuition fee", "Admission fee", "Re-admission fee", 
  "Exam fee", "Computer fee", "Sports fee", "TC fee", "Misc"
];

const PAYMENT_OPTIONS = [
  { label: "Bank", value: "Bank" },
  { label: "Cash", value: "Cash" },
  { label: "Bkash", value: "Bkash" },
  { label: "Nagad", value: "Nagad" },
  { label: "Rocket", value: "Rocket" }
];

export default function FeeEntry() {
  const navigate = useNavigate(); 
  
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paidMonths, setPaidMonths] = useState([]);
  
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [monthFees, setMonthFees] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("Bank");
  const [remarks, setRemarks] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await getStudents();
      setStudents(data.filter(s => s.status !== "Inactive"));
    };
    fetchStudents();
    getInvoiceNo();
  }, []);

  const getInvoiceNo = async () => {
    const nextNo = await generateNextInvoiceNo();
    setInvoiceNo(nextNo);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStudents = students.filter(student => 
    student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.studentId} - ${student.fullName}`);
    setIsDropdownOpen(false);
    setGeneratedInvoice(null);
    
    const pastPaidMonths = await getStudentPaidMonths(student.studentId);
    setPaidMonths(pastPaidMonths);
    setSelectedMonths([]);
    setMonthFees({});
  };

  const toggleMonth = (month) => {
    if (paidMonths.includes(month)) return;
    
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        const newSelected = prev.filter(m => m !== month);
        const newMonthFees = { ...monthFees };
        delete newMonthFees[month];
        setMonthFees(newMonthFees);
        return newSelected;
      } else {
        setMonthFees(prevFees => ({
          ...prevFees,
          [month]: {
            amounts: {} 
          }
        }));
        return [...prev, month];
      }
    });
  };

  const handleMonthFeeAmountChange = (month, feeType, val) => {
    setMonthFees(prev => {
      const currentMonth = prev[month] || { amounts: {} };
      return {
        ...prev,
        [month]: {
          ...currentMonth,
          amounts: { ...currentMonth.amounts, [feeType]: val }
        }
      };
    });
  };

  let aggregatedFees = {};
  let grandTotal = 0;

  selectedMonths.forEach(month => {
    const monthData = monthFees[month] || { amounts: {} };
    FEE_TYPES.forEach(fee => {
      const amount = Number(monthData.amounts[fee]) || 0;
      if (amount > 0) {
        aggregatedFees[fee] = (aggregatedFees[fee] || 0) + amount;
        grandTotal += amount;
      }
    });
  });

  const handleSubmit = async () => {
    if (!selectedStudent) return alert("দয়া করে শিক্ষার্থী নির্বাচন করুন।");
    if (selectedMonths.length === 0) return alert("অন্তত একটি মাস নির্বাচন করুন।");
    if (grandTotal <= 0) return alert("কোনো ফি এর পরিমাণ দেওয়া হয়নি।");

    let finalInvoiceNo = invoiceNo;
    if (!finalInvoiceNo || finalInvoiceNo.trim() === "") {
      finalInvoiceNo = await generateNextInvoiceNo();
      setInvoiceNo(finalInvoiceNo);
    }

    setIsSubmitting(true);
    try {
      const currentPaidMonths = await getStudentPaidMonths(selectedStudent.studentId);
      const duplicateFound = selectedMonths.some(m => currentPaidMonths.includes(m));
      
      if (duplicateFound) {
        alert("এই শিক্ষার্থীর নির্বাচিত কিছু মাসের ফি ইতিমধ্যে জমা দেওয়া হয়েছে।");
        setIsSubmitting(false);
        return;
      }

      const feeData = {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.fullName,
        class: selectedStudent.class || "",
        roll: selectedStudent.roll || "",
        section: selectedStudent.section || "",
        invoiceNo: finalInvoiceNo,
        memoNo: finalInvoiceNo,
        invoiceDate: invoiceDate,
        selectedMonths: selectedMonths,
        paymentMethod: paymentMethod,
        feeDetails: aggregatedFees, 
        monthWiseDetails: monthFees, 
        grandTotal: grandTotal,
        remarks: remarks,
      };

      const savedDoc = await saveStudentFee(feeData);
      setGeneratedInvoice(savedDoc.data);
      setInvoiceNo(await generateNextInvoiceNo()); 
      
      setSelectedMonths([]);
      setMonthFees({});
      setRemarks("");

    } catch (error) {
      console.error(error);
      alert("ডেটা সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    if (!generatedInvoice) return;
    try {
      const blob = await pdf(<InvoiceTemplate data={generatedInvoice} schoolConfig={appConfig} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${generatedInvoice.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("PDF জেনারেট করতে সমস্যা হচ্ছে। ডেটা ঠিক আছে কিনা যাচাই করুন।");
    }
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Receipt className="w-6 h-6 mr-2 text-blue-600" /> ফি এন্ট্রি (Fee Entry)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ম্যানুয়াল এন্ট্রির মাধ্যমে ফি গ্রহণ করুন অথবা বাল্ক ইম্পোর্ট করুন।</p>
        </div>
        
        <div>
          <Button 
            variant="outline" 
            leftIcon={<UploadCloud className="w-4 h-4" />}
            onClick={() => navigate('/fee/bulk-import')}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30 shadow-sm"
          >
            Bulk Fee Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="relative overflow-visible" ref={dropdownRef}>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">শিক্ষার্থী খুঁজুন <span className="text-red-500">*</span></CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                leftIcon={<Search className="w-4 h-4" />}
                placeholder="নাম অথবা আইডি টাইপ করুন..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />

              {isDropdownOpen && (
                <div className="absolute z-50 mt-2 w-[calc(100%-3rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                  {filteredStudents.length > 0 ? (
                    <ul className="py-1">
                      {filteredStudents.map((student) => (
                        <li 
                          key={student.id} 
                          onClick={() => handleSelectStudent(student)}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mr-3">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{student.fullName}</p>
                            <p className="text-xs text-slate-500">ID: {student.studentId} • Class: {student.class}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-4 text-sm text-slate-500 text-center">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedStudent && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between w-full">
                    <span>মাস নির্বাচন করুন <span className="text-red-500">*</span></span>
                    {paidMonths.length > 0 && <Badge variant="success">{paidMonths.length} মাস পরিশোধিত</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {MONTHS.map(month => {
                      const isPaid = paidMonths.includes(month);
                      const isSelected = selectedMonths.includes(month);
                      return (
                        <button
                          key={month}
                          type="button"
                          onClick={() => toggleMonth(month)}
                          disabled={isPaid}
                          className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center
                            ${isPaid 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                              : isSelected 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
                            }`}
                        >
                          {isPaid && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                          {month.slice(0,3)}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {selectedMonths.length > 0 && (
                <Card className="overflow-visible">
                  <CardHeader>
                    <CardTitle className="text-base">মাস-ভিত্তিক ফি এর বিবরণ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 overflow-visible">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 mb-4 overflow-visible">
                      <div className="relative z-30">
                        <Input 
                          label="Invoice / Memo No (অটো জেনারেট)" 
                          value={invoiceNo} 
                          onChange={(e) => setInvoiceNo(e.target.value)} 
                          placeholder="e.g. WSC-000001"
                        />
                      </div>
                      
                      {/* --- GlassDatePicker Implemented Here --- */}
                      <div className="relative z-40">
                        <GlassDatePicker 
                          label="Invoice Date" 
                          value={invoiceDate} 
                          onChange={(date) => setInvoiceDate(date)} 
                        />
                      </div>
                    </div>

                    <Tabs defaultValue={selectedMonths[0]} className="w-full relative z-10">
                      <TabsList className="mb-4 flex-wrap h-auto p-1.5 bg-slate-100 dark:bg-slate-800">
                        {selectedMonths.map(month => (
                          <TabsTrigger key={`tab-${month}`} value={month} className="flex-1 min-w-[80px]">
                            {month}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {selectedMonths.map(month => (
                        <TabsContent key={`content-${month}`} value={month}>
                          <div className="space-y-3 p-1">
                            {FEE_TYPES.map(fee => {
                              const monthData = monthFees[month] || { amounts: {} };
                              const amount = monthData.amounts[fee] || "";

                              return (
                                <div key={`row-${month}-${fee}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 mb-2 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                      {fee}
                                    </span>
                                  </div>
                                  <div className="w-1/3 min-w-[120px]">
                                    <Input 
                                      type="number"
                                      placeholder="0.00"
                                      value={amount}
                                      onChange={(e) => handleMonthFeeAmountChange(month, fee, e.target.value)}
                                      className="text-right font-semibold"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>

                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="flex items-center text-slate-800 dark:text-white">
                <Calculator className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" /> সামারি (Summary)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 relative z-20">
              
              {Object.keys(aggregatedFees).length > 0 && (
                <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">All Months Total</p>
                  {Object.entries(aggregatedFees).map(([feeName, totalAmt]) => (
                    <div key={`summary-${feeName}`} className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                      <span>{feeName}:</span>
                      <span className="font-medium">৳ {totalAmt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-lg font-bold text-emerald-600 dark:text-emerald-400 pt-2">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span>৳ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Select 
                  label="পেমেন্ট মেথড" 
                  options={PAYMENT_OPTIONS}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <Textarea 
                  label="রিমার্কস (ঐচ্ছিক)"
                  placeholder="অতিরিক্ত কোনো নোট..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

            </CardContent>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 relative z-10">
              {!generatedInvoice ? (
                <Button
                  variant="primary"
                  className="w-full h-12 text-base font-bold shadow-lg shadow-blue-500/20"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!selectedStudent || grandTotal <= 0 || selectedMonths.length === 0}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                >
                  ইনভয়েস তৈরি করুন
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center justify-center font-medium">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> সফলভাবে জমা হয়েছে
                  </div>
                  <Button
                    onClick={downloadPDF}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
                    leftIcon={<FileText className="w-5 h-5" />}
                  >
                    ইনভয়েস ডাউনলোড (PDF)
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}