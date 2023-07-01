import styled from 'styled-components';

import SafeImg from '../SafeImg';

import Modal from './Modal';

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
`;

const ImageModal = (props) => {
  return (
    <Modal centerVertically={props.images?.length === 1} onClose={props.onClose}>
      <ContentContainer>
        {props.images.map((i) => {
          return (
            <p>
              <SafeImg
                className="rounded-sm"
                style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                src={i}
              />
            </p>
          );
        })}
      </ContentContainer>
    </Modal>
  );
};

export default ImageModal;
