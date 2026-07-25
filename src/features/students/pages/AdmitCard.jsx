import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AdmitCardForm from "@/features/students/components/AdmitCardForm";
import AdmitCardTemplate from "@/templates/pdf/AdmitCardTemplate";
import { useAdmitCard } from "@/features/students/hooks/useAdmitCard";

export default function AdmitCard() {
  const { loading, generatedData, generateCards, resetGenerator } = useAdmitCard();

  // বিদ্যালয়ের কনফিগারেশন
  const schoolConfig = {
  schoolName: "Western School and College",
  schoolLogo: "/logo.png" // সরাসরি লোকাল পাথ
};

  const handleFormSubmit = (data) => {
    generateCards(data);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">প্রবেশপত্র তৈরি করুন</h1>
      
      {!generatedData ? (
        <AdmitCardForm onSubmit={handleFormSubmit} isLoading={loading} />
      ) : (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <h2 className="text-xl font-semibold mb-2 text-green-600">সফলভাবে তৈরি সম্পন্ন!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {generatedData.students.length} জন শিক্ষার্থীর প্রবেশপত্র ডাউনলোডের জন্য প্রস্তুত।
          </p>

          <div className="flex justify-center gap-4">
            <PDFDownloadLink
              document={
                <AdmitCardTemplate 
                  students={generatedData.students} 
                  examData={generatedData.examDetails} 
                  schoolConfig={schoolConfig} 
                />
              }
              fileName={`Admit_Cards_${generatedData.examDetails.targetClass}.pdf`}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {({ loading }) => (loading ? 'ডকুমেন্ট প্রস্তুত করা হচ্ছে...' : 'পিডিএফ ডাউনলোড')}
            </PDFDownloadLink>

            <button 
              onClick={resetGenerator}
              className="bg-slate-200 text-slate-800 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-300 transition"
            >
              নতুন তৈরি করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}