// local
import { SuspenseComponent } from "./suspense";
import { selectIsAuthenticated, selectRole } from "../redux/slices/authSlice";

// react
import { lazy } from "react";

// react-router
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";

// redux
import { useSelector } from "react-redux";

// App shell
const App = lazy(() => import("../App"));

// Lazy-loaded public pages
const LandingPage = lazy(() => import("../pages/landing-page/landingPage"));
const ErrorPage = lazy(() => import("../pages/error-page/errorPage"));
const TermsPage = lazy(() => import("../pages/terms-page/TermsPage"));
const PrivacyPage = lazy(() => import("../pages/privacy-page/PrivacyPage"));

// Lazy-loaded auth pages
const LoginPage = lazy(() => import("../pages/authentication/login-page/LoginPage"));
const RegisterPage = lazy(() => import("../pages/authentication/register-page/RegisterPage"));
const VerifyEmailPage = lazy(() => import("../pages/authentication/verify-email-page/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../pages/authentication/forgot-password-page/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/authentication/reset-password-page/ResetPasswordPage"));

// Lazy-loaded protected layouts & dashboards
const ProtectedStudentLayout = lazy(() => import("../layouts/ProtectedStudentLayout"));
const ProtectedInstructorLayout = lazy(() => import("../layouts/ProtectedInstructorLayout"));
const StudentDashboard = lazy(() => import("../pages/student/dashboard/Dashboard"));
const InstructorDashboard = lazy(() => import("../pages/instructor/dashboard/Dashboard"));

// Redirect authenticated users away from public auth pages
const RedirectIfAuth = ({ children }) => {
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);

    if (isAuth && role) {
        // Exception: If student goes to /register directly, let them see the Blocked card page
        const isStudentRegister = role === "student" && window.location.pathname === "/register";
        if (!isStudentRegister) {
            return <Navigate to={role === "instructor" ? "/instructor/dashboard" : "/student/dashboard"} replace />;
        }
    }
    return children;
};

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <SuspenseComponent>
                <App />
            </SuspenseComponent>
        ),
        errorElement: (
            <SuspenseComponent>
                <ErrorPage />
            </SuspenseComponent>
        ),
        children: [
            // Public Landing Pages
            {
                index: true,
                element: (
                    <SuspenseComponent>
                        <LandingPage />
                    </SuspenseComponent>
                ),
            },
            {
                path: "home",
                element: (
                    <SuspenseComponent>
                        <LandingPage />
                    </SuspenseComponent>
                ),
            },
            {
                path: "terms",
                element: (
                    <SuspenseComponent>
                        <TermsPage />
                    </SuspenseComponent>
                ),
            },
            {
                path: "privacy",
                element: (
                    <SuspenseComponent>
                        <PrivacyPage />
                    </SuspenseComponent>
                ),
            },

            // Authentication Routes
            {
                path: "login",
                element: (
                    <RedirectIfAuth>
                        <SuspenseComponent>
                            <LoginPage />
                        </SuspenseComponent>
                    </RedirectIfAuth>
                ),
            },
            {
                path: "register",
                element: (
                    <SuspenseComponent>
                        <RegisterPage />
                    </SuspenseComponent>
                ),
            },
            {
                path: "verify-email",
                element: (
                    <SuspenseComponent>
                        <VerifyEmailPage />
                    </SuspenseComponent>
                ),
            },
            {
                path: "forgot-password",
                element: (
                    <RedirectIfAuth>
                        <SuspenseComponent>
                            <ForgotPasswordPage />
                        </SuspenseComponent>
                    </RedirectIfAuth>
                ),
            },
            {
                path: "reset-password",
                element: (
                    <SuspenseComponent>
                        <ResetPasswordPage />
                    </SuspenseComponent>
                ),
            },

            // Student Protected Routes
            {
                path: "student",
                element: <ProtectedStudentLayout />,
                children: [
                    {
                        path: "dashboard",
                        element: (
                            <SuspenseComponent>
                                <StudentDashboard />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "*",
                        element: <Navigate to="dashboard" replace />,
                    }
                ],
            },

            // Instructor Protected Routes
            {
                path: "instructor",
                element: <ProtectedInstructorLayout />,
                children: [
                    {
                        path: "dashboard",
                        element: (
                            <SuspenseComponent>
                                <InstructorDashboard />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "*",
                        element: <Navigate to="dashboard" replace />,
                    }
                ],
            },
            
            // Unauthorized / Error fallbacks
            {
                path: "403",
                element: (
                    <SuspenseComponent>
                        <ErrorPage customMessage="403 Unauthorized Access" />
                    </SuspenseComponent>
                ),
            },
            {
                path: "*",
                element: (
                    <SuspenseComponent>
                        <ErrorPage customMessage="404 Page Not Found" />
                    </SuspenseComponent>
                ),
            }
        ],
    },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;