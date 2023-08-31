import { useState } from 'react';

const VALUE_TRUNCATE_LENGTH = 50;

type ExplorerNodeValueProps = {
  value: any;
  displayName: string;
};

const ExplorerNodeValue: React.FC<ExplorerNodeValueProps> = ({ displayName, value }) => {
  const [showMore, setShowMore] = useState(false);

  const truncateValue = () => {
    if (displayName === 'priv' || displayName === 'key') {
      return `${value.substring(0, 2)}...`;
    }
    return value.length > VALUE_TRUNCATE_LENGTH
      ? `${value.substring(0, VALUE_TRUNCATE_LENGTH)}...`
      : value;
  };

  if (typeof value === 'string') {
    return (
      <span className="text-xs text-blue-400">
        {value.length > VALUE_TRUNCATE_LENGTH && (
          <span
            className="text-xs text-blue-200 cursor-pointer"
            onClick={() => setShowMore(!showMore)}
          >
            Show {showMore ? 'less' : 'more'}{' '}
          </span>
        )}
        "{showMore ? value : truncateValue()}"
      </span>
    );
  }

  return <span className="text-xs text-green-400">{JSON.stringify(value)}</span>;
};

export default ExplorerNodeValue;
