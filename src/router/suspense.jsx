// local
import LoadingPage from "../pages/loading-page/loadingPage";

// react
import { Suspense } from "react";

export const SuspenseComponent = ({ children }) => {
    return (
        <Suspense fallback={<LoadingPage />}>
            {children}
        </Suspense>
    );
};