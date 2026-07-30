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
  Building2,
  MessageSquare, 
  CalendarCheck, 
  Send,
  Contact,           // for Teacher Directory
  ClipboardCheck,    // for Teacher Attendance (Added comma here)
  Search,            // for Teacher Details
  HandCoins          // for Teacher Salary
} from "lucide-react";

export const SIDEBAR_MENU = [
  { 
    title: "ড্যাশবোর্ড", 
    path: "/", 
    icon: LayoutDashboard 
  },
  { 
    title: "শিক্ষার্থী সেকশন", 
    icon: GraduationCap,
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
  // শিক্ষক সেকশন (সঠিকভাবে সাজানো হলো)
  { 
    title: "শিক্ষক সেকশন", 
    icon: Presentation,
    subItems: [
      { title: "অ্যাকাউন্ট ও তালিকা", path: "/teachers/directory", icon: Contact },
      { title: "হাজিরা ও রিপোর্ট", path: "/teachers/attendance", icon: ClipboardCheck },
      { title: "প্রোফাইল ও হিস্ট্রি", path: "/teachers/details", icon: Search },
      { title: "বেতন ও বোনাস", path: "/teachers/salary", icon: HandCoins }
    ]
  },
  { 
    title: "অফিস সেকশন", 
    icon: Building2,
    subItems: [
       // ভবিষ্যতে আইটেম এখানে যুক্ত করবেন
    ]
  },
  { 
    title: "SMS মডিউল", 
    icon: MessageSquare,
    subItems: [
      { title: "অটো হাজিরা SMS", path: "/attendance-sms", icon: CalendarCheck },
      { title: "কাস্টম SMS", path: "/custom-sms", icon: Send }
    ]
  }
];