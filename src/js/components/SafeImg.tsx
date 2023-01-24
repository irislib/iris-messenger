import { useState } from 'react';

type Props = {
  src: string;
  class?: string;
  width?: number;
};

// need to have trailing slash, otherwise you could do https://imgur.com.myevilwebsite.com/image.png
const safeOrigins = [
  'https://', // disable for now, image proxy doesn't keep up with snowden attention
  'data:image',
  'https://imgur.com/',
  'https://i.imgur.com/',
  'https://nostr.build/',
];

export const isSafeOrigin = (url: string) => {
  return safeOrigins.some((origin) => url.indexOf(origin) === 0);
};

const SafeImg = (props: Props) => {
  if (props.src && !isSafeOrigin(props.src)) {
    // free proxy with a 250 images per 10 min limit: https://images.weserv.nl/docs/
    if (props.width) {
      const width = props.width * 2;
      props.src = `https://proxy.irismessengers.wtf/insecure/rs:fill:${width}:${width}/plain/${props.src}`;
    } else {
      props.src = `https://proxy.irismessengers.wtf/insecure/plain/${props.src}`;
    }
  }
  const [src, setSrc] = useState(props.src);

  const handleError = () => {
    console.log('handleeerrorr');
    setSrc('/assets/img/cover.jpg');
  };

  const newProps = Object.assign(props, { src });
  return <img onError={handleError} {...newProps} />;
};

export default SafeImg;
