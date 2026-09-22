function Card({
  children,
  variant = 'default',
  interactive = false,
  compact = false,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'fx-card',
    variant === 'elevated' && 'fx-card--elevated',
    variant === 'glass' && 'fx-card--glass',
    variant === 'glow' && 'fx-card--glow fx-card--elevated',
    variant === 'selected' && 'fx-card--selected',
    variant === 'empty' && 'fx-card--empty',
    variant === 'result' && 'fx-card--result',
    variant === 'quiet' && 'fx-card--quiet',
    interactive && 'fx-card--interactive',
    compact && 'fx-card--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Card;
