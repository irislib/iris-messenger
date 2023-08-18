import { ID } from '@/utils/UniqueIds';
import useVerticeMonitor from '../../dwotr/hooks/useVerticeMonitor';
import { translate as t } from '../../translations/Translation.mjs';


type Props = {
  str: string;
};


const ItemName = (props: Props) => {

    const wot = useVerticeMonitor(ID(props.str), ['badName', 'neutralName', 'goodName'], '');

  return (
    <>
      <span className={wot?.option}>
        {`${t('note')} ${props.str.slice(0, 4)}`}
      </span>
    </>
  );
};

export default ItemName;