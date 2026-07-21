import React, { useEffect, useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

// Cloudinary Configuration Fixed
const CLOUDINARY_CLOUD_NAME = "do1dejkkk";
const CLOUDINARY_UPLOAD_PRESET = "Western"; // আপনার স্ক্রিনশট অনুযায়ী সঠিক প্রিসেট নাম

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function ImageUpload({
  label = "Student Photo",
  error,
  defaultImage = null,
  onUpload,
  onUploading,
  className = "",
  id,
  accept = "image/png, image/jpeg, image/jpg, image/webp",
  maxSize = 2 * 1024 * 1024,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(defaultImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef(null);
  const objectUrlRef = useRef(null);

  // Set initial/default image (for edit mode)
  useEffect(() => {
    setPreview(defaultImage || null);
  }, [defaultImage]);

  // Cleanup local object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    let result = null;

    try {
      result = await response.json();
    } catch {
      throw new Error("Invalid response received from Cloudinary.");
    }

    if (!response.ok) {
      throw new Error(result?.error?.message || `Cloudinary upload failed with status ${response.status}`);
    }

    if (!result?.secure_url) {
      throw new Error("Cloudinary did not return a secure image URL.");
    }

    return result.secure_url;
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (isUploading) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("শুধুমাত্র PNG, JPG অথবা JPEG ছবি আপলোড করুন।");
      return;
    }

    if (file.size > maxSize) {
      alert(`ছবির সাইজ অনেক বড়। সর্বোচ্চ সাইজ ${maxSize / (1024 * 1024)}MB হতে হবে।`);
      return;
    }

    try {
      setIsUploading(true);
      onUploading?.(true);

      // Create a quick local preview before actual upload
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const localObjectUrl = URL.createObjectURL(file);
      objectUrlRef.current = localObjectUrl;
      setPreview(localObjectUrl);

      // Upload to Cloudinary
      const secureUrl = await uploadToCloudinary(file);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setPreview(secureUrl);
      onUpload?.(secureUrl); // Send Cloudinary URL to StudentForm

    } catch (uploadError) {
      console.error("Cloudinary image upload error:", uploadError);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setPreview(defaultImage || null);
      alert(uploadError?.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      onUploading?.(false);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

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

    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeImage = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUploading) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPreview(null);
    onUpload?.(null); // Remove URL from form state

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-") || "image-upload";

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      <div
        className={`relative w-full rounded-xl border-2 border-dashed transition-all
          ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700"}
          ${error ? "border-red-500 bg-red-50 dark:bg-red-900/10" : ""}
          ${preview ? "p-2" : "p-6"}
          ${isUploading ? "cursor-wait" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"}
          flex items-center justify-center min-h-[160px]
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !preview && !isUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">ছবি আপলোড হচ্ছে...</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">অনুগ্রহ করে অপেক্ষা করুন</p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full min-h-[140px] rounded-lg overflow-hidden group flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <img src={preview} alt="Student Preview" className="max-h-48 max-w-full object-contain rounded-lg" />
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

      {error && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}