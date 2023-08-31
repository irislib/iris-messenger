import { useEffect, useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

import Show from '@/components/helpers/Show.tsx';
import Node, { DIR_VALUE } from '@/state/Node';
import SortedMap from '@/utils/SortedMap/SortedMap.tsx';
import { ExplorerNodeEditRow } from '@/views/explorer/ExplorerNodeEditRow.tsx';

import ExplorerNodeValue from './ExplorerNodeValue';

type Props = {
  node: Node;
  value?: any;
  level?: number;
  expanded?: boolean;
  name?: string;
  parentCounter?: number;
};

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

  const paddingLeft = `${level * 15 + (isDirectory ? 0 : 16)}px`;

  return (
    <div className={`relative w-full ${rowColor}`}>
      <div
        className={`flex items-center text-white ${isDirectory ? 'cursor-pointer' : ''}`}
        onClick={toggleOpen}
        style={{ paddingLeft }}
      >
        <Show when={isDirectory}>
          <ChevronRightIcon
            className={`w-4 h-4 transition ${isOpen ? 'transform rotate-90' : ''}`}
          />
        </Show>
        <span className="ml-1 w-1/3 truncate">{displayName}</span>
        <Show when={!isDirectory}>
          <div className="ml-auto w-1/2">
            <ExplorerNodeValue
              displayName={displayName}
              value={value}
              setValue={(v) => node.put(v)}
            />
          </div>
        </Show>
      </div>
      {isDirectory && isOpen ? (
        <div>
          <ExplorerNodeEditRow level={level + 1} parent={node} />
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
