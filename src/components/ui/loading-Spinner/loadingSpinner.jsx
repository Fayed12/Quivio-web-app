// local
import styles from "./loadingSpinner.module.css";

// prop-types
import PropTypes from "prop-types";

// component
const LoadingSpinner = ({
    size = "md",
    color = "primary",
    label = "",
}) => {
    return (
        <span
            className={styles.wrap}
            role="status"
            aria-label={label || "Loading…"}
            aria-live="polite"
        >
            <span
                className={styles.spinner}
                data-size={size}
                data-color={color}
            />
            {label && (
                <span className={styles.label} aria-hidden="true">
                    {label}
                </span>
            )}
        </span>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
    color: PropTypes.oneOf(["primary", "info", "danger", "warning", "white"]),
    label: PropTypes.string,
};

export default LoadingSpinner;
