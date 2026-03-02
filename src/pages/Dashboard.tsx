import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (role === "student") return <Navigate to="/internships" replace />;
  if (role === "employer") return <Navigate to="/my-internships" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;

  return <Navigate to="/" replace />;
};

export default Dashboard;
