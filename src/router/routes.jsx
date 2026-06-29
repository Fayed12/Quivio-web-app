// local
import { SuspenseComponent } from "./suspense";

// react
import { lazy } from "react";

// react-router
import { createBrowserRouter, RouterProvider } from "react-router";

// App shell
const App = lazy(() => import("../App"));

// Lazy-loaded public pages
const LandingPage = lazy(() => import("../pages/landing-page/landingPage"));
const ErrorPage = lazy(() => import("../pages/error-page/errorPage"));

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
        ],
    },
]);

// Satisfies Vite's Fast Refresh rule: exporting only components from this file
const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;