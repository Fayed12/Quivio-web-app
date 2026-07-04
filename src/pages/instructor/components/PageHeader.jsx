// react
import { useNavigate } from "react-router";

// react-icons
import { FiChevronRight, FiArrowLeft } from "react-icons/fi";

// local
import styles from "./PageHeader.module.css";

const PageHeader = ({ 
    title, 
    subtitle, 
    breadcrumbs = [], 
    onBack, 
    actions 
}) => {
    const navigate = useNavigate();

    const handleBackClick = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={styles.header}>
            {/* Breadcrumbs Row */}
            {breadcrumbs.length > 0 && (
                <div className={styles.breadcrumbs}>
                    <span 
                        className={styles.breadcrumbLink} 
                        onClick={() => navigate("/instructor/dashboard")}
                    >
                        Home
                    </span>
                    {breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                            <div key={`${crumb}-${idx}`} className={styles.breadcrumbItem}>
                                <FiChevronRight className={styles.separator} />
                                {isLast ? (
                                    <span className={styles.breadcrumbCurrent}>{crumb}</span>
                                ) : (
                                    <span className={styles.breadcrumbText}>{crumb}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Title / Actions Row */}
            <div className={styles.mainRow}>
                <div className={styles.titleArea}>
                    {onBack && (
                        <button 
                            onClick={handleBackClick} 
                            className={styles.backBtn}
                            aria-label="Go back"
                        >
                            <FiArrowLeft />
                        </button>
                    )}
                    <div>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                </div>
                {actions && <div className={styles.actions}>{actions}</div>}
            </div>
        </div>
    );
};

export default PageHeader;
