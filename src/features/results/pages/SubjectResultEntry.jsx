import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SubjectResultTemplate from "@/templates/pdf/SubjectResultTemplate";
import { getClassesAndSubjects, addSubjectToClass, removeSubjectFromClass, editSubjectInClass, initializeDefaultSubjects } from "../services/resultService";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, FileText, Settings, Download, Trophy, AlertCircle, CheckCircle2, Loader2, BookOpen, Plus, Edit2, Trash2, Check, X, Database } from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_CLASS_SUBJECTS = {
  "Play": ["Bengali", "English", "Math", "Drawing"],
  "Nursery": ["Bengali", "English", "Math", "Drawing", "Religion"],
  "KG": ["Bengali", "English", "Math", "General Knowledge", "Drawing", "Religion", "English Reading & Writing", "Bengali Reading & Writing", "Spoken English"],
  "Class 1": ["Bengali", "English", "Math", "General Knowledge", "Drawing", "Religion", "Bengali Reading & Writing", "English Reading & Writing", "Spoken English", "Computer"],
  "Class 2": ["Bengali", "English", "Math", "General Knowledge", "Drawing", "Religion", "English Reading & Writing", "Bengali Reading & Writing", "Spoken English", "Computer"],
  "Class 3": ["Bengali", "English 1st Paper", "English 2nd Paper", "Math", "Science", "BGS", "General Knowledge", "Drawing", "Religion", "English Reading & Writing", "Bengali Reading & Writing", "Spoken English", "Computer"],
  "Class 4": ["Bengali", "English 1st Paper", "English 2nd Paper", "Math", "Science", "BGS", "General Knowledge", "Drawing", "Religion", "Spoken English", "Computer"],
  "Class 5": ["Bengali", "English 1st Paper", "English 2nd Paper", "Math", "Science", "BGS", "General Knowledge", "Drawing", "Religion", "Spoken English", "Computer"]
};

