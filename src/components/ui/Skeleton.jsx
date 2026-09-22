function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
  style = {},
  ...props
}) {
  const classes = [
    'fx-skeleton',
    variant === 'text' && 'fx-skeleton--text',
    variant === 'title' && 'fx-skeleton--title',
    variant === 'circle' && 'fx-skeleton--circle',
    variant === 'card' && 'fx-skeleton--card',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const baseStyle = { ...style };
  if (width) baseStyle.width = width;
  if (height) baseStyle.height = height;

  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={classes}
            style={{
              ...baseStyle,
              width: variant === 'text' && i === count - 1 ? '70%' : baseStyle.width,
            }}
            {...props}
          />
        ))}
      </div>
    );
  }

  return <div className={classes} style={baseStyle} {...props} />;
}

export default Skeleton;
