import { forwardRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    required = false,
    className = '',
    wrapperClassName = '',
    id,
    ...props
  },
  ref
) {
  const { t } = useLanguage();
  const inputId = id || `input-${label?.replace(/\s+/g, '-')?.toLowerCase() || Math.random().toString(36).slice(2)}`;
  const isTextarea = props.as === 'textarea';
  const isSelect = props.as === 'select';
  const Component = props.as || 'input';

  // Remove 'as' prop before passing to DOM
  const { as: _as, ...domProps } = props;

  const inputClasses = [
    'fx-input',
    isTextarea && 'fx-textarea',
    isSelect && 'fx-select',
    error && 'fx-input--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className={`fx-input-wrapper ${wrapperClassName}`}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor={inputId} className="fx-input-label">
            {label}
          </label>
          {required !== undefined && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              ({required ? t.common.required : t.common.optional})
            </span>
          )}
        </div>
      )}

      {Icon ? (
        <div className="fx-input-icon-wrapper">
          <Icon size={18} className="input-icon" />
          <Component
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            required={required}
            {...domProps}
          />
        </div>
      ) : (
        <Component
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          required={required}
          {...domProps}
        />
      )}

      {error && (
        <span id={`${inputId}-error`} className="fx-input-error-text" role="alert">
          {error}
        </span>
      )}

      {hint && !error && (
        <span id={`${inputId}-hint`} className="fx-input-hint">
          {hint}
        </span>
      )}
    </div>
  );

  return content;
});

export default Input;
