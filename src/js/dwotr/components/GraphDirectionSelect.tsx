import { Link } from 'preact-router';
import { translate as t } from '../../translations/Translation.mjs';


type GraphDirectionSelectProps = {
  dir: string;
  setSearch: (params: any) => string;
};

const GraphDirectionSelect = ({ dir, setSearch }: GraphDirectionSelectProps) => {
  const selected = 'link link-active'; // linkSelected
  const unselected = 'text-neutral-500';

  return (        <div className="flex gap-4">
  <span>Trust:</span>
  <Link
    href={setSearch({ dir: 'out' })}
    className={dir == 'out' ? selected : unselected}
  >
    {t('Outgoing')}
  </Link>
  <Link
    href={setSearch({ dir: 'in' })}
    className={dir == 'in' ? selected : unselected}
  >
    {t('Incoming')}
  </Link>
</div>
    );
}

export default GraphDirectionSelect;
