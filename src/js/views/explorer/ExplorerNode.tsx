import { useEffect, useState } from 'react';

import Node from '@/state/Node';

type Props = {
  node: Node;
  level?: number;
  expanded?: boolean;
  name?: string;
};

export default function ExplorerNode({ node, level = 0, expanded = false, name }: Props) {
  const [children, setChildren] = useState<{ [key: string]: Node }>({});
  const [isOpen, setIsOpen] = useState(expanded);

  useEffect(() => {
    node.map((_value, key) => {
      if (!children[key]) {
        setChildren((prev) => {
          const childName = key.split('/').pop()!;
          return { ...prev, [key]: node.get(childName) };
        });
      }
    });
  }, [node.id]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const isEven = level % 2 === 0;
  const displayName = name || node.id.split('/').pop()!;

  return (
    <div className={`relative ${isEven ? 'bg-gray-800' : 'bg-gray-700'}`}>
      <div className="flex items-center cursor-pointer text-white" onClick={toggleOpen}>
        <div className={`transition ${isOpen ? 'transform rotate-90' : ''}`}>
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </div>
        <span className="ml-2">{displayName}</span>
      </div>
      <div className={`ml-6 ${isOpen ? 'block' : 'hidden'}`}>
        {Object.values(children).map((child) => (
          <ExplorerNode key={node.id + child.id} node={child} level={level + 1} expanded={false} />
        ))}
      </div>
    </div>
  );
}
