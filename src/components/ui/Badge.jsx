function Badge({ children, variant = 'primary', className = '', ...props }) {
  const classes = ['fx-badge', `fx-badge--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
