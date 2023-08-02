import { Link } from 'preact-router';
import { translate as t } from '../../translations/Translation.mjs';

type GraphTrust1SelectProps = {
  trusttype: string;
  setSearch: (params: any) => string;
};

const GraphTrust1Select = ({ trusttype, setSearch }: GraphTrust1SelectProps) => {
  const selected = 'graphlink active'; // linkSelected
  const unselected = 'graphlink';

  return (
    <div className="flex gap-4">
      <span className="text-neutral-500">Value:</span>
      <Link
        href={setSearch({ trusttype: 'both' })}
        className={trusttype == 'both' ? selected : unselected}
      >
        {t('Both')}
      </Link>
      <Link
        href={setSearch({ trusttype: 'trust' })}
        className={trusttype == 'trust' ? selected : unselected}
      >
        {t('Trust')}
      </Link>
      <Link
        href={setSearch({ trusttype: 'distrust' })}
        className={trusttype == 'distrust' ? selected : unselected}
      >
        {t('Distrust')}
      </Link>
    </div>
  );
};

export default GraphTrust1Select;
