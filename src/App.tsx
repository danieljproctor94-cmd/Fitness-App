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
import Measurements from "@/pages/Measurements";
import Account from "@/pages/Account";
import Settings from "@/pages/Settings";
import Leaderboard from "@/pages/Leaderboard";
import Support from "@/pages/Support";
import Mindset from "@/pages/Mindset";
import ManageUsers from "@/pages/ManageUsers";
import ToDos from "@/pages/ToDos";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
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
                                        <Route path="/todos" element={<ToDos />} />
                                        <Route path="/measurements" element={<Measurements />} />
                                        <Route path="/leaderboard" element={<Leaderboard />} />
                                        <Route path="/account" element={<Account />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/support" element={<Support />} />
                                        <Route path="/mindset" element={<Mindset />} />
                                        <Route path="/admin/users" element={<ManageUsers />} />
                                    </Route>
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </NotificationProvider>
                </DataProvider>
            </AuthProvider>
            <Toaster />
        </ThemeProvider >
    )
}

export default App
