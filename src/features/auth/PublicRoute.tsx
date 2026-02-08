import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Loader2 } from "lucide-react";

export const PublicRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
