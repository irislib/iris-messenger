type Props = {
  src: string;
  class?: string;
  width?: number;
};

const SafeImg = (props: Props) => {
  if (props.src.indexOf('data:image') !== 0) {
    props.src = '';
  }
  return <img {...props} />;
}

export default SafeImg;
