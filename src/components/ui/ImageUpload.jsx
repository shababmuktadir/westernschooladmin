import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, X } from "lucide-react";

export default function ImageUpload({
  label,
  error,
  value, 
  onChange,
  className = "",
  id,
  accept = "image/png, image/jpeg, image/jpg",
  maxSize = 2 * 1024 * 1024 // ডিফল্ট ২ মেগাবাইট (2MB)
}) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  // ইনশিয়াল ভ্যালু বা সিলেক্ট করা ছবি প্রিভিউ হিসেবে সেট করা
  useEffect(() => {
    if (typeof value === "string") {
      setPreview(value);
    } else if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.size > maxSize) {
      alert(`ছবির সাইজ অনেক বড়। সর্বোচ্চ সাইজ ${maxSize / (1024 * 1024)}MB হতে হবে।`);
      return;
    }
    if (onChange) {
      onChange(file);
    }
  };

  const removeImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      
      <div
        className={`relative w-full rounded-xl border-2 border-dashed transition-all
          ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700"}
          ${error ? "border-red-500 bg-red-50 dark:bg-red-900/10" : ""}
          ${preview ? "p-2" : "p-6"}
          hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-center min-h-[160px]
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !preview && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-full min-h-[140px] rounded-lg overflow-hidden group flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-48 object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={removeImage}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              ক্লিক করুন অথবা ছবি টেনে এনে ছেড়ে দিন
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG বা JPEG (সর্বোচ্চ 2MB)
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}