import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Requests from "./pages/Requests";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";

function RequireAuth({ children }) {
    const { user, isLoading } = useAuth();
    if (isLoading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected routes (inside Layout with sidebar/topbar) */}
                    <Route
                        element={
                            <RequireAuth>
                                <Layout />
                            </RequireAuth>
                        }
                    >
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/requests" element={<Requests />} />
                        <Route path="/quotes" element={<Quotes />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/payments" element={<Payments />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>

                    {/* Fallback — redirect unknown URLs to dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}