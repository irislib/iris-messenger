import { useMemo } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Link } from 'preact-router';

import Show from '@/components/helpers/Show.tsx';
import Name from '@/components/user/Name.tsx';
import useLocalState from '@/state/useLocalState.ts';
import { translate as t } from '@/translations/Translation.mjs';

export default function Title() {
  const [activeRoute] = useLocalState('activeRoute', '');
  const isFeed = ['/', '/global'].includes(activeRoute);

  const title = useMemo(() => {
    {
      let title: any = activeRoute.split('/')[1] || t('follows');
      if (title.startsWith('note')) {
        title = t('post');
      } else if (title.startsWith('npub')) {
        title = <Name key={`${title}title`} pub={title || ''} />;
      } else {
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }

      if (activeRoute.indexOf('/search/') === 0) {
        let searchTerm = activeRoute.replace('/search/', '');
        if (searchTerm.indexOf('?') !== -1) {
          searchTerm = searchTerm.substring(0, searchTerm.indexOf('?'));
        }
        title = `${t('search')}: ${decodeURIComponent(searchTerm)}`;
      }

      return title;
    }
  }, [activeRoute]);

  const onClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <div className={`flex flex-1 items-center justify-center`} onClick={onClick}>
      {title}
      <Show when={isFeed}>
        <button
          className="ml-2 focus:outline-none rounded-full p-2"
          onClick={(e) => {
            e.stopPropagation();
            window.feed_selector_modal.showModal();
          }}
        >
          <ChevronDownIcon width={20} />
        </button>
        <dialog id="feed_selector_modal" className="modal focus:outline-none">
          <ul className="modal-box p-2 shadow menu bg-base-100 rounded-box w-52 border-2 border-neutral-900 gap-2">
            <li>
              <Link className={activeRoute === '/' ? 'active' : ''} href="/">
                {t('follows')}
              </Link>
            </li>
            <li>
              <Link className={activeRoute === '/global' ? 'active' : ''} href="/global">
                {t('global_feed')}
              </Link>
            </li>
          </ul>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </Show>
    </div>
  );
}
