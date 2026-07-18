import { 
  LayoutDashboard, 
  GraduationCap,
  Users, 
  ClipboardList,
  UserPlus,
  Banknote, 
  Wallet,
  History,
  FilePieChart,
  FileSpreadsheet,
  FileEdit,
  LineChart,
  FileText, 
  Map, 
  Presentation,
  Building2
} from "lucide-react";

export const SIDEBAR_MENU = [
  { 
    title: "ড্যাশবোর্ড", 
    path: "/", 
    icon: LayoutDashboard 
  },
  { 
    title: "শিক্ষার্থী সেকশন", 
    icon: GraduationCap, // Mega Section Icon
    subItems: [
      { 
        title: "অ্যাকাউন্ট", 
        icon: Users,
        subItems: [
          { title: "তালিকা (List)", path: "/students", icon: ClipboardList },
          { title: "নিবন্ধন (Register)", path: "/students/register", icon: UserPlus }
        ]
      },
      { 
        title: "ফি মডিউল", 
        icon: Banknote,
        subItems: [
          { title: "ফি এন্ট্রি", path: "/fee/entry", icon: Wallet },
          { title: "ফি হিস্ট্রি", path: "/fee/history", icon: History },
          { title: "ফি রিপোর্ট", path: "/fee/report", icon: FilePieChart }
        ]
      },
      { 
        title: "ফলাফল মডিউল", 
        icon: FileSpreadsheet,
        subItems: [
          { title: "ফলাফল এন্ট্রি", path: "/result/entry", icon: FileEdit },
          { title: "ফলাফল হিস্ট্রি", path: "/result/history", icon: History },
          { title: "ওভারঅল রিপোর্ট", path: "/result/overall-report", icon: LineChart }
        ]
      },
      { 
        title: "প্রবেশপত্র", 
        path: "/admit-card", 
        icon: FileText 
      },
      { 
        title: "সিট প্ল্যান", 
        path: "/seat-plan", 
        icon: Map 
      }
    ]
  },
  { 
    title: "শিক্ষক সেকশন", 
    icon: Presentation, // Teachers Section Icon
    subItems: [
      // ভবিষ্যতে আইটেম এখানে যুক্ত করবেন
    ]
  },
  { 
    title: "অফিস সেকশন", 
    icon: Building2, // Office Section Icon
    subItems: [
       // ভবিষ্যতে আইটেম এখানে যুক্ত করবেন
    ]
  }
];