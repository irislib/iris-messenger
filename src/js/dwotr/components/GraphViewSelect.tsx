import { Link } from 'preact-router';
import Show from '../../components/helpers/Show';
import { translate as t } from '../../translations/Translation.mjs';

type GraphViewSelectProps = {
  view: string;
  me: boolean;
  setSearch: (params: any) => string;
};

const GraphViewSelect = ({ view, me, setSearch }: GraphViewSelectProps) => {
  const selected = 'graphlink active'; // linkSelected
  const unselected = 'graphlink';

  return (
    <div className="flex flex-wrap gap-4">
      <span className="text-neutral-500">View:</span>
      <Show when={!me}>
        <Link
          href={setSearch({ view: 'path' })}
          className={view == 'path' ? selected : unselected}
        >
          {t('Path')}
        </Link>
      </Show>
      <Link
        href={setSearch({ view: 'graph' })}
        className={view == 'graph' ? selected : unselected}
      >
        {t('Graph')}
      </Link>
      <Link
        href={setSearch({ view: 'list' })}
        className={view == 'list' ? selected : unselected}
      >
        {t('List')}
      </Link>

    </div>
  );
};

export default GraphViewSelect;
