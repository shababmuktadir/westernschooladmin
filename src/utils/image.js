// Cloudinary Unsigned Upload
export const uploadToCloudinary = async (file) => {
  if (!file) return null;
  
  const formData = new FormData();
  formData.append("file", file);
  // নোট: Cloudinary তে 'unsigned' আপলোড প্রিসেট তৈরি করে এখানে নাম দিতে হবে। আপাতত একটি ডামি ডেমো দেওয়া হলো।
  formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "demo_preset");
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
  
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};