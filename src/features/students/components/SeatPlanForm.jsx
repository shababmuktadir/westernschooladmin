import { useForm, Controller } from "react-hook-form";
import { LayoutGrid, Edit3 } from "lucide-react";
import Select from "@/components/ui/Select";

export default function SeatPlanForm({ onSubmit, isLoading }) {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      targetClass: "All",
      examName: "অর্ধবার্ষিক পরীক্ষা ২০২৬"
    }
  });

  const CLASS_OPTIONS = ["All", "Play", "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">শ্রেণী নির্বাচন করুন (Class) <span className="text-red-500">*</span></label>
          <Controller
            name="targetClass"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select options={CLASS_OPTIONS} value={field.value} onChange={field.onChange} placeholder="শ্রেণী নির্বাচন করুন" />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">পরীক্ষার নাম <span className="text-red-500">*</span></label>
          <div className="relative">
            <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              {...register("examName", { required: true })} 
              type="text" 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-slate-800" 
              placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৬" 
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          type="submit" 
          disabled={isLoading} 
          className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center hover:bg-slate-900 transition disabled:opacity-70"
        >
          <LayoutGrid className="w-5 h-5 mr-2" />
          {isLoading ? "তৈরি হচ্ছে..." : "সিট প্ল্যান তৈরি করুন"}
        </button>
      </div>
    </form>
  );
}