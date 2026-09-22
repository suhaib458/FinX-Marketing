import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}) {
  const modalRef = useRef(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '520px' },
    lg: { maxWidth: '680px' },
    xl: { maxWidth: '860px' },
  };

  return (
    <div
      className="fx-modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="fx-modal"
        style={sizeStyles[size]}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {title && (
          <div className="fx-modal__header">
            <h2 id="modal-title" className="fx-modal__title">{title}</h2>
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              icon={X}
              onClick={onClose}
              aria-label="Close"
            />
          </div>
        )}

        <div className="fx-modal__body">{children}</div>

        {footer && <div className="fx-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
