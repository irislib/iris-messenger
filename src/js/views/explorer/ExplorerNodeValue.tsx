import { useState, useEffect, useRef } from 'react';

const VALUE_TRUNCATE_LENGTH = 50;

type ExplorerNodeValueProps = {
  value: any;
  displayName: string;
  setValue: (value: any) => void;
};

const ExplorerNodeValue: React.FC<ExplorerNodeValueProps> = ({ displayName, value, setValue }) => {
  const [showMore, setShowMore] = useState(false);
  const [editableValue, setEditableValue] = useState<any>(JSON.stringify(value));
  const inputRef = useRef<any>(null);

  const truncateValue = () => {
    if (displayName === 'priv' || displayName === 'key') {
      return `${value.substring(0, 2)}...`;
    }
    return value.length > VALUE_TRUNCATE_LENGTH
      ? `${value.substring(0, VALUE_TRUNCATE_LENGTH)}...`
      : value;
  };

  const handleBlur = () => {
    let parsedValue;
    try {
      parsedValue = JSON.parse(editableValue);
    } catch (e) {
      parsedValue = editableValue;
    }
    setValue(parsedValue);
  };

  useEffect(() => {
    // Handling unmount
    return () => {
      handleBlur();
    };
  }, []);

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
        <span
          ref={inputRef}
          contentEditable
          onBlur={handleBlur}
          onInput={(e) => setEditableValue(e.currentTarget.textContent)}
        >
          {showMore ? value : truncateValue()}
        </span>
      </span>
    );
  }

  return (
    <span className="text-xs text-green-400">
      <span
        ref={inputRef}
        contentEditable
        onBlur={handleBlur}
        onInput={(e) => setEditableValue(e.currentTarget.textContent)}
      >
        {JSON.stringify(value)}
      </span>
    </span>
  );
};

export default ExplorerNodeValue;
