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
import BulkFeeImport from "@/features/fee/pages/BulkFeeImport"; // নতুন ইমপোর্ট
import FeeHistory from "@/features/fee/pages/FeeHistory";
import AddAdmin from "@/features/auth/pages/AddAdmin";

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
          <Route path="/fee/bulk-import" element={<BulkFeeImport />} /> {/* নতুন রাউট */}
          <Route path="/fee/history" element={<FeeHistory />} />
          <Route path="/add-admin" element={<AddAdmin />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}