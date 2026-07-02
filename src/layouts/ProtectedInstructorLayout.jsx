// react-router
import { Navigate, Outlet } from "react-router";

// redux
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectRole, selectIsInitializing } from "../redux/slices/authSlice";

const ProtectedInstructorLayout = () => {
    const isAuth = useSelector(selectIsAuthenticated);
    const role = useSelector(selectRole);
    const isInitializing = useSelector(selectIsInitializing);

    if (isInitializing) return null;

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "instructor") {
        if (role === "student") {
            return <Navigate to="/student/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedInstructorLayout;
