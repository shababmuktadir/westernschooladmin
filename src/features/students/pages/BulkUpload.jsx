import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createStudent } from "@/features/students/services/studentService";

export default function BulkUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryString = event.target.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rawData = XLSX.utils.sheet_to_json(sheet);
        setStudentsData(rawData);
        toast.success(`${rawData.length} records found in the sheet!`);
      } catch (error) {
        toast.error("Failed to read the Excel file.");
        console.error(error);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const saveToDatabase = async () => {
    if (studentsData.length === 0) return toast.error("No data found to upload.");
    
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < studentsData.length; i++) {
      const row = studentsData[i];
      
      // Exact Mapping based on your Excel Sheet Column Names
      const studentObj = {
        fullName: row["Name"] || "Unknown Name",
        studentId: row["Students ID"] ? String(row["Students ID"]) : `STU-${Date.now()}-${i}`,
        rollNumber: row["Roll"] ? String(row["Roll"]) : "",
        class: row["Class"] ? String(row["Class"]) : "",
        contactNumber: row["Number"] ? String(row["Number"]) : "",
        gender: row["Gender"] || "Other",
        bloodGroup: row["Blood group"] || "Unknown",
        dateOfBirth: row["Birthday"] || today,
        fatherName: row["Fathers name"] || "",
        motherName: row["Mothers name"] || "",
        address: row["Address"] || "",
        birthCertificateNumber: row["Birth certificate number"] ? String(row["Birth certificate number"]) : "",
        photoURL: row["Photo"] || "",
        section: "", // Optional, as it's not in your sheet
      };

      try {
        await createStudent(studentObj);
        successCount++;
      } catch (error) {
        console.error(`Failed to upload row ${i + 1}:`, error);
        errorCount++;
      }
      
      setUploadProgress(Math.round(((i + 1) / studentsData.length) * 100));
    }

    setIsUploading(false);
    
    if (errorCount === 0) {
      toast.success(`Successfully uploaded all ${successCount} students!`);
      navigate("/students");
    } else {
      toast.error(`Uploaded ${successCount}, Failed ${errorCount}. Check console.`);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-3">
        <button onClick={() => navigate("/students/register")} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bulk Data Upload</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload an Excel (.xlsx) file to register multiple students at once.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          />
          <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
            {file ? file.name : "Click or Drag & Drop your Excel file"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {file ? "File selected successfully." : "Supports .xlsx, .xls format"}
          </p>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Make sure headers match exactly:</p>
            <p>Students ID, Name, Roll, Class, Gender, Number, Fathers name, Mothers name, Address, Birthday, Birth certificate number, Photo, Blood group</p>
          </div>
        </div>

        {studentsData.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Records found: <span className="text-blue-600 font-bold">{studentsData.length}</span>
              </span>
              
              <button 
                onClick={saveToDatabase}
                disabled={isUploading}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center hover:bg-blue-700 transition disabled:opacity-70"
              >
                {isUploading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading ({uploadProgress}%)</>
                ) : (
                  <><CheckCircle className="w-5 h-5 mr-2" /> Sync to Database</>
                )}
              </button>
            </div>

            {isUploading && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}