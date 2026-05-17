import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireCustomerAuth({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF6]">
        <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || isAdmin) {
    return <Navigate to="/account/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
