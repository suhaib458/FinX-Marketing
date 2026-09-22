const REQUIRED_FIELDS = {
  'social-post': ['platform', 'goal', 'contentLanguage', 'postType', 'description', 'tone'],
  'ad-design': ['platform', 'goal', 'contentLanguage', 'offerDescription', 'designSize'],
  'content-ideas': ['platform', 'goal', 'contentLanguage', 'topic', 'targetAudience'],
  campaign: ['platform', 'goal', 'contentLanguage', 'objective', 'campaignProduct', 'tone'],
};

export function trimCreateValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  );
}

export function isValidDateInput(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateCreateValues(tool, values, messages) {
  const normalized = trimCreateValues(values);
  const errors = {};
  for (const field of REQUIRED_FIELDS[tool] || []) {
    if (!normalized[field]) errors[field] = messages.required;
  }
  if (tool === 'campaign' && normalized.startDate && !isValidDateInput(normalized.startDate)) {
    errors.startDate = messages.invalidDate;
  }
  return { values: normalized, errors, valid: Object.keys(errors).length === 0 };
}

export { REQUIRED_FIELDS };
