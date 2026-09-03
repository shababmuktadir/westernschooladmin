import React, { useState, useEffect, useRef } from "react";
import GlassDatePicker from "@/components/ui/GlassDatePicker";
import { ChevronDown, Loader2, FileText, Users, User, Users2, Clock, MapPin, Edit3 } from "lucide-react";

const CLASS_OPTIONS = [
  "Play", "Nursery", "KG", "Class 1", "Class 2", "Class 3", 
  "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

export default function AdmitCardForm({ onSubmit, isLoading }) {
  const currentYear = new Date().getFullYear();
  
  // Default Exam Options with Dynamic Year
  const defaultExamOptions = [
    `1st Term Examination ${currentYear}`,
    `2nd Term Examination ${currentYear}`,
    `Annual Examination ${currentYear}`
  ];

  // Form States (Strictly matched with useAdmitCard hooks)
  const [generateType, setGenerateType] = useState("class"); // 'class', 'single', 'custom'
  
  const [targetClass, setTargetClass] = useState("");
  const [studentId, setStudentId] = useState("");
  const [customIds, setCustomIds] = useState("");
  
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("10:00 AM - 01:00 PM");
  const [examCenter, setExamCenter] = useState("Main Campus");

  // Dropdown States & Refs
  const [showExamOptions, setShowExamOptions] = useState(false);
  const examRef = useRef(null);

  const [showClassOptions, setShowClassOptions] = useState(false);
  const classRef = useRef(null);

  // Local Storage Logic for Exam Name
  useEffect(() => {
    const savedExam = localStorage.getItem("savedExamName");
    if (savedExam) {
      setExamName(savedExam);
    } else {
      setExamName(defaultExamOptions[0]);
      localStorage.setItem("savedExamName", defaultExamOptions[0]);
    }
  }, []);

  // Outside Click Detector for Custom Dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (examRef.current && !examRef.current.contains(e.target)) {
        setShowExamOptions(false);
      }
      if (classRef.current && !classRef.current.contains(e.target)) {
        setShowClassOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers for Exam Name
  const handleExamSelect = (val) => {
    setExamName(val);
    localStorage.setItem("savedExamName", val);
    setShowExamOptions(false);
  };

  const handleExamChange = (e) => {
    setExamName(e.target.value);
    localStorage.setItem("savedExamName", e.target.value);
  };

  // Submit Handler (Mapped precisely to your original logic)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      examName,
      examDate,
      examTime,
      examCenter,
    };

    if (generateType === "class") {
      submitData.targetClass = targetClass;
    } else if (generateType === "single") {
      submitData.studentId = studentId;
    } else if (generateType === "custom") {
      submitData.selectedStudentIds = customIds
        .split(",")
        .map(id => id.trim())
        .filter(id => id !== "");
    }

    onSubmit(submitData);
  };

  // Validation
  const isFormValid = () => {
    if (!examName || !examDate || !examCenter) return false;
    if (generateType === 'class' && !targetClass) return false;
    if (generateType === 'single' && !studentId) return false;
    if (generateType === 'custom' && !customIds) return false;
    return true;
  };

  // Common Input Class (Dark Theme matched with your image)
  const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder:text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="bg-[#0f172a] p-6 md:p-8 rounded-xl shadow-lg border border-slate-800">
      
      {/* --- Top Radio Buttons --- */}
      <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-slate-800 pb-6">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="radio" 
            name="generateType" 
            value="class" 
            checked={generateType === "class"} 
            onChange={(e) => setGenerateType(e.target.value)}
            className="w-4 h-4 text-blue-500 bg-slate-800 border-slate-700 focus:ring-blue-600 focus:ring-offset-slate-900"
          />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">পুরো ক্লাস</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="radio" 
            name="generateType" 
            value="single" 
            checked={generateType === "single"} 
            onChange={(e) => setGenerateType(e.target.value)}
            className="w-4 h-4 text-blue-500 bg-slate-800 border-slate-700 focus:ring-blue-600 focus:ring-offset-slate-900"
          />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">নির্দিষ্ট শিক্ষার্থী (Single ID)</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="radio" 
            name="generateType" 
            value="custom" 
            checked={generateType === "custom"} 
            onChange={(e) => setGenerateType(e.target.value)}
            className="w-4 h-4 text-blue-500 bg-slate-800 border-slate-700 focus:ring-blue-600 focus:ring-offset-slate-900"
          />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">বাছাইকৃত একাধিক (Custom IDs)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* --- Column 1: Dynamic Target Input based on Radio --- */}
        <div className="relative z-50">
          
          {generateType === 'class' && (
            <div className="relative" ref={classRef}>
              <label className="block text-sm font-medium text-slate-300 mb-2">Class Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowClassOptions(!showClassOptions)}
                  className={`${inputClass} flex items-center justify-between text-left`}
                >
                  <span className={targetClass ? "text-slate-200" : "text-slate-500"}>
                    {targetClass || "Select Class"}
                  </span>
                </button>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-200 pointer-events-none ${showClassOptions ? "rotate-180" : ""}`} />
              </div>

              {/* Custom Dropdown Options for Class */}
              {showClassOptions && (
                <div className="absolute z-50 mt-2 w-full py-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl animate-in zoom-in-95 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Class</div>
                  {CLASS_OPTIONS.map(c => (
                    <button 
                      key={c} 
                      type="button" 
                      onClick={() => {
                        setTargetClass(c);
                        setShowClassOptions(false);
                      }} 
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${targetClass === c ? "bg-blue-600 text-white font-medium" : "text-slate-300 hover:bg-slate-700"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {generateType === 'single' && (
            <>
              <label className="block text-sm font-medium text-slate-300 mb-2">Student ID <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. S-101"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {generateType === 'custom' && (
            <>
              <label className="block text-sm font-medium text-slate-300 mb-2">Student IDs (Comma Separated) <span className="text-red-500">*</span></label>
              <div className="relative">
                <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customIds}
                  onChange={(e) => setCustomIds(e.target.value)}
                  placeholder="e.g. S-101, S-105"
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>

        {/* --- Column 2: Editable Exam Name --- */}
        <div className="relative z-40" ref={examRef}>
          <label className="block text-sm font-medium text-slate-300 mb-2">Exam Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={examName}
              onChange={handleExamChange}
              onFocus={() => setShowExamOptions(true)}
              placeholder={`e.g. 1st Term Examination ${currentYear}`}
              className={inputClass}
            />
            <button 
              type="button" 
              onClick={() => setShowExamOptions(!showExamOptions)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-500 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExamOptions ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showExamOptions && (
            <div className="absolute z-50 mt-2 w-full p-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl animate-in zoom-in-95 duration-200">
              {defaultExamOptions.map(opt => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => handleExamSelect(opt)} 
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${examName === opt ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- Column 3: Starting Date (GlassDatePicker) --- */}
        <div className="relative z-30">
          <GlassDatePicker 
            label={<span>Starting Date <span className="text-red-500">*</span></span>}
            value={examDate}
            onChange={setExamDate}
            placeholder="Select Exam Date"
          />
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* --- Time (Optional) --- */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-2">Time (Optional)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
              placeholder="e.g. 10:00 AM - 01:00 PM"
              className={inputClass}
            />
          </div>
        </div>

        {/* --- Exam Center --- */}
        <div className="relative md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">Exam Center <span className="text-red-500">*</span></label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={examCenter}
              onChange={(e) => setExamCenter(e.target.value)}
              placeholder="e.g. Main Campus"
              className={inputClass}
            />
          </div>
        </div>

      </div>

      {/* --- Submit Button --- */}
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={isLoading || !isFormValid()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
          {isLoading ? "Generating..." : "Generate Admit Cards"}
        </button>
      </div>

    </form>
  );
}