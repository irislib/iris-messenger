import { Bars3Icon, Squares2X2Icon } from '@heroicons/react/24/outline';

import { DisplayAs } from '@/components/feed/types';

type DisplaySelectorProps = {
  activeDisplay: DisplayAs; // You can replace this with "DisplayAs" type if it's exported
  onDisplayChange: (display: DisplayAs) => void; // Same here, replace string if necessary
};

const DisplaySelector = ({ activeDisplay, onDisplayChange }: DisplaySelectorProps) => {
  return (
    <div className="flex mb-px">
      <button
        className={`rounded-sm flex justify-center flex-1 p-3 ${
          activeDisplay === 'feed' ? 'bg-neutral-800' : 'hover:bg-neutral-900'
        }`}
        onClick={() => onDisplayChange('feed')}
      >
        <Bars3Icon width={24} height={24} />
      </button>
      <button
        className={`rounded-sm flex justify-center flex-1 p-3 ${
          activeDisplay === 'grid' ? 'bg-neutral-800' : 'hover:bg-neutral-900'
        }`}
        onClick={() => onDisplayChange('grid')}
      >
        <Squares2X2Icon width={24} height={24} />
      </button>
    </div>
  );
};

export default DisplaySelector;
