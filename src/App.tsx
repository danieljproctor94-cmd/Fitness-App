import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubdomainRouter } from "@/components/routing/SubdomainRouter";
import { AuthProvider } from "@/features/auth/AuthContext";
import { DataProvider } from "@/features/data/DataContext";
import { ProtectedLayout } from "@/features/auth/ProtectedLayout";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/features/notifications/NotificationContext";
import { ReminderManager } from "@/features/reminders/ReminderManager";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import { lazy, Suspense, useEffect } from "react";`nimport { isAppDomain } from "@/lib/domain";

// Lazy Load Pages
const Workouts = lazy(() => import("@/pages/Workouts"));
const WorkoutAnalytics = lazy(() => import("@/pages/WorkoutAnalytics"));
const MeasurementAnalytics = lazy(() => import("@/pages/MeasurementAnalytics"));
const Measurements = lazy(() => import("@/pages/Measurements"));
const Account = lazy(() => import("@/pages/Account"));
const Settings = lazy(() => import("@/pages/Settings"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Support = lazy(() => import("@/pages/Support"));
const Mindset = lazy(() => import("@/pages/Mindset"));
const ManageUsers = lazy(() => import("@/pages/ManageUsers"));
const Goals = lazy(() => import("@/pages/Goals"));
const ToDos = lazy(() => import("@/pages/ToDos"));
const TaskAnalytics = lazy(() => import("@/pages/TaskAnalytics"));
const Collaboration = lazy(() => import("@/pages/Collaboration"));
const ReloadPrompt = lazy(() => import("@/components/ReloadPrompt").then(module => ({ default: module.ReloadPrompt })));
import { FaviconUpdater } from "@/components/FaviconUpdater";


// Public Pages
import { PublicLayout } from "@/components/public/PublicLayout";
import Landing from "@/pages/public/Landing";
import { PublicRoute } from "@/features/auth/PublicRoute";

import { Component, ErrorInfo, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-red-500">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <pre className="text-sm bg-muted p-4 rounded overflow-auto max-w-full text-left inline-block">
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}


function AuthLoadingWrapper({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0b0c15] text-white z-[9999]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-purple-500"></div>
                <p className="mt-4 text-sm font-medium text-white/60">Loading...</p>
            </div>
        );
    }

    return <>{children}</>;
}

function App() {
    useEffect(() => {
        const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
            const error = event instanceof PromiseRejectionEvent ? event.reason : event.error;
            if (error?.message?.includes("Failed to fetch dynamically imported module") ||
                error?.message?.includes("Importing a module script failed")) {
                // Prevent infinite reload loop if server is actually down
                const lastReload = sessionStorage.getItem('chunk_reload');
                if (!lastReload || Date.now() - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem('chunk_reload', Date.now().toString());
                    window.location.reload();
                }
            }
        };

        window.addEventListener('error', handleChunkError);
        window.addEventListener('unhandledrejection', handleChunkError);

        return () => {
            window.removeEventListener('error', handleChunkError);
            window.removeEventListener('unhandledrejection', handleChunkError);
        };
    }, []);

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <ErrorBoundary>
                <AuthProvider>
                    <DataProvider>
                        <NotificationProvider>
                            <FaviconUpdater />
                            <ReminderManager />
                            <BrowserRouter>
                                <AuthLoadingWrapper><SubdomainRouter
                                    publicRoutes={
                                        <Routes>
                                            <Route element={<PublicLayout />}>
                                                <Route path="/" element={<Landing />} />
                                                <Route path="/features" element={<Landing />} />
                                                <Route path="*" element={<Landing />} />
                                            </Route>
                                        </Routes>
                                    }
                                    appRoutes={
                                        <Suspense fallback={
                                            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0b0c15] text-white">
                                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-purple-500"></div>
                                                <p className="mt-4 text-sm font-medium text-white/60">Loading...</p>
                                            </div>
                                        }>
                                            <Routes>
                                                {/* Auth Routes */}
                                                <Route element={<PublicRoute />}>
                                                    <Route path="/login" element={<Login />} />
                                                    <Route path="/register" element={<Register />} />
                                                </Route>

                                                {/* Protected Routes */}
                                                <Route element={<ProtectedLayout />}>
                                                    <Route element={<AppShell />}>
                                                        <Route path="/" element={<Dashboard />} />
                                                        <Route path="/dashboard" element={<Dashboard />} />
                                                        <Route path="/workouts" element={<Workouts />} />
                                                        <Route path="/workouts/analytics" element={<WorkoutAnalytics />} />
                                                        <Route path="/goals" element={<Goals />} />
                                                        <Route path="/planner" element={<ToDos />} />
                                                        <Route path="/planner/analytics" element={<TaskAnalytics />} />
                                                        <Route path="/measurements" element={<Measurements />} />
                                                        <Route path="/measurements/analytics" element={<MeasurementAnalytics />} />
                                                        <Route path="/leaderboard" element={<Leaderboard />} />
                                                        <Route path="/account" element={<Account />} />
                                                        <Route path="/settings" element={<Settings />} />
                                                        <Route path="/support" element={<Support />} />
                                                        <Route path="/mindset" element={<Mindset />} />
                                                        <Route path="/collaboration" element={<Collaboration />} />
                                                        <Route path="/admin/users" element={<ManageUsers />} />
                                                    </Route>
                                                </Route>
                                            </Routes>
                                        </Suspense>
                                    }
                                />
                            </AuthLoadingWrapper></BrowserRouter>
                        </NotificationProvider>
                    </DataProvider>
                </AuthProvider>
            </ErrorBoundary>
            <Toaster />
            <ReloadPrompt />
        </ThemeProvider >
    )
}

export default App

