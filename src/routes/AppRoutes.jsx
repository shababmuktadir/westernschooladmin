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

// Certificates Import
import Certificates from "@/features/students/pages/Certificates"; 

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          
          {/* Student Routes */}
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/register" element={<StudentRegistration />} />
          <Route path="/students/bulk-upload" element={<BulkUpload />} /> 
          <Route path="/students/details/:id" element={<StudentDetails />} />
          <Route path="/students/edit/:id" element={<StudentEdit />} />
          
          <Route path="/admit-card" element={<AdmitCard />} />
          <Route path="/seat-plan" element={<SeatPlan />} />
          
          {/* Certificates Route */}
          <Route path="/certificates" element={<Certificates />} />
          
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}