import { Link } from 'preact-router';

type GraphViewSelectProps = {
  view: string;
  setSearch: any;
};

const GraphViewSelect = ({ view, setSearch }: GraphViewSelectProps) => {
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
        Graph
      </Link>
      <Link
        href={setSearch({ page: 'path', view: 'path' })}
        className={view == 'path' ? selected : unselected}
      >
        Path
      </Link>
    </div>
  );
};

export default GraphViewSelect;
