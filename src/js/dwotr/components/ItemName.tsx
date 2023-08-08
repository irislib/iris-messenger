import { ID } from '../../nostr/UserIds';

import useVerticeMonitor from '../../dwotr/hooks/useVerticeMonitor';
import { translate as t } from '../../translations/Translation.mjs';


type Props = {
  hexPub: string;
};


const ItemName = (props: Props) => {

    const wot = useVerticeMonitor(ID(props.hexPub), ['badName', 'neutralName', 'goodName'], '');

  return (
    <>
      <span className={wot?.option}>
        {`${t('note')} ${props.hexPub.slice(0, 4)}`}
      </span>
    </>
  );
};

export default ItemName;