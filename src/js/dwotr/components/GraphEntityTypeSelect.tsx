import { Link } from 'preact-router';
import { translate as t } from '../../translations/Translation.mjs';
import Show from '../../components/helpers/Show';

type GraphEntityTypeSelectProps = {
  entitytype: string;
  dir: string;
  setSearch: (params: any) => string;
};

const GraphEntityTypeSelect = ({ entitytype, dir, setSearch }: GraphEntityTypeSelectProps) => {
  const selected = 'link link-active'; // linkSelected
  const unselected = 'text-neutral-500';

  return (
    <Show when={dir == 'out'}>
      <div className="flex gap-4">
        <span>Type:</span>
        <Link
          href={setSearch({ entitytype: 'key' })}
          className={entitytype == 'key' ? selected : unselected}
        >
          {t('Profile')}
        </Link>
        <Link
          href={setSearch({ entitytype: 'item' })}
          className={entitytype == 'item' ? selected : unselected}
        >
          {t('Post')}
        </Link>
      </div>
    </Show>
  );
};

export default GraphEntityTypeSelect;
