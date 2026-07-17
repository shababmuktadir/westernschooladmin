import { useSeatPlan } from "@/features/students/hooks/useSeatPlan";
import SeatPlanForm from "@/features/students/components/SeatPlanForm";
import SeatPlanTemplate from "@/templates/pdf/SeatPlanTemplate";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { appConfig } from "@/config/appConfig";
import { Printer, RefreshCw, LayoutGrid } from "lucide-react";

export default function SeatPlan() {
  const { loading, generatedData, generatePlan, resetGenerator } = useSeatPlan();

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">সিট প্ল্যান (Seat Plan)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">পরীক্ষার জন্য প্রতি A4 পৃষ্ঠায় ১০টি সিট কার্ড তৈরি করুন।</p>
        </div>
        {generatedData && (
          <button onClick={resetGenerator} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center">
            <RefreshCw className="w-4 h-4 mr-1" /> রিসেট করুন
          </button>
        )}
      </div>

      {!generatedData ? (
        <SeatPlanForm onSubmit={generatePlan} isLoading={loading} />
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-center max-w-4xl">
          <div className="w-20 h-20 bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">সিট প্ল্যান প্রস্তুত!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            সফলভাবে <strong>{generatedData.students.length}</strong> জন শিক্ষার্থীর সিট কার্ড তৈরি করা হয়েছে। A4 কাগজে প্রিন্ট করার জন্য প্রস্তুত।
          </p>

          <PDFDownloadLink
            key={JSON.stringify(generatedData)} // Cache invalidation
            document={<SeatPlanTemplate students={generatedData.students} examData={generatedData.examDetails} schoolConfig={appConfig} />}
            fileName={`Seat_Plan_${generatedData.examDetails.targetClass.replace(/\s+/g, '_')}.pdf`}
            className="inline-flex"
          >
            {({ loading }) => (
              <span className={`px-8 py-3 rounded-lg font-medium flex items-center transition shadow-md border border-slate-800 ${loading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-black cursor-pointer'}`}>
                <Printer className="w-5 h-5 mr-2" />
                {loading ? "পিডিএফ তৈরি হচ্ছে..." : "ডাউনলোড ও প্রিন্ট করুন (PDF)"}
              </span>
            )}
          </PDFDownloadLink>
        </div>
      )}
    </div>
  );
}