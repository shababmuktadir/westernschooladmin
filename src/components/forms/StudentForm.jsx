import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema } from "@/features/students/schemas/studentSchema";
import ImageUpload from "@/components/ui/ImageUpload";
import Dropdown from "@/components/ui/Dropdown"; 
import GlassDatePicker from "@/components/ui/GlassDatePicker"; // নতুন Glass Date Picker
import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentForm({ defaultValues, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Get Today's Date (YYYY-MM-DD Format)
  const today = new Date().toISOString().split("T")[0];
  const initialValues = defaultValues || {};

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      ...initialValues,
      // ফাঁকা থাকলে ডিফল্ট ভ্যালুগুলো নিবে
      dateOfBirth: initialValues.dateOfBirth || today,
      bloodGroup: initialValues.bloodGroup || "Unknown",
      gender: initialValues.gender || "Other", // জেন্ডার ফাঁকা থাকলে 'Other' নিবে
      class: initialValues.class || "", // ড্রপডাউনের জন্য ডিফল্ট ভ্যালু
    }
  });

  const CLASS_OPTIONS = ["Play", "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const GENDER_OPTIONS = ["Male", "Female", "Other"];
  const BLOOD_OPTIONS = ["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-", "Unknown"];

  // ইনপুটের জন্য কমন মডার্ন টেইলউইন্ড ক্লাস
  const inputBaseClass = "w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white outline-none transition-all duration-200";
  const inputNormalClass = `${inputBaseClass} border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500`;
  const inputErrorClass = `${inputBaseClass} border-red-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Image Upload */}
        <div className="col-span-1">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Student Photo (Optional)</h3>
          <ImageUpload 
            defaultImage={defaultValues?.photoURL}
            onUpload={(url) => setValue("photoURL", url, { shouldValidate: true })} 
            onUploading={setIsImageUploading} 
          />
        </div>

        {/* Right Column: Form Fields */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Full Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input {...register("fullName")} type="text" className={`${errors.fullName ? inputErrorClass : inputNormalClass} capitalize`} placeholder="John Doe" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.fullName.message}</p>}
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Student ID <span className="text-red-500">*</span></label>
            <input {...register("studentId")} type="text" className={errors.studentId ? inputErrorClass : inputNormalClass} placeholder="STU-2024-001" />
            {errors.studentId && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.studentId.message}</p>}
          </div>

          {/* Roll Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Roll Number <span className="text-red-500">*</span></label>
            <input {...register("rollNumber")} type="text" className={errors.rollNumber ? inputErrorClass : inputNormalClass} placeholder="101" />
            {errors.rollNumber && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.rollNumber.message}</p>}
          </div>

          {/* Class */}
          <div className="relative z-30">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Class <span className="text-red-500">*</span></label>
            <Controller
              name="class"
              control={control}
              render={({ field }) => (
                <Dropdown options={CLASS_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Select Class" error={errors.class?.message} />
              )}
            />
          </div>

          {/* Section (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Section</label>
            <input {...register("section")} type="text" className={`${inputNormalClass} uppercase`} placeholder="A" />
          </div>

          {/* Contact Number (Required) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contact Number <span className="text-red-500">*</span></label>
            <input {...register("contactNumber")} type="text" className={errors.contactNumber ? inputErrorClass : inputNormalClass} placeholder="01XXXXXXXXX" />
            {errors.contactNumber && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contactNumber.message}</p>}
          </div>

          {/* Gender (Optional, Defaults to Other) */}
          <div className="relative z-20">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => <Dropdown options={GENDER_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Select Gender" />}
            />
          </div>

          {/* DOB (Optional, Defaults to Today) */}
          <div className="relative z-20">
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }) => (
                <GlassDatePicker 
                  label="Date of Birth"
                  value={field.value} 
                  onChange={field.onChange} 
                  placeholder="Select Date"
                />
              )}
            />
          </div>

          {/* Birth Certificate Number (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Birth Certificate Number</label>
            <input {...register("birthCertificateNumber")} type="text" className={inputNormalClass} placeholder="e.g. 2010XXXXXXXXXXXXX" />
          </div>

          {/* Father's Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Father's Name</label>
            <input {...register("fatherName")} type="text" className={`${inputNormalClass} capitalize`} />
          </div>

          {/* Father's NID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Father's NID</label>
            <input {...register("fatherNID")} type="text" className={inputNormalClass} />
          </div>

          {/* Mother's Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mother's Name</label>
            <input {...register("motherName")} type="text" className={`${inputNormalClass} capitalize`} />
          </div>

          {/* Mother's NID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mother's NID</label>
            <input {...register("motherNID")} type="text" className={inputNormalClass} />
          </div>

          {/* Blood Group (Optional, Defaults to Unknown) */}
          <div className="relative z-10">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Blood Group</label>
            <Controller
              name="bloodGroup"
              control={control}
              render={({ field }) => <Dropdown options={BLOOD_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Select Blood Group" />}
            />
          </div>

          {/* Guardian Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Local Guardian Name</label>
            <input {...register("guardianName")} type="text" className={`${inputNormalClass} capitalize`} />
          </div>

          {/* Address (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Address</label>
            <textarea {...register("address")} rows="3" className={`${inputNormalClass} capitalize resize-none`} placeholder="Complete address..." />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
        <button type="button" onClick={() => navigate("/students")} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium flex items-center transition">
          <X className="w-4 h-4 mr-2" /> Cancel
        </button>
        
        <button 
          type="submit" 
          disabled={isSubmitting || isImageUploading} 
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" /> 
          {isImageUploading ? "Uploading Image..." : isSubmitting ? "Saving..." : "Save Student"}
        </button>
      </div>
    </form>
  );
}