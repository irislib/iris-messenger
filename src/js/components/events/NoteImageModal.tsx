import { route } from 'preact-router';
import styled from 'styled-components';

import Helpers from '../../Helpers';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation';
import Modal from '../modal/Modal';
import Name from '../Name';
import SafeImg from '../SafeImg';

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

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

const InfoContainer = styled.div`
  flex: 1;
  max-width: 30%;
  padding: 0 20px;
  overflow-y: auto;
  background: var(--msg-content-background);
`;

const NoteImageModal = ({ event, onClose, attachment }) => {
  return (
    <Modal width="90%" height="90%" centerVertically={true} onClose={onClose}>
      <ContentContainer>
        <MediaContainer>
          {attachment.type === 'image' ? (
            <SafeImg src={attachment.url} />
          ) : (
            <video loop autoPlay src={attachment.url} controls />
          )}
        </MediaContainer>
        <InfoContainer>
          {/* Add your note text and replies here */}
          <p>
            <a href={'/' + Key.toNostrBech32Address(event.pubkey, 'npub')}>
              <Name pub={event.pubkey} />
            </a>
          </p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{Helpers.highlightText(event.content, event)}</p>
          <p>
            <a
              href=""
              onClick={(e) => {
                e.preventDefault();
                route('/' + Key.toNostrBech32Address(event.id, 'note'));
              }}
            >
              {t('show_post')}
            </a>
          </p>
        </InfoContainer>
      </ContentContainer>
    </Modal>
  );
};

export default NoteImageModal;