export default function SubjectResultEntry() {
  const [activeTab, setActiveTab] = useState("entry"); 

  // Firebase Data States
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [students, setStudents] = useState([]);
  
  // Loading States
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form States (Result Entry)
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [fullMarks, setFullMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(33);
  const [enableTutorial, setEnableTutorial] = useState(false);
  const [marks, setMarks] = useState({});

  // Form States (Subject Manager)
  const [manageClass, setManageClass] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [editTargetSubject, setEditTargetSubject] = useState(null);
  const [editSubjectValue, setEditSubjectValue] = useState("");

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const { classList, subjectsMap } = await getClassesAndSubjects();
      setAvailableClasses(classList);
      setSubjectsMap(subjectsMap);
    } catch (error) {
      toast.error("কনফিগারেশন লোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Smart Filtering Logic for Students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || activeTab !== "entry") {
        setStudents([]);
        setMarks({});
        return;
      }
      setLoadingStudents(true);
      try {
        const snap = await getDocs(collection(db, "students"));
        let studentList = [];
        
        const selectedFormatted = selectedClass.toLowerCase().replace(/-/g, ' ').trim();

        snap.forEach(doc => { 
          const data = doc.data();
          if (data.class) {
            const dbClass = data.class.toString().toLowerCase().replace(/-/g, ' ').trim();
            if (dbClass === selectedFormatted || dbClass === selectedFormatted.replace('class ', '')) {
              studentList.push({ id: doc.id, ...data }); 
            }
          }
        });
        
        studentList.sort((a, b) => Number(a.roll || a.rollNumber || 0) - Number(b.roll || b.rollNumber || 0));
        
        setStudents(studentList);
        
        const initialMarks = {};
        studentList.forEach(s => { initialMarks[s.id] = { exam: "", tut: "" }; });
        setMarks(initialMarks);
      } catch (error) {
        toast.error("শিক্ষার্থীদের তথ্য লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
    setSelectedSubject(""); 
  }, [selectedClass, activeTab]);

  const handleMarkChange = (studentId, field, value) => {
    let numVal = value === "" ? "" : Number(value);
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: numVal } }));
  };

  const processedData = useMemo(() => {
    let highestMark = -1;
    let highestScorers = [];

    const data = students.map(student => {
      const studentMarks = marks[student.id] || { exam: 0, tut: 0 };
      const examVal = Number(studentMarks.exam) || 0;
      const tutVal = enableTutorial ? (Number(studentMarks.tut) || 0) : 0;
      const total = examVal + tutVal;
      const status = total >= passMarks ? "Pass" : "Fail";
      const name = student.name || student.studentName || student.fullName || "Unknown";

      if (total > highestMark) {
        highestMark = total;
        highestScorers = [name];
      } else if (total === highestMark && total > 0) {
        highestScorers.push(name);
      }

      return { ...student, name, roll: student.roll || student.rollNumber || "-", exam: examVal, tut: tutVal, total, status };
    });

    return { data, highestMark: highestMark === -1 ? 0 : highestMark, highestScorers };
  }, [students, marks, passMarks, enableTutorial]);

  // --- SHOW/HIDE DEFAULT INITIALIZATION BUTTON LOGIC ---
  const showInitButton = useMemo(() => {
    // Check if any default subject is missing in the database
    for (const className in DEFAULT_CLASS_SUBJECTS) {
      const defaultSubs = DEFAULT_CLASS_SUBJECTS[className];
      const dbSubs = subjectsMap[className] || [];
      for (const sub of defaultSubs) {
        if (!dbSubs.includes(sub)) return true; // Missing a subject, show the button
      }
    }
    return false; // All default subjects are fully present, hide the button
  }, [subjectsMap]);

  // --- SUBJECT MANAGEMENT LOGIC ---
  const handleSaveDefaults = async () => {
    if(!window.confirm("ডিফল্ট সাবজেক্ট লিস্ট ডাটাবেসে সেভ করতে চান? এটি আগের সমস্ত সাবজেক্ট ওভাররাইট করে ডিফল্ট লিস্ট সেভ করবে।")) return;
    try {
      toast.loading("ডাটাবেস আপডেট হচ্ছে...", { id: "init" });
      await initializeDefaultSubjects(DEFAULT_CLASS_SUBJECTS);
      await loadConfig();
      toast.success("ডিফল্ট লিস্ট সফলভাবে সেভ হয়েছে!", { id: "init" });
    } catch (err) {
      toast.error("ব্যর্থ হয়েছে!", { id: "init" });
    }
  };

  const handleAddSubject = async () => {
    if (!manageClass || !newSubject.trim()) return toast.error("ক্লাস এবং সাবজেক্টের নাম আবশ্যক!");
    try {
      toast.loading("যোগ করা হচ্ছে...", { id: "subj" });
      await addSubjectToClass(manageClass, newSubject.trim());
      await loadConfig();
      setNewSubject("");
      toast.success("সাবজেক্ট যোগ করা হয়েছে!", { id: "subj" });
    } catch (err) { toast.error("ব্যর্থ হয়েছে!", { id: "subj" }); }
  };

  const handleDeleteSubject = async (subject) => {
    if(!window.confirm(`আপনি কি "${subject}" ডিলিট করতে চান?`)) return;
    try {
      toast.loading("ডিলিট হচ্ছে...", { id: "subj" });
      await removeSubjectFromClass(manageClass, subject);
      await loadConfig();
      toast.success("সাবজেক্ট ডিলিট হয়েছে!", { id: "subj" });
    } catch (err) { toast.error("ব্যর্থ হয়েছে!", { id: "subj" }); }
  };

  const handleEditSubject = async () => {
    if (!editSubjectValue.trim()) return toast.error("নাম ফাঁকা রাখা যাবে না!");
    try {
      toast.loading("আপডেট হচ্ছে...", { id: "subj" });
      await editSubjectInClass(manageClass, editTargetSubject, editSubjectValue.trim());
      await loadConfig();
      setEditTargetSubject(null);
      toast.success("সাবজেক্ট আপডেট হয়েছে!", { id: "subj" });
    } catch (err) { toast.error("ব্যর্থ হয়েছে!", { id: "subj" }); }
  };

  const inputClass = "w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold";
  const markInputClass = "w-20 p-2 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-black";

  if (loadingConfig) return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in duration-300">
      
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
          <GraduationCap className="w-8 h-8 mr-3 text-indigo-600" /> Subject-wise Result Entry
        </h1>
        <p className="text-slate-500 mt-1">Manage subjects and generate result marksheet easily.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit">
        <button onClick={() => setActiveTab("entry")} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === "entry" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <FileText className="w-4 h-4"/> Result Entry
        </button>
        <button onClick={() => setActiveTab("subjects")} className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === "subjects" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <BookOpen className="w-4 h-4"/> Manage Subjects
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================== */}
        {/* --- TAB 1: RESULT ENTRY --- */}
        {/* ========================================== */}
        {activeTab === "entry" && (
          <motion.div key="entry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center text-slate-700 dark:text-slate-300"><Settings className="w-5 h-5 mr-2"/> Setup Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Class</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={inputClass}>
                    <option value="">-- Class --</option>
                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Subject</label>
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass} className={inputClass}>
                    <option value="">-- Subject --</option>
                    {selectedClass && subjectsMap[selectedClass]?.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Marks</label>
                  <input type="number" value={fullMarks} onChange={e => setFullMarks(Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Pass Marks</label>
                  <input type="number" value={passMarks} onChange={e => setPassMarks(Number(e.target.value))} className={inputClass} />
                </div>
                <div className="flex items-center h-full pb-2">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={enableTutorial} onChange={() => setEnableTutorial(!enableTutorial)} />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${enableTutorial ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enableTutorial ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <span className="ml-3 font-bold text-sm text-slate-700 dark:text-slate-300">Enable Tutorial</span>
                  </label>
                </div>
              </div>
            </div>

            {selectedClass && selectedSubject ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 dark:text-white flex items-center">Student Marks Entry {loadingStudents && <Loader2 className="w-4 h-4 ml-3 animate-spin text-indigo-500"/>}</h2>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{students.length} Students</span>
                  </div>
                  
                  <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm sticky top-0 z-10">
                        <tr>
                          <th className="p-4 font-semibold text-center w-20">Roll</th>
                          <th className="p-4 font-semibold">Student Name</th>
                          <th className="p-4 font-semibold text-center">Exam Marks</th>
                          {enableTutorial && <th className="p-4 font-semibold text-center">Tutorial</th>}
                          <th className="p-4 font-semibold text-center">Total</th>
                          <th className="p-4 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {processedData.data.length === 0 && !loadingStudents && (
                          <tr><td colSpan={enableTutorial ? 6 : 5} className="p-8 text-center text-slate-500">এই ক্লাসের কোনো শিক্ষার্থী ডাটাবেসে পাওয়া যায়নি।</td></tr>
                        )}
                        {processedData.data.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-4 font-bold text-center text-slate-500">{s.roll}</td>
                            <td className="p-4 font-bold text-slate-800 dark:text-white">{s.name}</td>
                            <td className="p-4 text-center">
                              <input type="number" min="0" max={fullMarks} value={marks[s.id]?.exam} onChange={e => handleMarkChange(s.id, "exam", e.target.value)} className={markInputClass} placeholder="0" />
                            </td>
                            {enableTutorial && (
                              <td className="p-4 text-center">
                                <input type="number" min="0" value={marks[s.id]?.tut} onChange={e => handleMarkChange(s.id, "tut", e.target.value)} className={markInputClass} placeholder="0" />
                              </td>
                            )}
                            <td className="p-4 text-center"><span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{s.total}</span></td>
                            <td className="p-4 text-center">
                              {s.status === "Pass" ? (
                                <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1"/> Pass</span>
                              ) : (
                                <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full"><AlertCircle className="w-3 h-3 mr-1"/> Fail</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-6 h-6 text-amber-100" />
                      <h3 className="font-bold text-amber-100 uppercase tracking-wider text-sm">Highest Marks</h3>
                    </div>
                    <p className="text-4xl font-black mb-2">{processedData.highestMark}</p>
                    <div className="text-sm font-semibold bg-black/10 p-2 rounded-lg backdrop-blur-sm">
                      <span className="block text-amber-100 mb-1">Top Scorers:</span>
                      {processedData.highestScorers.length > 0 ? processedData.highestScorers.join(", ") : "N/A"}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-indigo-500"/> Report Actions</h3>
                    <PDFDownloadLink
                      document={
                        <SubjectResultTemplate 
                          className={selectedClass}
                          subjectName={selectedSubject}
                          fullMarks={fullMarks}
                          passMarks={passMarks}
                          enableTutorial={enableTutorial}
                          studentsData={processedData.data}
                          highestMark={processedData.highestMark}
                          highestScorers={processedData.highestScorers}
                        />
                      }
                      fileName={`Result_${selectedClass}_${selectedSubject}.pdf`}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold flex justify-center items-center transition shadow-lg shadow-indigo-500/30"
                    >
                      {({ loading }) => (loading ? "Generating Report..." : <><Download className="w-5 h-5 mr-2"/> Download A4 Report</>)}
                    </PDFDownloadLink>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-500">Please Select Class & Subject</h2>
                <p className="text-sm text-slate-400 mt-2">Configure settings above to start entering marks.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================== */}
        {/* --- TAB 2: MANAGE SUBJECTS --- */}
        {/* ========================================== */}
        {activeTab === "subjects" && (
          <motion.div key="subjects" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white mb-6"><BookOpen className="w-5 h-5 text-indigo-600"/> Subject Management</h2>
              
              {/* Only show this section if a default subject is missing or classes aren't set up yet */}
              {showInitButton && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center"><Database className="w-4 h-4 mr-2"/> Default Initialization</h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Add all default classes & subjects to database.</p>
                    </div>
                    <button onClick={handleSaveDefaults} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors">
                      Initialize Defaults
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Class to Manage</label>
                <select value={manageClass} onChange={e => { setManageClass(e.target.value); setEditTargetSubject(null); }} className={inputClass}>
                  <option value="">-- Choose Class --</option>
                  {Array.from(new Set([...Object.keys(DEFAULT_CLASS_SUBJECTS), ...availableClasses])).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {manageClass && (
                <div className="flex gap-2">
                  <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Enter New Subject Name" className={inputClass} />
                  <button onClick={handleAddSubject} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold flex items-center shadow-md transition-colors whitespace-nowrap"><Plus className="w-5 h-5 mr-1"/> Add Subject</button>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[500px]">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Existing Subjects for {manageClass || "..."}</h3>
              
              {!manageClass ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">Please select a class to view subjects.</div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {(!subjectsMap[manageClass] || subjectsMap[manageClass].length === 0) && (
                    <p className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">No subjects found in database for this class.</p>
                  )}
                  
                  {subjectsMap[manageClass]?.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      {editTargetSubject === sub ? (
                        <div className="flex w-full gap-2">
                          <input type="text" value={editSubjectValue} onChange={e => setEditSubjectValue(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm outline-none focus:border-indigo-500 font-semibold" />
                          <button onClick={handleEditSubject} className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg transition-colors shadow-sm"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setEditTargetSubject(null)} className="p-2 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-lg transition-colors shadow-sm"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{sub}</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditTargetSubject(sub); setEditSubjectValue(sub); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteSubject(sub)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}