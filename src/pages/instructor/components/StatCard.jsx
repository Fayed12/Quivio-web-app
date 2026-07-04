// react
import PropTypes from "prop-types";

// react-icons
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

// local
import styles from "./StatCard.module.css";

const StatCard = ({ 
    icon, 
    value, 
    label, 
    trend, 
    color = "blue" 
}) => {
    // Map theme colors
    const colorClass = styles[color] || styles.blue;

    return (
        <div className={`${styles.card} ${colorClass}`}>
            <div className={styles.topRow}>
                <div className={styles.iconContainer}>
                    {icon}
                </div>
                {trend && (
                    <div 
                        className={`${styles.trend} ${trend.isPositive ? styles.positive : styles.negative}`}
                        title={`${trend.isPositive ? "Up" : "Down"} by ${trend.amount}`}
                    >
                        {trend.isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
                        <span>{trend.amount}</span>
                    </div>
                )}
            </div>
            
            <div className={styles.valueRow}>
                <h3 className={styles.value}>{value}</h3>
                <span className={styles.label}>{label}</span>
            </div>
        </div>
    );
};

StatCard.propTypes = {
    icon: PropTypes.node.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    trend: PropTypes.shape({
        amount: PropTypes.string.isRequired,
        isPositive: PropTypes.bool.isRequired,
    }),
    color: PropTypes.oneOf(["blue", "green", "amber", "red", "violet"]),
};

export default StatCard;
