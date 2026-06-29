// local
import "./index.css";
import AppRouter from "./router/routes.jsx";

// react
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// toastify
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AppRouter />
        <ToastContainer />
    </StrictMode>
);
