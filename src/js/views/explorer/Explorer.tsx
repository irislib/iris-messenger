import View from '@/views/View.tsx';
import useSubscribe from "@/nostr/hooks/useSubscribe.ts";

type Props = {
  p?: string;
  path: string;
};

const Explorer = ({ p }: Props) => {
  const all = useSubscribe({ kinds: [30000], authors: [Key.getPubKey()] });

  return (
    <View hideSideBar={true}>
      <div>{p}</div>
    </View>
  );
};

export default Explorer;
