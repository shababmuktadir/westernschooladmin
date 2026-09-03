import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AdmitCardForm from "@/features/students/components/AdmitCardForm";
import AdmitCardTemplate from "@/templates/pdf/AdmitCardTemplate";
import { useAdmitCard } from "@/features/students/hooks/useAdmitCard";

export default function AdmitCard() {
  const { loading, generatedData, generateCards, resetGenerator } = useAdmitCard();

  const schoolConfig = {
    schoolName: "Western School and College",
    schoolLogo: "/logo.png" 
  };

  const handleFormSubmit = (data) => {
    generateCards(data);
  };

  const getPdfFileName = () => {
    if (generatedData?.examDetails?.studentId) {
      return `Admit_Card_${generatedData.examDetails.studentId}.pdf`;
    }
    if (generatedData?.examDetails?.selectedStudentIds?.length > 0) {
      return `Admit_Cards_Custom_Selection.pdf`;
    }
    return `Admit_Cards_${generatedData?.examDetails?.targetClass || 'All'}.pdf`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">প্রবেশপত্র তৈরি করুন</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">শিক্ষার্থীদের পরীক্ষার অ্যাডমিট কার্ড (Admit Card) তৈরি এবং ডাউনলোড করুন।</p>
      </div>
      
      {!generatedData ? (
        <AdmitCardForm onSubmit={handleFormSubmit} isLoading={loading} />
      ) : (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">সফলভাবে তৈরি সম্পন্ন!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
            সর্বমোট <span className="font-bold text-indigo-600">{generatedData.students.length}</span> জন শিক্ষার্থীর প্রবেশপত্র ডাউনলোডের জন্য প্রস্তুত করা হয়েছে।
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <PDFDownloadLink
              document={
                <AdmitCardTemplate 
                  students={generatedData.students} 
                  examData={generatedData.examDetails} 
                  schoolConfig={schoolConfig} 
                />
              }
              fileName={getPdfFileName()}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center"
            >
              {({ loading }) => (loading ? 'ডকুমেন্ট প্রস্তুত করা হচ্ছে...' : 'পিডিএফ ডাউনলোড করুন')}
            </PDFDownloadLink>

            <button 
              onClick={resetGenerator}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center"
            >
              নতুন তৈরি করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}