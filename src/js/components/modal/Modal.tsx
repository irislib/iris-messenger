import { FC, useEffect } from 'react';
import styled from 'styled-components';

type Props = {
  onClose?: () => void;
  justifyContent?: string;
  showContainer?: boolean;
  centerVertically?: boolean;
  width?: string;
  height?: string;
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: ${(props) =>
    props.centerVertically ? 'center' : props.justifyContent || 'flex-start'};
  align-items: center;
  overflow-y: auto;
  overflow-x: hidden;
`;

const ModalContentContainer = styled.div<{ width?: string; height?: string }>`
  width: ${(props) => props.width || 'auto'};
  height: ${(props) => props.height || 'auto'};
  max-height: calc(100% - 40px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Modal: FC<Props> = ({
  width,
  height,
  centerVertically,
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
      className="p-8 border-neutral-500 border-2 bg-black rounded-lg shadow-lg"
      style={{ width: '600px', 'max-width': 'calc(100vw - 40px)' }}
      onClick={(e) => handleContainerClick(e)}
    >
      {children}
    </div>
  ) : (
    children
  );

  return (
    <Overlay centerVertically={centerVertically} onClick={handleOverlayClick}>
      <ModalContentContainer width={width} height={height}>
        {content}
      </ModalContentContainer>
    </Overlay>
  );
};

export default Modal;
