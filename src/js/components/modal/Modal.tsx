import { FC, useEffect } from 'react';

type Props = {
  onClose?: () => void;
  justifyContent?: string;
  showContainer?: boolean;
  centerVertically?: boolean;
  width?: string;
  height?: string;
};

const Modal: FC<Props> = ({
  width,
  height,
  centerVertically = true,
  showContainer,
  children,
  onClose,
}) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose?.();
    }
  };

  const handleOverlayClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  const handleContainerClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const content = showContainer ? (
    <div
      className="p-8 border-2 border-neutral-500 bg-black rounded-lg shadow-lg"
      style={{ width: '600px', maxWidth: 'calc(100vw - 40px)' }}
      onClick={(e) => handleContainerClick(e)}
    >
      {children}
    </div>
  ) : (
    children
  );

  const justifyContentClass = centerVertically ? 'justify-center' : 'justify-start';

  return (
    <div
      className={`fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-90 flex flex-col ${justifyContentClass} items-center overflow-y-auto overflow-x-hidden`}
      onClick={handleOverlayClick}
    >
      <div
        className="overflow-y-auto flex flex-col items-center"
        style={{ width: width || 'auto', height: height || 'auto' }}
      >
        {content}
      </div>
    </div>
  );
};

export default Modal;
