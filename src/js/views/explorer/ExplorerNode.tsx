import { useEffect, useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

import Show from '@/components/helpers/Show.tsx';
import Node, { DIR_VALUE } from '@/state/Node';
import SortedMap from '@/utils/SortedMap/SortedMap.tsx';

type Props = {
  node: Node;
  value?: any;
  level?: number;
  expanded?: boolean;
  name?: string;
  parentCounter?: number;
};

const VALUE_TRUNCATE_LENGTH = 50;

type Child = { node: Node; value: any };

export default function ExplorerNode({
  node,
  value = DIR_VALUE,
  level = 0,
  expanded = false,
  name,
  parentCounter = 0,
}: Props) {
  const [children, setChildren] = useState<SortedMap<string, Child>>(new SortedMap());
  const [isOpen, setIsOpen] = useState(expanded);
  const [showMore, setShowMore] = useState(false);

  const isDirectory = value === DIR_VALUE;

  useEffect(() => {
    if (!isDirectory) return;
    return node.map((value, key) => {
      if (!children.has(key)) {
        const childName = key.split('/').pop()!;
        setChildren((prev) => {
          const newChildren = new SortedMap(prev);
          newChildren.set(childName, { node: node.get(childName), value });
          return newChildren;
        });
      }
    });
  }, [node.id, value]);

  const toggleOpen = () => setIsOpen(!isOpen);
  const rowColor = parentCounter % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700';
  const displayName = name || node.id.split('/').pop()!;

  const renderValue = (value) => {
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
          "
          {showMore
            ? value
            : value.length > VALUE_TRUNCATE_LENGTH
            ? `${value.substring(0, VALUE_TRUNCATE_LENGTH)}...`
            : value}
          "
        </span>
      );
    }
    return <span className="text-xs text-green-400">{JSON.stringify(value)}</span>;
  };

  return (
    <div className={`relative w-full ${rowColor}`}>
      <div
        className={`flex items-center text-white ${isDirectory ? 'cursor-pointer' : null}`}
        onClick={toggleOpen}
        style={{ paddingLeft: `${level * 15}px` }}
      >
        <Show when={isDirectory}>
          <ChevronRightIcon
            className={`w-4 h-4 transition ${isOpen ? 'transform rotate-90' : ''}`}
          />
        </Show>
        <span className="ml-2 w-1/3 truncate">{displayName}</span>
        <Show when={!isDirectory}>
          <div className="ml-auto w-1/2">{renderValue(value)}</div>
        </Show>
      </div>
      {isOpen ? (
        <div>
          {Array.from(children.values()).map((child, index) => (
            <ExplorerNode
              key={node.id + child.node.id}
              node={child.node}
              level={level + 1}
              expanded={false}
              value={child.value}
              parentCounter={parentCounter + index + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
