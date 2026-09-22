function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  ...props
}) {
  const classes = ['fx-avatar', `fx-avatar--${size}`, className]
    .filter(Boolean)
    .join(' ');

  // Get initials from name
  const initials = name
    ? name
        .split(' ')
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div className={classes} title={name || alt} {...props}>
      {src ? (
        <img src={src} alt={alt || name} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
