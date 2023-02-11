type Props = {
  src: string;
  class?: string;
  width?: number;
  onError?: () => void;
};

// need to have trailing slash, otherwise you could do https://imgur.com.myevilwebsite.com/image.png
const safeOrigins = [
  'https://',
  'data:image',
  'https://imgur.com/',
  'https://i.imgur.com/',
  'https://proxy.irismessengers.wtf/',
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

  return <img {...props} />;
};

export default SafeImg;
