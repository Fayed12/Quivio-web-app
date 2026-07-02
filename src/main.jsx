// local
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import AppRouter from "./router/routes.jsx";
import store from "./redux/store.js"

// react
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// toastify
import { ToastContainer } from "react-toastify";

// redux
import { Provider } from 'react-redux';

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <AppRouter />
            <ToastContainer />
        </Provider>
    </StrictMode>
);
