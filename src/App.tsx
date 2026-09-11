import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadCSV from "./pages/UploadCSV";
import ProtectedRoute from "./components/ProtectedRoute";
import ScoreBreakdown from "./pages/ScoreBreakdown";
import Modules from "./pages/Modules";
import Interventions from "./pages/Interventions";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import SystemHealth from "./pages/SystemHealth";
import ScoringConfig from "./pages/ScoringConfig";
import Students from "./pages/Students";
import StudentList from "./pages/StudentList";
import Analysis from "./pages/Analysis";
import UploadHistory from "./pages/UploadHistory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadCSV />
            </ProtectedRoute>
          } 
        />
                <Route
          path="/breakdown/:riskScoreID"
          element={
            <ProtectedRoute>
              <ScoreBreakdown />
            </ProtectedRoute>
          }
        />
                <Route
          path="/modules"
          element={
            <ProtectedRoute>
              <Modules />
            </ProtectedRoute>
          }
        />
                <Route
          path="/interventions"
          element={
            <ProtectedRoute>
              <Interventions />
            </ProtectedRoute>
          }
        />
                <Route
          path="/student-list"
          element={
            <ProtectedRoute>
              <StudentList />
            </ProtectedRoute>
          }
        />
                <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
                <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
                <Route
          path="/system-health"
          element={
            <ProtectedRoute>
              <SystemHealth />
            </ProtectedRoute>
          }
        />
                <Route
          path="/scoring-config"
          element={
            <ProtectedRoute>
              <ScoringConfig />
            </ProtectedRoute>
          }
        />
                <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          }
        />
                <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <Analysis />
            </ProtectedRoute>
          }
        />
                <Route
          path="/upload-history"
          element={
            <ProtectedRoute>
              <UploadHistory />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;