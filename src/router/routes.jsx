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

// Lazy-loaded student pages
const BrowseQuizzes = lazy(() => import("../pages/student/quizzes/BrowseQuizzes"));
const QuizDetail = lazy(() => import("../pages/student/quizzes/QuizDetail"));
const QuizTaking = lazy(() => import("../pages/student/quizzes/QuizTaking"));
const QuizResults = lazy(() => import("../pages/student/quizzes/QuizResults"));
const MyAttempts = lazy(() => import("../pages/student/attempts/MyAttempts"));
const AttemptDetail = lazy(() => import("../pages/student/attempts/AttemptDetail"));
const ProgressAnalytics = lazy(() => import("../pages/student/progress/ProgressAnalytics"));
const Achievements = lazy(() => import("../pages/student/achievements/Achievements"));
const Leaderboard = lazy(() => import("../pages/student/leaderboard/Leaderboard"));
const Bookmarks = lazy(() => import("../pages/student/bookmarks/Bookmarks"));
const StudentNotifications = lazy(() => import("../pages/student/notifications/Notifications"));
const StudentProfile = lazy(() => import("../pages/student/profile/Profile"));

// Lazy-loaded instructor pages
const MyQuizzes = lazy(() => import("../pages/instructor/quizzes/MyQuizzes"));
const CreateEditQuiz = lazy(() => import("../pages/instructor/quizzes/CreateEditQuiz"));
const QuestionBank = lazy(() => import("../pages/instructor/questions/QuestionBank"));
const Rooms = lazy(() => import("../pages/instructor/rooms/Rooms"));
const RoomDetail = lazy(() => import("../pages/instructor/rooms/RoomDetail"));
const StudentsManagement = lazy(() => import("../pages/instructor/students/StudentsManagement"));
const Analytics = lazy(() => import("../pages/instructor/analytics/Analytics"));
const Assignments = lazy(() => import("../pages/instructor/assignments/Assignments"));
const AssignmentDetail = lazy(() => import("../pages/instructor/assignments/AssignmentDetail"));
const Categories = lazy(() => import("../pages/instructor/categories/Categories"));
const Certificates = lazy(() => import("../pages/instructor/certificates/Certificates"));
const Notifications = lazy(() => import("../pages/instructor/notifications/Notifications"));
const Profile = lazy(() => import("../pages/instructor/profile/Profile"));

// Redirect authenticated users away from public auth pages
const RedirectIfAuth = ({ children }) => {
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);

    if (isAuth && role) {
        // Exception: If student goes to /register directly, let them see the Blocked card page
        const isStudentRegister = role === "student" && window.location.pathname === "/register";
        const isForgotPassword = window.location.pathname === "/forgot-password";
        if (!isStudentRegister && !isForgotPassword) {
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
                        index: true,
                        element: (
                            <SuspenseComponent>
                                <StudentDashboard />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "dashboard",
                        element: (
                            <SuspenseComponent>
                                <StudentDashboard />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "quizzes",
                        element: (
                            <SuspenseComponent>
                                <BrowseQuizzes />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "quizzes/:quizId",
                        element: (
                            <SuspenseComponent>
                                <QuizDetail />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "quiz/:quizId/take",
                        element: (
                            <SuspenseComponent>
                                <QuizTaking />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "quiz/:quizId/results/:attemptId",
                        element: (
                            <SuspenseComponent>
                                <QuizResults />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "attempts",
                        element: (
                            <SuspenseComponent>
                                <MyAttempts />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "attempts/:attemptId",
                        element: (
                            <SuspenseComponent>
                                <AttemptDetail />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "progress",
                        element: (
                            <SuspenseComponent>
                                <ProgressAnalytics />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "achievements",
                        element: (
                            <SuspenseComponent>
                                <Achievements />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "leaderboard",
                        element: (
                            <SuspenseComponent>
                                <Leaderboard />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "bookmarks",
                        element: (
                            <SuspenseComponent>
                                <Bookmarks />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "notifications",
                        element: (
                            <SuspenseComponent>
                                <StudentNotifications />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "profile",
                        element: (
                            <SuspenseComponent>
                                <StudentProfile />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "*",
                        element: <Navigate to="/student/dashboard" replace />,
                    }
                ],
            },

            // Instructor Protected Routes
            {
                path: "instructor",
                element: <ProtectedInstructorLayout />,
                children: [
                    {
                        index: true,
                        element: (
                            <SuspenseComponent>
                                <InstructorDashboard />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "dashboard",
                        element: (
                            <SuspenseComponent>
                                <InstructorDashboard />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "quizzes",
                        element: (
                            <SuspenseComponent>
                                <MyQuizzes />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "quizzes/create",
                        element: (
                            <SuspenseComponent>
                                <CreateEditQuiz />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "quizzes/:id/edit",
                        element: (
                            <SuspenseComponent>
                                <CreateEditQuiz />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "questions",
                        element: (
                            <SuspenseComponent>
                                <QuestionBank />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "rooms",
                        element: (
                            <SuspenseComponent>
                                <Rooms />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "rooms/:id",
                        element: (
                            <SuspenseComponent>
                                <RoomDetail />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "students",
                        element: (
                            <SuspenseComponent>
                                <StudentsManagement />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "analytics",
                        element: (
                            <SuspenseComponent>
                                <Analytics />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "assignments",
                        element: (
                            <SuspenseComponent>
                                <Assignments />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "assignments/:id",
                        element: (
                            <SuspenseComponent>
                                <AssignmentDetail />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "categories",
                        element: (
                            <SuspenseComponent>
                                <Categories />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "certificates",
                        element: (
                            <SuspenseComponent>
                                <Certificates />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "notifications",
                        element: (
                            <SuspenseComponent>
                                <Notifications />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "profile",
                        element: (
                            <SuspenseComponent>
                                <Profile />
                            </SuspenseComponent>
                        ),
                    },
                    {
                        path: "*",
                        element: <Navigate to="/instructor/dashboard" replace />,
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