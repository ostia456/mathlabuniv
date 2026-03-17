import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';

// Module Pages
import { DynamicalSystemsPage } from '@/pages/modules/DynamicalSystemsPage';
import { NumericalMethodsPage } from '@/pages/modules/NumericalMethodsPage';
import { LinearAlgebraPage } from '@/pages/modules/LinearAlgebraPage';
import { GraphTheoryPage } from '@/pages/modules/GraphTheoryPage';

// Teacher Pages
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage';
import { ScenarioEditorPage } from '@/pages/teacher/ScenarioEditorPage';
import { ExerciseManagerPage } from '@/pages/teacher/ExerciseManagerPage';

// Student Pages
import { ExercisesPage } from '@/pages/student/ExercisesPage';
import { ProgressPage } from '@/pages/student/ProgressPage';

// Layout
import { MainLayout } from '@/layouts/MainLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>  
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Module Routes */}
              <Route path="/modules/dynamical-systems" element={<DynamicalSystemsPage />} />
              <Route path="/modules/numerical-methods" element={<NumericalMethodsPage />} />
              <Route path="/modules/linear-algebra" element={<LinearAlgebraPage />} />
              <Route path="/modules/graph-theory" element={<GraphTheoryPage />} />
              
              {/* Student Routes */}
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              
              {/* Teacher Routes */}
              <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
              <Route path="/teacher/scenarios" element={<ScenarioEditorPage />} />
              <Route path="/teacher/exercises" element={<ExerciseManagerPage />} />
            </Route>
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
