type Props = {
  src: string;
  class?: string;
  width?: number;
  onError?: () => void;
};

// need to have trailing slash, otherwise you could do https://imgur.com.myevilwebsite.com/image.png
const safeOrigins = [
  'data:image',
  'https://imgur.com/',
  'https://i.imgur.com/',
  'https://imgproxy.irismessengers.wtf/',
];

export const isSafeOrigin = (url: string) => {
  return safeOrigins.some((origin) => url.indexOf(origin) === 0);
};

const SafeImg = (props: Props) => {
  if (
    props.src &&
    !props.src.startsWith('data:image') &&
    (!isSafeOrigin(props.src) || props.width)
  ) {
    // free proxy with a 250 images per 10 min limit: https://images.weserv.nl/docs/
    if (props.width) {
      const width = props.width * 2;
      props.src = `https://imgproxy.irismessengers.wtf/insecure/rs:fill:${width}:${width}/plain/${props.src}`;
    } else {
      props.src = `https://imgproxy.irismessengers.wtf/insecure/plain/${props.src}`;
    }
  }

  return <img {...props} />;
};

export default SafeImg;
