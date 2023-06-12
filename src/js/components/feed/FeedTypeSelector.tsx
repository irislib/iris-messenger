import { Bars3Icon, Squares2X2Icon } from '@heroicons/react/24/outline';

import localState from '../../LocalState';

export default function FeedTypeSelector({ setDisplay, display, index }) {
  const isProfile = ['posts', 'postsAndReplies', 'likes'].includes(index);
  return (
    <div className="flex mb-px">
      <button
        onClick={() => {
          setDisplay('posts');
          localState.get('settings').get('feed').get('display').put('posts');
        }}
        className={`${display === 'grid' ? 'hover:bg-neutral-900' : 'bg-neutral-800'} ${
          isProfile ? 'isProfile_left' : ''
        } rounded-sm flex justify-center flex-1 p-3`}
      >
        <Bars3Icon width={24} height={24} />
      </button>
      <button
        onClick={() => {
          setDisplay('grid');
          localState.get('settings').get('feed').get('display').put('grid');
        }}
        className={`${display === 'grid' ? 'bg-neutral-800' : 'hover:bg-neutral-900'} ${
          isProfile ? 'isProfile_right' : ''
        } rounded-sm flex justify-center flex-1 p-3`}
      >
        <Squares2X2Icon width={24} height={24} />
      </button>
    </div>
  );
}
