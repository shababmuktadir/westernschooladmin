import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Login from "@/features/auth/pages/Login";
import Dashboard from "@/features/students/pages/Dashboard";
import StudentList from "@/features/students/pages/StudentList";
import StudentRegistration from "@/features/students/pages/StudentRegistration";
import BulkUpload from "@/features/students/pages/BulkUpload";
import StudentDetails from "@/features/students/pages/StudentDetails";
import StudentEdit from "@/features/students/pages/StudentEdit";
import AdmitCard from "@/features/students/pages/AdmitCard";
import SeatPlan from "@/features/students/pages/SeatPlan";
import FeeEntry from "@/features/fee/pages/FeeEntry";
import BulkFeeImport from "@/features/fee/pages/BulkFeeImport";
import FeeHistory from "@/features/fee/pages/FeeHistory";
import AddAdmin from "@/features/fee/pages/AddAdmin";
import AttendanceSmsPage from "@/features/sms/pages/AttendanceSmsPage";
import CustomSmsPage from "@/features/sms/pages/CustomSmsPage";
import FeeReport from "@/features/fee/pages/FeeReport";
import TeacherDirectory from "@/features/teachers/pages/TeacherDirectory";
import TeacherAttendance from "@/features/teachers/pages/TeacherAttendance";
import TeacherDetails from "@/features/teachers/pages/TeacherDetails";
import TeacherSalary from "@/features/teachers/pages/TeacherSalary";
import BlankMarksheet from "@/features/result/pages/BlankMarksheet";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/register" element={<StudentRegistration />} />
          <Route path="/students/bulk-upload" element={<BulkUpload />} />
          <Route path="/students/details/:id" element={<StudentDetails />} />
          <Route path="/students/edit/:id" element={<StudentEdit />} />
          <Route path="/admit-card" element={<AdmitCard />} />
          <Route path="/seat-plan" element={<SeatPlan />} />
          <Route path="/fee/entry" element={<FeeEntry />} />
          <Route path="/fee/bulk-import" element={<BulkFeeImport />} />
          <Route path="/fee/history" element={<FeeHistory />} />
          <Route path="/teachers/directory" element={<TeacherDirectory />} />
          <Route path="/teachers/attendance" element={<TeacherAttendance />} />
          {/* ✅ New route */}
          <Route path="/fee/report" element={<FeeReport />} />
          <Route path="/attendance-sms" element={<AttendanceSmsPage />} />
          <Route path="/custom-sms" element={<CustomSmsPage />} />
          <Route path="/add-admin" element={<AddAdmin />} />
          <Route path="/teachers/details" element={<TeacherDetails />} />
          <Route path="/result/blank-marksheet" element={<BlankMarksheet />} />
<Route path="/teachers/salary" element={<TeacherSalary />} />

        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
