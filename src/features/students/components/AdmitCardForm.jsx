import { useForm, Controller } from "react-hook-form";
import { FileText, Clock, MapPin, Edit3, User, Users } from "lucide-react";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker"; 

export default function AdmitCardForm({ onSubmit, isLoading }) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      generateType: "class", // 'class', 'single', or 'custom'
      targetClass: "Play",
      examName: "Half Yearly Examination 2026",
      studentId: "",
      customIds: ""
    }
  });

  const generateType = watch("generateType");
  const CLASS_OPTIONS = ["Play", "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

  const handleFormSubmit = (data) => {
    const submitData = {
      examName: data.examName,
      examDate: data.examDate,
      examTime: data.examTime,
      examCenter: data.examCenter,
    };

    if (data.generateType === "class") {
      submitData.targetClass = data.targetClass;
    } else if (data.generateType === "single") {
      submitData.studentId = data.studentId;
    } else if (data.generateType === "custom") {
      submitData.selectedStudentIds = data.customIds
        .split(",")
        .map(id => id.trim())
        .filter(id => id !== "");
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      
      {/* Generation Type Selection */}
      <div className="mb-6 flex flex-wrap gap-6 border-b border-slate-200 dark:border-slate-700 pb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="class" {...register("generateType")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">পুরো ক্লাস</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="single" {...register("generateType")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">নির্দিষ্ট শিক্ষার্থী (Single ID)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="custom" {...register("generateType")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">বাছাইকৃত একাধিক (Custom IDs)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Dynamic First Field Based on Selection */}
        {generateType === "class" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Generate For (Class) <span className="text-red-500">*</span></label>
            <Controller
              name="targetClass"
              control={control}
              rules={{ required: generateType === "class" }}
              render={({ field }) => (
                <Select options={CLASS_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Select Class" />
              )}
            />
          </div>
        )}

        {generateType === "single" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student ID <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input {...register("studentId", { required: generateType === "single" })} type="text" className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. S-101" />
            </div>
          </div>
        )}

        {generateType === "custom" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student IDs (Comma Separated) <span className="text-red-500">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input {...register("customIds", { required: generateType === "custom" })} type="text" className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. S-101, S-105" />
            </div>
          </div>
        )}

        {/* Other Fixed Fields */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input {...register("examName", { required: true })} type="text" className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Final Exam 2026" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Starting Date <span className="text-red-500">*</span></label>
          <Controller
            name="examDate"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Select Exam Date" />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time (Optional)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input {...register("examTime")} type="text" className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="10:00 AM - 01:00 PM" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Center <span className="text-red-500">*</span></label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input {...register("examCenter", { required: true })} type="text" defaultValue="Main Campus" className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          type="submit" 
          disabled={isLoading} 
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center hover:bg-blue-700 transition disabled:opacity-70"
        >
          <FileText className="w-5 h-5 mr-2" />
          {isLoading ? "Generating Cards..." : "Generate Admit Cards"}
        </button>
      </div>
    </form>
  );
}