import localState from '@/state/LocalState.ts';
import ExplorerNode from '@/views/explorer/ExplorerNode.tsx';
import View from '@/views/View.tsx';

type Props = {
  p?: string;
  path: string;
};

const Explorer = ({ p }: Props) => {
  return (
    <View hideSideBar={true}>
      <div>{p}</div>
      <div className="m-2 md:mx-4">
        <ExplorerNode expanded={true} name="Local state" node={localState} />
      </div>
    </View>
  );
};

export default Explorer;
