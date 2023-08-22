import { translate as t } from '@/translations/Translation.mjs';

export default function SearchPostsRow({ onResultFocus, query, selected }) {
  return (
    <a
      onFocus={(e) => onResultFocus(e, -1)}
      tabIndex={2}
      className={
        'p-2 cursor-pointer flex gap-2 items-center result ' +
        (selected ? 'selected bg-neutral-700' : '')
      }
      href={`/search/${encodeURIComponent(query)}`}
    >
      <div className="avatar-container">
        <div style="font-size: 1.5em; width: 40px">&#128269;</div>
      </div>
      <div>
        <span>{query}</span>
        <br />
        <small>{t('search_posts')}</small>
      </div>
    </a>
  );
}
