import { memo, useState } from 'react';
import { Event } from 'nostr-tools';
import { JSX } from 'preact';
import styled, { css, keyframes } from 'styled-components';

import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';

import EventComponent from './EventComponent';
import NoteImageModal from './NoteImageModal';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

function VideoIcon({ attachment }): JSX.Element {
  return attachment.type === 'video' ? (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
      }}
    >
      {Icons.video}
    </div>
  ) : (
    <></>
  );
}

const HiddenImg = styled.img`
  display: none;
`;

const GalleryImage = styled.a`
  position: relative;
  aspect-ratio: 1;
  color: white;
  background-size: cover;
  background-position: center;
  background-color: #ccc;
  background-image: url(${(props) =>
    props.attachment?.type === 'video'
      ? `https://imgproxy.iris.to/thumbnail/428/${props.attachment.url}`
      : props.proxyError
      ? `${props.attachment.url}`
      : `https://imgproxy.iris.to/insecure/rs:fill:428:428/plain/${props.attachment.url}`});
  & .dropdown {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
  & .dropbtn {
    padding-top: 0px;
    margin-top: -5px;
    text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.5);
    color: white;
    user-select: none;
  }
  &:hover {
    opacity: 0.8;
  }

  & svg {
    filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.8));
  }

  opacity: ${(props) => (props.fadeIn ? 0 : 1)};
  animation: ${(props) =>
    props.fadeIn
      ? css`
          ${fadeIn} 0.5s ease-in-out forwards
        `
      : 'none'};
`;

function NoteImage(props: { event: Event; fadeIn?: boolean }) {
  const [showImageModal, setShowImageModal] = useState(-1);
  const [proxyError, setProxyError] = useState<boolean[]>([]);

  const handleProxyError = (index) => {
    setProxyError((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
  };

  if (props.event.kind !== 1) {
    const id = Events.getEventReplyingTo(props.event);
    if (!id) {
      return null;
    }
    return <EventComponent id={id} renderAs="NoteImage" />;
  }
  const attachments = [] as { type: string; url: string }[];
  const urls = props.event.content?.match(/(https?:\/\/[^\s]+)/g);
  if (urls) {
    urls.forEach((url) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        console.log('invalid url', url);
        return;
      }
      if (parsedUrl.pathname.toLowerCase().match(/\.(jpg|jpeg|gif|png|webp)$/)) {
        attachments.push({ type: 'image', url: parsedUrl.href });
      }
      // videos
      if (parsedUrl.pathname.toLowerCase().match(/\.(mp4|mkv|avi|flv|wmv|mov|webm)$/)) {
        attachments.push({ type: 'video', url: parsedUrl.href });
      }
    });
  }

  const onClick = (e, i) => {
    if (window.innerWidth > 625) {
      e.preventDefault();
      e.stopPropagation();
      setShowImageModal(i);
    }
  };

  // return all images from post
  return (
    <>
      {attachments.map((attachment, i) => (
        <>
          <GalleryImage
            href={`/${Key.toNostrBech32Address(props.event.id, 'note')}`}
            key={props.event.id + i}
            onClick={(e) => onClick(e, i)}
            attachment={attachment}
            fadeIn={props.fadeIn}
            proxyError={proxyError[i]}
          >
            <VideoIcon attachment={attachment} />
          </GalleryImage>
          {attachment.type === 'image' && (
            <HiddenImg
              src={`https://imgproxy.iris.to/insecure/rs:fill:428:428/plain/${attachment.url}`}
              onError={() => handleProxyError(i)}
            />
          )}
          {showImageModal === i && (
            <NoteImageModal
              attachment={attachment}
              onClose={() => setShowImageModal(-1)}
              event={props.event}
            />
          )}
        </>
      ))}
    </>
  );
}

export default memo(NoteImage);
