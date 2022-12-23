type Props = {
  src: string;
  class?: string;
  width?: number;
};

const SafeImg = (props: Props) => {
  const width = props.width * 2 || 400;
  if (props.src && props.src.indexOf('data:image') !== 0) {
    props.src = `https://proxy.irismessengers.wtf/insecure/rs:fill:${width}:${width}/plain/${props.src}`;
  }
  return <img {...props} />;
};

export default SafeImg;
