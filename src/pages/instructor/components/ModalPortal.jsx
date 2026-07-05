import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * ModalPortal - Renders children into #popup-modal portal element.
 * Prevents body scroll while open and centers content on the full viewport.
 */
const ModalPortal = ({ children, onClose }) => {
    const portalRoot = document.getElementById("popup-modal");

    // Prevent page scroll while modal is open
    useEffect(() => {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && onClose) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!portalRoot) return null;

    return createPortal(children, portalRoot);
};

export default ModalPortal;
