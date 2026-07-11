import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import PropTypes from "prop-types";

// Dynamic custom styling based on index.css theme variables
const getCustomStyles = () => ({
    control: (provided, state) => ({
        ...provided,
        backgroundColor: "transparent",
        borderColor: state.isFocused ? "var(--color-accent, #2563eb)" : "var(--border-default, #cbd5e1)",
        borderRadius: "var(--radius-md, 0.5rem)",
        minHeight: "2.5rem",
        boxShadow: state.isFocused ? "0 0 0 1px var(--color-accent, #2563eb)" : "none",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: "var(--text-sm, 0.8125rem)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
            borderColor: state.isFocused ? "var(--color-accent, #2563eb)" : "var(--border-strong, #94a3b8)"
        }
    }),
    valueContainer: (provided) => ({
        ...provided,
        padding: "2px 12px"
    }),
    input: (provided) => ({
        ...provided,
        color: "var(--text-primary, #0f172a)"
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "var(--text-muted, #94a3b8)"
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "var(--text-primary, #0f172a)"
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: "var(--bg-surface, #ffffff)",
        border: "1px solid var(--border-default, #cbd5e1)",
        borderRadius: "var(--radius-md, 0.5rem)",
        boxShadow: "var(--shadow-lg, 0 10px 24px rgba(0, 0, 0, 0.1))",
        zIndex: 999
    }),
    menuList: (provided) => ({
        ...provided,
        padding: "4px 0"
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? "var(--color-accent, #2563eb)"
            : state.isFocused
            ? "var(--bg-surface-2, #f1f5f9)"
            : "transparent",
        color: state.isSelected
            ? "var(--text-on-accent, #ffffff)"
            : "var(--text-primary, #0f172a)",
        cursor: "pointer",
        fontSize: "var(--text-sm, 0.8125rem)",
        "&:active": {
            backgroundColor: "var(--bg-surface-3, #e2e8f0)"
        }
    }),
    multiValue: (provided) => ({
        ...provided,
        backgroundColor: "var(--bg-surface-2, #f1f5f9)",
        border: "1px solid var(--border-default, #cbd5e1)",
        borderRadius: "var(--radius-sm, 0.375rem)"
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: "var(--text-primary, #0f172a)",
        fontSize: "var(--text-xs, 0.6875rem)"
    }),
    multiValueRemove: (provided) => ({
        ...provided,
        color: "var(--text-muted, #94a3b8)",
        "&:hover": {
            backgroundColor: "var(--bg-danger-mid, #ffe4e6)",
            color: "var(--color-danger, #ef4444)"
        }
    })
});

const CustomSelect = ({
    options = [],
    value,
    onChange,
    isMulti = false,
    isCreatable = false,
    placeholder = "Select...",
    isDisabled = false,
    isClearable = false,
    className = "",
    ...props
}) => {
    // Standardize options to { value, label } format
    const formattedOptions = options.map((opt) => {
        if (typeof opt === "string" || typeof opt === "number") {
            return { value: opt, label: String(opt) };
        }
        return opt;
    });

    // Helper to find the matched option object for the selected value
    const getOptionFromValue = (val) => {
        if (isMulti) {
            if (!val) return [];
            const valArray = Array.isArray(val) ? val : [val];
            return valArray.map((v) => {
                // If it is already an object, use it
                if (typeof v === "object" && v !== null && "value" in v) return v;
                // Otherwise find in formatted options
                const found = formattedOptions.find((o) => o.value === v);
                return found || { value: v, label: String(v) };
            });
        } else {
            if (val === undefined || val === null || val === "") return null;
            if (typeof val === "object" && "value" in val) return val;
            const found = formattedOptions.find((o) => o.value === val);
            return found || { value: val, label: String(val) };
        }
    };

    const selectValue = getOptionFromValue(value);

    // Call onChange with the raw values
    const handleChange = (selected) => {
        if (isMulti) {
            const values = selected ? selected.map((o) => o.value) : [];
            onChange(values);
        } else {
            onChange(selected ? selected.value : "");
        }
    };

    const SelectComponent = isCreatable ? CreatableSelect : Select;

    return (
        <SelectComponent
            options={formattedOptions}
            value={selectValue}
            onChange={handleChange}
            isMulti={isMulti}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isClearable={isClearable}
            styles={getCustomStyles()}
            className={className}
            classNamePrefix="react-select"
            {...props}
        />
    );
};

CustomSelect.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.shape({
                value: PropTypes.any.isRequired,
                label: PropTypes.string.isRequired
            })
        ])
    ),
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
    isMulti: PropTypes.bool,
    isCreatable: PropTypes.bool,
    placeholder: PropTypes.string,
    isDisabled: PropTypes.bool,
    isClearable: PropTypes.bool,
    className: PropTypes.string
};

export default CustomSelect;
