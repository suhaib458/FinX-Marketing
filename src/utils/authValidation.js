export function validateRegistration(fields, messages) {
  const errors = {};
  if (!fields.name.trim()) errors.name = messages.required;
  if (!fields.email) errors.email = messages.required;
  else if (!/\S+@\S+\.\S+/.test(fields.email)) errors.email = messages.invalidEmail;
  if (!fields.password) errors.password = messages.required;
  else if (fields.password.length < 8) errors.password = messages.passwordMinLength;
  if (fields.password !== fields.confirmPassword) errors.confirmPassword = messages.passwordsNotMatch;
  if (!fields.agreed) errors.agreed = messages.required;
  return errors;
}
