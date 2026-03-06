import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SelectRole from "./pages/SelectRole";
import Profile from "./pages/Profile";
import Internships from "./pages/Internships";
import InternshipDetail from "./pages/InternshipDetail";
import MyApplications from "./pages/MyApplications";
import PostInternship from "./pages/PostInternship";
import MyInternships from "./pages/MyInternships";
import ApplicantReview from "./pages/ApplicantReview";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Groups from "./pages/Groups";
import OnboardingProfile from "./pages/onboarding/OnboardingProfile";
import OnboardingPreferences from "./pages/onboarding/OnboardingPreferences";
import OnboardingCulture from "./pages/onboarding/OnboardingCulture";
import OnboardingResume from "./pages/onboarding/OnboardingResume";
import OnboardingDone from "./pages/onboarding/OnboardingDone";
import EmployerOnboardingCompany from "./pages/employer-onboarding/EmployerOnboardingCompany";
import EmployerOnboardingDetails from "./pages/employer-onboarding/EmployerOnboardingDetails";
import EmployerOnboardingVerify from "./pages/employer-onboarding/EmployerOnboardingVerify";
import EmployerOnboardingTeam from "./pages/employer-onboarding/EmployerOnboardingTeam";
import EmployerOnboardingDone from "./pages/employer-onboarding/EmployerOnboardingDone";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/select-role" element={<ProtectedRoute><SelectRole /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/internships/:id" element={<InternshipDetail />} />
            <Route path="/my-applications" element={<ProtectedRoute allowedRoles={["student"]}><MyApplications /></ProtectedRoute>} />
            <Route path="/post-internship" element={<ProtectedRoute allowedRoles={["employer"]}><PostInternship /></ProtectedRoute>} />
            <Route path="/my-internships" element={<ProtectedRoute allowedRoles={["employer"]}><MyInternships /></ProtectedRoute>} />
            <Route path="/internships/:id/applicants" element={<ProtectedRoute allowedRoles={["employer"]}><ApplicantReview /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><Admin /></ProtectedRoute>} />
            {/* Student onboarding */}
            <Route path="/onboarding/profile" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingProfile /></ProtectedRoute>} />
            <Route path="/onboarding/preferences" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingPreferences /></ProtectedRoute>} />
            <Route path="/onboarding/culture" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingCulture /></ProtectedRoute>} />
            <Route path="/onboarding/resume" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingResume /></ProtectedRoute>} />
            <Route path="/onboarding/done" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingDone /></ProtectedRoute>} />
            {/* Employer onboarding */}
            <Route path="/employer/onboarding/company" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingCompany /></ProtectedRoute>} />
            <Route path="/employer/onboarding/details" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingDetails /></ProtectedRoute>} />
            <Route path="/employer/onboarding/verify" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingVerify /></ProtectedRoute>} />
            <Route path="/employer/onboarding/team" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingTeam /></ProtectedRoute>} />
            <Route path="/employer/onboarding/done" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingDone /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
