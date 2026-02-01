import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { DataProvider } from "@/features/data/DataContext";
import { ProtectedLayout } from "@/features/auth/ProtectedLayout";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/features/notifications/NotificationContext";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Workouts from "@/pages/Workouts";
import WorkoutAnalytics from "@/pages/WorkoutAnalytics";
import Measurements from "@/pages/Measurements";
import Account from "@/pages/Account";
import Settings from "@/pages/Settings";
import Leaderboard from "@/pages/Leaderboard";
import Support from "@/pages/Support";
import Mindset from "@/pages/Mindset";
import ManageUsers from "@/pages/ManageUsers";
import ToDos from "@/pages/ToDos";
import Collaboration from "@/pages/Collaboration";
import { ReloadPrompt } from "@/components/ReloadPrompt";

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

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <ErrorBoundary>
                <AuthProvider>
                    <DataProvider>
                        <NotificationProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />

                                    <Route element={<ProtectedLayout />}>
                                        <Route element={<AppShell />}>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route path="/workouts" element={<Workouts />} />
                                            <Route path="/workouts/analytics" element={<WorkoutAnalytics />} />
                                            <Route path="/todos" element={<ToDos />} />
                                            <Route path="/measurements" element={<Measurements />} />
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
                            </BrowserRouter>
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
