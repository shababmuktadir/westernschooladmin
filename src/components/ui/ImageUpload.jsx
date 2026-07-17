import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ImageUpload({ onUpload, defaultImage, onUploading }) {
  const [preview, setPreview] = useState(defaultImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    // 11 & 12. Check File Type and Max Size validations (Max 10MB)
    if (fileRejections.length > 0) {
      toast.error("Invalid file. Only JPG, JPEG, PNG, WEBP (Max 10MB) allowed.");
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // 8. Add proper loading state while uploading
    setIsUploading(true);
    if (onUploading) onUploading(true); // Disable submit button in parent

    // 1. Create a FormData object & Append fields
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Western");

    try {
      // 2 & 13. Upload image using async/await and try/catch
      const res = await fetch("https://api.cloudinary.com/v1_1/do1dejkkk/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Cloudinary upload failed");

      // 3 & 4. Wait until upload is completed & Store returned data
      const data = await res.json();
      
      // 5 & 7. Replace previous image value with secure_url & Display preview
      setPreview(data.secure_url);
      
      // 6. Pass only the secure_url to the form (to save in Firestore)
      if (onUpload) onUpload(data.secure_url);
      
      toast.success("Image uploaded to Cloudinary successfully!");
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      // 10. Show upload errors if the request fails
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (onUploading) onUploading(false); // Enable submit button in parent
    }
  }, [onUpload, onUploading]);

  const removeImage = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (onUpload) onUpload("");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 1,
  });

  return (
    <div 
      {...getRootProps()} 
      className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
          : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800"
      } ${isUploading ? "pointer-events-none opacity-70 border-blue-400" : ""}`}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="py-8 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm font-medium">Uploading Image...</p>
        </div>
      ) : preview ? (
        <div className="relative w-32 h-32 mx-auto">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" />
          <button 
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center text-slate-500 dark:text-slate-400">
          <UploadCloud className="w-10 h-10 mb-2 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-medium">Drag & Drop Image</p>
          <p className="text-xs mt-1">JPG, PNG, WEBP (Max 10MB)</p>
        </div>
      )}
    </div>
  );
}