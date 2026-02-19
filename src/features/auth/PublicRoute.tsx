import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const PublicRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0b0c15] text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-purple-500"></div>
                <p className="mt-4 text-sm font-medium text-white/60">Loading...</p>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
