/**
 * Form section wrapper with title and description
 */
export function FormSection({ title, description, children, className = "" }) {
  return (
    <section className={`v2-primary-container-inner p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">{children}</div>
    </section>
  );
}
