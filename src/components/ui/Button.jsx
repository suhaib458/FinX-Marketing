import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconEnd: IconEnd,
    isLoading = false,
    isIconOnly = false,
    fullWidth = false,
    className = '',
    disabled,
    href,
    type,
    onClick,
    ...props
  },
  ref
) {
  const classes = [
    'fx-btn',
    `fx-btn--${variant}`,
    size !== 'md' && `fx-btn--${size}`,
    isIconOnly && 'fx-btn--icon',
    fullWidth && 'fx-btn--full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || isLoading;
  const Component = href ? 'a' : 'button';
  const componentProps = href
    ? {
        href: isDisabled ? undefined : href,
        'aria-disabled': isDisabled || undefined,
        onClick: (event) => {
          if (isDisabled) event.preventDefault();
          else onClick?.(event);
        },
      }
    : { type: type || 'button', disabled: isDisabled, onClick };

  return (
    <Component
      ref={ref}
      className={classes}
      {...componentProps}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 16 : size === 'lg' || size === 'xl' ? 20 : 18} strokeWidth={1.9} />
      ) : null}
      {!isIconOnly && children}
      {IconEnd && !isLoading && (
        <IconEnd size={size === 'sm' ? 16 : 18} strokeWidth={1.9} />
      )}
    </Component>
  );
});

export default Button;
