import { Link } from 'preact-router';
import Show from '../../components/helpers/Show';

type GraphViewSelectProps = {
  view: string;
  me: boolean;
  setSearch: any;
};

const GraphViewSelect = ({ view, me, setSearch }: GraphViewSelectProps) => {
  const selected = 'link link-active'; // linkSelected
  const unselected = 'text-neutral-500';

  return (
    <div className="flex flex-wrap gap-4">
      <span className="">View:</span>
      <Link
        href={setSearch({ page: 'wot', view: 'list' })}
        className={view == 'list' ? selected : unselected}
      >
        List
      </Link>
      <Link
        href={setSearch({ page: 'vis', view: 'graph' })}
        className={view == 'graph' ? selected : unselected}
      >
        My Graph
      </Link>
      <Show when={!me}>
        <Link
          href={setSearch({ page: 'path', view: 'path' })}
          className={view == 'path' ? selected : unselected}
        >
          Path
        </Link>
      </Show>
      <Link
        href={setSearch({ page: 'globalgraph', view: 'globalgraph' })}
        className={view == 'globalgraph' ? selected : unselected}
      >
        Global Graph
      </Link>
    </div>
  );
};

export default GraphViewSelect;
