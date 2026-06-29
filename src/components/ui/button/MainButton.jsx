// local
import styles from "./MainButton.module.css";

// prop-types
import PropTypes from "prop-types";

const MainButton = ({
    type = "button",
    children,
    variant = "primary",
    action = "primary",
    size = "md",
    onClick,
    clickEvent,
    disabled = false,
    isDisabled = false,
    isLoading = false,
    href,
    className = "",
    ...props
}) => {
    // Fallback support for old names
    const activeVariant = variant || action;
    const activeDisabled = disabled || isDisabled;
    const activeClick = onClick || clickEvent;

    const sharedProps = {
        className: `${styles.btn} ${className}`.trim(),
        "data-variant": activeVariant,
        "data-size": size,
        "data-loading": isLoading ? "true" : undefined,
        ...props
    };

    if (href) {
        return (
            <a href={href} {...sharedProps} target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        );
    }

    return (
        <button
            {...sharedProps}
            type={type}
            onClick={activeClick}
            disabled={activeDisabled || isLoading}
        >
            {children}
        </button>
    );
};

MainButton.propTypes = {
    type: PropTypes.string,
    children: PropTypes.node,
    variant: PropTypes.string,
    action: PropTypes.oneOf(["primary", "ghost", "outline", "danger", "success", "glass"]),
    size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
    onClick: PropTypes.func,
    clickEvent: PropTypes.func,
    disabled: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    href: PropTypes.string,
    className: PropTypes.string,
};

export default MainButton;