import View from '@/views/View.tsx';

type Props = {
  p?: string;
  path: string;
};

const Explorer = ({ p }: Props) => {
  return (
    <View hideSideBar={true}>
      <div>{p}</div>
    </View>
  );
};

export default Explorer;
