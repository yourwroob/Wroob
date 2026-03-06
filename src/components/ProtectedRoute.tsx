import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("student" | "employer" | "admin")[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Allow access to select-role page even without a role
  if (location.pathname === "/select-role") return <>{children}</>;

  // If user has no role yet (new OAuth user), redirect to role selection
  if (!role) return <Navigate to="/select-role" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
