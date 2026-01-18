/**
 * Reusable form field wrapper with label and error handling
 *
 * @param {object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Input name attribute
 * @param {string} props.type - Input type (text, number, date, textarea, etc.)
 * @param {string} props.as - Render as different element (select, textarea)
 * @param {string} props.value - Current value
 * @param {string} props.error - Error message
 * @param {function} props.onChange - Change handler (receives event)
 * @param {function} props.onBlur - Blur handler
 * @param {boolean} props.required - Show required indicator
 * @param {boolean} props.disabled - Disable input
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.helpText - Help text below input
 * @param {React.ReactNode} props.children - Children (for select options)
 */
export function FormField({
  label,
  name,
  type = "text",
  as,
  value,
  error,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  placeholder = "",
  className = "",
  helpText = "",
  children,
  ...props
}) {
  const inputClasses = `
    w-full px-4 py-2.5
    bg-slate-50 dark:bg-slate-800
    border rounded-lg
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
    ${error ? "border-red-500 dark:border-red-500" : "border-slate-200 dark:border-slate-700"}
    ${className}
  `.trim();

  // Determine element type
  const Element = as || (type === "textarea" ? "textarea" : "input");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {Element === "select" ? (
        <select
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={inputClasses}
          {...props}
        >
          {children}
        </select>
      ) : Element === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClasses}
          rows={3}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
      )}

      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
