import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { lazy, Suspense } from "react";

// Eagerly loaded (landing/auth - first paint)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy loaded routes
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SelectRole = lazy(() => import("./pages/SelectRole"));
const Profile = lazy(() => import("./pages/Profile"));
const Internships = lazy(() => import("./pages/Internships"));
const InternshipDetail = lazy(() => import("./pages/InternshipDetail"));
const MyApplications = lazy(() => import("./pages/MyApplications"));
const PostInternship = lazy(() => import("./pages/PostInternship"));
const MyInternships = lazy(() => import("./pages/MyInternships"));
const ApplicantReview = lazy(() => import("./pages/ApplicantReview"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminInternships = lazy(() => import("./pages/admin/AdminInternships"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Help = lazy(() => import("./pages/Help"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Groups = lazy(() => import("./pages/Groups"));
const StudentDiscovery = lazy(() => import("./pages/StudentDiscovery"));
const SkillTests = lazy(() => import("./pages/SkillTests"));
const CampusCommunity = lazy(() => import("./pages/CampusCommunity"));
const OnboardingProfile = lazy(() => import("./pages/onboarding/OnboardingProfile"));
const OnboardingCulture = lazy(() => import("./pages/onboarding/OnboardingCulture"));
const OnboardingResume = lazy(() => import("./pages/onboarding/OnboardingResume"));
const OnboardingDone = lazy(() => import("./pages/onboarding/OnboardingDone"));
const EmployerOnboardingCompany = lazy(() => import("./pages/employer-onboarding/EmployerOnboardingCompany"));
const EmployerOnboardingLocation = lazy(() => import("./pages/employer-onboarding/EmployerOnboardingLocation"));
const EmployerOnboardingManager = lazy(() => import("./pages/employer-onboarding/EmployerOnboardingManager"));
const EmployerOnboardingLegal = lazy(() => import("./pages/employer-onboarding/EmployerOnboardingLegal"));
const EmployerOnboardingVerify = lazy(() => import("./pages/employer-onboarding/EmployerOnboardingVerify"));
const EmployerOnboardingTeam = lazy(() => import("./pages/employer-onboarding/EmployerOnboardingTeam"));
const EmployerOnboardingDone = lazy(() => import("./pages/employer-onboarding/EmployerOnboardingDone"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SessionTimeoutWarning />
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/students" element={<ProtectedRoute allowedRoles={["student"]}><StudentDiscovery /></ProtectedRoute>} />
              <Route path="/skill-tests" element={<ProtectedRoute allowedRoles={["student"]}><SkillTests /></ProtectedRoute>} />
              <Route path="/campus" element={<ProtectedRoute allowedRoles={["student"]}><CampusCommunity /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/internships" element={<ProtectedRoute allowedRoles={["admin"]}><AdminInternships /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
              {/* Student onboarding */}
              <Route path="/onboarding/profile" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingProfile /></ProtectedRoute>} />
              <Route path="/onboarding/culture" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingCulture /></ProtectedRoute>} />
              <Route path="/onboarding/resume" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingResume /></ProtectedRoute>} />
              <Route path="/onboarding/done" element={<ProtectedRoute allowedRoles={["student"]}><OnboardingDone /></ProtectedRoute>} />
              {/* Employer onboarding */}
              <Route path="/employer/onboarding/company" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingCompany /></ProtectedRoute>} />
              <Route path="/employer/onboarding/location" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingLocation /></ProtectedRoute>} />
              <Route path="/employer/onboarding/manager" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingManager /></ProtectedRoute>} />
              <Route path="/employer/onboarding/legal" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingLegal /></ProtectedRoute>} />
              <Route path="/employer/onboarding/verify" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingVerify /></ProtectedRoute>} />
              <Route path="/employer/onboarding/team" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingTeam /></ProtectedRoute>} />
              <Route path="/employer/onboarding/done" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingDone /></ProtectedRoute>} />
              {/* Legacy route redirect */}
              <Route path="/employer/onboarding/details" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerOnboardingLocation /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/help" element={<Help />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;