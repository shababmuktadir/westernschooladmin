import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema } from "@/features/students/schemas/studentSchema";
import ImageUpload from "@/components/ui/ImageUpload";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
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
    }
  });

  const CLASS_OPTIONS = ["Play", "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const GENDER_OPTIONS = ["Male", "Female", "Other"];
  const BLOOD_OPTIONS = ["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-", "Unknown"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Image Upload */}
        <div className="col-span-1">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Student Photo (Optional)</h3>
          <ImageUpload 
            defaultImage={defaultValues?.photoURL}
            onUpload={(url) => setValue("photoURL", url)} 
            onUploading={setIsImageUploading} 
          />
        </div>

        {/* Right Column: Form Fields */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Full Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input {...register("fullName")} type="text" className={`w-full px-4 py-2 border rounded-lg bg-transparent dark:text-white outline-none capitalize ${errors.fullName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'}`} placeholder="John Doe" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student ID <span className="text-red-500">*</span></label>
            <input {...register("studentId")} type="text" className={`w-full px-4 py-2 border rounded-lg bg-transparent dark:text-white outline-none ${errors.studentId ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'}`} placeholder="STU-2024-001" />
            {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId.message}</p>}
          </div>

          {/* Roll Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Roll Number <span className="text-red-500">*</span></label>
            <input {...register("rollNumber")} type="text" className={`w-full px-4 py-2 border rounded-lg bg-transparent dark:text-white outline-none ${errors.rollNumber ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'}`} placeholder="101" />
            {errors.rollNumber && <p className="text-red-500 text-xs mt-1">{errors.rollNumber.message}</p>}
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class <span className="text-red-500">*</span></label>
            <Controller
              name="class"
              control={control}
              render={({ field }) => (
                <Select options={CLASS_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Select Class" error={errors.class} />
              )}
            />
            {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class.message}</p>}
          </div>

          {/* Section (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Section</label>
            <input {...register("section")} type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="A" />
          </div>

          {/* Contact Number (Required) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Number <span className="text-red-500">*</span></label>
            <input {...register("contactNumber")} type="text" className={`w-full px-4 py-2 border rounded-lg bg-transparent dark:text-white outline-none ${errors.contactNumber ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'}`} placeholder="01XXXXXXXXX" />
            {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>}
          </div>

          {/* Gender (Optional, Defaults to Other) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => <Select options={GENDER_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Select Gender" />}
            />
          </div>

          {/* DOB (Optional, Defaults to Today) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
          </div>

          {/* Birth Certificate Number (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Birth Certificate Number</label>
            <input {...register("birthCertificateNumber")} type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 2010XXXXXXXXXXXXX" />
          </div>

          {/* Father's Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Father's Name</label>
            <input {...register("fatherName")} type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none capitalize" />
          </div>

          {/* Father's NID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Father's NID</label>
            <input {...register("fatherNID")} type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Mother's Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mother's Name</label>
            <input {...register("motherName")} type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none capitalize" />
          </div>

          {/* Mother's NID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mother's NID</label>
            <input {...register("motherNID")} type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Blood Group (Optional, Defaults to Unknown) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
            <Controller
              name="bloodGroup"
              control={control}
              render={({ field }) => <Select options={BLOOD_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Select Blood Group" />}
            />
          </div>

          {/* Guardian Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Local Guardian Name</label>
            <input {...register("guardianName")} type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none capitalize" />
          </div>

          {/* Address (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Address</label>
            <textarea {...register("address")} rows="3" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none capitalize" placeholder="Complete address..." />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
        <button type="button" onClick={() => navigate("/students")} className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium flex items-center transition">
          <X className="w-4 h-4 mr-2" /> Cancel
        </button>
        
        <button 
          type="submit" 
          disabled={isSubmitting || isImageUploading} 
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" /> 
          {isImageUploading ? "Uploading Image..." : isSubmitting ? "Saving..." : "Save Student"}
        </button>
      </div>
    </form>
  );
}