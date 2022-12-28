type Props = {
  src: string;
  class?: string;
  width?: number;
};

const SafeImg = (props: Props) => {
  if (props.src && props.src.indexOf('data:image') !== 0) {
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
