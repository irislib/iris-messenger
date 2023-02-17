import { useState } from 'react';

type Props = {
  src: string;
  class?: string;
  width?: number;
  onError?: () => void;
  onClick?: (ev: MouseEvent) => void;
  alt?: string;
};

// need to have trailing slash, otherwise you could do https://imgur.com.myevilwebsite.com/image.png
const safeOrigins = [
  'data:image',
  'https://imgur.com/',
  'https://i.imgur.com/',
  'https://imgproxy.iris.to/',
];

export const isSafeOrigin = (url: string) => {
  return safeOrigins.some((origin) => url.startsWith(origin));
};

const SafeImg = (props: Props) => {
  let onError = props.onError;
  let mySrc = props.src;
  let proxyFailed = false;
  if (
    props.src &&
    !props.src.startsWith('data:image') &&
    (!isSafeOrigin(props.src) || props.width)
  ) {
    // free proxy with a 250 images per 10 min limit? https://images.weserv.nl/docs/
    const originalSrc = props.src;
    if (props.width) {
      const width = props.width * 2;
      mySrc = `https://imgproxy.iris.to/insecure/rs:fill:${width}:${width}/plain/${originalSrc}`;
    } else {
      mySrc = `https://imgproxy.iris.to/insecure/plain/${originalSrc}`;
    }
    const originalOnError = props.onError;
    // try without proxy if it fails
    onError = () => {
      if (proxyFailed) {
        console.log('original source failed too', originalSrc);
        originalOnError && originalOnError();
      } else {
        console.log('image proxy failed', mySrc, 'trying original source', originalSrc);
        proxyFailed = true;
        setSrc(originalSrc);
      }
    };
  }
  const [src, setSrc] = useState(mySrc);

  return (
    <img
      src={src}
      onError={onError}
      onClick={props.onClick}
      className={props.class}
      width={props.width}
      alt={props.alt}
    />
  );
};

export default SafeImg;
