import React, { useState, useEffect } from "react";
import { getStudents } from "@/features/students/services/studentService"; 
import { PDFDownloadLink } from "@react-pdf/renderer";
import BlankMarksheetTemplate from "@/templates/pdf/BlankMarksheetTemplate";
import { FileSpreadsheet, Printer, Users } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";

// Class-wise Subject Mapping based on your provided list
const CLASS_SUBJECTS = {
  "Play": ["Bengali", "English", "Math", "Drawing"],
  "Nursery": ["Bengali", "English", "Math", "Drawing", "Religion"],
  "KG": ["Bengali", "English", "Math", "General\nKnowledge", "Drawing", "Religion", "English Reading\n& Writing", "Bengali Reading\n& Writing", "Spoken\nEnglish"],
  "Class 1": ["Bengali", "English", "Math", "General\nKnowledge", "Drawing", "Religion", "Bengali Reading\n& Writing", "English Reading\n& Writing", "Spoken\nEnglish", "Computer"],
  "Class 2": ["Bengali", "English", "Math", "General\nKnowledge", "Drawing", "Religion", "English Reading\n& Writing", "Bengali Reading\n& Writing", "Spoken\nEnglish", "Computer"],
  "Class 3": ["Bengali", "English 1st\nPaper", "English 2nd\nPaper", "Math", "Science", "BGS", "General\nKnowledge", "Drawing", "Religion", "English Reading\n& Writing", "Bengali Reading\n& Writing", "Spoken\nEnglish", "Computer"],
  "Class 4": ["Bengali", "English 1st\nPaper", "English 2nd\nPaper", "Math", "Science", "BGS", "General\nKnowledge", "Drawing", "Religion", "Spoken\nEnglish", "Computer"],
  "Class 5": ["Bengali", "English 1st\nPaper", "English 2nd\nPaper", "Math", "Science", "BGS", "General\nKnowledge", "Drawing", "Religion", "Spoken\nEnglish", "Computer"]
};

export default function BlankMarksheet() {
  const [allStudents, setAllStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [termName, setTermName] = useState("2ND TERM SCHOOL");
  const [filteredStudents, setFilteredStudents] = useState([]);

  const classOptions = Object.keys(CLASS_SUBJECTS).map(c => ({ label: c, value: c }));

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const data = await getStudents();
    setAllStudents(data || []);
  };

  useEffect(() => {
    if (selectedClass) {
      // Filter by class (Case-insensitive and trimmed to fix Firebase matching issues)
      let students = allStudents.filter(s => {
        if (!s.class) return false;
        
        // ফায়ারবেসের ক্লাস নেম এবং ড্রপডাউনের ক্লাস নেম লোয়ারকেস করে এবং স্পেস মুছে মেলানো হচ্ছে
        const dbClass = s.class.toString().toLowerCase().replace(/-/g, ' ').trim();
        const selected = selectedClass.toLowerCase().replace(/-/g, ' ').trim();
        
        return dbClass === selected || dbClass === selected.replace('class ', '');
      });

      // Sort by Roll Number (handle empty rolls safely)
      students.sort((a, b) => Number(a.rollNumber || 0) - Number(b.rollNumber || 0));
      
      setFilteredStudents(students);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClass, allStudents]);

  const generatedDate = new Date().toLocaleString('en-GB', { 
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
  });

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in">
      <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1a2235] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" /> Blank Marksheet Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">Select a class to generate a printable marksheet template.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Section */}
        <div className="bg-white dark:bg-[#1a2235] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-5 relative z-20">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Class</label>
            <Dropdown 
              options={classOptions}
              value={selectedClass}
              onChange={(val) => setSelectedClass(val)}
              placeholder="-- Choose Class --"
              fullWidth={true}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Term / Exam Name</label>
            <input 
              type="text" 
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase font-bold"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
            {selectedClass && filteredStudents.length > 0 ? (
              <PDFDownloadLink
                document={
                  <BlankMarksheetTemplate 
                    students={filteredStudents} 
                    className={selectedClass}
                    subjects={CLASS_SUBJECTS[selectedClass]}
                    termName={termName}
                    generatedDate={generatedDate}
                  />
                }
                fileName={`${selectedClass}_Marksheet_Template.pdf`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md active:scale-95"
              >
                {({ loading }) => (loading ? "Generating PDF..." : <><Printer className="w-5 h-5"/> Download PDF Format</>)}
              </PDFDownloadLink>
            ) : (
              <button disabled className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 py-3 rounded-xl font-bold flex justify-center items-center gap-2 cursor-not-allowed">
                <Printer className="w-5 h-5"/> Download PDF Format
              </button>
            )}
          </div>
        </div>

        {/* Preview / Info Section */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2235] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-10">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" /> Class Overview
            </h2>
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-bold text-sm">
              {filteredStudents.length} Students
            </span>
          </div>

          {selectedClass ? (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Subjects included for {selectedClass}:</h3>
                <div className="flex flex-wrap gap-2">
                  {CLASS_SUBJECTS[selectedClass].map((sub, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                      {sub.replace('\n', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {filteredStudents.length > 0 ? (
                <div className="overflow-x-auto max-h-[350px] border border-slate-200 dark:border-slate-700 rounded-xl mt-6">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-[#0f172a] sticky top-0 z-10">
                      <tr>
                        <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Roll</th>
                        <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Student Name</th>
                        <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {filteredStudents.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{s.rollNumber}</td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300 uppercase">{s.fullName}</td>
                          <td className="p-3 text-slate-500">{s.studentId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-slate-500 font-medium">No students registered in this class.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Please select a class from the left panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}