import styled from 'styled-components';
import Modal from '../modal/Modal';
import SafeImg from '../SafeImg';

import EventComponent from './EventComponent';

const ContentContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

const MediaContainer = styled.div`
  flex: 1;
  max-width: 70%;
  display: flex;
  background: var(--body-bg);
  justify-content: center;

  @media (max-width: 625px) {
    max-width: 100%;
  }

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

const InfoContainer = styled.div`
  flex: 1;
  max-width: 30%;
  overflow-y: auto;
  background: var(--msg-content-background);

  @media (max-width: 625px) {
    display: none;
  }
`;

const NoteImageModal = ({ event, onClose, attachment }) => {
  return (
    <Modal width="90%" height="90%" centerVertically={true} onClose={onClose}>
      <ContentContainer>
        <MediaContainer>
          {attachment.type === 'image' ? (
            <SafeImg src={attachment.url} />
          ) : (
            <video
              loop
              autoPlay
              src={attachment.url}
              controls
              poster={`https://imgproxy.iris.to/thumbnail/428/${attachment.url}`}
            />
          )}
        </MediaContainer>
        <InfoContainer>
          <EventComponent id={event.id} standalone={true} showReplies={Infinity} />
        </InfoContainer>
      </ContentContainer>
    </Modal>
  );
};

export default NoteImageModal;
