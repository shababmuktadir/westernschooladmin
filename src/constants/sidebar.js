import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  FileText, 
  Map, 
  FolderOpen, 
  FileSpreadsheet 
} from "lucide-react";

export const SIDEBAR_MENU = [
  { title: "ড্যাশবোর্ড", path: "/", icon: LayoutDashboard },
  { 
    title: "শিক্ষার্থী মডিউল", 
    icon: Users,
    subItems: [
      { title: "শিক্ষার্থী তালিকা", path: "/students" },
      { title: "শিক্ষার্থী নিবন্ধন", path: "/students/register" }
    ]
  },
  { 
    title: "ফি মডিউল", 
    icon: Banknote,
    subItems: [
      { title: "ফি এন্ট্রি", path: "/fee/entry" },
      { title: "ফি হিস্ট্রি", path: "/fee/history" },
      { title: "ফি ইনভয়েস এডিট", path: "/fee/invoice-edit" }
    ]
  },
  { title: "প্রবেশপত্র", path: "/admit-card", icon: FileText },
  { title: "সিট প্ল্যান", path: "/seat-plan", icon: Map },
  
  { 
    title: "ফলাফল মডিউল", 
    icon: FileSpreadsheet,
    subItems: [
      { title: "ফলাফল এন্ট্রি", path: "/result/entry" },
      { title: "ফলাফল হিস্ট্রি", path: "/result/history" },
      { title: "ফলাফল অনুসন্ধান", path: "/result/search" }
    ]
  }
];