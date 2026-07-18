import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { UserPlus, Mail, Lock, ShieldCheck } from "lucide-react";

export default function AddAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return alert("পাসওয়ার্ড মিলছে না!");
    }
    
    setIsLoading(true);
    try {
      // TODO: এখানে Firebase Authentication বা আপনার Backend API দিয়ে নতুন এডমিন তৈরি করার লজিক বসবে। 
      // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log("New Admin Credentials:", { email, password });
      
      // ডেমো সাকসেস ম্যাসেজ
      setTimeout(() => {
        alert("নতুন এডমিন সফলভাবে তৈরি হয়েছে! এখন থেকে এই ইমেইল দিয়ে লগইন করা যাবে।");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      alert("এডমিন তৈরি করতে সমস্যা হয়েছে।");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200 dark:border-blue-800">
          <ShieldCheck className="w-8 h-8 text-purple-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">নতুন এডমিন যোগ করুন</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          নতুন সিস্টেম এডমিনের ইমেইল এবং পাসওয়ার্ড সেট করুন। পরবর্তীতে এই তথ্য দিয়ে ড্যাশবোর্ডে লগইন করা যাবে।
        </p>
      </div>

      <Card className="shadow-lg border-slate-200 dark:border-white/10 dark:bg-[#0a0a0a]">
        <CardHeader className="border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <CardTitle className="text-lg flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-purple-600 dark:text-blue-400" /> এডমিন ডিটেইলস
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <Input 
              label="এডমিনের ইমেইল অ্যাড্রেস"
              type="email"
              required
              placeholder="admin@school.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dark:bg-black dark:border-white/10 focus:ring-purple-500 dark:focus:ring-blue-400"
            />
            
            <Input 
              label="নতুন পাসওয়ার্ড"
              type="password"
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="dark:bg-black dark:border-white/10 focus:ring-purple-500 dark:focus:ring-blue-400"
            />

            <Input 
              label="পাসওয়ার্ড নিশ্চিত করুন"
              type="password"
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="dark:bg-black dark:border-white/10 focus:ring-purple-500 dark:focus:ring-blue-400"
            />

            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
              <Button 
                type="submit" 
                isLoading={isLoading} 
                className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md shadow-purple-500/20 dark:shadow-blue-500/20 transition-all"
              >
                এডমিন অ্যাকাউন্ট তৈরি করুন
              </Button>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}