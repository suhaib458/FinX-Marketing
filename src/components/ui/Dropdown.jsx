import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

function Dropdown({
  trigger,
  children,
  align = 'end',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        close();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') close();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, close]);

  const menuStyle = {};
  if (align === 'start') {
    menuStyle.insetInlineStart = 0;
    menuStyle.insetInlineEnd = 'auto';
  }

  return (
    <div className={`fx-dropdown ${className}`} ref={dropdownRef}>
      <div onClick={toggle} style={{ cursor: 'pointer' }}>
        {trigger || (
          <button className="fx-btn fx-btn--ghost fx-btn--sm">
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fx-dropdown__menu" style={menuStyle}>
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  children,
  icon: Icon,
  active = false,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      className={`fx-dropdown__item ${active ? 'fx-dropdown__item--active' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function DropdownDivider() {
  return <div className="fx-dropdown__divider" />;
}

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;

export default Dropdown;
