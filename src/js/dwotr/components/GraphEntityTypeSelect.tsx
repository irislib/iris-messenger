import { Link } from 'preact-router';
import { translate as t } from '../../translations/Translation.mjs';
import Show from '../../components/helpers/Show';

type GraphEntityTypeSelectProps = {
  entitytype: string;
  dir: string;
  setSearch: (params: any) => string;
};

const GraphEntityTypeSelect = ({ entitytype, dir, setSearch }: GraphEntityTypeSelectProps) => {
  const selected = 'graphlink active'; // linkSelected
  const unselected = 'graphlink';

  return (
    <Show when={dir == 'out'}>
      <div className="flex gap-4">
        <span className="text-neutral-500">Subject:</span>
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
