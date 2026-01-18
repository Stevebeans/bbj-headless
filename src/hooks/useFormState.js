"use client";

import { useState, useCallback, useMemo } from "react";

/**
 * Form state management hook with dirty tracking and validation
 *
 * @param {object} initialValues - Initial form values
 * @param {object} options - Optional configuration
 * @param {function} options.validate - Validation function returning errors object
 * @param {function} options.onSubmit - Submit handler
 * @returns {object} Form state and handlers
 */
export function useFormState(initialValues, options = {}) {
  const { validate, onSubmit } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Update a single field value
  const setValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // Update multiple field values at once
  const setMultipleValues = useCallback((newValues) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Mark a field as touched (for showing errors)
  const setFieldTouched = useCallback((field, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  // Handle input change events
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setValue(name, fieldValue);
  }, [setValue]);

  // Handle input blur events
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name, true);
  }, [setFieldTouched]);

  // Reset form to initial values
  const reset = useCallback((newInitialValues) => {
    const resetTo = newInitialValues || initialValues;
    setValues(resetTo);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [initialValues]);

  // Validate form
  const validateForm = useCallback(() => {
    if (!validate) return true;

    const validationErrors = validate(values);
    setErrors(validationErrors || {});
    return Object.keys(validationErrors || {}).length === 0;
  }, [values, validate]);

  // Submit form
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate
    if (!validateForm()) {
      return { success: false, errors: errors };
    }

    if (!onSubmit) return { success: true };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await onSubmit(values);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || "Submit failed";
      setSubmitError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, errors, onSubmit]);

  // Get field props for easy binding
  const getFieldProps = useCallback((field) => ({
    name: field,
    value: values[field] ?? "",
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[field] ? errors[field] : undefined,
  }), [values, handleChange, handleBlur, touched, errors]);

  return {
    values,
    errors,
    touched,
    isDirty,
    isSubmitting,
    submitError,
    setValue,
    setMultipleValues,
    setFieldTouched,
    handleChange,
    handleBlur,
    reset,
    validateForm,
    handleSubmit,
    getFieldProps,
  };
}

export default useFormState;
