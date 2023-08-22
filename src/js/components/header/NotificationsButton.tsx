import { Cog8ToothIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconFull } from '@heroicons/react/24/solid';
import { Link } from 'preact-router';

import Show from '@/components/helpers/Show.tsx';
import useLocalState from '@/state/useLocalState.ts';

export default function NotificationsButton() {
  const [unseenNotificationCount] = useLocalState('unseenNotificationCount', 0);
  const [isMyProfile] = useLocalState('isMyProfile', false);
  const [activeRoute] = useLocalState('activeRoute', '');

  return (
    <>
      <Show when={isMyProfile}>
        <Link href="/settings" className="md:hidden">
          <Cog8ToothIcon width={28} />
        </Link>
      </Show>
      <Link
        href="/notifications"
        className={`relative inline-block rounded-full ${isMyProfile ? 'hidden md:flex' : ''}`}
      >
        <Show when={activeRoute === '/notifications'}>
          <HeartIconFull width={28} />
        </Show>
        <Show when={activeRoute !== '/notifications'}>
          <HeartIcon width={28} />
        </Show>
        <Show when={unseenNotificationCount}>
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-iris-purple text-white text-sm rounded-full h-5 w-5 flex items-center justify-center">
            {unseenNotificationCount > 99 ? '' : unseenNotificationCount}
          </span>
        </Show>
      </Link>
    </>
  );
}
