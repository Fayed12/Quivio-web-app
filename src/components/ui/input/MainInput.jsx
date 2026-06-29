// local
import styles from "./MainInput.module.css";

// react
import { forwardRef } from "react";

// prop-types
import PropTypes from "prop-types";

// component
const MainInput = forwardRef(({
    type = "text",
    name,
    placeholder,
    title,
    size = "md",
    icon,
    hasError = false,
    errorMsg = "",
    hasSuccess = false,
    register,
    className = "",
}, ref) => {
    return (
        <div className={styles.wrapper}>
            {title && (
                <label className={styles.label} htmlFor={name}>
                    {title}
                </label>
            )}

            <div className={icon ? styles.inputWrap : undefined}>
                {icon && <span className={styles.inputIcon}>{icon}</span>}
                <input
                    id={name}
                    ref={ref}
                    className={`${styles.input} ${className}`.trim()}
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    aria-label={title || placeholder}
                    data-size={size}
                    data-error={hasError ? "true" : undefined}
                    data-success={hasSuccess ? "true" : undefined}
                    {...register}
                />
            </div>

            {hasError && errorMsg && (
                <p className={styles.errorMsg} role="alert">
                    {errorMsg}
                </p>
            )}
        </div>
    );
});

MainInput.displayName = "MainInput";

MainInput.propTypes = {
    type: PropTypes.string,
    name: PropTypes.string,
    placeholder: PropTypes.string,
    title: PropTypes.string,
    size: PropTypes.oneOf(["sm", "md", "lg"]),
    icon: PropTypes.node,
    hasError: PropTypes.bool,
    errorMsg: PropTypes.string,
    hasSuccess: PropTypes.bool,
    register: PropTypes.object,
    className: PropTypes.string,
};

export default MainInput;